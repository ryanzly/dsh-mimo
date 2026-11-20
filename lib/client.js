// dsh-mimo —— Client 侧
//
// UI 全部走 DSH 原生插槽与设计令牌（--dsw-*）：
//   1. settings.section：OAuth 一键登录/退出、Coding Plan 余量、模型卡片、思考档位、语音。
//   2. sidebar.footer.action：侧栏底部快捷余量（宽栏显示百分比，窄栏显示角标）。
//   3. conversation.input.right：模型旁的余量药丸。
//   4. conversation.chat.text-interaction：选中文字「朗读」（与「引用」同款悬浮胶囊）。
//   5. conversation.chat.assistant-actions：回复动作行 🔊（与反馈按钮同规格图标按钮）。
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
			expiry: "到期",
			daysLeft: "还剩 {n} 天",
			expired: "已到期",
			autoRenew: "自动续费",
			on: "开",
			off: "关",
			loginTitle: "账号",
			oauthLogin: "浏览器授权登录",
			oauthHint: "跳转 Xiaomi MiMo 开放平台完成授权，自动创建 API Key。",
			loggingIn: "等待浏览器授权…",
			openManually: "浏览器没打开？访问：",
			pasteCode: "或粘贴授权码：",
			pasteCodePlaceholder: "粘贴授权码（u=... 的整段内容）",
			submitCode: "提交",
			cancelLogin: "取消",
			loginDone: "登录成功",
			loginFailed: "登录失败",
			logout: "退出登录",
			logoutDone: "已退出登录",
			currentKey: "当前密钥",
			noKey: "尚未登录",
			quotaTitle: "套餐余量",
			quotaNone: "当前凭据不是 Coding Plan 套餐。",
			quotaError: "余量查询失败",
			modelsTitle: "可用模型",
			modelsLive: "自动更新 · 实时获取",
			modelsFallback: "自动更新 · 暂用默认列表",
			thinkingTitle: "思考档位（默认值）",
			thinkingOff: "Off · 关闭思考",
			thinkingLow: "Low · 低",
			thinkingMedium: "Medium · 中",
			thinkingHigh: "High · 深度思考",
			thinkingHint: "MiMo 深度思考目前是开/关语义：Off 之外的档位行为一致。",
			voiceTitle: "语音",
			ttsModel: "TTS 模型",
			ttsVoice: "音色",
			ttsStyle: "风格指令（可选）",
			ttsTest: "试听",
			ttsPlaying: "播放中…",
			asrLanguage: "语音输入识别语言",
			asrHint: "语音输入走 DSH 官方「语音输入」插件：识别来源选「MiMo 语音识别（云端）」即可。",
			speakAction: "朗读",
			speakThis: "朗读这条回复",
			speakPlaying: "朗读中",
			stopSpeak: "停止朗读",
			badgeContext: "{n} 上下文",
			badgeThinking: "深度思考",
			badgeVision: "多模态输入",
			badgeTools: "函数调用",
			sidebarTitle: "MiMo Coding Plan 余量",
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
			expiry: "Expires",
			daysLeft: "{n} days left",
			expired: "Expired",
			autoRenew: "Auto renew",
			on: "On",
			off: "Off",
			loginTitle: "Account",
			oauthLogin: "Sign in with browser",
			oauthHint: "Opens the Xiaomi MiMo platform to authorize and create an API key.",
			loggingIn: "Waiting for browser authorization…",
			openManually: "Browser didn't open? Visit:",
			pasteCode: "Or paste the code:",
			pasteCodePlaceholder: "Paste the code (the whole u=... blob)",
			submitCode: "Submit",
			cancelLogin: "Cancel",
			loginDone: "Signed in",
			loginFailed: "Sign-in failed",
			logout: "Sign out",
			logoutDone: "Signed out",
			currentKey: "Current key",
			noKey: "Not signed in",
			quotaTitle: "Plan credits",
			quotaNone: "This credential is not a Coding Plan subscription.",
			quotaError: "Failed to read credits",
			modelsTitle: "Available models",
			modelsLive: "auto-updating · live",
			modelsFallback: "auto-updating · default list for now",
			thinkingTitle: "Default reasoning level",
			thinkingOff: "Off",
			thinkingLow: "Low",
			thinkingMedium: "Medium",
			thinkingHigh: "High · deep thinking",
			thinkingHint: "MiMo deep thinking is an on/off switch today: every level except Off behaves the same.",
			voiceTitle: "Voice",
			ttsModel: "TTS model",
			ttsVoice: "Voice",
			ttsStyle: "Style instruction (optional)",
			ttsTest: "Preview",
			ttsPlaying: "Playing…",
			asrLanguage: "Voice-input recognition language",
			asrHint: "Voice input uses the official Voice input plugin: pick 'MiMo ASR (cloud)'.",
			speakAction: "Read aloud",
			speakThis: "Read this reply aloud",
			speakPlaying: "Reading",
			stopSpeak: "Stop",
			badgeContext: "{n} context",
			badgeThinking: "Deep thinking",
			badgeVision: "Multimodal input",
			badgeTools: "Tool calls",
			sidebarTitle: "MiMo Coding Plan credits",
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
				{ id: "dsh-mimo#mimo/logout", service: "mimo", namespace: "mimo", method: "logout", invocation: { kind: "direct" }, parameters: [], result: objectCodec("MimoStatus") },
				{ id: "dsh-mimo#mimo/speak", service: "mimo", namespace: "mimo", method: "speak", invocation: { kind: "direct" }, parameters: [{ name: "request", wire: "request", source: "json", codec: objectCodec("MimoSpeakRequest") }], result: objectCodec("MimoSpeakResult") }
			]
		};

		const MIMO_PROVIDER = "xiaomi-mimo";
		const TTS_MODELS = ["mimo-v2.5-tts", "mimo-v2.5-tts-voicedesign", "mimo-v2.5-tts-voiceclone"];
		const VOICES = [
			{ id: "mimo_default", zh: "默认音色", en: "Default" },
			{ id: "冰糖", zh: "冰糖 · 中文女声 · 活泼少女", en: "Bingtang · Chinese female · lively" },
			{ id: "茉莉", zh: "茉莉 · 中文女声 · 知性", en: "Jasmine · Chinese female · gentle" },
			{ id: "苏打", zh: "苏打 · 中文男声 · 阳光少年", en: "Soda · Chinese male · sunny" },
			{ id: "白桦", zh: "白桦 · 中文男声 · 成熟", en: "Birch · Chinese male · steady" },
			{ id: "Mia", zh: "Mia · 英文女声 · 活泼", en: "Mia · English female · lively" },
			{ id: "Chloe", zh: "Chloe · 英文女声 · 甜美", en: "Chloe · English female · sweet" },
			{ id: "Milo", zh: "Milo · 英文男声 · 阳光", en: "Milo · English male · sunny" },
			{ id: "Dean", zh: "Dean · 英文男声 · 沉稳", en: "Dean · English male · steady" }
		];
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
			const startRaw = String(startAt ?? "").trim();
			const endRaw = String(endAt ?? "").trim();
			const parse = (text) => {
				const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(text);
				return match ? new Date(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6]).getTime() : null;
			};
			const start = parse(startRaw);
			const end = parse(endRaw);
			if (start === null || end === null) return { startAt: startRaw, endAt: endRaw, daysLeft: null, expired: false };
			return { startAt: startRaw, endAt: endRaw, daysLeft: Math.max(0, Math.ceil((end - now) / 86400000)), expired: now > end };
		}
		function usagePercent(quota) {
			const total = Number(quota?.totalCredits) || 0;
			const used = Number(quota?.usedCredits) || 0;
			if (total <= 0) return 0;
			return Math.min(100, Math.max(0, Math.round((used / total) * 1000) / 10));
		}

		// ── 样式（DSH 设计令牌） ────────────────────────────────────────────────
		function mountStyles() {
			const css = `
				.dsh-mimo-card { border: 1px solid var(--dsw-alias-border-l2); border-radius: var(--dsw-radius-lg); background: var(--dsw-alias-bg-layer-1); padding: 14px 16px; margin: 12px 0; }
				.dsh-mimo-card h3 { margin: 0 0 10px; font-size: 13px; font-weight: 600; color: var(--dsw-alias-label-primary); font-family: var(--dsw-font-family); }
				.dsh-mimo-row { display: flex; gap: 8px; align-items: center; margin: 8px 0; flex-wrap: wrap; }
				.dsh-mimo-row label { font-size: 12px; color: var(--dsw-alias-label-secondary); min-width: 88px; font-family: var(--dsw-font-family); }
				.dsh-mimo-input { flex: 1; min-width: 160px; padding: 6px 10px; border-radius: var(--dsw-radius-sm); border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font: var(--dsw-font-xs-13); font-family: var(--dsw-font-family); }
				.dsh-mimo-btn { padding: 6px 14px; border-radius: var(--dsw-radius-sm); border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); cursor: pointer; font: var(--dsw-font-xs-13); font-family: var(--dsw-font-family); }
				.dsh-mimo-btn:hover { background: var(--dsw-alias-interactive-bg-hover); }
				.dsh-mimo-btn:disabled { opacity: .4; cursor: default; }
				.dsh-mimo-btn-primary { background: var(--dsw-alias-state-business-primary); border-color: transparent; color: #fff; }
				.dsh-mimo-btn-primary:hover { filter: brightness(1.06); background: var(--dsw-alias-state-business-primary); }
				.dsh-mimo-btn-quiet { border: none; background: transparent; color: var(--dsw-alias-link); padding: 4px 8px; }
				.dsh-mimo-hint { font-size: 11px; color: var(--dsw-alias-label-tertiary); line-height: 1.7; font-family: var(--dsw-font-family); }
				.dsh-mimo-kv { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; margin: 5px 0; color: var(--dsw-alias-label-secondary); font-family: var(--dsw-font-family); }
				.dsh-mimo-kv span:last-child { color: var(--dsw-alias-label-primary); }

				/* 余量面板：大字号 + 渐变流光进度条 */
				.dsh-mimo-quota { position: relative; }
				.dsh-mimo-quota .big { font-size: 22px; font-weight: 600; color: var(--dsw-alias-label-primary); letter-spacing: .2px; font-family: var(--dsw-font-family); }
				.dsh-mimo-quota .big em { font-style: normal; font-size: 13px; font-weight: 500; color: var(--dsw-alias-label-secondary); margin-left: 6px; }
				.dsh-mimo-bar { position: relative; height: 8px; border-radius: 999px; background: var(--dsw-alias-border-l2); overflow: hidden; margin: 10px 0; }
				.dsh-mimo-bar > i { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--dsw-alias-state-business-primary), var(--dsw-alias-link)); background-size: 200% 100%; animation: dsh-mimo-flow 6s linear infinite; transition: width .6s cubic-bezier(.22,1,.36,1); }
				.dsh-mimo-bar > b { position: absolute; inset: 0; border-radius: 999px; background: linear-gradient(100deg, transparent 20%, rgba(255,255,255,.35) 50%, transparent 80%); background-size: 200% 100%; animation: dsh-mimo-shine 2.8s ease-in-out infinite; pointer-events: none; }
				@keyframes dsh-mimo-flow { 0% { background-position: 0% 0; } 100% { background-position: 200% 0; } }
				@keyframes dsh-mimo-shine { 0% { background-position: 150% 0; } 100% { background-position: -50% 0; } }

				/* 模型卡片（Claude Desktop 风格） */
				.dsh-mimo-model-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; }
				.dsh-mimo-model { display: flex; gap: 10px; padding: 10px 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: var(--dsw-radius-md); background: var(--dsw-alias-bg-layer-2); }
				.dsh-mimo-model:hover { border-color: var(--dsw-alias-border-l3); background: var(--dsw-alias-bg-layer-3); }
				.dsh-mimo-model .avatar { flex: none; width: 32px; height: 32px; border-radius: var(--dsw-radius-sm); display: flex; align-items: center; justify-content: center; background: var(--dsw-alias-state-business-primary); color: #fff; font-size: 15px; }
				.dsh-mimo-model .name { font-size: 13px; font-weight: 600; color: var(--dsw-alias-label-primary); font-family: var(--dsw-font-family); }
				.dsh-mimo-model .id { font-size: 11px; color: var(--dsw-alias-label-tertiary); margin: 1px 0 4px; font-family: var(--dsw-font-family); }
				.dsh-mimo-model .badges { display: flex; flex-wrap: wrap; gap: 4px; }
				.dsh-mimo-model .badge { font-size: 10px; padding: 1px 7px; border-radius: 999px; background: var(--dsw-alias-bg-base); border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-secondary); font-family: var(--dsw-font-family); }

				/* 侧栏底部快捷余量 */
				.dsh-mimo-side { position: relative; }
				.dsh-mimo-side-btn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 10px; border: none; border-radius: var(--dsw-radius-sm); background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font: var(--dsw-font-xxs-12); font-family: var(--dsw-font-family); }
				.dsh-mimo-side-btn:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
				.dsh-mimo-side-btn .mini { flex: 1; height: 4px; border-radius: 999px; background: var(--dsw-alias-border-l2); overflow: hidden; }
				.dsh-mimo-side-btn .mini > i { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--dsw-alias-state-business-primary), var(--dsw-alias-link)); background-size: 200% 100%; animation: dsh-mimo-flow 6s linear infinite; }
				.dsh-mimo-side-badge { position: absolute; top: -2px; right: -4px; font-size: 9px; line-height: 1; padding: 2px 4px; border-radius: 999px; background: var(--dsw-alias-state-business-primary); color: #fff; font-family: var(--dsw-font-family); }
				.dsh-mimo-pop { position: absolute; bottom: calc(100% + 8px); left: 0; z-index: 60; min-width: 250px; background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l2); border-radius: var(--dsw-radius-lg); padding: 14px; box-shadow: var(--dsw-elevation-panel); font-family: var(--dsw-font-family); }
				.dsh-mimo-pop .title { font-size: 12px; font-weight: 600; color: var(--dsw-alias-label-primary); margin-bottom: 8px; }

				/* 药丸 */
				.dsh-mimo-pill { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); font-size: 11px; color: var(--dsw-alias-label-secondary); cursor: pointer; white-space: nowrap; font-family: var(--dsw-font-family); }
				.dsh-mimo-pill:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }

				/* 原生消息动作按钮（与反馈按钮同规格） */
				.dsh-mimo-action { display: inline-flex; align-items: center; justify-content: center; width: calc(28px + var(--dsh-content-font-delta, 0px)); height: calc(28px + var(--dsh-content-font-delta, 0px)); padding: 6px; border: none; border-radius: var(--dsw-radius-sm); background: transparent; color: var(--dsw-alias-label-tertiary); cursor: pointer; }
				.dsh-mimo-action svg { flex: none; width: calc(16px + var(--dsh-content-font-delta, 0px)); height: calc(16px + var(--dsh-content-font-delta, 0px)); }
				@media (hover: hover) { .dsh-mimo-action:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-secondary); } }
				.dsh-mimo-action:disabled { cursor: default; opacity: .4; }

				/* 选中文字悬浮胶囊（与「引用」同款） */
				.dsh-mimo-float { padding: 5px 10px; border: none; border-radius: 999px; corner-shape: round; background: var(--dsw-alias-button-floating-fill); --dsw-elevation-stroke-color: var(--dsw-alias-border-l3); box-shadow: var(--dsw-elevation-panel); color: var(--dsw-alias-label-primary); font: var(--dsw-font-xs-13); cursor: pointer; }
				.dsh-mimo-float:focus-visible, .dsh-mimo-float:hover { background: var(--dsw-alias-button-floating-hover); }
			`;
			const style = document.createElement("style");
			style.textContent = css;
			document.head.appendChild(style);
			return () => style.remove();
		}

		function IconSpeak() {
			return h("svg", { viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true" },
				h("path", { d: "M2.5 6v4h2.2L8 13V3L4.7 6H2.5z", fill: "currentColor" }),
				h("path", { d: "M10.2 5.6a3.2 3.2 0 0 1 0 4.8M12 4a5.4 5.4 0 0 1 0 8", stroke: "currentColor", "stroke-width": "1.3", "stroke-linecap": "round" }));
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

		// ── 余量面板 ─────────────────────────────────────────────────────────────
		function QuotaPanel({ quota, quotaError, hasKey, busy, onRefresh, t, compact }) {
			if (!hasKey) return h("div", { className: "dsh-mimo-hint" }, t("noKey"));
			if (!quota) return h("div", { className: "dsh-mimo-hint" }, quotaError ? `${t("quotaError")}：${quotaError}` : t("quotaNone"));
			const usedPct = usagePercent(quota.quota);
			const remainPct = Math.round((100 - usedPct) * 10) / 10;
			const period = formatPeriod(quota.period.startAt, quota.period.endAt);
			return h("div", { className: "dsh-mimo-quota" },
				h("div", { className: "big" }, `${formatCredits(quota.quota.remainingCredits)}`, h("em", null, `credits · ${t("remaining")} ${remainPct}%`)),
				h("div", { className: "dsh-mimo-bar" },
					h("i", { style: { width: `${Math.max(2, usedPct)}%` } }),
					h("b")),
				compact ? null : h("div", null,
					h("div", { className: "dsh-mimo-kv" }, h("span", null, `${t("used")} ${formatCredits(quota.quota.usedCredits)}（${usedPct}%）`), h("span", null, `${t("total")} ${formatCredits(quota.quota.totalCredits)}`)),
					h("div", { className: "dsh-mimo-kv" }, h("span", null, `${t("plan")} ${quota.planCode || ""}`), h("span", null, `${t("autoRenew")} ${quota.autoRenew ? t("on") : t("off")}`)),
					h("div", { className: "dsh-mimo-kv" }, h("span", null, t("expiry")), h("span", null,
						`${period.endAt}${period.expired ? ` · ${t("expired")}` : period.daysLeft === null ? "" : ` · ${t("daysLeft").replace("{n}", period.daysLeft)}`}`))),
				onRefresh ? h("div", { className: "dsh-mimo-row" },
					h("button", { className: "dsh-mimo-btn", disabled: busy, onClick: onRefresh }, t("refresh"))) : null);
		}

		// ── 设置页 ──────────────────────────────────────────────────────────────
		function MimoSection({ call, t, getLocale }) {
			const lang = String((getLocale && getLocale()) || "zh").toLowerCase().startsWith("zh") ? "zh" : "en";
			const [status, setStatus] = react.useState(null);
			const [busy, setBusy] = react.useState("");
			const [notice, setNotice] = react.useState("");
			const [thinking, setThinking] = react.useState("high");
			const [voice, setVoice] = react.useState({ model: TTS_MODELS[0], voice: "mimo_default", style: "" });
			const [asrLanguage, setAsrLanguage] = react.useState("auto");
			const [login, setLogin] = react.useState(null);
			const [codeInput, setCodeInput] = react.useState("");

			const refresh = react.useCallback(async (force = false) => {
				try {
					const next = await call(force ? "quota" : "status");
					setStatus(next);
					const settings = next.settings ?? {};
					if (settings.thinking) setThinking(settings.thinking);
					if (settings.voice) setVoice({ model: settings.voice.model ?? TTS_MODELS[0], voice: settings.voice.voice || "mimo_default", style: settings.voice.style ?? "" });
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
			const logout = async () => {
				setBusy("logout");
				try { setStatus(await call("logout")); setNotice(t("logoutDone")); }
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
				try { setStatus(await call("save", patch)); setNotice(t("saved")); }
				catch (error) { setNotice(String(error?.message ?? error)); }
				finally { setBusy(""); }
			};
			const preview = async () => {
				setBusy("tts");
				try {
					const result = await call("speak", { text: "你好，我是 MiMo 语音，很高兴认识你。", model: voice.model, voice: voice.voice === "mimo_default" ? "" : voice.voice, style: voice.style });
					await playAudio(result.audioBase64, result.format);
					setNotice(t("ttsPlaying"));
				} catch (error) {
					setNotice(`${t("speakPlaying")}：${String(error?.message ?? error)}`);
				} finally { setBusy(""); }
			};

			const auth = status?.auth ?? {};
			const models = status?.models ?? { models: [], source: "fallback" };
			return h("div", null,
				h("div", { className: "dsh-mimo-card" },
					h("h3", null, t("loginTitle")),
					auth.hasKey
						? h("div", null,
							h("div", { className: "dsh-mimo-hint" }, `${t("currentKey")}：${auth.keyPreview ?? ""}${auth.uid ? ` · uid ${auth.uid}` : ""}`),
							h("div", { className: "dsh-mimo-row" },
								h("button", { className: "dsh-mimo-btn", disabled: busy !== "", onClick: logout }, t("logout"))))
						: h("div", null,
							h("div", { className: "dsh-mimo-row" },
								h("button", { className: "dsh-mimo-btn dsh-mimo-btn-primary", disabled: busy !== "" || (login && login.state === "pending"), onClick: startLogin }, t("oauthLogin")),
								login && login.state === "pending" ? h("button", { className: "dsh-mimo-btn", onClick: () => { void call("cancelLogin").then(setLogin).catch(() => {}); } }, t("cancelLogin")) : null),
							h("div", { className: "dsh-mimo-hint" }, t("oauthHint"))),
					login && login.state === "pending" ? h("div", null,
						h("div", { className: "dsh-mimo-hint" }, t("loggingIn")),
						login.manualUrl ? h("div", { className: "dsh-mimo-hint" }, t("openManually"), " ", login.manualUrl) : null,
						h("div", { className: "dsh-mimo-row" },
							h("input", { className: "dsh-mimo-input", placeholder: t("pasteCodePlaceholder"), value: codeInput, onChange: (e) => setCodeInput(e.target.value) }),
							h("button", { className: "dsh-mimo-btn", disabled: busy !== "", onClick: submitCode }, t("submitCode")))
					) : null,
					notice ? h("div", { className: "dsh-mimo-hint" }, notice) : null),

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
					h("div", { className: "dsh-mimo-model-grid" },
						(models.models ?? []).map((model) => {
							const id = String(model.id ?? "");
							const badges = [];
							if (model.contextWindow) badges.push(t("badgeContext").replace("{n}", `${Math.round(model.contextWindow / 1000)}K`));
							if (/mimo-v2\.6/.test(id)) { badges.push(t("badgeThinking"), t("badgeVision")); }
							badges.push(t("badgeTools"));
							return h("div", { className: "dsh-mimo-model", key: id },
								h("div", { className: "avatar" }, "🐋"),
								h("div", null,
									h("div", { className: "name" }, model.name ?? id),
									h("div", { className: "id" }, id),
									h("div", { className: "badges" }, badges.map((badge) => h("span", { className: "badge", key: badge }, badge)))));
						}))),

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
						h("select", { className: "dsh-mimo-input", value: voice.voice, onChange: (e) => { const next = { ...voice, voice: e.target.value }; setVoice(next); void save({ voice: next }); } },
							VOICES.map((v) => h("option", { key: v.id, value: v.id }, v[lang]))),
						h("button", { className: "dsh-mimo-btn", disabled: busy !== "" || !status?.auth?.hasKey, onClick: preview }, t("ttsTest"))),
					h("div", { className: "dsh-mimo-row" },
						h("label", null, t("ttsStyle")),
						h("input", { className: "dsh-mimo-input", placeholder: "温柔的女声，语速稍快", value: voice.style, onChange: (e) => setVoice({ ...voice, style: e.target.value }), onBlur: () => void save({ voice }) })),
					h("div", { className: "dsh-mimo-row" },
						h("label", null, t("asrLanguage")),
						h("select", { className: "dsh-mimo-input", value: asrLanguage, onChange: (e) => { setAsrLanguage(e.target.value); void save({ asr: { language: e.target.value } }); } },
							["auto", "zh", "en"].map((id) => h("option", { key: id, value: id }, id)))),
					h("div", { className: "dsh-mimo-hint" }, t("asrHint")))
			);
		}

		// ── 侧栏底部快捷余量 ─────────────────────────────────────────────────────
		function SidebarQuotaEntry({ wide, call, t }) {
			const [status, setStatus] = react.useState(null);
			const [open, setOpen] = react.useState(false);
			const load = react.useCallback(async () => {
				try { setStatus(await call("status")); } catch { /* stay quiet */ }
			}, [call]);
			react.useEffect(() => {
				void load();
				const timer = setInterval(load, 5 * 60 * 1000);
				return () => clearInterval(timer);
			}, [load]);
			const quota = status?.quota ?? null;
			const remainPct = quota ? Math.round((100 - usagePercent(quota.quota)) * 10) / 10 : null;
			return h("div", { className: "dsh-mimo-side" },
				wide
					? h("button", { className: "dsh-mimo-side-btn", title: t("sidebarTitle"), onClick: () => setOpen((value) => !value) },
						h("span", null, "MiMo"),
						h("span", { className: "mini" }, h("i", { style: { width: `${Math.max(2, 100 - (remainPct ?? 0))}%` } })),
						h("span", null, quota ? `${remainPct}%` : "—"))
					: h("button", { className: "dsh-mimo-side-btn", title: t("sidebarTitle"), style: { justifyContent: "center", position: "relative" }, onClick: () => setOpen((value) => !value) },
						h("span", null, "🐋"),
						quota ? h("span", { className: "dsh-mimo-side-badge" }, `${remainPct}`) : null),
				open ? h("div", { className: "dsh-mimo-pop" },
					h("div", { className: "title" }, t("sidebarTitle")),
					h(QuotaPanel, {
						quota,
						quotaError: status?.quotaError ?? "",
						hasKey: status?.auth?.hasKey === true,
						busy: false,
						onRefresh: async () => { try { setStatus(await call("quota")); } catch { /* keep last */ } },
						t
					})) : null);
		}

		// ── 药丸 ────────────────────────────────────────────────────────────────
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
				open ? h("div", { className: "dsh-mimo-pop", style: { bottom: "calc(100% + 8px)", right: 0, left: "auto" } },
					h("div", { className: "title" }, t("quotaTitle")),
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
		function SpeakSelectionAction({ readText, dismiss, call, t }) {
			const [busy, setBusy] = react.useState(false);
			const speak = async () => {
				const text = readText();
				if (!text) { dismiss(); return; }
				setBusy(true);
				try { await speakText(call, text); }
				catch { /* ignore */ }
				finally { setBusy(false); dismiss(); }
			};
			return h("button", {
				className: "dsh-mimo-float",
				disabled: busy,
				"aria-label": t("speakAction"),
				onPointerDown: (event) => { event.preventDefault(); },
				onClick: speak
			}, busy ? t("speakPlaying") : t("speakAction"));
		}

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
				type: "button",
				className: "dsh-mimo-action",
				"aria-label": busy ? t("stopSpeak") : t("speakThis"),
				title: busy ? t("stopSpeak") : t("speakThis"),
				onClick: speak
			}, busy ? "⏹" : h(IconSpeak));
		}

		// ── 装配 ────────────────────────────────────────────────────────────────
		const name = "dsh-mimo";
		const inject = ["slots", "locale", "remote", "sessions", "uiConversation"];
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
					{ name: "settings.section", id: "mimo", order: 23, locale: NS, label: () => t("nav"), inject: () => ({ call, t, getLocale }) },
					MimoSection));
			} catch (error) { console.error("[dsh-mimo] settings:", error); }

			// 侧栏底部快捷余量
			try {
				ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register(
					{ name: "sidebar.footer.action", id: "mimo-quota", order: 10, locale: NS, inject: () => ({ call, t }) },
					SidebarQuotaEntry));
			} catch (error) { console.error("[dsh-mimo] sidebar:", error); }

			// 模型旁余量药丸
			ctx.inject(["modelDirectories"], (scope) => {
				try {
					scope.slots.inject("conversation.input.right", () => scope.slots.register(
						{ name: "conversation.input.right", id: "mimo-quota", order: 1002, locale: NS, inject: (sessionId) => ({ store: scope.modelDirectories.directoryFor(sessionId).store, call, t }) },
						MimoPillEntry));
				} catch (error) { console.error("[dsh-mimo] pill:", error); }
			});

			// 语音输出：原生插槽
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
