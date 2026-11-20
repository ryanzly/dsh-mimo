// dsh-mimo —— Client 侧
//
// UI 全部走 DSH 原生插槽：
//   1. settings.section：登录（OAuth 一键为主，手动粘贴折叠为高级项）/ Coding Plan 余量
//      / 模型列表 / 思考档位 / 语音设置。
//   2. conversation.input.right：余量药丸（选中 MiMo 模型时），无额外浮动按钮。
//   3. conversation.chat.text-interaction：选中文字后的「朗读」（与「引用」同一原生交互面）。
//   4. conversation.chat.assistant-actions：消息动作行里的「朗读」（与反馈按钮同一原生行）。
//
// Remote 契约与 Host 的 lib/index.js 对齐（dsh-mimo#mimo/*）。

window.__ModuleLoader__.load({
	id: "dsh-mimo",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const react = require("react");
		const h = react.createElement;

		// ── 词典 ────────────────────────────────────────────────────────────────
		const zh = {
			nav: "MiMo Coding Plan",
			pillHint: "当前为 MiMo 模型，点击查看套餐余量",
			remaining: "剩余",
			used: "本周期已用",
			total: "总额",
			refresh: "刷新",
			plan: "套餐",
			daysLeft: "还剩 {n} 天",
			autoRenew: "自动续费",
			on: "开",
			off: "关",
			loginTitle: "登录",
			oauthLogin: "浏览器授权登录",
			oauthHint: "跳转 Xiaomi MiMo 开放平台完成授权，自动创建 API Key，无需手动配置。",
			loggingIn: "等待浏览器授权…",
			openManually: "浏览器没打开？访问：",
			pasteCode: "或粘贴平台返回的授权码：",
			pasteCodePlaceholder: "粘贴授权码（u=... 的整段内容）",
			submitCode: "提交",
			cancelLogin: "取消",
			loginDone: "登录成功",
			loginFailed: "登录失败",
			currentKey: "当前密钥",
			manual: "手动粘贴密钥 / 高级",
			keyPlaceholder: "粘贴 tp- / ttp- 密钥",
			region: "集群",
			baseUrl: "Base URL（留空自动判断）",
			save: "保存",
			saved: "已保存",
			noKey: "尚未登录",
			quotaTitle: "套餐余量",
			quotaNone: "当前凭据不是 Coding Plan 套餐（按量计费），没有套餐余量。",
			quotaError: "余量查询失败",
			modelsTitle: "可用模型（自动更新）",
			modelsLive: "实时获取",
			modelsFallback: "默认列表（未能实时获取）",
			thinkingTitle: "思考档位（默认值）",
			thinkingOff: "Off · 关闭思考",
			thinkingLow: "Low · 低",
			thinkingMedium: "Medium · 中",
			thinkingHigh: "High · 深度思考",
			thinkingHint: "MiMo 深度思考目前是开/关语义：Off 之外的档位行为一致，均开启深度思考。",
			voiceTitle: "语音",
			ttsModel: "TTS 模型",
			ttsVoice: "音色（留空用默认）",
			ttsStyle: "风格指令（可选）",
			ttsTest: "试听",
			ttsPlaying: "播放中…",
			asrLanguage: "语音输入识别语言",
			asrHint: "语音输入走 DSH 官方「语音输入」插件：识别来源选「MiMo 语音识别（云端）」即可。",
			speakAction: "朗读",
			speakSelection: "朗读选中文字",
			speakThis: "朗读这条回复",
			speakNothing: "没有可朗读的文字",
			speakFailed: "朗读失败",
			speakPlaying: "朗读中…",
			stopSpeak: "停止朗读",
			error: "出错了"
		};
		const en = {
			nav: "MiMo Coding Plan",
			pillHint: "A MiMo model is selected — click for plan credits",
			remaining: "Remaining",
			used: "Used this cycle",
			total: "Total",
			refresh: "Refresh",
			plan: "Plan",
			daysLeft: "{n} days left",
			autoRenew: "Auto renew",
			on: "On",
			off: "Off",
			loginTitle: "Sign-in",
			oauthLogin: "Sign in with browser",
			oauthHint: "Opens the Xiaomi MiMo platform to authorize and create an API key automatically.",
			loggingIn: "Waiting for browser authorization…",
			openManually: "Browser didn't open? Visit:",
			pasteCode: "Or paste the authorization code:",
			pasteCodePlaceholder: "Paste the code (the whole u=... blob)",
			submitCode: "Submit",
			cancelLogin: "Cancel",
			loginDone: "Signed in",
			loginFailed: "Sign-in failed",
			currentKey: "Current key",
			manual: "Paste a key / advanced",
			keyPlaceholder: "Paste a tp- / ttp- key",
			region: "Cluster",
			baseUrl: "Base URL (auto by key)",
			save: "Save",
			saved: "Saved",
			noKey: "Not signed in",
			quotaTitle: "Plan credits",
			quotaNone: "This credential is not a Coding Plan subscription (pay-as-you-go).",
			quotaError: "Failed to read credits",
			modelsTitle: "Available models (auto-updating)",
			modelsLive: "live",
			modelsFallback: "default list (live discovery unavailable)",
			thinkingTitle: "Default reasoning level",
			thinkingOff: "Off",
			thinkingLow: "Low",
			thinkingMedium: "Medium",
			thinkingHigh: "High · deep thinking",
			thinkingHint: "MiMo deep thinking is an on/off switch today: every level except Off behaves the same.",
			voiceTitle: "Voice",
			ttsModel: "TTS model",
			ttsVoice: "Voice (default when empty)",
			ttsStyle: "Style instruction (optional)",
			ttsTest: "Preview",
			ttsPlaying: "Playing…",
			asrLanguage: "Voice-input recognition language",
			asrHint: "Voice input uses the official Voice input plugin: pick 'MiMo ASR (cloud)' as the recognizer.",
			speakAction: "Read aloud",
			speakSelection: "Read selection aloud",
			speakThis: "Read this reply aloud",
			speakNothing: "Nothing to read",
			speakFailed: "Speech failed",
			speakPlaying: "Reading…",
			stopSpeak: "Stop",
			error: "Something went wrong"
		};

		// ── Remote 契约（与 Host 的 lib/index.js 逐字对齐） ───────────────────────
		const NS = "mimo";
		const codec = (type, parse) => ({ mode: "strict", typeSymbol: `dsh-mimo#${type}`, schema: { parse }, create: () => ({ parse }) });
		const parseObject = (type) => (value) => {
			if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`Invalid ${type}`);
			return value;
		};
		const objectCodec = (type) => codec(type, parseObject(type));
		const mimoRemote = {
			package: "dsh-mimo",
			descriptors: [
				{ id: "dsh-mimo#mimo/status", service: "mimo", namespace: "mimo", method: "status", invocation: { kind: "direct" }, parameters: [], result: objectCodec("MimoStatus") },
				{ id: "dsh-mimo#mimo/save", service: "mimo", namespace: "mimo", method: "save", invocation: { kind: "direct" }, parameters: [{ name: "patch", wire: "patch", source: "json", codec: objectCodec("MimoSettingsPatch") }], result: objectCodec("MimoStatus") },
				{ id: "dsh-mimo#mimo/models", service: "mimo", namespace: "mimo", method: "models", invocation: { kind: "direct" }, parameters: [], result: objectCodec("MimoModels") },
				{ id: "dsh-mimo#mimo/quota", service: "mimo", namespace: "mimo", method: "quota", invocation: { kind: "direct" }, parameters: [], result: objectCodec("MimoStatus") },
				{ id: "dsh-mimo#mimo/login", service: "mimo", namespace: "mimo", method: "login", invocation: { kind: "direct" }, parameters: [], result: objectCodec("MimoLoginState") },
				{ id: "dsh-mimo#mimo/loginStatus", service: "mimo", namespace: "mimo", method: "loginStatus", invocation: { kind: "direct" }, parameters: [], result: objectCodec("MimoLoginState") },
				{ id: "dsh-mimo#mimo/loginSubmit", service: "mimo", namespace: "mimo", method: "loginSubmit", invocation: { kind: "direct" }, parameters: [{ name: "code", wire: "code", source: "json", codec: objectCodec("MimoLoginCode") }], result: objectCodec("MimoLoginState") },
				{ id: "dsh-mimo#mimo/cancelLogin", service: "mimo", namespace: "mimo", method: "cancelLogin", invocation: { kind: "direct" }, parameters: [], result: objectCodec("MimoLoginState") },
				{ id: "dsh-mimo#mimo/speak", service: "mimo", namespace: "mimo", method: "speak", invocation: { kind: "direct" }, parameters: [{ name: "request", wire: "request", source: "json", codec: objectCodec("MimoSpeakRequest") }], result: objectCodec("MimoSpeakResult") }
			]
		};

		const MIMO_PROVIDER = "xiaomi-mimo";
		const REGIONS = [
			{ id: "cn", label: "CN" },
			{ id: "sgp", label: "SGP" },
			{ id: "ams", label: "AMS" }
		];
		const TTS_MODELS = ["mimo-v2.5-tts", "mimo-v2.5-tts-voicedesign", "mimo-v2.5-tts-voiceclone"];
		const THINKING_LEVELS = [
			{ id: "off", label: "thinkingOff" },
			{ id: "low", label: "thinkingLow" },
			{ id: "medium", label: "thinkingMedium" },
			{ id: "high", label: "thinkingHigh" }
		];

		// ── 友好格式化（与 Host 的 mimo-api.js 保持一致） ─────────────────────────
		function formatCredits(value) {
			const n = Number(value) || 0;
			const trim = (text) => text.replace(/\.0$/, "");
			if (Math.abs(n) >= 1e8) return `${trim((n / 1e8).toFixed(1))} 亿`;
			if (Math.abs(n) >= 1e4) return `${trim((n / 1e4).toFixed(1))} 万`;
			return String(Math.round(n));
		}
		function formatPeriod(startAt, endAt, now = Date.now()) {
			const parse = (text) => {
				const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(String(text ?? "").trim());
				return match ? Date.UTC(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6]) : null;
			};
			const fmt = (ms) => {
				const d = new Date(ms);
				const pad = (n) => String(n).padStart(2, "0");
				return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
			};
			const start = parse(startAt);
			const end = parse(endAt);
			if (start === null || end === null) return { label: `${startAt ?? ""} ~ ${endAt ?? ""}`, daysLeft: null };
			return { label: `${fmt(start)} ~ ${fmt(end)}`, daysLeft: Math.max(0, Math.ceil((end - now) / 86400000)) };
		}
		function usagePercent(quota) {
			const total = Number(quota?.totalCredits) || 0;
			const used = Number(quota?.usedCredits) || 0;
			if (total <= 0) return 0;
			return Math.min(100, Math.max(0, Math.round((used / total) * 1000) / 10));
		}

		// ── 样式 ────────────────────────────────────────────────────────────────
		function mountStyles() {
			const css = `
				.dsh-mimo-card { border: 1px solid var(--border, rgba(128,128,128,.25)); border-radius: 10px; padding: 12px 14px; margin: 10px 0; }
				.dsh-mimo-card h3 { margin: 0 0 8px; font-size: 13px; font-weight: 600; opacity: .85; }
				.dsh-mimo-row { display: flex; gap: 8px; align-items: center; margin: 6px 0; flex-wrap: wrap; }
				.dsh-mimo-row label { font-size: 12px; opacity: .8; min-width: 88px; }
				.dsh-mimo-input { flex: 1; min-width: 160px; padding: 6px 8px; border-radius: 6px; border: 1px solid var(--border, rgba(128,128,128,.35)); background: transparent; color: inherit; font-size: 12px; }
				.dsh-mimo-btn { padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border, rgba(128,128,128,.35)); background: transparent; color: inherit; cursor: pointer; font-size: 12px; }
				.dsh-mimo-btn:hover { background: rgba(128,128,128,.12); }
				.dsh-mimo-btn-primary { background: var(--accent, #3b82f6); border-color: transparent; color: #fff; }
				.dsh-mimo-btn-ghost { border: none; padding: 2px 6px; font-size: 12px; opacity: .85; }
				.dsh-mimo-hint { font-size: 11px; opacity: .65; line-height: 1.6; }
				.dsh-mimo-big { font-size: 20px; font-weight: 600; margin: 4px 0 2px; }
				.dsh-mimo-bar { height: 6px; border-radius: 3px; background: rgba(128,128,128,.2); overflow: hidden; margin: 8px 0; }
				.dsh-mimo-bar > div { height: 100%; background: var(--accent, #3b82f6); }
				.dsh-mimo-pill { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--border, rgba(128,128,128,.3)); font-size: 11px; cursor: pointer; white-space: nowrap; }
				.dsh-mimo-pill:hover { background: rgba(128,128,128,.12); }
				.dsh-mimo-pop { position: absolute; bottom: 34px; right: 0; z-index: 50; min-width: 230px; background: var(--bg, #fff); border: 1px solid var(--border, rgba(128,128,128,.3)); border-radius: 10px; padding: 12px; box-shadow: 0 8px 24px rgba(0,0,0,.18); }
				.dsh-mimo-kv { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; margin: 4px 0; }
				.dsh-mimo-kv span:first-child { opacity: .7; }
				.dsh-mimo-models { max-height: 180px; overflow: auto; font-size: 12px; }
				.dsh-mimo-models div { padding: 2px 0; opacity: .85; }
				.dsh-mimo-details > summary { cursor: pointer; font-size: 12px; opacity: .75; margin-top: 6px; }
			`;
			const style = document.createElement("style");
			style.textContent = css;
			document.head.appendChild(style);
			return () => style.remove();
		}

		// ── 朗读（MiMo TTS，分段顺序播放） ──────────────────────────────────────
		let currentAudio = null;
		function playAudio(base64, format) {
			return new Promise((resolve, reject) => {
				const mime = format === "wav" ? "audio/wav" : format === "pcm" || format === "pcm16" ? "audio/wav" : "audio/mpeg";
				const audio = new Audio(`data:${mime};base64,${base64}`);
				currentAudio = audio;
				audio.onended = () => { if (currentAudio === audio) currentAudio = null; resolve(); };
				audio.onerror = () => { if (currentAudio === audio) currentAudio = null; reject(new Error("audio")); };
				audio.play().catch(reject);
			});
		}
		function stopAudio() {
			if (currentAudio) { currentAudio.pause(); currentAudio = null; }
		}
		function splitSpeech(text, limit = 1500) {
			const chunks = [];
			let rest = String(text ?? "").trim();
			while (rest.length > 0) {
				if (rest.length <= limit) { chunks.push(rest); break; }
				let cut = rest.lastIndexOf("。", limit);
				if (cut < limit / 2) cut = rest.lastIndexOf("\n", limit);
				if (cut < limit / 2) cut = limit;
				chunks.push(rest.slice(0, cut + 1));
				rest = rest.slice(cut + 1).trim();
			}
			return chunks.filter((chunk) => chunk !== "");
		}
		async function speakText(call, text) {
			const clean = String(text ?? "").replace(/\s+/g, " ").trim();
			if (clean === "") throw new Error("empty");
			for (const chunk of splitSpeech(clean)) {
				const result = await call("speak", { text: chunk });
				await playAudio(result.audioBase64, result.format);
			}
		}

		// 消息动作行里取「这条回复」的正文：动作行就在正文节点后面。
		function readAssistantTextFromDom(buttonEl) {
			try {
				const tail = buttonEl.closest("[data-turn-tail]");
				const node = tail ? tail.previousElementSibling : null;
				if (!node) return "";
				const clone = node.cloneNode(true);
				for (const bad of clone.querySelectorAll("button, [role=button], svg, style, script")) bad.remove();
				return (clone.innerText || clone.textContent || "").trim();
			} catch {
				return "";
			}
		}

		// ── 设置页 ──────────────────────────────────────────────────────────────
		function QuotaPanel({ quota, quotaError, hasKey, busy, onRefresh, t }) {
			if (!hasKey) return h("div", { className: "dsh-mimo-hint" }, t("noKey"));
			if (!quota) return h("div", { className: "dsh-mimo-hint" }, quotaError ? `${t("quotaError")}：${quotaError}` : t("quotaNone"));
			const usedPct = usagePercent(quota.quota);
			const remainPct = Math.round((100 - usedPct) * 10) / 10;
			const period = formatPeriod(quota.period.startAt, quota.period.endAt);
			return h("div", null,
				h("div", { className: "dsh-mimo-big" }, `${t("remaining")} ${formatCredits(quota.quota.remainingCredits)} credits（${remainPct}%）`),
				h("div", { className: "dsh-mimo-bar" }, h("div", { style: { width: `${usedPct}%` } })),
				h("div", { className: "dsh-mimo-kv" }, h("span", null, `${t("used")} ${formatCredits(quota.quota.usedCredits)}（${usedPct}%）`), h("span", null, `${t("total")} ${formatCredits(quota.quota.totalCredits)}`)),
				h("div", { className: "dsh-mimo-kv" }, h("span", null, t("plan")), h("span", null, `${period.label}${period.daysLeft === null ? "" : ` · ${t("daysLeft").replace("{n}", period.daysLeft)}`}`)),
				h("div", { className: "dsh-mimo-kv" }, h("span", null, t("autoRenew")), h("span", null, quota.autoRenew ? t("on") : t("off"))),
				h("div", { className: "dsh-mimo-row" },
					h("button", { className: "dsh-mimo-btn", disabled: busy, onClick: onRefresh }, t("refresh")),
					h("span", { className: "dsh-mimo-hint" }, quota.planCode || "")));
		}

		function MimoSection({ call, t }) {
			const [status, setStatus] = react.useState(null);
			const [busy, setBusy] = react.useState("");
			const [notice, setNotice] = react.useState("");
			const [keyInput, setKeyInput] = react.useState("");
			const [region, setRegion] = react.useState("cn");
			const [baseUrl, setBaseUrl] = react.useState("");
			const [thinking, setThinking] = react.useState("high");
			const [voice, setVoice] = react.useState({ model: TTS_MODELS[0], voice: "", style: "" });
			const [asrLanguage, setAsrLanguage] = react.useState("auto");
			const [login, setLogin] = react.useState(null);
			const [codeInput, setCodeInput] = react.useState("");

			const refresh = react.useCallback(async (force = false) => {
				try {
					const next = await call(force ? "quota" : "status");
					setStatus(next);
					const settings = next.settings ?? {};
					if (settings.region) setRegion(settings.region);
					if (settings.baseUrl) setBaseUrl(settings.baseUrl);
					if (settings.thinking) setThinking(settings.thinking);
					if (settings.voice) setVoice({ model: settings.voice.model ?? TTS_MODELS[0], voice: settings.voice.voice ?? "", style: settings.voice.style ?? "" });
					if (settings.asr?.language) setAsrLanguage(settings.asr.language);
				} catch (error) {
					setNotice(String(error?.message ?? error));
				}
			}, [call]);

			react.useEffect(() => { void refresh(); }, [refresh]);
			react.useEffect(() => {
				if (!login || login.state !== "pending") return undefined;
				const timer = setInterval(async () => {
					try {
						const state = await call("loginStatus");
						setLogin(state);
						if (state.state === "done") { setNotice(t("loginDone")); void refresh(true); }
						if (state.state === "failed" && state.error) setNotice(`${t("loginFailed")}：${state.error}`);
					} catch { /* keep polling */ }
				}, 2000);
				return () => clearInterval(timer);
			}, [login, call, refresh, t]);

			const startLogin = async () => {
				setBusy("login");
				try { setLogin(await call("login")); }
				catch (error) { setNotice(String(error?.message ?? error)); }
				finally { setBusy(""); }
			};
			const submitCode = async () => {
				if (codeInput.trim() === "") return;
				setBusy("code");
				try {
					const state = await call("loginSubmit", { code: codeInput.trim() });
					setLogin(state);
					if (state.state === "done") { setNotice(t("loginDone")); void refresh(true); }
					else if (state.error) setNotice(state.error);
				} finally { setBusy(""); }
			};
			const save = async (patch) => {
				setBusy("save");
				try {
					setStatus(await call("save", patch));
					setNotice(t("saved"));
					setKeyInput("");
				} catch (error) {
					setNotice(String(error?.message ?? error));
				} finally { setBusy(""); }
			};
			const preview = async () => {
				setBusy("tts");
				try {
					const result = await call("speak", { text: "你好，我是 MiMo 语音，很高兴认识你。", model: voice.model, voice: voice.voice, style: voice.style });
					await playAudio(result.audioBase64, result.format);
					setNotice(t("ttsPlaying"));
				} catch (error) {
					setNotice(`${t("speakFailed")}：${String(error?.message ?? error)}`);
				} finally { setBusy(""); }
			};

			const auth = status?.auth ?? {};
			const models = status?.models ?? { models: [], source: "fallback" };
			return h("div", null,
				h("div", { className: "dsh-mimo-card" },
					h("h3", null, t("loginTitle")),
					auth.hasKey
						? h("div", { className: "dsh-mimo-hint" }, `${t("currentKey")}：${auth.keyPreview ?? ""}${auth.uid ? ` · uid ${auth.uid}` : ""}`)
						: h("div", { className: "dsh-mimo-hint" }, t("noKey")),
					h("div", { className: "dsh-mimo-row" },
						h("button", { className: "dsh-mimo-btn dsh-mimo-btn-primary", disabled: busy !== "" || (login && login.state === "pending"), onClick: startLogin }, t("oauthLogin")),
						login && login.state === "pending" ? h("button", { className: "dsh-mimo-btn", onClick: () => { void call("cancelLogin").then(setLogin).catch(() => {}); } }, t("cancelLogin")) : null),
					h("div", { className: "dsh-mimo-hint" }, t("oauthHint")),
					login && login.state === "pending" ? h("div", null,
						h("div", { className: "dsh-mimo-hint" }, t("loggingIn")),
						login.manualUrl ? h("div", { className: "dsh-mimo-hint" }, t("openManually"), " ", login.manualUrl) : null,
						h("div", { className: "dsh-mimo-row" },
							h("input", { className: "dsh-mimo-input", placeholder: t("pasteCodePlaceholder"), value: codeInput, onChange: (e) => setCodeInput(e.target.value) }),
							h("button", { className: "dsh-mimo-btn", disabled: busy !== "", onClick: submitCode }, t("submitCode")))
					) : null,
					notice ? h("div", { className: "dsh-mimo-hint" }, notice) : null,
					h("details", { className: "dsh-mimo-details" },
						h("summary", null, t("manual")),
						h("div", { className: "dsh-mimo-row" },
							h("input", { className: "dsh-mimo-input", type: "password", placeholder: t("keyPlaceholder"), value: keyInput, onChange: (e) => setKeyInput(e.target.value) }),
							h("select", { className: "dsh-mimo-input", value: region, onChange: (e) => setRegion(e.target.value) },
								REGIONS.map((r) => h("option", { key: r.id, value: r.id }, `${t("region")} ${r.label}`))),
							h("button", { className: "dsh-mimo-btn", disabled: busy !== "" || keyInput.trim() === "", onClick: () => void save({ apiKey: keyInput.trim(), region, baseUrl: baseUrl.trim() }) }, t("save"))),
						h("div", { className: "dsh-mimo-row" },
							h("label", null, t("baseUrl")),
							h("input", { className: "dsh-mimo-input", placeholder: "https://token-plan-cn.xiaomimimo.com/v1", value: baseUrl, onChange: (e) => setBaseUrl(e.target.value) })))),

				h("div", { className: "dsh-mimo-card" },
					h("h3", null, t("quotaTitle")),
					h(QuotaPanel, {
						quota: status?.quota ?? null,
						quotaError: status?.quotaError ?? "",
						hasKey: auth.hasKey === true,
						busy: busy !== "",
						onRefresh: () => { setBusy("quota"); void refresh(true).finally(() => setBusy("")); },
						t
					})),

				h("div", { className: "dsh-mimo-card" },
					h("h3", null, t("modelsTitle")),
					h("div", { className: "dsh-mimo-hint" }, models.source === "live" ? t("modelsLive") : t("modelsFallback")),
					h("div", { className: "dsh-mimo-models" },
						(models.models ?? []).map((model) => h("div", { key: model.id }, model.name ?? model.id, model.contextWindow ? ` · ${Math.round(model.contextWindow / 1000)}K` : "")))),

				h("div", { className: "dsh-mimo-card" },
					h("h3", null, t("thinkingTitle")),
					h("div", { className: "dsh-mimo-row" },
						h("select", { className: "dsh-mimo-input", value: thinking, onChange: (e) => { setThinking(e.target.value); void save({ thinking: e.target.value }); } },
							THINKING_LEVELS.map((level) => h("option", { key: level.id, value: level.id }, t(level.label))))),
					h("div", { className: "dsh-mimo-hint" }, t("thinkingHint"))),

				h("div", { className: "dsh-mimo-card" },
					h("h3", null, t("voiceTitle")),
					h("div", { className: "dsh-mimo-row" },
						h("label", null, t("ttsModel")),
						h("select", { className: "dsh-mimo-input", value: voice.model, onChange: (e) => { const next = { ...voice, model: e.target.value }; setVoice(next); void save({ voice: next }); } },
							TTS_MODELS.map((model) => h("option", { key: model, value: model }, model)))),
					h("div", { className: "dsh-mimo-row" },
						h("label", null, t("ttsVoice")),
						h("input", { className: "dsh-mimo-input", value: voice.voice, onChange: (e) => setVoice({ ...voice, voice: e.target.value }), onBlur: () => void save({ voice }) }),
						h("button", { className: "dsh-mimo-btn", disabled: busy !== "" || !status?.auth?.hasKey, onClick: preview }, t("ttsTest"))),
					h("div", { className: "dsh-mimo-row" },
						h("label", null, t("ttsStyle")),
						h("input", { className: "dsh-mimo-input", value: voice.style, onChange: (e) => setVoice({ ...voice, style: e.target.value }), onBlur: () => void save({ voice }) })),
					h("div", { className: "dsh-mimo-row" },
						h("label", null, t("asrLanguage")),
						h("select", { className: "dsh-mimo-input", value: asrLanguage, onChange: (e) => { setAsrLanguage(e.target.value); void save({ asr: { language: e.target.value } }); } },
							["auto", "zh", "en"].map((id) => h("option", { key: id, value: id }, id)))),
					h("div", { className: "dsh-mimo-hint" }, t("asrHint")))
			);
		}

		// ── 余量药丸（仅药丸，无浮动按钮） ───────────────────────────────────────
		function MimoPillEntry({ store, call, t }) {
			const state = react.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
			const [open, setOpen] = react.useState(false);
			const [status, setStatus] = react.useState(null);
			const isMimo = state?.current?.provider === MIMO_PROVIDER;

			react.useEffect(() => {
				if (!isMimo) return undefined;
				let alive = true;
				const load = async () => {
					try { const next = await call("status"); if (alive) setStatus(next); } catch { /* stay quiet */ }
				};
				void load();
				const timer = setInterval(load, 5 * 60 * 1000);
				return () => { alive = false; clearInterval(timer); };
			}, [isMimo, call]);
			if (!isMimo) return null;

			const quota = status?.quota ?? null;
			const remainPct = quota ? Math.round((100 - usagePercent(quota.quota)) * 10) / 10 : null;
			return h("div", { style: { position: "relative", display: "inline-flex", gap: 6, alignItems: "center" } },
				h("button", { className: "dsh-mimo-pill", title: t("pillHint"), onClick: () => setOpen((value) => !value) },
					quota ? `MiMo 余 ${remainPct}%` : "MiMo"),
				open ? h("div", { className: "dsh-mimo-pop" },
					h(QuotaPanel, {
						quota,
						quotaError: status?.quotaError ?? "",
						hasKey: status?.auth?.hasKey === true,
						busy: false,
						onRefresh: async () => { try { setStatus(await call("quota")); } catch { /* keep last */ } },
						t
					})) : null);
		}

		// ── 原生语音入口 ─────────────────────────────────────────────────────────
		// 选中文字 → 原生文本交互面（与「引用」并排）→「朗读」。
		function SpeakSelectionAction({ readText, dismiss, call, t }) {
			const [busy, setBusy] = react.useState(false);
			const speak = async () => {
				const text = readText();
				if (!text) { dismiss(); return; }
				setBusy(true);
				try { await speakText(call, text); }
				catch { /* settings page shows diagnostics */ }
				finally { setBusy(false); dismiss(); }
			};
			return h("button", { className: "dsh-mimo-btn dsh-mimo-btn-ghost", disabled: busy, title: t("speakSelection"), onClick: speak }, busy ? t("speakPlaying") : `🔊 ${t("speakAction")}`);
		}

		// 回复动作行（与反馈按钮同一原生行）→「朗读这条回复」。
		function SpeakMessageAction({ call, t }) {
			const [busy, setBusy] = react.useState(false);
			const ref = react.useRef(null);
			const speak = async () => {
				if (busy) { stopAudio(); setBusy(false); return; }
				const text = readAssistantTextFromDom(ref.current);
				if (text === "") return;
				setBusy(true);
				try { await speakText(call, text); }
				catch { /* ignore */ }
				finally { setBusy(false); }
			};
			return h("button", {
				ref,
				className: "dsh-mimo-btn dsh-mimo-btn-ghost",
				title: busy ? t("stopSpeak") : t("speakThis"),
				onClick: speak
			}, busy ? "⏹" : "🔊");
		}

		// ── 装配 ────────────────────────────────────────────────────────────────
		const name = "dsh-mimo";
		const inject = ["slots", "locale", "remote", "sessions", "uiConversation"];
		function apply(ctx) {
			ctx.effect(() => mountStyles(), "dsh-mimo: styles");
			const t = ctx.locale.bind(NS);
			try { ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-mimo: locale"); } catch (error) { console.error("[dsh-mimo] locale:", error); }

			let mounted = Promise.resolve();
			const pendingTimers = new Set();
			try {
				mounted = ctx.remote.$mount(mimoRemote);
				ctx.effect(async () => await mounted, "dsh-mimo: mount remotes");
			} catch (error) {
				mounted = Promise.reject(error);
				mounted.catch(() => {});
			}
			const wait = (ms) => new Promise((resolve, reject) => {
				const timer = setTimeout(() => { pendingTimers.delete(timer); resolve(); }, ms);
				pendingTimers.add(timer);
			});
			const call = async (method, ...args) => {
				const deadline = Date.now() + 20000;
				try { await Promise.race([mounted, wait(20000)]); } catch { /* try anyway */ }
				for (;;) {
					const service = ctx.get("remote.mimo");
					if (service !== undefined) {
						if (typeof service[method] !== "function") throw new Error(`Host/Client 契约版本不匹配：Host 缺少 ${method}`);
						return await Promise.resolve(service[method](...args)).then((result) => {
							if (!result.ok) throw result.error;
							return result.value;
						});
					}
					if (Date.now() > deadline) throw new Error("remote.mimo 挂载超时：Host 端 dsh-mimo 未就绪");
					await wait(250);
				}
			};

			// 设置页
			try {
				ctx.slots.inject("settings.section", () => ctx.slots.register(
					{ name: "settings.section", id: "mimo", order: 23, locale: NS, label: () => t("nav"), inject: () => ({ call, t }) },
					MimoSection));
			} catch (error) { console.error("[dsh-mimo] settings:", error); }

			// 余量药丸
			ctx.inject(["modelDirectories"], (scope) => {
				try {
					scope.slots.inject("conversation.input.right", () => scope.slots.register(
						{ name: "conversation.input.right", id: "mimo-quota", order: 1002, locale: NS, inject: (sessionId) => ({ store: scope.modelDirectories.directoryFor(sessionId).store, call, t }) },
						MimoPillEntry));
				} catch (error) { console.error("[dsh-mimo] pill:", error); }
			});

			// 语音输出：全部走原生插槽，不再自设浮动按钮。
			try {
				ctx.effect(() => ctx.uiConversation.interactions.register({
					id: "mimo-speak",
					onInteraction(request) {
						if (request.trigger !== "selection" || request.readText() === null) return;
						request.open();
					}
				}), "dsh-mimo: selection interaction");
				ctx.slots.inject("conversation.chat.text-interaction", () => ctx.slots.register(
					{ name: "conversation.chat.text-interaction", key: "mimo-speak", locale: NS, inject: () => ({ call, t }) },
					SpeakSelectionAction));
			} catch (error) { console.error("[dsh-mimo] selection speak:", error); }
			try {
				ctx.slots.inject("conversation.chat.assistant-actions", () => ctx.slots.register(
					{ name: "conversation.chat.assistant-actions", id: "mimo-speak", order: 20, locale: NS, inject: () => ({ call, t }) },
					SpeakMessageAction));
			} catch (error) { console.error("[dsh-mimo] message speak:", error); }

			ctx.effect(() => () => {
				stopAudio();
				for (const timer of pendingTimers) clearTimeout(timer);
				pendingTimers.clear();
			}, "dsh-mimo: dispose audio and rpc timers");
		}

		exports.name = name;
		exports.inject = inject;
		exports.apply = apply;
		return module.exports;
	}
});
