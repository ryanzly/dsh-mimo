/**
 * MiMo platform API surface shared by the adapter, the speech provider and
 * the Host remote: base-URL resolution from key shape, model discovery,
 * Token Plan credits, ASR and TTS.
 *
 * Facts verified against mimo.mi.com docs (2026-11):
 *  - pay-as-you-go keys (sk-)  -> https://api.xiaomimimo.com/v1
 *  - Token Plan keys (tp-/ttp-) -> https://token-plan-{cn,sgp,ams}.xiaomimimo.com/v1
 *  - GET  /v1/models                      model discovery (OpenAI shape)
 *  - GET  /v1/platform/token_plan         plan credits (Token Plan keys only)
 *  - POST /v1/chat/completions            chat, ASR (mimo-v2.5-asr) and TTS
 *    (mimo-v2.5-tts*) all share this endpoint; ASR sends `input_audio` parts
 *    with `asr_options.language`, TTS puts the text in a role=assistant
 *    message and returns base64 audio in message.audio.data.
 */
import { attributionHeaders } from "@deepseek-ai/dsh-llm";

export const PAYG_BASE_URL = "https://api.xiaomimimo.com/v1";
export const TOKEN_PLAN_REGIONS = { cn: "https://token-plan-cn.xiaomimimo.com/v1", sgp: "https://token-plan-sgp.xiaomimimo.com/v1", ams: "https://token-plan-ams.xiaomimimo.com/v1" };

export const ASR_MODEL = "mimo-v2.5-asr";
export const TTS_MODELS = ["mimo-v2.5-tts", "mimo-v2.5-tts-voicedesign", "mimo-v2.5-tts-voiceclone"];
/** Fallback catalog used when live discovery is unavailable. */
export const KNOWN_MODELS = [
  { id: "mimo-v2.6-pro", name: "MiMo V2.6 Pro", contextWindow: 1000000, maxTokens: 131072 },
  { id: "mimo-v2.6-flash", name: "MiMo V2.6 Flash", contextWindow: 1000000, maxTokens: 131072 }
];

/** Resolve the endpoint for a key: Token Plan keys route to their cluster, sk- keys to pay-as-you-go. */
export function resolveBaseUrl({ apiKey = "", baseUrl = "", region = "cn" } = {}) {
  if (typeof baseUrl === "string" && baseUrl.trim() !== "") return normalizeBase(baseUrl);
  const key = String(apiKey ?? "").trim();
  if (/^tp-|^ttp-/.test(key)) return TOKEN_PLAN_REGIONS[region] ?? TOKEN_PLAN_REGIONS.cn;
  return PAYG_BASE_URL;
}

export function normalizeBase(url) {
  const trimmed = String(url).trim().replace(/\/+$/, "");
  return /\/v\d+$/.test(trimmed) ? trimmed : `${trimmed}/v1`;
}

export function keyKind(apiKey) {
  const key = String(apiKey ?? "").trim();
  if (/^ttp-/.test(key)) return "token-plan-team";
  if (/^tp-/.test(key)) return "token-plan";
  if (/^sk-/.test(key)) return "pay-as-you-go";
  return key === "" ? "none" : "unknown";
}

function headers(apiKey) {
  return {
    "content-type": "application/json",
    "api-key": apiKey,
    authorization: `Bearer ${apiKey}`,
    "x-mimo-source": "dsh-mimo",
    ...attributionHeaders()
  };
}

/** Thrown for provider failures; carries HTTP status for retry policy. */
export class MimoApiError extends Error {
  constructor(message, { status, code, body } = {}) {
    super(message);
    this.name = "MimoApiError";
    this.status = status;
    this.code = code ?? "mimo/api";
    this.body = body;
  }
}

async function readError(response) {
  let body = "";
  try { body = await response.text(); } catch { /* ignore */ }
  let message = `MiMo API ${response.status}`;
  try {
    const parsed = JSON.parse(body);
    message = parsed?.error?.message ?? parsed?.message ?? message;
  } catch { /* plain body */ }
  return new MimoApiError(message, { status: response.status, code: `mimo/http-${response.status}`, body });
}

export class MimoClient {
  /** @param {{ apiKey: string, baseUrl: string, fetcher?: typeof fetch }} options */
  constructor({ apiKey, baseUrl, fetcher } = {}) {
    this.apiKey = apiKey ?? "";
    this.baseUrl = baseUrl ?? "";
    this.fetcher = fetcher ?? globalThis.fetch;
    this.modelsCache = null;
  }

  configured() { return this.apiKey !== "" && this.baseUrl !== ""; }

  /**
   * Live model discovery with a small TTL cache and an honest fallback:
   * `source` tells the caller which of the two produced the list.
   */
  async listModels({ signal, force = false, now = Date.now } = {}) {
    if (!force && this.modelsCache && now - this.modelsCache.at < 5 * 60 * 1000) return this.modelsCache.value;
    try {
      const response = await this.fetcher(`${this.baseUrl}/models`, { headers: headers(this.apiKey), signal });
      if (!response.ok) throw await readError(response);
      const payload = await response.json();
      const data = Array.isArray(payload?.data) ? payload.data : [];
      const models = data.map(entry => ({
        id: String(entry?.id ?? ""),
        name: typeof entry?.name === "string" && entry.name !== "" ? entry.name : String(entry?.id ?? ""),
        contextWindow: typeof entry?.context_window === "number" ? entry.context_window : undefined,
        maxTokens: typeof entry?.max_tokens === "number" ? entry.max_tokens : undefined
      })).filter(entry => entry.id !== "");
      const value = { models: models.length > 0 ? models : KNOWN_MODELS, source: models.length > 0 ? "live" : "fallback" };
      this.modelsCache = { at: now, value };
      return value;
    } catch (error) {
      const value = { models: KNOWN_MODELS, source: "fallback", error: String(error?.message ?? error) };
      if (!this.modelsCache) this.modelsCache = { at: now, value };
      return value;
    }
  }

  /** GET /v1/platform/token_plan — Token Plan credits for the account behind the key. */
  async tokenPlan({ signal } = {}) {
    const response = await this.fetcher(`${this.baseUrl}/platform/token_plan`, { headers: headers(this.apiKey), signal });
    if (!response.ok) throw await readError(response);
    const payload = await response.json();
    return {
      planCode: String(payload?.plan_code ?? ""),
      period: {
        startAt: String(payload?.period?.start_at ?? ""),
        endAt: String(payload?.period?.end_at ?? "")
      },
      quota: {
        totalCredits: numberOr(payload?.quota?.total_credits),
        usedCredits: numberOr(payload?.quota?.used_credits),
        remainingCredits: numberOr(payload?.quota?.remaining_credits)
      },
      autoRenew: payload?.auto_renew === true,
      clawEnabled: payload?.claw_enabled === true
    };
  }

  /** One chat-completions call shared by ASR, TTS and plain probes. */
  async chatCompletions(body, { signal } = {}) {
    const response = await this.fetcher(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: headers(this.apiKey),
      body: JSON.stringify(body),
      signal
    });
    if (!response.ok) throw await readError(response);
    return response.json();
  }

  /** MiMo ASR: WAV bytes in, transcript out. Input must stay under 10 MB base64. */
  async transcribe(wavBytes, { language = "auto", signal } = {}) {
    const base64 = Buffer.from(wavBytes).toString("base64");
    if (base64.length > 10 * 1024 * 1024) throw new MimoApiError("录音超过 10 MB，请分段后重试", { code: "mimo/asr-too-large" });
    const payload = await this.chatCompletions({
      model: ASR_MODEL,
      messages: [{ role: "user", content: [{ type: "input_audio", input_audio: { data: `data:audio/wav;base64,${base64}` } }] }],
      asr_options: { language: language || "auto" }
    }, { signal });
    const content = payload?.choices?.[0]?.message?.content;
    const text = typeof content === "string" ? content : Array.isArray(content) ? content.map(part => part?.text ?? "").join("") : "";
    return { text: text.trim(), model: String(payload?.model ?? ASR_MODEL) };
  }

  /**
   * MiMo TTS: the text to speak goes in a role=assistant message; an optional
   * role=user message carries the natural-language style instruction. Returns
   * base64 audio plus its format.
   */
  async synthesize(text, { model = "mimo-v2.5-tts", voice = "", style = "", format = "mp3", signal } = {}) {
    const messages = [];
    if (style !== "") messages.push({ role: "user", content: style });
    messages.push({ role: "assistant", content: text });
    const audio = { format };
    if (voice !== "") audio.voice = voice;
    const payload = await this.chatCompletions({ model, messages, audio }, { signal });
    const data = payload?.choices?.[0]?.message?.audio?.data;
    if (typeof data !== "string" || data === "") throw new MimoApiError("TTS 未返回音频", { code: "mimo/tts-empty" });
    return { audioBase64: data, format, model: String(payload?.model ?? model) };
  }
}

function numberOr(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** Whether one endpoint is a Token Plan cluster (OAuth may return it with an sk- shaped key). */
export function isTokenPlanEndpoint(baseUrl) {
  return /token-plan/i.test(String(baseUrl ?? ""));
}

/** Credits as 亿/万 units: 71492410796 -> "714.9 亿". */
export function formatCredits(value) {
  const n = Number(value) || 0;
  const trim = text => text.replace(/\.0$/, "");
  if (Math.abs(n) >= 1e8) return `${trim((n / 1e8).toFixed(1))} 亿`;
  if (Math.abs(n) >= 1e4) return `${trim((n / 1e4).toFixed(1))} 万`;
  return String(Math.round(n));
}

/**
 * Plan period for display: the platform reports UTC "YYYY-MM-DD HH:mm:ss";
 * show local calendar dates plus days remaining, so the window matches what
 * the console shows instead of raw UTC strings.
 */
export function formatPeriod(startAt, endAt, now = Date.now()) {
  const parse = text => {
    const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(String(text ?? "").trim());
    if (!match) return null;
    return Date.UTC(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6]);
  };
  const fmt = ms => {
    const d = new Date(ms);
    const pad = n => String(n).padStart(2, "0");
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const start = parse(startAt);
  const end = parse(endAt);
  if (start === null || end === null) return { label: `${startAt ?? ""} ~ ${endAt ?? ""}`, daysLeft: null, valid: false };
  const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
  return { label: `${fmt(start)} ~ ${fmt(end)}`, daysLeft, valid: true };
}

/** Used-percentage of a credits quota, clamped to 0-100. */
export function usagePercent(quota) {
  const total = Number(quota?.totalCredits) || 0;
  const used = Number(quota?.usedCredits) || 0;
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((used / total) * 1000) / 10));
}

/**
 * Audio duration of a canonical PCM16 WAV, used for the ASR transcript stats.
 * Falls back to a byte-rate estimate from the fmt chunk when present.
 */
export function wavSeconds(bytes) {
  try {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let byteRate = 32000;
    for (let offset = 12; offset + 8 <= view.byteLength;) {
      const id = String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
      const size = view.getUint32(offset + 4, true);
      if (id === "fmt ") byteRate = view.getUint32(offset + 16, true) || byteRate;
      if (id === "data") return size / byteRate;
      offset += 8 + size + (size % 2);
    }
    return bytes.byteLength / byteRate;
  } catch {
    return 0;
  }
}
