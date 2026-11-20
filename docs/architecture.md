# 架构说明

单包组合包（bundle）：npm 包 `dsh-mimo` 通过 `dsh.bundle` 声明贡献一层
`cordis.patch.yml`，其中一行插件把 Host 面全部装配好；浏览器面由 `dsh.client`
声明自动装载（`exports["./client"]`）。

```
┌─────────────────────────── Host（lib/index.js） ───────────────────────────┐
│ MimoService (TypertRemoteService, namespace "mimo")                        │
│   ├─ settings.js   ~/.dsh/dsh-mimo.json + AES-256-GCM 密钥文件（0600）      │
│   ├─ mimo-auth.js  OAuth：X25519 密钥对 → /authorize → 回环 HTTP 收加密回调 │
│   ├─ mimo-api.js   Base URL 解析 / models / token_plan / ASR / TTS         │
│   ├─ mimo-adapter.js  LlmAdapter：Chat Completions SSE → StreamChunk       │
│   └─ mimo-stt.js   SpeechProvider → ctx.speechToText.register              │
│ mimo_quota 工具（ctx.tools）                                               │
└────────────────────────────────────────────────────────────────────────────┘
          ▲ typert Remote（dsh-mimo#mimo/*，9 个 direct invocation）
┌─────────────────────────── Client（lib/client.js） ────────────────────────┐
│ settings.section            登录 / 密钥 / 余量（登录后）/ 模型 / 语音      │
│ sidebar.footer.action       侧栏快捷余量（登录后才展示，点击展开详情）      │
│ conversation.input.model.options  推理滑条（仅选中 MiMo 模型时）           │
│ conversation.chat.text-interaction  选中文字「引用 + 朗读」悬浮胶囊        │
│ conversation.chat.assistant-actions 每条回复动作行 🔊 朗读整条             │
└────────────────────────────────────────────────────────────────────────────┘
```

## Remote 契约（`dsh-mimo#mimo/*`）

| 方法 | 参数 | 结果 |
| --- | --- | --- |
| `status` | — | 认证态（掩码预览）、端点、余量、模型目录、公开设置 |
| `save` | `patch`（apiKey/baseUrl/region/thinking/voice/asr） | 新的 status |
| `models` | — | 实时/回退模型列表（含 source） |
| `quota` | — | 强制刷新后的 status |
| `login` / `loginStatus` / `loginSubmit` / `cancelLogin` | `code`（手动授权码） | 登录态（含手动链接） |
| `speak` | `{ text, voice?, style?, model? }`（`format` 忽略，一律 wav） | base64 wav 音频 + 格式 |

两端的 descriptor 表逐字对齐（`lib/index.js` 的 `mimoRemote` 与 `lib/client.js`
内的同名对象）；codec 是形状校验器（`{ mode:"strict", typeSymbol, schema:{parse}, create }`）。

## 关键设计决定

1. **一行插件**：Host 面全部走 `apply(ctx)`，注册均为 `ctx.effect` 可逆效果，卸载干净。
2. **凭据不进配置**：密钥写入 `~/.dsh/dsh-mimo.json`（加密），`cordis.yml` 不含秘密；
   也兼容环境变量 `MIMO_TOKEN_PLAN_API_KEY` / `MIMO_API_KEY`。
3. **模型发现诚实**：`/v1/models` 5 分钟缓存；失败回退内置目录并在 UI 标注 `source: fallback`。
4. **推理档位自适应**：`resolveModel()` 按模型能力返回权威档位表（思考模型
   off/low/medium/high，ASR/TTS 无档位）；档位映射到 `thinking.type` 开关，
   reasoning_content 在多轮工具调用历史中回传（平台硬性要求）。
5. **语音**：ASR 是 `ctx.speechToText` 的云端 provider（弱依赖，语音输入插件未装则不注册）；
   TTS 走 Remote 由浏览器 `Audio` 播放（Host 无音频输出能力，不假装播放）。
   一律以 wav 出货：平台的 `mp3` 实际是 ADTS/AAC 裸流、`pcm*` 是无头 PCM16，
   浏览器播不了；朗读按句分段、边播边合成下一段，失败直接显示在按钮上。
6. **选中文字胶囊与官方「引用」共存**：DSH 的文本交互面每次手势只渲染
   胜出者的 keyed 条目，而官方 message-quotes 先注册、稳赢 selection 手势。
   因此本插件用 DSH 的影子机制（同 key 不同 priority，最低者渲染）在
   `quote` 单元格合并出「引用 + 朗读」胶囊；官方插件缺席时退回自己的
   `mimo-speak` 单元格（含右键手势兜底），两套场景都有完整功能。

## 测试

`tests/run-all.mjs` 为 DSH peer 包生成最小 stub（dsh-llm / dsh-tools /
dsh-typert-protocol），覆盖：密钥加密与掩码、OAuth 加密回调往返（按平台格式仿真）、
Base URL 解析、模型目录缓存与回退、余量归一化、WAV 时长、历史投影
（reasoning_content / 工具调用）、SSE → StreamChunk 全链路。
