// dsh-mimo —— Client 侧
//
// UI 全部走 DSH 原生插槽与设计令牌（--dsw-*）：
//   1. settings.section：OAuth 一键登录/退出、Coding Plan 余量、模型卡片、语音。
//   2. sidebar.footer.action：侧栏底部整行余量（普通文字档位 + 线性用量，点击展开详情）。
//   3. conversation.input.model.options：推理滑条，仅当前模型属于本插件时出现。
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
			thinkingTitle: "推理强度",
			menuEffort: "推理等级",
			thinkingOff: "关闭",
			thinkingLow: "低",
			thinkingMedium: "中",
			thinkingHigh: "最高",
			thinkingHint: "拖到最右是最高档。Off 关闭思考，其余档位开启深度思考。",
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
			thinkingTitle: "Reasoning",
			menuEffort: "Effort",
			thinkingOff: "Off",
			thinkingLow: "Low",
			thinkingMedium: "Med",
			thinkingHigh: "Max",
			thinkingHint: "Drag to the right for max. Off disables thinking; every other stop enables it.",
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
				.dsh-mimo-kv { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; font-size: 12px; margin: 6px 0; color: var(--dsw-alias-label-secondary); font-family: var(--dsw-font-family); }
				.dsh-mimo-kv span { white-space: nowrap; }
				.dsh-mimo-kv span:last-child { color: var(--dsw-alias-label-primary); }

				/* 余量面板：大字号 + 渐变流光进度条 */
				.dsh-mimo-quota { position: relative; }
				.dsh-mimo-quota .big { font-size: 22px; font-weight: 600; color: var(--dsw-alias-label-primary); letter-spacing: .2px; font-family: var(--dsw-font-family); }
				.dsh-mimo-quota .big em { font-style: normal; font-size: 13px; font-weight: 500; color: var(--dsw-alias-label-secondary); margin-left: 6px; white-space: nowrap; }
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

				/* 侧栏底部：整行普通文字 + 线性用量 */
				[data-slot="sidebar.footer.action"] { display: flex !important; flex-direction: column !important; align-items: stretch; width: 100% !important; min-width: 0; flex: 1 0 100% !important; }
				[data-slot="sidebar.footer.action"] > * { width: 100% !important; min-width: 0 !important; flex: none !important; box-sizing: border-box; }
				:has(> [data-slot="sidebar.footer.action"]) { flex-wrap: wrap !important; width: 100%; }
				:has(> [data-slot="sidebar.footer.action"]) > * { flex: 1 0 100% !important; width: 100% !important; min-width: 0 !important; box-sizing: border-box; }
				.dsh-mimo-side { position: relative; display: block; width: 100% !important; min-width: 0; flex: 1 0 100% !important; }
				.dsh-mimo-side.is-rail { width: auto !important; flex: none !important; }
				.dsh-mimo-side-btn { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; width: 100%; min-height: 28px; padding: 6px 10px 2px; border: none; border-radius: var(--dsw-radius-sm); background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font: var(--dsw-font-xxs-12); font-family: var(--dsw-font-family); text-align: left; }
				.dsh-mimo-side-btn:hover { background: var(--dsw-alias-interactive-bg-hover); }
				.dsh-mimo-side-btn .tier { color: var(--dsw-alias-label-primary); font-weight: 600; letter-spacing: .2px; }
				.dsh-mimo-side-btn .usage { margin-left: auto; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; font-weight: 500; }
				.dsh-mimo-side .line { display: block; height: 2px; margin: 2px 10px 6px; border-radius: 999px; background: var(--dsw-alias-border-l2); overflow: hidden; }
				.dsh-mimo-side .line > i { display: block; height: 100%; background: var(--dsw-alias-label-tertiary); }
				.dsh-mimo-side-badge { position: absolute; top: -2px; right: -4px; font-size: 9px; line-height: 1; padding: 2px 4px; border-radius: 999px; background: var(--dsw-alias-bg-layer-3); color: var(--dsw-alias-label-secondary); font-family: var(--dsw-font-family); }

				/* 推理等级二级面板：点开原生「推理等级」行才出现的拉条 */
				.dsh-mimo-effort-menu { padding: 2px 10px 10px; }
				.dsh-mimo-effort-menu .label { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 2px; color: var(--dsw-alias-label-secondary); font: var(--dsw-font-xxs-12); font-family: var(--dsw-font-family); }
				.dsh-mimo-effort-menu .label b { color: var(--dsw-alias-label-primary); font-weight: 600; }
				.dsh-mimo-effort { margin: 0; user-select: none; }
				.dsh-mimo-effort .track { position: relative; height: 22px; cursor: grab; touch-action: none; outline: none; }
				.dsh-mimo-effort .track:active { cursor: grabbing; }
				.dsh-mimo-effort .track:focus-visible { outline: 1px solid var(--dsw-alias-border-l3); outline-offset: 2px; border-radius: 4px; }
				.dsh-mimo-effort .track::before { content: ""; position: absolute; left: 6px; right: 6px; top: 9px; height: 3px; border-radius: 999px; background: var(--dsw-alias-border-l2); }
				.dsh-mimo-effort .fill { position: absolute; left: 6px; top: 9px; height: 3px; border-radius: 999px; background: var(--dsw-alias-label-secondary); pointer-events: none; }
				.dsh-mimo-effort .thumb { position: absolute; top: 5px; width: 11px; height: 11px; border-radius: 50%; background: var(--dsw-alias-label-primary); pointer-events: none; transform: translateX(-50%); }
				.dsh-mimo-effort.is-max .fill { background: var(--dsw-alias-label-primary); }
				.dsh-mimo-effort.is-max .thumb { box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-label-primary) 16%, transparent); }
				.dsh-mimo-effort .stops { display: flex; justify-content: space-between; margin: 0 2px; }
				.dsh-mimo-effort .stops button { border: none; background: transparent; color: var(--dsw-alias-label-tertiary); font: var(--dsw-font-xxs-12); font-family: var(--dsw-font-family); cursor: pointer; padding: 0; }
				.dsh-mimo-effort .stops button.on { color: var(--dsw-alias-label-primary); font-weight: 600; }

				.dsh-mimo-plan { color: var(--dsw-alias-label-primary); font-size: 12px; font-weight: 600; letter-spacing: .2px; }

				/* 模型分类标题 */
				.dsh-mimo-group { margin: 12px 0 6px; font-size: 11px; font-weight: 600; letter-spacing: .5px; text-transform: uppercase; color: var(--dsw-alias-label-tertiary); font-family: var(--dsw-font-family); }

				/* 侧栏快捷余量富文本行 */
				.dsh-mimo-side .meta, .dsh-mimo-pop .meta { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; color: var(--dsw-alias-label-tertiary); margin-top: 2px; }

				/* 展开面板：原生 MenuSurface 材质的 Popover */
				.dsh-mimo-pop { z-index: 60; box-sizing: border-box; max-height: min(70vh, 460px); overflow-y: auto; padding: 12px 14px; font-family: var(--dsw-font-family); }
				.dsh-mimo-pop .title { font-size: 12px; font-weight: 600; color: var(--dsw-alias-label-primary); margin-bottom: 8px; }
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
		// 弹层锚定：fixed 定位 + 视口钳制，窄栏与屏幕边缘都自适应。
		function popoverStyle(anchorEl, prefer = "above") {
			const rect = anchorEl.getBoundingClientRect();
			const width = Math.max(320, rect.width);
			const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - width - 8));
			const useAbove = prefer === "above" && rect.top > 220;
			return useAbove
				? { left, width, bottom: window.innerHeight - rect.top + 8 }
				: { left, width, top: Math.min(rect.bottom + 8, Math.max(12, window.innerHeight - 200)) };
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
		function PlanChip({ code }) {
			return h("span", { className: "dsh-mimo-plan" }, String(code ?? "PLAN").toUpperCase());
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
					h("div", { className: "dsh-mimo-row", style: { justifyContent: "space-between" } },
						h(PlanChip, { code: quota.planCode }),
						h("span", { className: "dsh-mimo-hint" }, `${t("autoRenew")} ${quota.autoRenew ? t("on") : t("off")}`)),
					h("div", { className: "dsh-mimo-kv" }, h("span", null, t("expiry")), h("span", null,
						`${period.endAt}${period.expired ? ` · ${t("expired")}` : period.daysLeft === null ? "" : ` · ${t("daysLeft").replace("{n}", period.daysLeft)}`}`))),
				onRefresh ? h("div", { className: "dsh-mimo-row" },
					h("button", { className: "dsh-mimo-btn", disabled: busy, onClick: onRefresh }, t("refresh"))) : null);
		}

		function EffortSlider({ value, onChange, t }) {
			const trackRef = react.useRef(null);
			const max = THINKING_LEVELS.length - 1;
			const index = Math.max(0, THINKING_LEVELS.findIndex((level) => level.id === value));
			const atMax = index === max;
			const setFromClientX = (clientX) => {
				const rect = trackRef.current?.getBoundingClientRect();
				if (!rect || rect.width <= 0) return;
				const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
				const next = THINKING_LEVELS[Math.round(ratio * max)].id;
				if (next !== value) onChange(next);
			};
			const onPointerDown = (event) => {
				event.preventDefault();
				event.currentTarget.setPointerCapture(event.pointerId);
				setFromClientX(event.clientX);
			};
			const onPointerMove = (event) => {
				if (event.currentTarget.hasPointerCapture?.(event.pointerId)) setFromClientX(event.clientX);
			};
			const onKeyDown = (event) => {
				if (event.key === "ArrowRight" || event.key === "ArrowUp") {
					event.preventDefault();
					if (index < max) onChange(THINKING_LEVELS[index + 1].id);
				} else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
					event.preventDefault();
					if (index > 0) onChange(THINKING_LEVELS[index - 1].id);
				}
			};
			const pct = (index / max) * 100;
			return h("div", { className: `dsh-mimo-effort${atMax ? " is-max" : ""}` },
				h("div", {
					ref: trackRef,
					className: "track",
					role: "slider",
					tabIndex: 0,
					"aria-valuemin": 0,
					"aria-valuemax": max,
					"aria-valuenow": index,
					"aria-valuetext": t(THINKING_LEVELS[index].label),
					onPointerDown,
					onPointerMove,
					onKeyDown
				},
					h("i", { className: "fill", style: { width: `calc((100% - 12px) * ${index / max})` } }),
					h("b", { className: "thumb", style: { left: `calc(6px + (100% - 12px) * ${index / max})` } })),
					h("div", { className: "stops" }, THINKING_LEVELS.map((level, at) =>
					h("button", { type: "button", key: level.id, className: at === index ? "on" : "", onClick: () => onChange(level.id) }, t(level.label)))));
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
			const plan = quota ? String(quota.planCode ?? "PLAN").toUpperCase() : "MiMo";
			return h("div", { className: wide ? "dsh-mimo-side is-wide" : "dsh-mimo-side is-rail" },
				wide
					? h("button", { ref: anchorRef, className: "dsh-mimo-side-btn", title: t("sidebarTitle"), "aria-expanded": pop ? "true" : "false", onClick: toggle, style: { flexWrap: "wrap" } },
						h("span", { className: "tier" }, plan),
						h("span", { className: "usage" }, quota ? "余 " + remainPct + "%" : "—"),
						h("span", { className: "line", style: { flex: "1 0 100%", margin: "2px 0 4px" } }, h("i", { style: { width: Math.max(2, usedPct ?? 0) + "%" } })))
					: h("button", { ref: anchorRef, className: "dsh-mimo-side-btn", title: t("sidebarTitle"), style: { justifyContent: "center", position: "relative", width: "auto" }, onClick: toggle },
						h("span", null, "🐋"),
						quota ? h("span", { className: "dsh-mimo-side-badge" }, String(Math.round(remainPct))) : null),
				pop ? renderPop(popRef, pop, t("sidebarTitle"), [
					h("div", { className: "title", key: "title" }, t("sidebarTitle")),
					h(QuotaPanel, {
						key: "quota",
						quota,
						quotaError: status?.quotaError ?? "",
						hasKey: status?.auth?.hasKey === true,
						busy: false,
						onRefresh: async () => { try { setStatus(await call("quota")); } catch { /* keep last */ } },
						t
					}),

				]) : null);
		}

		const MIMO_PROVIDER = "xiaomi-mimo";
		const EFFORT_ROW_LABELS = new Set(["推理等级", "Effort", "强度", "強度", "Reasoning", "Reasoning effort", "Esfuerzo"]);
		const MODEL_ROW_LABELS = new Set(["模型", "Model", "モデル", "modelo"]);
		const EMPTY_DIRECTORY = { current: null };

		/* 二级面板锚点：贴着原生行右侧弹出，越界翻到左边 */
		function submenuStyle(rect) {
			const width = 264;
			const gap = 8;
			let left = rect.right + gap;
			if (left + width > window.innerWidth - 8) left = Math.max(8, rect.left - width - gap);
			const top = Math.min(Math.max(8, rect.top - 8), Math.max(8, window.innerHeight - 160));
			return { left, top, width, zIndex: 1200 };
		}

		function EffortMenuControl({ directory, call, t, locked }) {
			const state = react.useSyncExternalStore(
				react.useCallback((fn) => directory?.store.subscribe(fn) ?? (() => {}), [directory]),
				() => directory?.store.getSnapshot() ?? EMPTY_DIRECTORY,
				() => directory?.store.getSnapshot() ?? EMPTY_DIRECTORY);
			const current = state?.current ?? null;
			const active = current?.provider === MIMO_PROVIDER;
			const effort = THINKING_LEVELS.some((level) => level.id === current?.reasoningEffort) ? current.reasoningEffort : "high";
			const popRef = react.useRef(null);
			const [sub, setSub] = react.useState(null);
			// 拦下原生「推理等级」行的激活，改开我们的拉条二级面板
			react.useEffect(() => {
				if (!active) { setSub(null); return undefined; }
				const findCell = (target) => {
					const cell = target instanceof Element ? target.closest("[role='menuitem']") : null;
					if (!cell) return null;
					const label = (cell.querySelector("span")?.textContent || "").trim();
					if (!EFFORT_ROW_LABELS.has(label)) return null;
					// 只认模型菜单的根面板：同级必须还有一行「模型」
					const sibling = [...(cell.parentElement?.querySelectorAll("[role='menuitem']") ?? [])]
						.some((el) => el !== cell && MODEL_ROW_LABELS.has((el.querySelector("span")?.textContent || "").trim()));
					return sibling ? cell : null;
				};
				const onDown = (event) => {
					if (!findCell(event.target)) return;
					event.preventDefault();
					event.stopPropagation();
				};
				const onClick = (event) => {
					const cell = findCell(event.target);
					if (!cell) return;
					event.preventDefault();
					event.stopPropagation();
					if (locked) return;
					setSub((prev) => (prev ? null : submenuStyle(cell.getBoundingClientRect())));
				};
				document.addEventListener("mousedown", onDown, true);
				document.addEventListener("click", onClick, true);
				return () => {
					document.removeEventListener("mousedown", onDown, true);
					document.removeEventListener("click", onClick, true);
				};
			}, [active, locked]);
			react.useEffect(() => {
				if (!sub) return undefined;
				const onDown = (event) => {
					if (popRef.current?.contains(event.target)) return;
					setSub(null);
				};
				const onResize = () => setSub(null);
				document.addEventListener("mousedown", onDown);
				window.addEventListener("resize", onResize);
				return () => {
					document.removeEventListener("mousedown", onDown);
					window.removeEventListener("resize", onResize);
				};
			}, [sub]);
			if (!active || !directory || !current) return null;
			const level = THINKING_LEVELS.find((item) => item.id === effort) ?? THINKING_LEVELS[THINKING_LEVELS.length - 1];
			const onChange = (id) => {
				if (locked || id === effort) return;
				void directory.select({ provider: current.provider, model: current.model, reasoningEffort: id }).catch(() => {});
				void call("save", { thinking: id }).catch(() => {});
			};
			if (!sub) return null;
			return renderPop(popRef, sub, t("menuEffort"), [
				h("div", {
					key: "effort",
					className: "dsh-mimo-effort-menu",
					onMouseDown: (event) => { event.preventDefault(); event.stopPropagation(); }
				},
					h("div", { className: "label" }, h("span", null, t("menuEffort")), h("b", null, t(level.label))),
					h(EffortSlider, { value: effort, onChange, t }))
			]);
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

			// 模型菜单里的推理滑条，只在选中本插件模型时出现
			try {
				ctx.slots.inject("conversation.input.model.options", () => ctx.slots.register(
					{
						name: "conversation.input.model.options",
						id: "mimo-effort",
						order: -10,
						locale: NS,
						inject: (sessionId) => {
							let directory = null;
							try { directory = ctx.modelDirectories.directoryFor(sessionId); } catch { directory = null; }
							return { directory, call, t };
						}
					},
					EffortMenuControl));
			} catch (error) { console.error("[dsh-mimo] effort menu:", error); }

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
