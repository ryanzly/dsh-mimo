# MiMo API 事实核对（2026-11-20）

来源：mimo.mi.com 官方文档（静态 Markdown 可直接抓取）、XiaomiMiMo/MiMo-Code 源码、
多份第三方接入笔记交叉核对。**以官方在线文档为准**，本表仅供实现时对照。

## 端点与密钥

| 用途 | 端点 | 密钥 |
| --- | --- | --- |
| 按量 API | `https://api.xiaomimimo.com/v1` | `sk-` |
| Token Plan | `https://token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`（以控制台为准） | `tp-`（个人）/ `ttp-`（团队） |
| Anthropic 兼容 | 各集群 `/anthropic` | 同上 |

- 鉴权头：`api-key: <key>` 或 `Authorization: Bearer <key>`（两者皆可）。
- 两种密钥**不可混用**。

## 接口

| 接口 | 说明 |
| --- | --- |
| `GET /v1/models` | 模型发现（OpenAI 形状 `{data:[{id,...}]}`） |
| `GET /v1/platform/token_plan` | 套餐余量：`plan_code`、`period.{start_at,end_at}`（UTC）、`quota.{total_credits,used_credits,remaining_credits}`、`auto_renew`、`claw_enabled` |
| `POST /v1/chat/completions` | 文本生成 / ASR / TTS 共用 |

## 模型（V2.6 系列）

- `mimo-v2.6-pro` / `mimo-v2.6-flash`：1M 上下文、最大输出 128K（131072）、
  全模态输入（文/图/音/视频）、深度思考、流式、函数调用、结构化输出、联网搜索。
- `mimo-v2.6-pro-ultraspeed`：定制服务。
- V2.5 文本模型已于 2026-10-21 下线；ASR/TTS 仍是 `mimo-v2.5-*`。

## 深度思考

- Chat 协议：`thinking: {type: "enabled"|"disabled"}`（默认 enabled）；**仅开/关**，
  不支持档位（`reasoning_effort` 非法值会被 400 拒绝）。
- Responses 协议：`reasoning.effort`：`none`（关闭）/ `minimal|low|medium|high|xhigh|max|ultra`，
  官方注明「除 none 外行为一致」，minimal→low、xhigh/max/ultra→high。
- 思考开启时不能自定义 `temperature`/`top_p`（固定 1.0/0.95）。
- **多轮工具调用必须回传 `reasoning_content`**，否则 400。
- `max_completion_tokens` 同时限制思考与正文。

## ASR（`mimo-v2.5-asr`）

`POST /v1/chat/completions`，`messages[0].content = [{type:"input_audio", input_audio:{data:"data:audio/wav;base64,..."}}]`，
`asr_options.language: auto|zh|en`；支持 wav/mp3，base64 ≤ 10MB；返回常规 chat 文本。

## TTS（`mimo-v2.5-tts` / `-voicedesign` / `-voiceclone`）

`POST /v1/chat/completions`：
- `messages`：`user`（可选，自然语言风格指令；voicedesign 必填）+ `assistant`（**要朗读的文本**）。
- `audio`：`{ format: wav|mp3|pcm|pcm16, voice?: ... }`。
- 返回 `choices[0].message.audio.data`（base64）；流式需 pcm16 拼接。
- **格式实测（2026-11）**：只有 `wav` 是带 RIFF 头的成品（24 kHz 单声道 PCM16），浏览器 `<audio>` 可直接播；`mp3` 实际返回 ADTS/AAC 裸流（0xFF 0xFx 帧头）、`pcm`/`pcm16` 返回无头小端 PCM16，都播不了。插件的 speak 一律按 `wav` 出货。

## OAuth（浏览器授权，同 MiMo Code）

1. 本地生成 X25519 密钥对，`pk` = base64url(SPKI DER)。
2. 打开 `https://platform.xiaomimimo.com/authorize?pk=...&redirect_uri=http://127.0.0.1:<port>/&kn=mimocode&key_name=<名字>`。
3. 回调 `GET /?u=<blob>`：blob = `ephemeralPub(32) || nonce(12) || AES-256-GCM(ciphertext||tag16)`，
   密钥 = SHA-256(ECDH(x25519))；解出 `{ sk, uid, url }`（自动创建的 API Key、账号 uid、
   建议 Base URL——有订阅时是 Token Plan 集群）。
4. 手动通道：`redirect_uri` 换成 `${PLATFORM_URL}/authorize/code/callback`，用户粘贴同一 blob。
