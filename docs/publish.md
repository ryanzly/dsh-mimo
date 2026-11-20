# 发布手册（GitHub + 插件市场 + SkillHub）

## 0. 链路总览

DSH 没有官方插件商店；「发现」页只读**用户自己添加的索引源**。因此分发链路是：

```
GitHub 公开仓库（代码） + market/index.json（版本→commit 指针）
        │                        │
        │                        └─→ 插件 → 发现 → 添加索引源 → 安装
        └─→ 也可直接 pnpm add "git+https://github.com/<owner>/dsh-mimo.git#<commit>"
```

SkillHub（skill.xfyun.cn / skillhub.cn）与 1024store 等社区目录会收录带
`dsh-plugin` 话题的公开仓库，可另行提交。

## 1. 发版步骤（每版必做）

1. 改 `package.json` 的 `version`（SemVer 精确号）。
2. `npm run check`（测试 + manifest 一致性）。
3. `git add -A && git commit -m "vX.Y.Z" && git tag vX.Y.Z && git push && git push --tags`。
4. `node tools/make-index.mjs` —— 读取 HEAD 与 origin，重写 `market/index.json`。
5. `git add market/index.json && git commit -m "index: vX.Y.Z" && git push`。
6. `node tools/make-index.mjs --check` 自检（打印安装串，警告索引 commit 与 HEAD 不一致）。

> 索引与代码分开提交：索引里的 `commit` 必须指向**已存在**的代码 commit。

## 2. 用户安装

- **市场**：插件 → 发现（需启用 `dsh-experimental-plugin-market-bundle`）→ 添加索引源：
  `https://raw.githubusercontent.com/<owner>/dsh-mimo/main/market/index.json` → 搜索
  **MiMo Coding Plan** → 安装。
- **直装**：`dsh plugin --profile web add "git+https://github.com/<owner>/dsh-mimo.git#<commit>"`。
- **npm（可选）**：`npm publish` 后 `dsh plugin --profile web add dsh-mimo`。

## 3. SkillHub 插件市场 / 社区目录

- **SkillHub**（skillhub.cn / skill.xfyun.cn）：以公开仓库 + `dsh-plugin` 话题提交收录；
  按其目录的 PR / 提交流程操作，包信息用 `package.json` 的 name/description/keywords。
- **1024store**：对目录仓库开 PR 收录（同上，需仓库公开且带 `dsh-plugin` 话题）。
- 提交前自检：README（安装/配置/诚实说明）、LICENSE、`dsh.bundle` manifest、
  无秘密无会话日志、`npm pack --dry-run` 文件列表干净。

## 4. 发布前清单

- [ ] `npm run check` 全绿
- [ ] `version` 与 tag 一致
- [ ] README 的功能表与实际行为一致（尤其推理档位的诚实说明）
- [ ] `market/index.json` 的 commit 指向已推送的 commit
- [ ] 仓库含 `dsh-plugin` 话题，公开可见
