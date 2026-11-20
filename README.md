# dsh-mimo — MiMo Coding Plan for DeepSeek Harness

[English](#english) | 中文

把 **Xiaomi MiMo Coding Plan / Token Plan** 接进 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)：像第一方模型一样选模型、看套餐余量、用语音输入输出。

**功能一览**

| 能力 | 说明 |
| --- | --- |
| 模型路由 `xiaomi-mimo` | OpenAI 兼容 Chat Completions 流式协议；tp-/ttp- 密钥自动路由到 Token Plan 集群（cn/sgp/ams），sk- 密钥走按量 API |
| 快捷登录 | **OAuth 一键授权**（与 MiMo Code 同协议，X25519 加密回调，自动创建 API Key）；手动粘贴 `tp-` / `ttp-` 密钥折叠为高级项 |
| 套餐余量 | `GET /v1/platform/token_plan`：剩余积分（亿/万单位 + 百分比）、本周期用量、到期时间（平台原值，带倒计时）；**侧栏底部快捷余量**（宽栏百分比 / 窄栏角标）+ 设置页 + `mimo_quota` 工具；**套餐相关入口登录后才展示** |
| 模型自动更新 | `GET /v1/models` 实时发现（5 分钟缓存），失败时回退到内置目录并在界面标注来源，不冒充实时 |
| 自适应推理等级 | 按模型能力暴露思考档位：`off / low / medium / high`，映射到 MiMo `thinking` 开关（见下方诚实说明） |
| 语音输入 | MiMo ASR（`mimo-v2.5-asr`）注册到 DSH 官方「语音输入」插件的识别来源列表，云端转写 |
| 语音输出 | MiMo TTS（`mimo-v2.5-tts` 系列）：设置页试听、选中文字「朗读」胶囊、每条回复动作行 🔊 朗读整条；支持音色与自然语言风格指令，按句分段、边播边合成 |
| 凭据安全 | 密钥 AES-256-GCM 加密落盘（`~/.dsh/dsh-mimo.json`，0600），Remote 只暴露掩码预览 |

## 安装

```sh
# 独立 CLI 管理的 profile（Desktop 请使用桌面壳自带的 DSH Desktop CLI）
dsh plugin --profile web add dsh-mimo
# 或本地 checkout
dsh plugin --profile web add ./dsh-mimo-plugin
```

重启（或刷新）DSH 后，在 **设置 → MiMo Coding Plan** 完成登录即可；模型选择器里会出现 **Xiaomi MiMo**。

## 快速配置

1. **OAuth（推荐）**：点「浏览器授权登录」→ 在 Xiaomi MiMo 开放平台确认 → 自动创建 `dsh-mimo-key-*` 密钥并写入。浏览器打不开时可复制手动链接，或把平台返回的授权码粘贴回来。
2. **粘贴密钥**：把 Token Plan 页面的 `tp-`（个人）/ `ttp-`（团队）或 API Keys 页面的 `sk-` 密钥粘进设置页，选择集群（cn/sgp/ams），保存。也可以用环境变量 `MIMO_TOKEN_PLAN_API_KEY` / `MIMO_API_KEY`。

> Token Plan 密钥与按量密钥**不能混用**：`tp-`/`ttp-` 只能打 Token Plan 集群，`sk-` 只能打 `api.xiaomimimo.com`。本插件按密钥前缀自动选择 Base URL，也可手动覆盖。

## 语音

- **输入**：安装 DSH 官方「语音输入」插件后，在识别来源里选 **MiMo 语音识别（云端）**；识别语言可在本插件设置页选 auto/zh/en。
- **输出**：全部走 DSH 原生插槽——选中文字后的悬浮胶囊是 **「引用 + 朗读」**（用 DSH 影子机制在 quote 单元格合并官方 message-quotes 胶囊；官方插件缺席时退回本插件自己的胶囊，右键选中文字也可唤起）；每条回复的原生动作行（与反馈按钮同规格图标按钮）有 🔊 朗读整条回复。设置页可选 TTS 模型、**内置音色下拉**（冰糖/茉莉/苏打/白桦/Mia/Chloe/Milo/Dean）与风格指令，并可试听。合成音频一律以 wav 出货（平台的 mp3/pcm 裸流浏览器播不了），朗读失败会在按钮上直接报错，不再静默。

## 关于推理档位的诚实说明

MiMo V2.6 的深度思考目前是**开/关**语义（`thinking.type: enabled|disabled`），官方 Responses API 也注明「除 none 外所有档位行为一致」。本插件按模型能力自适应地暴露 `off / low / medium / high` 档位：**`off` 关闭思考，其余档位均开启深度思考**，与平台自身语义一致；界面文案与文档都会明示这一点，不会假装低档位真的更省思考。历史消息中的 `reasoning_content` 会在多轮工具调用时原样回传（平台要求，否则 400）。

## 兼容性

- DSH Core 0.2.x（`engines.dsh` 语义见 `package.json` 的 peerDependencies 范围）。
- Web 与 Desktop 共用同一 Host 侧实现；Web 的设置页/药丸/朗读按钮由 `dsh.client` 声明自动装载。
- 语音输入依赖官方实验插件 `dsh-experimental-voice-input-bundle`；未安装时本插件的 ASR 来源不会出现，其余功能不受影响。

## 开发

纯 ESM JavaScript，无构建步骤；`lib/index.js` 是 Host 面，`lib/client.js` 是浏览器面（`window.__ModuleLoader__` 包裹）。

```sh
npm test          # node:test + DSH peer 包 stub
npm run check     # 测试 + manifest 一致性检查
```

架构与远端契约见 [docs/architecture.md](docs/architecture.md)；MiMo API 事实核对记录见 [docs/mimo-api.md](docs/mimo-api.md)。

## 安全与隐私

- 密钥仅存 Host，加密落盘；所有 Remote 载荷只含 `keyPreview`（前缀 + 后四位）。
- 语音音频为一次性传输：识别/合成不写会话日志。
- OAuth 使用回环地址（`127.0.0.1`）接收加密回调，5 分钟未完成自动关闭；随时可取消。

## License

MIT

---

<a id="english"></a>

## English summary

`dsh-mimo` plugs the **Xiaomi MiMo Coding Plan / Token Plan** into DeepSeek Harness as a first-party-feeling model route:

- **Sign-in**: browser OAuth (same encrypted-callback protocol as MiMo Code) or quick paste of `tp-` / `ttp-` / `sk-` keys; credentials encrypted at rest on the Host.
- **Plan credits**: live `/v1/platform/token_plan` quota in a pill next to the model selector, a settings page, and the `mimo_quota` agent tool.
- **Models**: auto-discovered via `GET /v1/models` with an honest cached fallback; reasoning levels adapt per model (MiMo deep thinking is an on/off switch today — `off` disables it, `low/medium/high` all enable it; the UI says so).
- **Voice**: MiMo ASR (`mimo-v2.5-asr`) appears as a cloud recognizer in the official Voice input plugin; MiMo TTS (`mimo-v2.5-tts` family) powers a settings preview, a combined Quote + Read-aloud selection capsule, and a per-message read-aloud button. Audio ships as playable WAV.

`npm test` runs the suite against stubbed DSH peer packages. MIT licensed.
