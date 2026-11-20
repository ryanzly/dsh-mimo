/**
 * Test runner: materialize minimal stubs for the DSH peer packages (they are
 * supplied by the running Host, not installed here), then run node:test on the
 * explicit test file list.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const stubs = {
  "@deepseek-ai/dsh-llm": `export function attributionHeaders() { return { "user-agent": "dsh-mimo-tests" }; }
export class LlmAdapter {}
export class LlmError extends Error {
  constructor(message, code, options = {}) {
    super(message);
    this.name = "LlmError";
    this.code = code;
    this.failure = { message, code, ...options };
  }
  static fromFailure(failure) { return new LlmError(failure.message, failure.code, failure); }
}
export default { attributionHeaders, LlmAdapter, LlmError };
`,
  "@deepseek-ai/dsh-tools": `export function defineTool(definition) { return definition; }
export default { defineTool };
`,
  "@deepseek-ai/dsh-typert-protocol": `export class TypertRemoteService {
  constructor(ctx, serviceKey) { this.ctx = ctx; this.name = serviceKey; }
}
export class RemoteError extends Error {
  constructor(code, message, details = {}) { super(message); this.code = code; this.details = details; }
}
export default { TypertRemoteService, RemoteError };
`
};

for (const [packageName, source] of Object.entries(stubs)) {
  const dir = join(root, "node_modules", ...packageName.split("/"));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: packageName, version: "0.0.0-test", type: "module", main: "index.js", exports: { ".": "./index.js", "./attribution": "./index.js" } }, null, 2));
  writeFileSync(join(dir, "index.js"), source);
}

const testFiles = ["settings.test.mjs", "auth.test.mjs", "api.test.mjs", "adapter.test.mjs", "format.test.mjs", "think-split.test.mjs", "speak.test.mjs"].map(file => join(root, "tests", file));
const result = spawnSync(process.execPath, ["--test", "--test-force-exit", ...testFiles], { stdio: "inherit" });
process.exit(result.status ?? 1);
