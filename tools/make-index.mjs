#!/usr/bin/env node
/**
 * Generate market/index.json (plugin market index, format 1) for dsh-mimo.
 *
 * Every release pins one version to one published git commit:
 *   1. bump package.json version, commit + tag, push;
 *   2. run `node tools/make-index.mjs` — it reads HEAD and origin;
 *   3. commit + push the regenerated market/index.json.
 *
 * Usage:
 *   node tools/make-index.mjs [--check] [--url https://github.com/OWNER/dsh-mimo]
 *   --check  validate the existing index against HEAD and print install spec
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const check = args.includes("--check");
const urlArg = args[args.indexOf("--url") + 1];

function git(...gitArgs) {
  return execFileSync("git", ["-C", root, ...gitArgs], { encoding: "utf-8" }).trim();
}

function normalizeRepoUrl(raw) {
  if (!raw) return "";
  let url = raw.trim();
  if (/^git@github\.com:/.test(url)) url = url.replace(/^git@github\.com:/, "https://github.com/");
  if (/^(ssh|git):\/\//.test(url)) url = url.replace(/^(ssh|git):\/\//, "https://");
  if (url.startsWith("git+https://")) url = url.slice(4);
  url = url.replace(/\.git$/, "").replace(/\/+$/, "");
  return url;
}

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
const commit = git("rev-parse", "HEAD");
const repoUrl = normalizeRepoUrl(urlArg && urlArg !== "--url" ? urlArg : git("config", "--get", "remote.origin.url") || "");
if (!check && (!repoUrl || !/^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(repoUrl))) {
  console.error("make-index: missing canonical https GitHub repo URL; pass --url https://github.com/OWNER/dsh-mimo");
  process.exit(2);
}

const indexPath = join(root, "market", "index.json");
const existing = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, "utf-8")) : null;
const previous = existing?.plugins?.[0]?.versions?.find(entry => entry.version === pkg.version);

const index = {
  format: 1,
  title: "dsh-mimo 插件市场索引",
  description: "Xiaomi MiMo Coding Plan / Token Plan for DeepSeek Harness：git 分发索引，每个版本固定到仓库的一个 commit。",
  metadata: {},
  plugins: [
    {
      name: pkg.name,
      title: "MiMo Coding Plan",
      description: pkg.description,
      repository: repoUrl || existing?.plugins?.[0]?.repository || "https://github.com/OWNER/dsh-mimo",
      homepage: pkg.homepage,
      metadata: { keywords: pkg.keywords ?? [] },
      versions: [
        {
          version: pkg.version,
          publishTimestamp: previous?.publishTimestamp ?? Math.floor(Date.now() / 1000),
          source: {
            type: "git",
            url: repoUrl || previous?.source?.url || "https://github.com/OWNER/dsh-mimo",
            commit
          }
        }
      ]
    }
  ]
};

if (check) {
  const head = git("rev-parse", "HEAD");
  const listed = existing?.plugins?.[0]?.versions ?? [];
  console.log("check: index versions:", listed.map(entry => `${entry.version} @ ${entry.source.commit.slice(0, 12)}`).join(", "));
  const current = listed.find(entry => entry.version === pkg.version);
  if (!current) {
    console.error("check: current package version missing from index — run node tools/make-index.mjs");
    process.exit(1);
  }
  if (current.source.commit !== head) console.warn(`warn: index commit ${current.source.commit} != HEAD ${head}`);
  console.log("install spec:", `git+${current.source.url}.git#${current.source.commit}`);
  console.log("index URL   :", `https://raw.githubusercontent.com/<owner>/<repo>/main/market/index.json`);
  process.exit(0);
}

mkdirSync(dirname(indexPath), { recursive: true });
writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n");
console.log(`wrote market/index.json — ${pkg.name}@${pkg.version} -> ${repoUrl} @ ${commit}`);
console.log("install spec:", `git+${index.plugins[0].versions[0].source.url}.git#${commit}`);
