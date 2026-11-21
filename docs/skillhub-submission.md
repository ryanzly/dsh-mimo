# SkillHub / 社区目录收录材料

仓库公开并带上 `dsh-plugin` 话题后，按下列材料向 SkillHub（skillhub.cn / skill.xfyun.cn）、
1024store 及社区索引提交收录。全部信息与 `package.json` / `README.md` 一致。

## 仓库事实

| 项 | 值 |
| --- | --- |
| 仓库 | https://github.com/ryanzly/dsh-mimo |
| 包名 | `dsh-mimo` |
| 标题 | MiMo Coding Plan |
| 一句话 | Xiaomi MiMo Coding Plan / Token Plan provider for DeepSeek Harness: OAuth or API-key sign-in, live model discovery, adaptive reasoning levels, plan-quota pill, MiMo ASR voice input and MiMo TTS voice output. |
| 话题 | `dsh-plugin` `dsh-client-plugin` `mimo` `xiaomi` `token-plan` `coding-plan` `llm-provider` `asr` `tts` |
| License | MIT |
| 兼容 | DSH Core 0.2.x，Web + Desktop |
| 安装 | 市场索引安装或 `dsh plugin --profile web add "git+https://github.com/ryanzly/dsh-mimo.git#<commit>"` |
| 市场索引 | `https://raw.githubusercontent.com/ryanzly/dsh-mimo/main/market/index.json` |

## 收录说明（PR / 表单正文可直接粘贴）

**名称**：MiMo Coding Plan（dsh-mimo）

**类别**：模型接入 / 语音 / 开发工具（LLM provider + ASR/TTS）

**简介**：
把 Xiaomi MiMo Coding Plan / Token Plan 接入 DeepSeek Harness：
浏览器 OAuth 授权登录（与 MiMo Code 同协议，自动创建 API Key）或快捷粘贴 tp-/ttp-/sk- 密钥；
模型列表自动发现、按模型能力自适应推理档位；套餐余量药丸与 `mimo_quota` 工具；
MiMo ASR 语音输入（云端识别源）与 MiMo TTS 语音输出（试听 / 朗读选中文字）；
凭据 AES-256-GCM 加密存 Host，Web 与 Desktop 双端可用。

**亮点**：
- 登录即用：OAuth 加密回调（X25519 + AES-256-GCM），无需手动搬运密钥
- 余量透明：周期积分总额/已用/剩余、有效期与自动续费，一目了然
- 诚实标注：模型目录实时获取失败时明确显示"默认列表"，推理档位如实说明 MiMo 思考为开/关语义

**安全**：密钥仅存 Host 并加密落盘；语音音频一次性传输，不写会话日志；MIT 许可。

## 提交渠道

| 渠道 | 方式 | 状态 |
| --- | --- | --- |
| GitHub 仓库 | 公开 + `dsh-plugin` 话题 + tag/Release v0.1.1（tgz 附件可在网页补） | ✅ 已完成 |
| dshfind 等自动目录 | 打 `dsh-plugin` 话题后自动扫描 | ⏳ 等待同步 |
| DSH「发现」页 | 添加索引源 `https://raw.githubusercontent.com/ryanzly/dsh-mimo/main/market/index.json` | ✅ 索引已上线 |
| 1024Store（deepseek1024.com） | 对 `imsai-sh/awesome-deepseek-harness-plugins` 开 PR：复制 [listing/1024store-catalog.json](listing/1024store-catalog.json) 为 `catalog/plugins/ryanzly--dsh-mimo.json` | 📄 材料就绪 |
| awesome-dsh-plugin（awesome-dsh-plugin.com） | 对 `awesome-dsh-plugin/awesome-dsh-plugin` 开 PR：复制 [listing/awesome-dsh-plugin-entry.yml](listing/awesome-dsh-plugin-entry.yml) 为 `data/plugins/ryanzly__dsh-mimo.yml` 并按其脚本重新生成 README（注意：该目录要求仓库 ≥1 天且 ≥10 提交，可稍后再提） | 📄 材料就绪 |
| SkillHub（skillhub.cn / skill.xfyun.cn） | 公开仓库 + 话题 + npm 包会被目录收录；npm 已发布（`npm publish` 0.1.1，包内 `files` 已限定） | ✅ 已发布，等目录收录 |

PR 正文可直接使用上方「收录说明」。
