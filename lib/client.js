// dsh-mimo —— Client 侧
//
// 三块 UI：
//   1. 设置页（settings.section 槽）：OAuth 登录 / 密钥快捷配置 / 套餐余量 / 模型列表 /
//      思考档位默认值 / 语音（MiMo TTS 试听、ASR 语言）。
//   2. 余量药丸（conversation.input.right 槽）：选中 MiMo 模型时显示套餐余量，点开看明细。
//   3. 朗读按钮（同一输入区）：把当前选中的文字交给 MiMo TTS 朗读。
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
			pill: "MiMo 余量",
			pillHint: "当前为 MiMo 模型，点击查看详情",
			credits: "积分",
			remaining: "剩余",
			used: "已用",
			total: "总额",
			period: "周期",
			to: "至",
			refresh: "刷新",
			refreshing: "刷新中…",
			autoRenew: "自动续费",
			on: "开",
			off: "关",
			plan: "套餐",
			loginTitle: "登录与密钥",
			oauthLogin: "浏览器授权登录",
			oauthHint: "跳转 Xiaomi MiMo 开放平台完成授权，自动创建 API Key，无需手动粘贴。",
			loggingIn: "等待浏览器授权…",
			openManually: "若浏览器未打开，请手动访问：",
			pasteCode: "或粘贴平台返回的授权码：",
			pasteCodePlaceholder: "粘贴授权码（u=... 的整段内容）",
			submitCode: "提交授权码",
			cancelLogin: "取消登录",
			loginDone: "登录成功",
			loginFailed: "登录失败",
			orKey: "或快捷配置 API Key",
			keyPlaceholder: "粘贴 tp- / ttp- / sk- 开头的密钥",
			region: "Token Plan 集群",
			baseUrl: "Base URL（可选，留空按密钥自动判断）",
			save: "保存",
			saved: "已保存",
			keySavedAs: "当前密钥",
			noKey: "尚未配置密钥",
			quotaTitle: "套餐余量",
			quotaNone: "当前密钥不是 Token Plan 套餐密钥（按量计费），无套餐余量。",
			quotaError: "余量查询失败",
			modelsTitle: "可用模型（自动更新）",
			modelsLive: "实时获取",
			modelsFallback: "默认列表（未能实时获取）",
			thinkingTitle: "思考档位（默认值）",
			thinkingOff: "Off · 关闭思考",
			thinkingLow: "Low · 低",
			thinkingMedium: "Medium · 中",
			thinkingHigh: "High · 深度思考",
			thinkingHint: "MiMo 当前仅支持深度思考开/关：Off 之外的档位行为一致，均开启深度思考。",
			voiceTitle: "语音",
			ttsModel: "TTS 模型",
			ttsVoice: "音色（可选，留空用默认）",
			ttsStyle: "风格指令（可选）",
			ttsTest: "试听",
			ttsPlaying: "播放中…",
			ttsEmpty: "先保存密钥再试听",
			asrLanguage: "语音输入识别语言",
			asrHint: "安装官方「语音输入」插件后，识别来源选「MiMo 语音识别（云端）」即可用 MiMo ASR。",
			speakSelection: "朗读选中文字",
			speakNothing: "先在对话里选中一段文字再点我",
			speakFailed: "朗读失败",
			copy: "复制",
			copied: "已复制",
			error: "出错了"
		};
		const en = {
			nav: "MiMo Coding Plan",
			pill: "MiMo credits",
			pillHint: "A MiMo model is selected — click for details",
			credits: "Credits",
			remaining: "Remaining",
			used: "Used",
			total: "Total",
			period: "Period",
			to: "to",
			refresh: "Refresh",
			refreshing: "Refreshing…",
			autoRenew: "Auto renew",
			on: "On",
			off: "Off",
			plan: "Plan",
			loginTitle: "Sign-in & API key",
			oauthLogin: "Sign in with browser",
			oauthHint: "Opens the Xiaomi MiMo platform to authorize and create an API key automatically.",
			loggingIn: "Waiting for browser authorization…",
			openManually: "If the browser did not open, visit:",
			pasteCode: "Or paste the authorization code returned by the platform:",
			pasteCodePlaceholder: "Paste the code (the whole u=... blob)",
			submitCode: "Submit code",
			cancelLogin: "Cancel",
			loginDone: "Signed in",
			loginFailed: "Sign-in failed",
			orKey: "Or paste an API key",
			keyPlaceholder: "Paste a tp- / ttp- / sk- key",
			region: "Token Plan cluster",
			baseUrl: "Base URL (optional; inferred from the key)",
			save: "Save",
			saved: "Saved",
			keySavedAs: "Current key",
			noKey: "No key configured",
			quotaTitle: "Plan credits",
			quotaNone: "This key is not a Token Plan key (pay-as-you-go) — no plan credits.",
			quotaError: "Failed to read credits",
			modelsTitle: "Available models (auto-updating)",
			modelsLive: "live",
			modelsFallback: "default list (live discovery unavailable)",
			thinkingTitle: "Default reasoning level",
			thinkingOff: "Off",
			thinkingLow: "Low",
			thinkingMedium: "Medium",
			thinkingHigh: "High · deep thinking",
			thinkingHint: "MiMo currently exposes deep thinking as on/off: every level except Off behaves the same.",
			voiceTitle: "Voice",
			ttsModel: "TTS model",
			ttsVoice: "Voice (optional)",
			ttsStyle: "Style instruction (optional)",
			ttsTest: "Preview",
			ttsPlaying: "Playing…",
			ttsEmpty: "Save a key first",
			asrLanguage: "Voice-input recognition language",
			asrHint: "With the official Voice input plugin, pick "MiMo ASR (cloud)" to use MiMo ASR.",
			speakSelection: "Read selection aloud",
			speakNothing: "Select some conversation text first",
			speakFailed: "Speech failed",
			copy: "Copy",
			copied: "Copied",
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
			{ id: "cn", label: "CN · token-plan-cn" },
			{ id: "sgp", label: "SGP · token-plan-sgp" },
			{ id: "ams", label: "AMS · token-plan-ams" }
		];
		const TTS_MODELS = ["mimo-v2.5-tts", "mimo-v2.5-tts-voicedesign", "mimo-v2.5-tts-voiceclone"];
		const THINKING_LEVELS = [
			{ id: "off", label: "thinkingOff" },
			{ id: "low", label: "thinkingLow" },
			{ id: "medium", label: "thinkingMedium" },
			{ id: "high", label: "thinkingHigh" }
		];

		// ── 小样式 ──────────────────────────────────────────────────────────────
		function mountStyles() {
			const css = `
				.dsh-mimo-card { border: 1px solid var(--border, rgba(128,128,128,.25)); border-radius: 10px; padding: 12px 14px; margin: 10px 0; }
				.dsh-mimo-card h3 { margin: 0 0 8px; font-size: 13px; font-weight: 600; opacity: .85; }
				.dsh-mimo-row { display: flex; gap: 8px; align-items: center; margin: 6px 0; flex-wrap: wrap; }
				.dsh-mimo-row label { font-size: 12px; opacity: .8; min-width: 96px; }
				.dsh-mimo-input { flex: 1; min-width: 180px; padding: 6px 8px; border-radius: 6px; border: 1px solid var(--border, rgba(128,128,128,.35)); background: transparent; color: inherit; font-size: 12px; }
				.dsh-mimo-btn { padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border, rgba(128,128,128,.35)); background: transparent; color: inherit; cursor: pointer; font-size: 12px; }
				.dsh-mimo-btn:hover { background: rgba(128,128,128,.12); }
				.dsh-mimo-btn-primary { background: var(--accent, #3b82f6); border-color: transparent; color: #fff; }
				.dsh-mimo-hint { font-size: 11px; opacity: .65; line-height: 1.6; }
				.dsh-mimo-bar { height: 6px; border-radius: 3px; background: rgba(128,128,128,.2); overflow: hidden; margin: 6px 0; }
				.dsh-mimo-bar > div { height: 100%; background: var(--accent, #3b82f6); }
				.dsh-mimo-pill { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--border, rgba(128,128,128,.3)); font-size: 11px; cursor: pointer; white-space: nowrap; }
				.dsh-mimo-pill:hover { background: rgba(128,128,128,.12); }
				.dsh-mimo-pop { position: absolute; bottom: 34px; right: 0; z-index: 50; min-width: 240px; background: var(--bg, #fff); border: 1px solid var(--border, rgba(128,128,128,.3)); border-radius: 10px; padding: 12px; box-shadow: 0 8px 24px rgba(0,0,0,.18); }
				.dsh-mimo-kv { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; margin: 4px 0; }
				.dsh-mimo-kv span:first-child { opacity: .7; }
				.dsh-mimo-models { max-height: 180px; overflow: auto; font-size: 12px; }
				.dsh-mimo-models div { padding: 2px 0; opacity: .85; }
			`;
			const style = document.createElement("style");
			style.textContent = css;
			document.head.appendChild(style);
			return () => style.remove();
		}

		function playAudio(base64, format) {
			const mime = format === "wav" ? "audio/wav" : format === "pcm" || format === "pcm16" ? "audio/wav" : "audio/mpeg";
			const audio = new Audio(`data:${mime};base64,${base64}`);
			return audio.play();
		}

		// ── 设置页 ──────────────────────────────────────────────────────────────
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
				try {
					const state = await call("login");
					setLogin(state);
				} catch (error) {
					setNotice(String(error?.message ?? error));
				} finally {
					setBusy("");
				}
			};
			const submitCode = async () => {
				if (codeInput.trim() === "") return;
				setBusy("code");
				try {
					const state = await call("loginSubmit", { code: codeInput.trim() });
					setLogin(state);
					if (state.state === "done") { setNotice(t("loginDone")); void refresh(true); }
					else if (state.error) setNotice(state.error);
				} finally {
					setBusy("");
				}
			};
			const cancelLogin = async () => {
				try { setLogin(await call("cancelLogin")); } catch { /* ignore */ }
			};
			const save = async (patch) => {
				setBusy("save");
				try {
					const next = await call("save", patch);
					setStatus(next);
					setNotice(t("saved"));
					setKeyInput("");
				} catch (error) {
					setNotice(String(error?.message ?? error));
				} finally {
					setBusy("");
				}
			};
			const preview = async () => {
				setBusy("tts");
				try {
					const result = await call("speak", { text: "你好，我是 MiMo 语音，很高兴认识你。", model: voice.model, voice: voice.voice, style: voice.style });
					playAudio(result.audioBase64, result.format);
					setNotice(t("ttsPlaying"));
				} catch (error) {
					setNotice(`${t("speakFailed")}：${String(error?.message ?? error)}`);
				} finally {
					setBusy("");
				}
			};

			const quota = status?.quota ?? null;
			const auth = status?.auth ?? {};
			const models = status?.models ?? { models: [], source: "fallback" };
			const percent = quota && quota.quota.totalCredits > 0 ? Math.min(100, Math.round(100 - (quota.quota.remainingCredits / quota.quota.totalCredits) * 100)) : 0;

			return h("div", null,
				h("div", { className: "dsh-mimo-card" },
					h("h3", null, t("loginTitle")),
					auth.hasKey
						? h("div", { className: "dsh-mimo-hint" }, `${t("keySavedAs")}：${auth.keyPreview ?? ""}（${auth.keyKind ?? ""}）${auth.uid ? ` · uid ${auth.uid}` : ""}`)
						: h("div", { className: "dsh-mimo-hint" }, t("noKey")),
					h("div", { className: "dsh-mimo-row" },
						h("button", { className: "dsh-mimo-btn dsh-mimo-btn-primary", disabled: busy !== "" || (login && login.state === "pending"), onClick: startLogin }, t("oauthLogin")),
						login && login.state === "pending" ? h("button", { className: "dsh-mimo-btn", onClick: cancelLogin }, t("cancelLogin")) : null),
					h("div", { className: "dsh-mimo-hint" }, t("oauthHint")),
					login && login.state === "pending" ? h("div", null,
						h("div", { className: "dsh-mimo-hint" }, t("loggingIn")),
						login.manualUrl ? h("div", { className: "dsh-mimo-hint" }, t("openManually"), " ", login.manualUrl) : null,
						h("div", { className: "dsh-mimo-row" },
							h("input", { className: "dsh-mimo-input", placeholder: t("pasteCodePlaceholder"), value: codeInput, onChange: e => setCodeInput(e.target.value) }),
							h("button", { className: "dsh-mimo-btn", disabled: busy !== "", onClick: submitCode }, t("submitCode")))
					) : null,
					h("div", { className: "dsh-mimo-row" },
						h("input", { className: "dsh-mimo-input", type: "password", placeholder: t("keyPlaceholder"), value: keyInput, onChange: e => setKeyInput(e.target.value) }),
						h("select", { className: "dsh-mimo-input", value: region, onChange: e => setRegion(e.target.value) },
							REGIONS.map(r => h("option", { key: r.id, value: r.id }, r.label))),
						h("button", { className: "dsh-mimo-btn", disabled: busy !== "" || keyInput.trim() === "", onClick: () => void save({ apiKey: keyInput.trim(), region, baseUrl: baseUrl.trim() }) }, t("save"))),
					h("div", { className: "dsh-mimo-row" },
						h("label", null, t("baseUrl")),
						h("input", { className: "dsh-mimo-input", placeholder: "https://token-plan-cn.xiaomimimo.com/v1", value: baseUrl, onChange: e => setBaseUrl(e.target.value) })),
					notice ? h("div", { className: "dsh-mimo-hint" }, notice) : null),

				h("div", { className: "dsh-mimo-card" },
					h("h3", null, t("quotaTitle")),
					quota
						? h("div", null,
							h("div", { className: "dsh-mimo-kv" }, h("span", null, t("plan")), h("span", null, quota.planCode || "Token Plan")),
							h("div", { className: "dsh-mimo-kv" }, h("span", null, t("period")), h("span", null, `${quota.period.startAt} ${t("to")} ${quota.period.endAt}`)),
							h("div", { className: "dsh-mimo-bar" }, h("div", { style: { width: `${percent}%` } })),
							h("div", { className: "dsh-mimo-kv" }, h("span", null, `${t("total")} ${quota.quota.totalCredits} / ${t("used")} ${quota.quota.usedCredits}`), h("span", null, `${t("remaining")} ${quota.quota.remainingCredits}`)),
							h("div", { className: "dsh-mimo-kv" }, h("span", null, t("autoRenew")), h("span", null, quota.autoRenew ? t("on") : t("off"))))
						: h("div", { className: "dsh-mimo-hint" }, status && status.quotaError ? `${t("quotaError")}：${status.quotaError}` : t("quotaNone")),
					h("div", { className: "dsh-mimo-row" },
						h("button", { className: "dsh-mimo-btn", disabled: busy !== "", onClick: () => { setBusy("quota"); void refresh(true).finally(() => setBusy("")); } }, t("refresh")))),

				h("div", { className: "dsh-mimo-card" },
					h("h3", null, t("modelsTitle")),
					h("div", { className: "dsh-mimo-hint" }, models.source === "live" ? t("modelsLive") : t("modelsFallback")),
					h("div", { className: "dsh-mimo-models" },
						(models.models ?? []).map(model => h("div", { key: model.id }, model.name ?? model.id, model.contextWindow ? ` · ${Math.round(model.contextWindow / 1000)}K` : "")))),

				h("div", { className: "dsh-mimo-card" },
					h("h3", null, t("thinkingTitle")),
					h("div", { className: "dsh-mimo-row" },
						h("select", { className: "dsh-mimo-input", value: thinking, onChange: e => { setThinking(e.target.value); void save({ thinking: e.target.value }); } },
							THINKING_LEVELS.map(level => h("option", { key: level.id, value: level.id }, t(level.label))))),
					h("div", { className: "dsh-mimo-hint" }, t("thinkingHint"))),

				h("div", { className: "dsh-mimo-card" },
					h("h3", null, t("voiceTitle")),
					h("div", { className: "dsh-mimo-row" },
						h("label", null, t("ttsModel")),
						h("select", { className: "dsh-mimo-input", value: voice.model, onChange: e => { const next = { ...voice, model: e.target.value }; setVoice(next); void save({ voice: next }); } },
							TTS_MODELS.map(model => h("option", { key: model, value: model }, model)))),
					h("div", { className: "dsh-mimo-row" },
						h("label", null, t("ttsVoice")),
						h("input", { className: "dsh-mimo-input", value: voice.voice, onChange: e => setVoice({ ...voice, voice: e.target.value }), onBlur: () => void save({ voice }) }),
						h("button", { className: "dsh-mimo-btn", disabled: busy !== "" || !status?.auth?.hasKey, onClick: preview }, t("ttsTest"))),
					h("div", { className: "dsh-mimo-row" },
						h("label", null, t("ttsStyle")),
						h("input", { className: "dsh-mimo-input", value: voice.style, onChange: e => setVoice({ ...voice, style: e.target.value }), onBlur: () => void save({ voice }) })),
					h("div", { className: "dsh-mimo-row" },
						h("label", null, t("asrLanguage")),
						h("select", { className: "dsh-mimo-input", value: asrLanguage, onChange: e => { setAsrLanguage(e.target.value); void save({ asr: { language: e.target.value } }); } },
							["auto", "zh", "en"].map(id => h("option", { key: id, value: id }, id)))),
					h("div", { className: "dsh-mimo-hint" }, t("asrHint")))
			);
		}

		// ── 余量药丸 + 朗读按钮 ─────────────────────────────────────────────────
		function MimoPillEntry({ store, call, t, getLocale }) {
			const state = react.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
			const [open, setOpen] = react.useState(false);
			const [status, setStatus] = react.useState(null);
			const [busy, setBusy] = react.useState(false);
			const provider = state?.current?.provider;
			const isMimo = provider === MIMO_PROVIDER;

			react.useEffect(() => {
				if (!isMimo) return undefined;
				let alive = true;
				const load = async () => {
					try { const next = await call("status"); if (alive) setStatus(next); } catch { /* pill stays quiet */ }
				};
				void load();
				const timer = setInterval(load, 5 * 60 * 1000);
				return () => { alive = false; clearInterval(timer); };
			}, [isMimo, call]);

			const speak = react.useCallback(async () => {
				const selection = typeof window !== "undefined" ? String(window.getSelection?.()?.toString() ?? "").trim() : "";
				if (selection === "") { setOpen(true); return; }
				setBusy(true);
				try {
					const result = await call("speak", { text: selection.slice(0, 20000) });
					playAudio(result.audioBase64, result.format);
				} catch { /* notice shown through the settings page */ }
				finally { setBusy(false); }
			}, [call]);

			const quota = status?.quota ?? null;
			const pillLabel = quota
				? `${t("pill")} ${quota.quota.remainingCredits}`
				: isMimo ? t("pill") : t("speakSelection");

			return h("div", { style: { position: "relative", display: "inline-flex", gap: 6, alignItems: "center" } },
				h("button", { className: "dsh-mimo-pill", title: t("speakSelection"), disabled: busy, onClick: () => void speak() }, "🔊"),
				isMimo ? h("button", { className: "dsh-mimo-pill", title: t("pillHint"), onClick: () => setOpen(value => !value) }, pillLabel) : null,
				open ? h("div", { className: "dsh-mimo-pop" },
					quota
						? h("div", null,
							h("div", { className: "dsh-mimo-kv" }, h("span", null, t("plan")), h("span", null, quota.planCode || "Token Plan")),
							h("div", { className: "dsh-mimo-kv" }, h("span", null, t("remaining")), h("span", null, String(quota.quota.remainingCredits))),
							h("div", { className: "dsh-mimo-kv" }, h("span", null, `${t("used")} / ${t("total")}`), h("span", null, `${quota.quota.usedCredits} / ${quota.quota.totalCredits}`)),
							h("div", { className: "dsh-mimo-kv" }, h("span", null, t("period")), h("span", null, `${quota.period.startAt} → ${quota.period.endAt}`)),
							h("div", { className: "dsh-mimo-row" },
								h("button", { className: "dsh-mimo-btn", onClick: async () => { try { setStatus(await call("quota")); } catch { /* keep last */ } } }, t("refresh"))))
						: h("div", { className: "dsh-mimo-hint" }, status?.quotaError ? `${t("quotaError")}：${status.quotaError}` : t("quotaNone")),
					!isMimo ? h("div", { className: "dsh-mimo-hint" }, t("speakNothing")) : null,
					h("div", { className: "dsh-mimo-hint" }, getLocale ? "" : "")
				) : null);
		}

		// ── 装配 ────────────────────────────────────────────────────────────────
		const name = "dsh-mimo";
		const inject = ["slots", "locale", "remote"];
		function apply(ctx) {
			ctx.effect(() => mountStyles(), "dsh-mimo: styles");
			const t = ctx.locale.bind(NS);
			const getLocale = () => ctx.locale.getLocale().active;
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
				try { await Promise.race([mounted, wait(20000)]); } catch { /* remote mount failed; try anyway */ }
				for (;;) {
					const service = ctx.get("remote.mimo");
					if (service !== undefined) {
						if (typeof service[method] !== "function") throw new Error(`Host/Client 契约版本不匹配：Host 缺少 ${method}`);
						const rpc = Promise.resolve(service[method](...args)).then((result) => {
							if (!result.ok) throw result.error;
							return result.value;
						});
						return await rpc;
					}
					if (Date.now() > deadline) throw new Error("remote.mimo 挂载超时：Host 端 dsh-mimo 未就绪");
					await wait(250);
				}
			};

			try {
				ctx.slots.inject("settings.section", () => ctx.slots.register(
					{ name: "settings.section", id: "mimo", order: 23, label: () => t("nav"), inject: () => ({ call, t }) },
					MimoSection));
			} catch (error) { console.error("[dsh-mimo] settings:", error); }

			ctx.inject(["modelDirectories"], (scope) => {
				try {
					scope.slots.inject("conversation.input.right", () => scope.slots.register(
						{ name: "conversation.input.right", id: "mimo-quota", order: 1002, inject: (sessionId) => ({ store: scope.modelDirectories.directoryFor(sessionId).store, call, t, getLocale }) },
						MimoPillEntry));
				} catch (error) { console.error("[dsh-mimo] pill:", error); }
			});

			ctx.effect(() => () => {
				for (const timer of pendingTimers) clearTimeout(timer);
				pendingTimers.clear();
			}, "dsh-mimo: dispose rpc timers");
		}

		exports.name = name;
		exports.inject = inject;
		exports.apply = apply;
		return module.exports;
	}
});
