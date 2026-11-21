// dsh-mimo —— Client 侧
//
// UI 全部走 DSH 原生插槽与设计令牌（--dsw-*）：
//   1. settings.section：OAuth 一键登录/退出、Coding Plan 余量、模型卡片、语音。
//   2. sidebar.footer.action：侧栏底部整行余量（MiMo Token Plan 档位 + 蓝色进度条，余量在条尾，点击展开详情）。
//   3. conversation.chat.text-interaction：选中文字「朗读」（与「引用」同款悬浮胶囊）。
//   4. conversation.chat.assistant-actions：回复动作行 🔊（与反馈按钮同规格图标按钮）。
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
		let createPortal = null;
		let MenuSurface = null;
		try { createPortal = require("react-dom").createPortal; } catch (error) { console.error("[dsh-mimo] react-dom:", error); }
		try { MenuSurface = require("@deepseek-ai/dsh-client-ui-primitives").MenuSurface; } catch (error) { console.error("[dsh-mimo] primitives:", error); }

		// ── 词典 ────────────────────────────────────────────────────────────────
		const zh = {
			nav: "MiMo Coding Plan",
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
			voiceTitle: "语音",
			ttsModel: "TTS 模型",
			ttsVoice: "音色",
			ttsStyle: "风格指令（可选）",
			ttsTest: "试听",
			ttsPlaying: "播放中…",
			asrLanguage: "语音输入识别语言",
			asrHint: "语音输入走 DSH 官方「语音输入」插件：识别来源选「MiMo 语音识别（云端）」即可。",
			quoteAction: "引用",
			speakAction: "朗读",
			speakThis: "朗读这条回复",
			speakPlaying: "朗读中",
			stopSpeak: "停止朗读",
			badgeContext: "{n} 上下文",
			badgeThinking: "深度思考",
			badgeVision: "多模态输入",
			badgeTools: "函数调用",
			sidebarTitle: "MiMo Coding Plan 余量",
			groupLlm: "LLM · 对话模型",
			groupAsr: "语音识别 ASR",
			groupTts: "语音合成 TTS",
			groupOther: "其他",
			selectEffort: "选择强度",
			badgeAsr: "云端转写",
			badgeTts: "语音合成",
			speakFailed: "朗读失败",
			error: "出错了"
		};
		const en = {
			nav: "MiMo Coding Plan",
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
			voiceTitle: "Voice",
			ttsModel: "TTS model",
			ttsVoice: "Voice",
			ttsStyle: "Style instruction (optional)",
			ttsTest: "Preview",
			ttsPlaying: "Playing…",
			asrLanguage: "Voice-input recognition language",
			asrHint: "Voice input uses the official Voice input plugin: pick 'MiMo ASR (cloud)'.",
			quoteAction: "Quote",
			speakAction: "Read aloud",
			speakThis: "Read this reply aloud",
			speakPlaying: "Reading",
			stopSpeak: "Stop",
			badgeContext: "{n} context",
			badgeThinking: "Deep thinking",
			badgeVision: "Multimodal input",
			badgeTools: "Tool calls",
			sidebarTitle: "MiMo Coding Plan credits",
			groupLlm: "LLM · Chat models",
			groupAsr: "Speech recognition (ASR)",
			groupTts: "Speech synthesis (TTS)",
			groupOther: "Other",
			selectEffort: "Select effort",
			badgeAsr: "Cloud transcription",
			badgeTts: "Speech synthesis",
			speakFailed: "Speech failed",
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
				.dsh-mimo-kv { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; font-size: 12px; margin: 6px 0; color: var(--dsw-alias-label-secondary); font-family: var(--dsw-font-family); }
				.dsh-mimo-kv span { white-space: nowrap; }
				.dsh-mimo-kv span:last-child { color: var(--dsw-alias-label-primary); }

				/* 余量面板：大字号 + 渐变流光进度条 */
				.dsh-mimo-quota { position: relative; }
				.dsh-mimo-quota .big { font-size: 22px; font-weight: 600; color: var(--dsw-alias-label-primary); letter-spacing: .2px; font-family: var(--dsw-font-family); }
				.dsh-mimo-quota .big em { font-style: normal; font-size: 13px; font-weight: 500; color: var(--dsw-alias-label-secondary); margin-left: 6px; white-space: nowrap; }
				.dsh-mimo-bar { position: relative; height: 10px; border-radius: 999px; background: color-mix(in srgb, #3b82f6 16%, var(--dsw-alias-border-l2)); overflow: hidden; margin: 10px 0; }
				.dsh-mimo-bar > i { position: relative; display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #1d4ed8, #3b82f6 62%, #60a5fa); overflow: hidden; transition: width .6s cubic-bezier(.22,1,.36,1); }
				.dsh-mimo-bar > i > b, .dsh-mimo-side .line > i > b { position: absolute; inset: 0; pointer-events: none; background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'64'%20height%3D'10'%20viewBox%3D'0%200%2064%2010'%3E%3Cg%20fill%3D'white'%3E%3Cpath%20d%3D'M8%201.2%208.7%204.1%2011.6%205%208.7%205.9%208%208.8%207.3%205.9%204.4%205%207.3%204.1Z'%2F%3E%3Cpath%20d%3D'M28%202.2%2028.5%204.2%2030.6%204.7%2028.5%205.2%2028%207.2%2027.5%205.2%2025.4%204.7%2027.5%204.2Z'%20opacity%3D'.85'%2F%3E%3Cpath%20d%3D'M46%201.4%2046.6%203.8%2049%204.4%2046.6%205%2046%207.4%2045.4%205%2043%204.4%2045.4%203.8Z'%20opacity%3D'.95'%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E"); background-repeat: repeat-x; background-size: 64px 10px; animation: dsh-mimo-twinkle 1.8s ease-in-out infinite; }
				@keyframes dsh-mimo-twinkle { 0% { opacity: .25; background-position: 0 0; } 42% { opacity: 1; } 100% { opacity: .3; background-position: 64px 0; } }
				@media (prefers-reduced-motion: reduce) { .dsh-mimo-bar > i > b, .dsh-mimo-side .line > i > b { animation: none; opacity: .65; } }

				/* 模型卡片（Claude Desktop 风格） */
				.dsh-mimo-model-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; }
				.dsh-mimo-model { display: flex; gap: 10px; padding: 10px 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: var(--dsw-radius-md); background: var(--dsw-alias-bg-layer-2); }
				.dsh-mimo-model:hover { border-color: var(--dsw-alias-border-l3); background: var(--dsw-alias-bg-layer-3); }
				.dsh-mimo-model .avatar { flex: none; width: 32px; height: 32px; border-radius: var(--dsw-radius-sm); display: flex; align-items: center; justify-content: center; background: var(--dsw-alias-state-business-primary); color: #fff; font-size: 15px; }
				.dsh-mimo-model .name { font-size: 13px; font-weight: 600; color: var(--dsw-alias-label-primary); font-family: var(--dsw-font-family); }
				.dsh-mimo-model .id { font-size: 11px; color: var(--dsw-alias-label-tertiary); margin: 1px 0 4px; font-family: var(--dsw-font-family); }
				.dsh-mimo-model .badges { display: flex; flex-wrap: wrap; gap: 4px; }
				.dsh-mimo-model .badge { font-size: 10px; padding: 1px 7px; border-radius: 999px; background: var(--dsw-alias-bg-base); border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-secondary); font-family: var(--dsw-font-family); }

				/* 侧栏底部：套餐名一行，蓝色进度条占满宽，余量跟在条尾 */
				[data-slot="sidebar.footer.action"] { display: flex !important; flex-direction: column !important; align-items: stretch; width: 100% !important; min-width: 0; flex: 1 0 100% !important; }
				[data-slot="sidebar.footer.action"] > * { width: 100% !important; min-width: 0 !important; flex: none !important; box-sizing: border-box; }
				:has(> [data-slot="sidebar.footer.action"]) { flex-wrap: wrap !important; width: 100%; }
				:has(> [data-slot="sidebar.footer.action"]) > * { flex: 1 0 100% !important; width: 100% !important; min-width: 0 !important; box-sizing: border-box; }
				.dsh-mimo-side { position: relative; display: block; width: 100% !important; min-width: 0; flex: 1 0 100% !important; }
				.dsh-mimo-side.is-rail { width: auto !important; flex: none !important; }
				.dsh-mimo-side.is-rail .dsh-mimo-side-btn { flex-direction: row; align-items: center; justify-content: center; width: auto; padding: 6px; }
				.dsh-mimo-side-btn { display: flex; flex-direction: column; align-items: stretch; gap: 6px; width: 100%; min-height: 28px; padding: 6px 10px 8px; border: none; border-radius: var(--dsw-radius-sm); background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font: var(--dsw-font-xxs-12); font-family: var(--dsw-font-family); text-align: left; }
				.dsh-mimo-side-btn:hover { background: var(--dsw-alias-interactive-bg-hover); }
				.dsh-mimo-side-btn .tier { display: block; min-width: 0; color: var(--dsw-alias-label-primary); font-weight: 600; letter-spacing: .1px; line-height: 1.35; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
				.dsh-mimo-side-meter { display: flex; align-items: center; gap: 8px; width: 100%; min-width: 0; }
				.dsh-mimo-side-btn .usage { flex: none; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; font-weight: 500; white-space: nowrap; }
				.dsh-mimo-side .line { flex: 1 1 auto; position: relative; display: block; height: 10px; min-width: 0; margin: 0; border-radius: 999px; background: color-mix(in srgb, #3b82f6 16%, var(--dsw-alias-border-l2)); overflow: hidden; }
				.dsh-mimo-side .line > i { position: relative; display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #1d4ed8, #3b82f6 62%, #60a5fa); overflow: hidden; }
				.dsh-mimo-side-badge { position: absolute; top: -2px; right: -4px; font-size: 9px; line-height: 1; padding: 2px 4px; border-radius: 999px; background: var(--dsw-alias-bg-layer-3); color: var(--dsw-alias-label-secondary); font-family: var(--dsw-font-family); }

				.dsh-mimo-plan { color: var(--dsw-alias-label-primary); font-size: 12px; font-weight: 600; letter-spacing: .1px; }

				/* 模型分类标题 */
				.dsh-mimo-group { margin: 12px 0 6px; font-size: 11px; font-weight: 600; letter-spacing: .5px; text-transform: uppercase; color: var(--dsw-alias-label-tertiary); font-family: var(--dsw-font-family); }

				/* 侧栏快捷余量富文本行 */
				.dsh-mimo-side .meta, .dsh-mimo-pop .meta { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; color: var(--dsw-alias-label-tertiary); margin-top: 2px; }

				/* 展开面板：原生 MenuSurface 材质的 Popover，宽度跟左侧边栏走 */
				.dsh-mimo-pop { z-index: 60; box-sizing: border-box !important; width: var(--dsh-mimo-pop-w) !important; min-width: var(--dsh-mimo-pop-w) !important; max-width: var(--dsh-mimo-pop-w) !important; max-height: min(70vh, 460px); overflow-x: hidden; overflow-y: auto; padding: 10px 12px; font-family: var(--dsw-font-family); }
				.dsh-mimo-pop .dsh-mimo-quota .big { font-size: 20px; line-height: 1.25; }
				.dsh-mimo-pop .dsh-mimo-quota .big em { white-space: normal; }
				.dsh-mimo-pop .title { font-size: 12px; font-weight: 600; color: var(--dsw-alias-label-primary); margin: 0 28px 8px 0; line-height: 24px; }
				.dsh-mimo-refresh { position: absolute; top: 8px; right: 8px; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; padding: 0; border: none; border-radius: var(--dsw-radius-sm); background: transparent; color: var(--dsw-alias-label-tertiary); cursor: pointer; }
				.dsh-mimo-refresh:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-secondary); }
				.dsh-mimo-refresh:disabled { cursor: default; opacity: .45; }
				.dsh-mimo-refresh svg { width: 14px; height: 14px; }
				.dsh-mimo-refresh.is-busy svg { animation: dsh-mimo-spin .8s linear infinite; }
				@keyframes dsh-mimo-spin { to { transform: rotate(360deg); } }
				.dsh-mimo-pop.fallback { background: var(--dsw-alias-bg-layer-3); border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; box-shadow: var(--dsw-elevation-panel); }

				/* 药丸 */
				.dsh-mimo-pill { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); font-size: 11px; color: var(--dsw-alias-label-secondary); cursor: pointer; white-space: nowrap; font-family: var(--dsw-font-family); }
				.dsh-mimo-pill:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }

				/* 原生消息动作按钮（与反馈按钮同规格） */
				.dsh-mimo-action { display: inline-flex; align-items: center; justify-content: center; width: calc(28px + var(--dsh-content-font-delta, 0px)); height: calc(28px + var(--dsh-content-font-delta, 0px)); padding: 6px; border: none; border-radius: var(--dsw-radius-sm); background: transparent; color: var(--dsw-alias-label-tertiary); cursor: pointer; }
				.dsh-mimo-action svg { flex: none; width: calc(16px + var(--dsh-content-font-delta, 0px)); height: calc(16px + var(--dsh-content-font-delta, 0px)); }
				@media (hover: hover) { .dsh-mimo-action:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-secondary); } }
				.dsh-mimo-action:disabled { cursor: default; opacity: .4; }

				/* 选中文字悬浮胶囊（与「引用」同款） */
				.dsh-mimo-floats { display: inline-flex; gap: 6px; align-items: center; }
				.dsh-mimo-float { padding: 5px 10px; border: none; border-radius: 999px; corner-shape: round; background: var(--dsw-alias-button-floating-fill); --dsw-elevation-stroke-color: var(--dsw-alias-border-l3); box-shadow: var(--dsw-elevation-panel); color: var(--dsw-alias-label-primary); font: var(--dsw-font-xs-13); cursor: pointer; }
				.dsh-mimo-float:focus-visible, .dsh-mimo-float:hover { background: var(--dsw-alias-button-floating-hover); }

				.dsh-mimo-effort-pill { display: inline-flex; align-items: center; height: 28px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); color: #4c9fff; font: 12px/1 var(--dsw-font-family, inherit); cursor: pointer; white-space: nowrap; }
				.dsh-mimo-effort-pill:hover { background: var(--dsw-alias-interactive-bg-hover); }
				.dsh-mimo-effort-pill.is-ultra { color: #c4b5fd; }
				.dsh-mimo-codex-card { box-sizing: border-box; width: 236px; padding: 12px 14px 11px; border-radius: 14px; background: #2c2c30; color: #fff; box-shadow: 0 10px 28px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.06); font-family: var(--dsw-font-family, inherit); }
				.dsh-mimo-codex-card .title { margin: 0; text-align: center; color: #4c9fff; font-size: 15px; font-weight: 650; letter-spacing: .1px; }
				.dsh-mimo-codex-card.is-ultra .title { color: #c4b5fd; }
				.dsh-mimo-codex-card .model { margin: 2px 0 0; text-align: center; color: #9a9aa3; font-size: 12px; }
				.dsh-mimo-codex { position: relative; height: 22px; margin-top: 10px; cursor: pointer; touch-action: none; outline: none; }
				.dsh-mimo-codex .bar { position: absolute; left: 0; right: 0; top: 4px; height: 14px; border-radius: 999px; overflow: hidden; background: #3c3c42; }
				.dsh-mimo-codex .fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: inherit; background: #3b93ff; }
				.dsh-mimo-codex .dot { position: absolute; top: 50%; width: 3px; height: 3px; margin: -1.5px 0 0 -1.5px; border-radius: 50%; background: rgba(255,255,255,.9); }
				.dsh-mimo-codex .dot.ahead { background: rgba(255,255,255,.32); }
				.dsh-mimo-codex.is-ultra .dot { display: none; }
				.dsh-mimo-codex.is-ultra .bar { background: linear-gradient(90deg, #7ec8ff 0%, #6aa6ff 24%, #8d86ff 58%, #b06bff 100%); }
				.dsh-mimo-codex.is-ultra .bar::after { content: ""; position: absolute; inset: 0; pointer-events: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='14' viewBox='0 0 64 14'%3E%3Cg fill='white'%3E%3Cpath d='M8 1.4 8.7 4.4 11.6 5.1 8.7 5.8 8 8.8 7.3 5.8 4.4 5.1 7.3 4.4Z'/%3E%3Cpath d='M28 3.2 28.4 4.8 30 5.2 28.4 5.6 28 7.2 27.6 5.6 26 5.2 27.6 4.8Z' opacity='.8'/%3E%3Cpath d='M48 1.6 48.6 4 51 4.6 48.6 5.2 48 7.6 47.4 5.2 45 4.6 47.4 4Z' opacity='.95'/%3E%3C/g%3E%3C/svg%3E"); background-repeat: repeat-x; background-size: 64px 14px; animation: dsh-mimo-effort-spark 1.6s linear infinite; }
				@keyframes dsh-mimo-effort-spark { 0% { opacity: .35; background-position: 0 0; } 45% { opacity: 1; } 100% { opacity: .4; background-position: 64px 0; } }
				@media (prefers-reduced-motion: reduce) { .dsh-mimo-codex.is-ultra .bar::after { animation: none; opacity: .7; } }
				.dsh-mimo-codex .thumb { position: absolute; top: 1px; width: 20px; height: 20px; margin-left: -10px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.35); pointer-events: none; }
			`;
			const style = document.createElement("style");
			style.textContent = css;
			document.head.appendChild(style);
			return () => style.remove();
		}

		function IconRefresh() {
			return h("svg", { viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true" },
				h("path", { d: "M13.2 8A5.2 5.2 0 1 1 11.6 4.2", stroke: "currentColor", "stroke-width": "1.4", "stroke-linecap": "round" }),
				h("path", { d: "M11.4 1.8v2.8h2.8", stroke: "currentColor", "stroke-width": "1.4", "stroke-linecap": "round", "stroke-linejoin": "round" }));
		}
		function IconSpeak() {
			return h("svg", { viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true" },
				h("path", { d: "M2.5 6v4h2.2L8 13V3L4.7 6H2.5z", fill: "currentColor" }),
				h("path", { d: "M10.2 5.6a3.2 3.2 0 0 1 0 4.8M12 4a5.4 5.4 0 0 1 0 8", stroke: "currentColor", "stroke-width": "1.3", "stroke-linecap": "round" }));
		}

		// ── 朗读（MiMo TTS，分段顺序播放、边播边取下一段） ──────────────────────
		// Host 端 speak 一律返回带 RIFF 头的 wav；mp3/pcm 都是浏览器播不了的裸流。
		let currentAudio = null;
		let settlePlay = null;
		function stopAudio() {
			const settle = settlePlay;
			settlePlay = null;
			if (currentAudio) {
				currentAudio.onended = null;
				currentAudio.onerror = null;
				try { currentAudio.pause(); } catch { /* already torn down */ }
				currentAudio = null;
			}
			if (settle) settle(true);
		}
		/** @returns {Promise<boolean>} true = 被 stopAudio 中途停掉 */
		function playAudio(base64, format) {
			return new Promise((resolve, reject) => {
				stopAudio(); // 同一时刻只留一路声音：新开播先把旧的停干净
				const mime = format === "wav" ? "audio/wav" : "audio/mpeg";
				const audio = new Audio(`data:${mime};base64,${base64}`);
				let settled = false;
				const settle = (stopped) => finish(resolve, stopped);
				const finish = (fn, value) => {
					if (settled) return;
					settled = true;
					if (currentAudio === audio) currentAudio = null;
					if (settlePlay === settle) settlePlay = null;
					fn(value);
				};
				currentAudio = audio;
				settlePlay = settle;
				audio.onended = () => finish(resolve, false);
				audio.onerror = () => finish(reject, new Error("audio"));
				audio.play().catch((error) => finish(reject, error));
			});
		}
		// 每段 160 字左右：兼顾首句出声速度与单段 wav 体积（24 kHz 单声道 PCM16）。
		const SPEECH_CHUNK = 160;
		function splitSpeech(text, limit = SPEECH_CHUNK) {
			const chunks = [];
			let rest = String(text ?? "").trim();
			while (rest.length > 0) {
				if (rest.length <= limit) { chunks.push(rest); break; }
				let cut = rest.lastIndexOf("。", limit);
				if (cut < limit / 2) cut = rest.lastIndexOf("！", limit);
				if (cut < limit / 2) cut = rest.lastIndexOf("？", limit);
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
			const chunks = splitSpeech(clean);
			let pending = null;
			for (let index = 0; index < chunks.length; index += 1) {
				const result = pending ? await pending : await call("speak", { text: chunks[index] });
				pending = null;
				if (index + 1 < chunks.length) {
					// 边播边合成下一段，段间不断档；失败留到轮到它时再抛。
					const next = call("speak", { text: chunks[index + 1] });
					next.catch(() => {});
					pending = next;
				}
				if (await playAudio(result.audioBase64, result.format) === true) return;
			}
		}
		// 弹层锚定：取贴左、比按钮更宽的那一层当侧栏，宽度跟它走，不探出去。
		function sidebarBound(anchorEl) {
			const anchor = anchorEl.getBoundingClientRect();
			let best = anchor;
			let node = anchorEl.parentElement;
			while (node && node !== document.body) {
				const rect = node.getBoundingClientRect();
				if (rect.width <= 0) break;
				if (rect.left > 72) break;
				if (rect.width > Math.min(520, window.innerWidth * 0.5)) break;
				if (rect.width + 1 >= best.width) best = rect;
				node = node.parentElement;
			}
			return best;
		}
		function popoverStyle(anchorEl, prefer = "above") {
			const rect = anchorEl.getBoundingClientRect();
			const bound = sidebarBound(anchorEl);
			const gap = 8;
			const left = Math.max(0, bound.left + gap);
			const width = Math.max(140, Math.min(bound.width - gap * 2, window.innerWidth - left - gap));
			const useAbove = prefer === "above" && rect.top > 180;
			const box = { left, width, minWidth: width, maxWidth: width, "--dsh-mimo-pop-w": width + "px" };
			return useAbove
				? Object.assign(box, { bottom: window.innerHeight - rect.top + 6 })
				: Object.assign(box, { top: Math.min(rect.bottom + 6, Math.max(8, window.innerHeight - 160)) });
		}
		function usePopover(anchorRef, prefer) {
			const [pop, setPop] = react.useState(null);
			const popRef = react.useRef(null);
			const open = react.useCallback(() => {
				if (anchorRef.current) setPop(popoverStyle(anchorRef.current, prefer));
			}, [anchorRef, prefer]);
			const close = react.useCallback(() => setPop(null), []);
			const toggle = react.useCallback(() => setPop((prev) => (prev ? null : (anchorRef.current ? popoverStyle(anchorRef.current, prefer) : null))), [anchorRef, prefer]);
			react.useEffect(() => {
				if (!pop) return undefined;
				const onResize = () => { if (anchorRef.current) setPop(popoverStyle(anchorRef.current, prefer)); };
				const onDown = (event) => {
					const inButton = Boolean(anchorRef.current && anchorRef.current.parentElement && anchorRef.current.parentElement.contains(event.target));
					const inPop = Boolean(popRef.current && popRef.current.contains(event.target));
					if (!inButton && !inPop) setPop(null);
				};
				const onKey = (event) => { if (event.key === "Escape") setPop(null); };
				window.addEventListener("resize", onResize);
				document.addEventListener("mousedown", onDown);
				document.addEventListener("keydown", onKey);
				return () => { window.removeEventListener("resize", onResize); document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
			}, [pop, anchorRef, prefer]);
			return { pop, popRef, open, close, toggle };
		}

		// 每条回复的朗读文本：优先读 Chat 快照里 closing blocks 的正文（与原生
		// 「复制」拿的是同一份文本），拿不到再退回到 DOM 行文本。
		function assistantTextOfSnapshot(snapshot, messageId) {
			try {
				for (const key of snapshot.order ?? []) {
					const node = snapshot.nodes.get(key);
					if (!node || node.kind !== "turn-tail") continue;
					const closing = node.data && node.data.closing;
					if (!closing || !closing.finalNode || closing.finalNode.messageId !== messageId) continue;
					return (closing.blocks ?? [])
						.filter((block) => block.kind === "text")
						.map((block) => String(block.text ?? ""))
						.join("")
						.trim();
				}
			} catch { /* fall back to DOM */ }
			return "";
		}
		function readAssistantTextFromDom(buttonEl) {
			try {
				const row = buttonEl.closest("[data-chat-flow-kind]");
				const turn = row ? row.getAttribute("data-chat-turn") : "";
				const texts = [];
				for (let node = row ? row.previousElementSibling : null; node; node = node.previousElementSibling) {
					if (node.getAttribute("data-chat-turn") !== turn) break;
					if (node.getAttribute("data-chat-flow-kind") !== "assistant-step") continue;
					const clone = node.cloneNode(true);
					for (const bad of clone.querySelectorAll("button, [role=button], svg, style, script, details, [aria-hidden=true], [hidden]")) bad.remove();
					const text = (clone.innerText || clone.textContent || "").trim();
					if (text !== "") texts.unshift(text);
				}
				return texts.join("\n");
			} catch {
				return "";
			}
		}

		// ── 套餐档位 ─────────────────────────────────────────────────────────────
		function planTier(code) {
			const c = String(code ?? "").toLowerCase();
			if (/ultra/.test(c)) return "ultra";
			if (/max/.test(c)) return "max";
			if (/pro/.test(c)) return "pro";
			if (/flash|lite|basic|std/.test(c)) return "flash";
			return "";
		}
		function planLabel(code) {
			const raw = String(code ?? "").trim();
			if (raw === "") return "MiMo Token Plan";
			const known = { lite: "Lite", standard: "Standard", std: "Standard", basic: "Basic", pro: "Pro", max: "Max", ultra: "Ultra", flash: "Flash" };
			const tier = known[raw.toLowerCase()] ?? (raw.length <= 8 ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() : raw);
			return "MiMo Token Plan " + tier;
		}
		function PlanChip({ code }) {
			return h("span", { className: "dsh-mimo-plan" }, planLabel(code));
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
					h("i", { style: { width: `${Math.max(2, usedPct)}%` } }, h("b"))),
				compact ? null : h("div", null,
					h("div", { className: "dsh-mimo-kv" }, h("span", null, `${t("used")} ${formatCredits(quota.quota.usedCredits)}（${usedPct}%）`), h("span", null, `${t("total")} ${formatCredits(quota.quota.totalCredits)}`)),
					h("div", { className: "dsh-mimo-row", style: { justifyContent: "space-between" } },
						h(PlanChip, { code: quota.planCode }),
						h("span", { className: "dsh-mimo-hint" }, `${t("autoRenew")} ${quota.autoRenew ? t("on") : t("off")}`)),
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
			const [voice, setVoice] = react.useState({ model: TTS_MODELS[0], voice: "mimo_default", style: "" });
			const [asrLanguage, setAsrLanguage] = react.useState("auto");
			const [login, setLogin] = react.useState(null);
			const [codeInput, setCodeInput] = react.useState("");
			const [playing, setPlaying] = react.useState(false);
			react.useEffect(() => {
				if (!notice) return undefined;
				const timer = setTimeout(() => setNotice(""), 4000);
				return () => clearTimeout(timer);
			}, [notice]);

			const refresh = react.useCallback(async (force = false) => {
				try {
					const next = await call(force ? "quota" : "status");
					setStatus(next);
					const settings = next.settings ?? {};
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
				if (playing) { stopAudio(); setPlaying(false); return; }
				setBusy("tts");
				try {
					const result = await call("speak", { text: "你好，我是 MiMo 语音，很高兴认识你。", model: voice.model, voice: voice.voice === "mimo_default" ? "" : voice.voice, style: voice.style });
					setPlaying(true);
					setBusy("");
					await playAudio(result.audioBase64, result.format);
				} catch (error) {
					setNotice(`${t("speakFailed")}：${String(error?.message ?? error)}`);
				} finally { setPlaying(false); setBusy(""); }
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

				// Coding Plan 余量卡片：登录后才展示。
				auth.hasKey ? h("div", { className: "dsh-mimo-card" },
					h("h3", null, t("quotaTitle")),
					h(QuotaPanel, {
						quota: status?.quota ?? null,
						quotaError: status?.quotaError ?? "",
						hasKey: true,
						busy: busy !== "",
						onRefresh: () => { setBusy("quota"); void refresh(true).finally(() => setBusy("")); },
						t
					})) : null,

				h("div", { className: "dsh-mimo-card" },
					h("h3", null, t("modelsTitle")),
					h("div", { className: "dsh-mimo-hint" }, models.source === "live" ? t("modelsLive") : t("modelsFallback")),
					[
						{ kind: "llm", label: t("groupLlm") },
						{ kind: "asr", label: t("groupAsr") },
						{ kind: "tts", label: t("groupTts") },
						{ kind: "embedding", label: t("groupOther") }
					].map((group) => {
						const items = (models.models ?? []).filter((model) => (model.kind ?? "llm") === group.kind);
						if (items.length === 0) return null;
						return h("div", { key: group.kind },
							h("div", { className: "dsh-mimo-group" }, group.label),
							h("div", { className: "dsh-mimo-model-grid" },
								items.map((model) => {
									const id = String(model.id ?? "");
									const badges = [];
									if (group.kind === "llm") {
										if (model.contextWindow) badges.push(t("badgeContext").replace("{n}", `${Math.round(model.contextWindow / 1000)}K`));
										if (/mimo-v2\.6/.test(id)) { badges.push(t("badgeThinking"), t("badgeVision")); }
										badges.push(t("badgeTools"));
									} else if (group.kind === "asr") {
										badges.push(t("badgeAsr"));
									} else if (group.kind === "tts") {
										badges.push(t("badgeTts"));
									}
									return h("div", { className: "dsh-mimo-model", key: id },
										h("div", { className: "avatar" }, group.kind === "llm" ? "🐋" : "🎙"),
										h("div", null,
											h("div", { className: "name" }, model.name ?? id),
											h("div", { className: "id" }, id),
											h("div", { className: "badges" }, badges.map((badge) => h("span", { className: "badge", key: badge }, badge)))));
								})));
					})),

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
						h("button", { className: "dsh-mimo-btn", disabled: busy !== "" || !status?.auth?.hasKey, onClick: preview }, playing ? t("ttsPlaying") : t("ttsTest"))),
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
		function renderPop(popRef, style, label, children) {
			const props = { ref: popRef, className: "dsh-mimo-pop", style: Object.assign({ position: "fixed" }, style), role: "dialog", "aria-label": label, tabIndex: -1 };
			if (MenuSurface && createPortal) return createPortal(h(MenuSurface, props, children), document.body);
			return h("div", Object.assign({}, props, { className: "dsh-mimo-pop fallback" }), children);
		}

		function SidebarQuotaEntry({ wide, call, t }) {
			const [status, setStatus] = react.useState(null);
			const [refreshing, setRefreshing] = react.useState(false);
			const anchorRef = react.useRef(null);
			const { pop, toggle, popRef } = usePopover(anchorRef, "above");
			const load = react.useCallback(async () => {
				try { setStatus(await call("status")); } catch { /* stay quiet */ }
			}, [call]);
			// Coding Plan 相关入口登录后才展示：未登录时静默轮询，登录成功后自己冒出来。
			const hasKey = status?.auth?.hasKey === true;
			react.useEffect(() => {
				void load();
				const timer = setInterval(load, hasKey ? 5 * 60 * 1000 : 15 * 1000);
				return () => clearInterval(timer);
			}, [load, hasKey]);
			if (!hasKey) return null;
			const quota = status?.quota ?? null;
			const usedPct = quota ? usagePercent(quota.quota) : null;
			const remainPct = usedPct === null ? null : Math.round((100 - usedPct) * 10) / 10;
			const plan = quota ? planLabel(quota.planCode) : "MiMo Token Plan";
			return h("div", { className: wide ? "dsh-mimo-side is-wide" : "dsh-mimo-side is-rail" },
				wide
					? h("button", { ref: anchorRef, className: "dsh-mimo-side-btn", title: plan + (quota ? " · 余 " + remainPct + "%" : ""), "aria-expanded": pop ? "true" : "false", onClick: toggle },
						h("span", { className: "tier" }, plan),
						h("span", { className: "dsh-mimo-side-meter" },
							h("span", { className: "line" }, h("i", { style: { width: Math.max(2, usedPct ?? 0) + "%" } }, h("b"))),
							h("span", { className: "usage" }, quota ? "余 " + remainPct + "%" : "—")))
					: h("button", { ref: anchorRef, className: "dsh-mimo-side-btn", title: t("sidebarTitle"), style: { justifyContent: "center", position: "relative", width: "auto" }, onClick: toggle },
						h("span", null, "🐋"),
						quota ? h("span", { className: "dsh-mimo-side-badge" }, String(Math.round(remainPct))) : null),
				pop ? renderPop(popRef, pop, t("sidebarTitle"), [
					h("div", { className: "title", key: "title" }, t("sidebarTitle")),
					h("button", {
						key: "refresh",
						className: refreshing ? "dsh-mimo-refresh is-busy" : "dsh-mimo-refresh",
						type: "button",
						title: t("refresh"),
						"aria-label": t("refresh"),
						disabled: refreshing,
						onClick: async (event) => {
							event.stopPropagation();
							if (refreshing) return;
							setRefreshing(true);
							try { setStatus(await call("quota")); } catch { /* keep last */ }
							setRefreshing(false);
						}
					}, h(IconRefresh)),
					h(QuotaPanel, {
						key: "quota",
						quota,
						quotaError: status?.quotaError ?? "",
						hasKey: status?.auth?.hasKey === true,
						busy: refreshing,
						t
					}),

				]) : null);
		}

		// ── 原生语音入口 ─────────────────────────────────────────────────────────
		function useBusySpeaker(call) {
			const [busy, setBusy] = react.useState(false);
			const [note, setNote] = react.useState("");
			const busyRef = react.useRef(false);
			const callRef = react.useRef(call);
			callRef.current = call;
			react.useEffect(() => {
				if (!note) return undefined;
				const timer = setTimeout(() => setNote(""), 5000);
				return () => clearTimeout(timer);
			}, [note]);
			// 组件被关掉时别把声音留在后台没人管。
			react.useEffect(() => () => { if (busyRef.current) stopAudio(); }, []);
			const toggle = react.useCallback(async (text) => {
				if (busyRef.current) { stopAudio(); busyRef.current = false; setBusy(false); return; }
				if (!text) return false;
				busyRef.current = true;
				setBusy(true);
				setNote("");
				try { await speakText(callRef.current, text); }
				catch (error) {
					const message = String(error?.message ?? error);
					setNote(message === "empty" ? "" : message);
					console.error("[dsh-mimo] speak:", message);
				} finally { busyRef.current = false; setBusy(false); }
				return true;
			}, []);
			return { busy, note, toggle };
		}

		// 选中文字悬浮胶囊：「引用」（官方 message-quotes 同款行为）+「朗读」。
		function SpeakSelectionAction({ readText, dismiss, clearSelection, inputActions, call, t }) {
			const { busy, note, toggle } = useBusySpeaker(call);
			const quote = () => {
				const text = readText();
				if (!text) { dismiss(); return; }
				if (!inputActions || !inputActions.insertQuote(text)) return;
				if (clearSelection) clearSelection();
				dismiss();
			};
			const speak = async () => {
				const text = readText();
				if (!text) { dismiss(); return; }
				await toggle(text);
			};
			return h("span", { className: "dsh-mimo-floats" },
				h("button", {
					className: "dsh-mimo-float",
					onPointerDown: (event) => { event.preventDefault(); },
					onClick: quote
				}, t("quoteAction")),
				h("button", {
					className: "dsh-mimo-float",
					"aria-label": busy ? t("stopSpeak") : t("speakAction"),
					title: note || (busy ? t("stopSpeak") : t("speakAction")),
					onPointerDown: (event) => { event.preventDefault(); },
					onClick: speak
				}, note ? t("speakFailed") : busy ? t("speakPlaying") : t("speakAction")));
		}

		function SpeakMessageAction({ messageId, useChat, call, t }) {
			const { busy, note, toggle } = useBusySpeaker(call);
			const ref = react.useRef(null);
			const snapshotText = typeof useChat === "function"
				? useChat((snapshot) => assistantTextOfSnapshot(snapshot, messageId))
				: "";
			const speak = async () => {
				const text = String(snapshotText ?? "").trim() || readAssistantTextFromDom(ref.current);
				if (text === "") return;
				await toggle(text);
			};
			return h("button", {
				ref,
				type: "button",
				className: "dsh-mimo-action",
				"aria-label": busy ? t("stopSpeak") : t("speakThis"),
				title: note || (busy ? t("stopSpeak") : t("speakThis")),
				onClick: speak
			}, busy ? "⏹" : h(IconSpeak));
		}

		// ── 推理等级：Codex 式宽拉条，档位是模型官方取值 ────────────────────────
		const MIMO_PROVIDER = "xiaomi-mimo";
		const EFFORT_STOPS = [
			{ id: "none", name: "None" },
			{ id: "minimal", name: "Minimal" },
			{ id: "low", name: "Low" },
			{ id: "medium", name: "Medium" },
			{ id: "high", name: "High" },
			{ id: "xhigh", name: "Extra high" },
			{ id: "max", name: "Max" },
			{ id: "ultra", name: "Ultra" }
		];
		const EFFORT_NAMES = new Set(EFFORT_STOPS.map((stop) => stop.name).concat(["Off"]));
		const EFFORT_ROW_LABELS = new Set(["推理等级", "Effort", "强度", "強度", "Reasoning", "Reasoning effort", "思考等级"]);
		const MODEL_TITLES = {
			"mimo-v2.6-pro": "MiMo V2.6 Pro",
			"mimo-v2.6-flash": "MiMo V2.6 Flash",
			"mimo-v2.6-pro-ultraspeed": "MiMo V2.6 Pro Ultraspeed",
			"mimo-v2.5-pro": "MiMo V2.5 Pro"
		};
		const EMPTY_DIRECTORY = { current: null };
		function modelThinks(id) {
			const model = String(id ?? "");
			if (model === "mimo-v2.5-asr" || model.startsWith("mimo-v2.5-tts")) return false;
			return /mimo-v2\.6|mimo-v2\.5-pro|reasoner|think/i.test(model);
		}
		function effortIndex(raw) {
			const id = raw === "off" || raw === "default" || raw === "" ? "none" : raw;
			const index = EFFORT_STOPS.findIndex((stop) => stop.id === id);
			return index < 0 ? EFFORT_STOPS.findIndex((stop) => stop.id === "high") : index;
		}
		function effortTitle(raw) {
			if (raw === "off") return "Off";
			return EFFORT_STOPS.find((stop) => stop.id === raw)?.name ?? "High";
		}
		function cardStyle(rect) {
			const width = 236;
			const height = 92;
			let left = rect.left + rect.width / 2 - width / 2;
			left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
			let top = rect.top - height - 10;
			if (top < 8) top = Math.min(rect.bottom + 8, window.innerHeight - height - 8);
			return { position: "fixed", left, top, width, zIndex: 1300 };
		}
		function effortRowFrom(event) {
			const button = event.target && event.target.closest ? event.target.closest("button[role='menuitem']") : null;
			if (!button) return null;
			const value = (button.querySelector("[class*='cellValue']")?.textContent || "").trim();
			const label = (button.querySelector("[class*='cellLabel']")?.textContent || "").trim();
			if (EFFORT_NAMES.has(value) || EFFORT_ROW_LABELS.has(label)) return button;
			return null;
		}
		function CodexEffortCard({ title, model, index, onPreview, onCommit }) {
			const max = EFFORT_STOPS.length - 1;
			const ultra = index === max;
			const trackRef = react.useRef(null);
			const pickAt = (clientX) => {
				const rect = trackRef.current && trackRef.current.getBoundingClientRect();
				if (!rect || rect.width <= 0) return;
				const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
				onPreview(EFFORT_STOPS[Math.round(ratio * max)].id);
			};
			const thumb = `calc(10px + (100% - 20px) * ${index / max})`;
			return h("div", { className: ultra ? "dsh-mimo-codex-card is-ultra" : "dsh-mimo-codex-card", role: "dialog", "aria-label": title },
				h("p", { className: "title" }, title),
				h("p", { className: "model" }, model),
				h("div", {
					ref: trackRef,
					className: ultra ? "dsh-mimo-codex is-ultra" : "dsh-mimo-codex",
					role: "slider",
					tabIndex: 0,
					"aria-valuemin": 0,
					"aria-valuemax": max,
					"aria-valuenow": index,
					"aria-valuetext": title,
					onPointerDown: (event) => {
						event.preventDefault();
						event.currentTarget.setPointerCapture(event.pointerId);
						pickAt(event.clientX);
					},
					onPointerMove: (event) => {
						if (event.currentTarget.hasPointerCapture && event.currentTarget.hasPointerCapture(event.pointerId)) pickAt(event.clientX);
					},
					onPointerUp: () => onCommit(),
					onPointerCancel: () => onCommit(),
					onKeyDown: (event) => {
						if (event.key === "ArrowRight" || event.key === "ArrowUp") {
							event.preventDefault();
							if (index < max) { onPreview(EFFORT_STOPS[index + 1].id); onCommit(); }
						} else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
							event.preventDefault();
							if (index > 0) { onPreview(EFFORT_STOPS[index - 1].id); onCommit(); }
						}
					}
				},
					h("div", { className: "bar" },
					ultra ? null : h("i", { className: "fill", style: { width: thumb } }),
					EFFORT_STOPS.map((stop, at) => h("i", {
						key: stop.id,
						className: at > index ? "dot ahead" : "dot",
						style: { left: `calc(10px + (100% - 20px) * ${at / max})` }
					}))),
					h("b", { className: "thumb", style: { left: thumb } })));
		}
		function EffortPill({ directory, call, t, locked }) {
			const anchorRef = react.useRef(null);
			const cardRef = react.useRef(null);
			const previewRef = react.useRef(null);
			const [pop, setPop] = react.useState(null);
			const [previewId, setPreviewId] = react.useState(null);
			const snapshot = react.useSyncExternalStore(
				react.useCallback((fn) => directory && directory.store ? directory.store.subscribe(fn) : () => {}, [directory]),
				() => directory && directory.store ? directory.store.getSnapshot() : EMPTY_DIRECTORY,
				() => directory && directory.store ? directory.store.getSnapshot() : EMPTY_DIRECTORY);
			const current = snapshot && snapshot.current ? snapshot.current : null;
			const active = Boolean(current && current.provider === MIMO_PROVIDER && modelThinks(current.model));
			const raw = current && current.reasoningEffort ? current.reasoningEffort : "high";
			const shownId = previewId ?? raw;
			const index = effortIndex(shownId);
			const title = effortTitle(shownId);
			const ultra = index === EFFORT_STOPS.length - 1;
			const model = current ? (MODEL_TITLES[current.model] || current.model) : "";
			const openAt = react.useCallback((el) => { if (el) setPop(cardStyle(el.getBoundingClientRect())); }, []);
			// 拖动只改本地预览，松手才落盘：这样拉条才跟手。
			const onPreview = react.useCallback((id) => {
				previewRef.current = id;
				setPreviewId(id);
			}, []);
			const onCommit = react.useCallback(() => {
				const id = previewRef.current;
				if (!id || locked || !current || id === raw) return;
				void directory.select({ provider: current.provider, model: current.model, reasoningEffort: id }).catch(() => {});
				void call("save", { thinking: id }).catch(() => {});
			}, [locked, current, raw, directory, call]);
			react.useEffect(() => {
				if (previewId && previewId === raw) {
					previewRef.current = null;
					setPreviewId(null);
				}
			}, [previewId, raw]);
			react.useEffect(() => {
				if (!active) return undefined;
				const onPointer = (event) => {
					const row = effortRowFrom(event);
					if (!row) return;
					event.preventDefault();
					event.stopPropagation();
					openAt(anchorRef.current || row);
				};
				document.addEventListener("pointerdown", onPointer, true);
				return () => document.removeEventListener("pointerdown", onPointer, true);
			}, [active, openAt]);
			react.useEffect(() => {
				if (!pop) return undefined;
				const onDown = (event) => {
					if (anchorRef.current && anchorRef.current.contains(event.target)) return;
					if (cardRef.current && cardRef.current.contains(event.target)) return;
					onCommit();
					setPop(null);
				};
				const onKey = (event) => { if (event.key === "Escape") { onCommit(); setPop(null); } };
				document.addEventListener("mousedown", onDown);
				document.addEventListener("keydown", onKey);
				return () => {
					document.removeEventListener("mousedown", onDown);
					document.removeEventListener("keydown", onKey);
				};
			}, [pop, onCommit]);
			if (!active) return null;
			const card = pop && createPortal
				? createPortal(h("div", { ref: cardRef, style: pop }, h(CodexEffortCard, { title, model, index, onPreview, onCommit })), document.body)
				: null;
			return h(react.Fragment, null,
				h("button", {
					ref: anchorRef,
					type: "button",
					className: ultra ? "dsh-mimo-effort-pill is-ultra" : "dsh-mimo-effort-pill",
					"aria-label": t("selectEffort"),
					"aria-expanded": pop ? "true" : "false",
					onClick: () => {
						if (pop) { onCommit(); setPop(null); return; }
						if (anchorRef.current) setPop(cardStyle(anchorRef.current.getBoundingClientRect()));
					}
				}, title),
				card);
		}

		// ── 装配 ────────────────────────────────────────────────────────────────
		const name = "dsh-mimo";
		const inject = ["slots", "locale", "remote", "sessions", "uiConversation", "modelDirectories"];
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

			// 输入栏推理拉条，只在选中会思考的 MiMo 模型时出现
			try {
				ctx.slots.inject("conversation.input.right", () => ctx.slots.register(
					{
						name: "conversation.input.right",
						id: "mimo-effort",
						order: 20,
						locale: NS,
						inject: (sessionId) => {
							let directory = null;
							try { directory = ctx.modelDirectories.directoryFor(sessionId); } catch { directory = null; }
							return { directory, call, t };
						}
					},
					EffortPill));
			} catch (error) { console.error("[dsh-mimo] effort pill:", error); }

// 语音输出：原生插槽
			try {
				ctx.effect(() => ctx.uiConversation.interactions.register({
					id: "mimo-speak",
					onInteraction(request) {
						// 官方「引用」先接 selection 手势；它不接的场合（右键、或
						// message-quotes 缺席/拒开）由我们兑底唤起胶囊。
						if (request.readText() === null) return;
						request.open();
					}
				}), "dsh-mimo: selection interaction");
			} catch (error) { console.error("[dsh-mimo] selection interaction:", error); }
			try {
				ctx.slots.inject("conversation.chat.text-interaction", () => {
					const offs = [];
					// quote 单元格用低优先级罩住官方「引用」胶囊（DSH 的影子机制：
					// 同格不同 priority 共存，最低者渲染），拼出「引用 + 朗读」。
					// 官方插件缺席/被禁用时，退回到自己的 mimo-speak 单元格。
					for (const spec of [{ key: "quote", priority: -1 }, { key: "mimo-speak", priority: 0 }]) {
						try {
							offs.push(ctx.slots.register(
								{ name: "conversation.chat.text-interaction", key: spec.key, priority: spec.priority, locale: NS, inject: () => ({ call, t }) },
								SpeakSelectionAction));
						} catch (error) { console.error("[dsh-mimo] selection speak (" + spec.key + "):", error); }
					}
					return () => { for (const off of offs) off(); };
				});
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
