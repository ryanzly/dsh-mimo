/**
 * dsh-mimo Host entry.
 *
 * One Cordis fiber assembles every Host-side capability:
 *   - the xiaomi-mimo LLM route (adapter with live model discovery),
 *   - OAuth / API-key sign-in with encrypted-at-rest credentials,
 *   - Token Plan credits (Remote + mimo_quota tool),
 *   - the MiMo ASR provider on ctx.speechToText,
 *   - MiMo TTS synthesis for the client's reading controls.
 *
 * Secrets stay on the Host; Remote payloads carry masked previews only.
 */
import { defineTool } from "@deepseek-ai/dsh-tools";
import { RemoteError, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { MimoClient, PAYG_BASE_URL, formatCredits, formatPeriod, isTokenPlanEndpoint, keyKind, resolveBaseUrl, usagePercent } from "./mimo-api.js";
import { MimoAdapter } from "./mimo-adapter.js";
import { MimoLoginSession } from "./mimo-auth.js";
import { MimoSettings, maskKey } from "./settings.js";
import { createMimoSpeechProvider } from "./mimo-stt.js";

export const name = "dsh-mimo";
export const inject = ["llm"];

const PROVIDER = "xiaomi-mimo";

// ── Remote 契约（与 lib/client.js 逐字对齐） ──────────────────────────────────
const codec = (type, parse) => ({ mode: "strict", typeSymbol: `dsh-mimo#${type}`, schema: { parse }, create: () => ({ parse }) });
const ok = value => value;
const parseObject = type => value => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw invalid(`Invalid ${type}`);
  return value;
};
const parseSave = value => {
  const patch = parseObject("MimoSettingsPatch")(value);
  const out = {};
  if (patch.apiKey !== undefined) {
    if (typeof patch.apiKey !== "string") throw invalid("apiKey must be a string");
    out.apiKey = patch.apiKey.trim();
  }
  for (const field of ["baseUrl", "region", "thinking", "loginMethod"]) {
    if (patch[field] !== undefined) {
      if (typeof patch[field] !== "string") throw invalid(`${field} must be a string`);
      out[field] = patch[field].trim();
    }
  }
  if (patch.voice !== undefined) {
    const voice = parseObject("MimoVoiceSettings")(patch.voice);
    out.voice = {};
    for (const field of ["model", "voice", "style"]) if (typeof voice[field] === "string") out.voice[field] = voice[field].trim();
    if (typeof voice.autoRead === "boolean") out.voice.autoRead = voice.autoRead;
  }
  if (patch.asr !== undefined) {
    const asr = parseObject("MimoAsrSettings")(patch.asr);
    if (typeof asr.language === "string") out.asr = { language: asr.language.trim() };
  }
  return out;
};
const parseText = value => {
  const input = parseObject("MimoSpeakRequest")(value);
  const text = String(input.text ?? "").trim();
  if (text === "") throw invalid("text is required");
  if (text.length > 20000) throw invalid("text too long");
  return {
    text,
    ...typeof input.voice === "string" ? { voice: input.voice.trim() } : {},
    ...typeof input.style === "string" ? { style: input.style.trim() } : {},
    ...typeof input.format === "string" && ["mp3", "wav", "pcm", "pcm16"].includes(input.format) ? { format: input.format } : {},
    ...typeof input.model === "string" && input.model !== "" ? { model: input.model.trim() } : {}
  };
};
const statusCodec = codec("MimoStatus", parseObject("MimoStatus"));
const loginCodec = codec("MimoLoginState", parseObject("MimoLoginState"));
const modelsCodec = codec("MimoModels", parseObject("MimoModels"));
const quotaCodec = codec("MimoQuota", parseObject("MimoQuota"));
const speakCodec = codec("MimoSpeakResult", parseObject("MimoSpeakResult"));

function invalid(message) {
  return new RemoteError("mimo/invalid-request", message, { retryable: false, retainPrevious: false });
}
function failure(code, message, retryable = false) {
  return new RemoteError(code, message, { retryable, retainPrevious: retryable });
}

export const mimoRemote = {
  package: name,
  descriptors: [
    { id: `${name}#mimo/status`, service: "mimo", namespace: "mimo", method: "status", invocation: { kind: "direct" }, parameters: [], result: statusCodec },
    { id: `${name}#mimo/save`, service: "mimo", namespace: "mimo", method: "save", invocation: { kind: "direct" }, parameters: [{ name: "patch", wire: "patch", source: "json", codec: codec("MimoSettingsPatch", parseSave) }], result: statusCodec },
    { id: `${name}#mimo/models`, service: "mimo", namespace: "mimo", method: "models", invocation: { kind: "direct" }, parameters: [], result: modelsCodec },
    { id: `${name}#mimo/quota`, service: "mimo", namespace: "mimo", method: "quota", invocation: { kind: "direct" }, parameters: [], result: statusCodec },
    { id: `${name}#mimo/login`, service: "mimo", namespace: "mimo", method: "login", invocation: { kind: "direct" }, parameters: [], result: loginCodec },
    { id: `${name}#mimo/loginStatus`, service: "mimo", namespace: "mimo", method: "loginStatus", invocation: { kind: "direct" }, parameters: [], result: loginCodec },
    { id: `${name}#mimo/loginSubmit`, service: "mimo", namespace: "mimo", method: "loginSubmit", invocation: { kind: "direct" }, parameters: [{ name: "code", wire: "code", source: "json", codec: codec("MimoLoginCode", parseObject("MimoLoginCode")) }], result: loginCodec },
    { id: `${name}#mimo/cancelLogin`, service: "mimo", namespace: "mimo", method: "cancelLogin", invocation: { kind: "direct" }, parameters: [], result: loginCodec },
    { id: `${name}#mimo/speak`, service: "mimo", namespace: "mimo", method: "speak", invocation: { kind: "direct" }, parameters: [{ name: "request", wire: "request", source: "json", codec: codec("MimoSpeakRequest", parseText) }], result: speakCodec },
    { id: `${name}#mimo/logout`, service: "mimo", namespace: "mimo", method: "logout", invocation: { kind: "direct" }, parameters: [], result: statusCodec }
  ]
};

function registerRemotes(ctx) {
  ctx.inject(["typert"], scope => {
    scope.effect(() => scope.typert.register({
      package: mimoRemote.package,
      face: "host",
      schemas: [],
      model: { services: [], events: [], objects: [] },
      invocations: mimoRemote.descriptors
    }));
  });
}

export class MimoService extends TypertRemoteService {
  constructor(ctx, options = {}) {
    super(ctx, "mimo");
    this.ctx = ctx;
    this.settings = options.settings ?? new MimoSettings(options.settingsOptions ?? {});
    this.now = options.now ?? Date.now;
    this.fetcher = options.fetch ?? globalThis.fetch;
    this.loginSession = null;
    this.quotaCache = null;
    this.openBrowser = options.openBrowser;
  }

  /** Current credentials: stored secret first, then well-known environment keys. */
  credential() {
    const stored = this.settings.secret();
    if (stored !== "") return stored;
    return process.env.MIMO_TOKEN_PLAN_API_KEY ?? process.env.XIAOMI_TOKEN_PLAN_API_KEY ?? process.env.MIMO_API_KEY ?? "";
  }

  client() {
    const apiKey = this.credential();
    const state = this.settings.get("baseUrl") || this.settings.get("region")
      ? { apiKey, baseUrl: this.settings.get("baseUrl"), region: this.settings.get("region") }
      : { apiKey };
    return new MimoClient({ apiKey, baseUrl: resolveBaseUrl(state), fetcher: this.fetcher });
  }

  /** Client-safe status snapshot used by every Remote entry point. */
  async status({ force = false } = {}) {
    const client = this.client();
    const apiKey = this.credential();
    const base = {
      auth: {
        hasKey: apiKey !== "",
        keyKind: keyKind(apiKey),
        keyPreview: maskKey(apiKey),
        uid: this.settings.get("uid") ?? "",
        keyName: this.settings.get("keyName") ?? "",
        loginAt: this.settings.get("loginAt") ?? 0,
        loginMethod: this.settings.get("loginMethod") ?? ""
      },
      endpoint: { baseUrl: client.baseUrl, region: this.settings.get("region") ?? "cn", defaultBaseUrl: PAYG_BASE_URL },
      quota: null,
      quotaError: "",
      models: { models: [], source: "fallback" },
      settings: this.settings.publicState(),
      updatedAt: new Date(this.now()).toISOString()
    };
    // Coding Plan only: quota is a Token Plan concept. OAuth may hand back an
    // sk- shaped key bound to a token-plan cluster, so classify by endpoint
    // first and key shape second — otherwise OAuth sign-in shows no quota.
    const plan = isTokenPlanEndpoint(client.baseUrl) || keyKind(apiKey).startsWith("token-plan");
    base.auth.planKind = plan ? "token-plan" : "pay-as-you-go";
    if (apiKey === "") return base;
    try {
      base.models = await client.listModels({ force, now: this.now() });
    } catch (error) {
      base.models = { models: [], source: "fallback", error: String(error?.message ?? error) };
    }
    if (plan) {
      const cached = !force && this.quotaCache && this.now() - this.quotaCache.at < 60 * 1000 ? this.quotaCache.value : undefined;
      if (cached !== undefined) base.quota = cached;
      else {
        try {
          const plan = await client.tokenPlan();
          base.quota = plan;
          this.quotaCache = { at: this.now(), value: plan };
        } catch (error) {
          base.quotaError = String(error?.message ?? error);
          if (this.quotaCache && this.now() - this.quotaCache.at < 5 * 60 * 1000) base.quota = this.quotaCache.value;
        }
      }
    }
    return base;
  }

  async save(patch) {
    this.settings.save(patch);
    this.quotaCache = null;
    try { this.ctx.emit("llm/models-updated", PROVIDER); } catch { /* registry may not be listening */ }
    return this.status({ force: true });
  }

  async models() {
    const client = this.client();
    if (!client.configured()) return { models: [], source: "none", error: "未配置密钥" };
    return client.listModels({ force: true, now: this.now() });
  }

  async quota() {
    this.quotaCache = null;
    return this.status({ force: true });
  }

  /** Start one browser authorization; completion lands through loginStatus/loginSubmit. */
  async login() {
    if (this.loginSession && this.loginSession.state === "pending") return this.loginSession.status();
    const session = new MimoLoginSession({
      keyName: `dsh-mimo-key-${Math.random().toString(16).slice(2, 10)}`,
      ...(this.openBrowser ? { open: this.openBrowser } : {})
    });
    this.loginSession = session;
    try {
      const started = await session.start();
      void session.done.then(result => this.completeLogin(result)).catch(() => {});
      return { ...session.status(), url: started.url, manualUrl: started.manualUrl };
    } catch (error) {
      this.loginSession = null;
      throw failure("mimo/login-failed", String(error?.message ?? error), true);
    }
  }

  loginStatus() {
    return this.loginSession ? this.loginSession.status() : { state: "idle", keyName: "", url: "", manualUrl: "", uid: "", baseUrl: "", error: "" };
  }

  /** Manual paste path: the platform hands the user the same encrypted blob. */
  loginSubmit({ code }) {
    const session = this.loginSession;
    if (!session) return { state: "failed", keyName: "", url: "", manualUrl: "", uid: "", baseUrl: "", error: "没有进行中的登录" };
    if (!session.submitCode(code)) return { ...session.status(), state: "failed", error: "授权码解密失败" };
    return session.status();
  }

  cancelLogin() {
    this.loginSession?.cancel();
    return this.loginStatus();
  }

  /** Sign out: drop every stored credential and reset the login stamp. */
  async logout() {
    this.settings.save({ apiKey: "", baseUrl: "", uid: "", keyName: "", loginAt: 0, loginMethod: "" });
    this.quotaCache = null;
    try { this.ctx.emit("llm/models-updated", PROVIDER); } catch { /* registry may not be listening */ }
    return this.status();
  }

  completeLogin(result) {
    const patch = {
      loginMethod: "oauth",
      loginAt: this.now(),
      uid: String(result?.uid ?? "")
    };
    if (typeof result?.sk === "string" && result.sk !== "") patch.apiKey = result.sk;
    if (typeof result?.url === "string" && result.url !== "") patch.baseUrl = result.url;
    this.settings.save(patch);
    this.quotaCache = null;
    try { this.ctx.emit("llm/models-updated", PROVIDER); } catch { /* registry may not be listening */ }
  }

  /** MiMo TTS for the client's reading controls. */
  async speak(request) {
    const client = this.client();
    if (!client.configured()) throw failure("mimo/no-credentials", "MiMo 尚未配置密钥", false);
    const voiceSettings = this.settings.get("voice") ?? {};
    try {
      const result = await client.synthesize(request.text, {
        model: request.model ?? voiceSettings.model ?? "mimo-v2.5-tts",
        voice: request.voice ?? voiceSettings.voice ?? "",
        style: request.style ?? voiceSettings.style ?? "",
        format: request.format ?? "mp3"
      });
      return { ...result, chars: request.text.length };
    } catch (error) {
      throw failure("mimo/tts-failed", String(error?.message ?? error), true);
    }
  }
}

function registerQuotaTool(ctx, serviceOf) {
  try {
    ctx.inject(["tools"], scope => {
      scope.effect(() => scope.tools.register(defineTool({
        name: "mimo_quota",
        description: "查询 Xiaomi MiMo Token Plan / Coding Plan 套餐余量（周期积分总额、已用、剩余与有效期）。当用户问到 MiMo 套餐、额度、余量时使用。",
        parameters: {},
        output: {
          schema: { type: "string" },
          render: (_args, value) => [{ type: "text", text: value }]
        },
        async execute() {
          const status = await serviceOf().status({ force: true });
          if (!status.auth.hasKey) return "MiMo Coding Plan 尚未配置密钥：请在设置页完成登录。";
          if (status.quota === null) {
            return status.quotaError !== ""
              ? `查询失败：${status.quotaError}`
              : "当前凭据不是 Coding Plan 套餐（按量计费），没有套餐余量。";
          }
          const q = status.quota;
          const period = formatPeriod(q.period.startAt, q.period.endAt, serviceOf().now());
          return [`套餐：${q.planCode || "Coding Plan"}`,
            `剩余：${formatCredits(q.quota.remainingCredits)} credits（${Math.round((100 - usagePercent(q.quota)) * 10) / 10}%）`,
            `本周期已用：${formatCredits(q.quota.usedCredits)}（${usagePercent(q.quota)}%），总额 ${formatCredits(q.quota.totalCredits)}`,
            `计费周期：${period.startAt} ~ ${period.endAt}${period.daysLeft === null ? "" : `（还剩 ${period.daysLeft} 天）`}`,
            `自动续费：${q.autoRenew ? "开" : "关"}`].join("\n");
        }
      })));
    });
  } catch { /* tools service unavailable */ }
}

export function apply(ctx) {
  registerRemotes(ctx);
  ctx.plugin(MimoService, {});
  // Lazy lookup: consumers resolve the service through the context so a
  // reload can replace it without stale captures.
  const serviceOf = () => ctx.get("mimo");
  registerQuotaTool(ctx, serviceOf);
  // Speech provider joins the voice-input registry when that capability is mounted.
  try {
    ctx.inject(["speechToText"], scope => {
      scope.effect(() => {
        const dispose = scope.speechToText.register(createMimoSpeechProvider({ client: () => serviceOf().client() }));
        return dispose;
      });
    });
  } catch { /* speech capability not mounted */ }
  // The LLM route: one registration, disposable with the fiber.
  const adapter = new MimoAdapter({
    client: () => serviceOf().client(),
    attachments: () => ctx.get("attachments"),
    defaultThinking: () => serviceOf().settings.get("thinking") ?? "high"
  });
  const registration = ctx.llm.registerAdapter([PROVIDER], adapter);
  ctx.effect(() => registration);
  ctx.logger?.info("dsh-mimo: provider ready");
}

export default { name, inject, apply };
