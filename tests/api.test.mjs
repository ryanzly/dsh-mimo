import test from "node:test";
import assert from "node:assert/strict";
import { KNOWN_MODELS, MimoClient, keyKind, modelKind, normalizeBase, resolveBaseUrl, wavSeconds } from "../lib/mimo-api.js";

test("api: modelKind separates chat models from voice models", () => {
  assert.equal(modelKind("mimo-v2.6-pro"), "llm");
  assert.equal(modelKind("mimo-v2.6-flash"), "llm");
  assert.equal(modelKind("mimo-v2.5-asr"), "asr");
  assert.equal(modelKind("mimo-v2.5-tts"), "tts");
  assert.equal(modelKind("mimo-v2.5-tts-voiceclone"), "tts");
  assert.equal(modelKind("mimo-v2.5-tts-voicedesign"), "tts");
});

test("api: base URL resolution follows the key shape", () => {
  assert.equal(resolveBaseUrl({ apiKey: "sk-abc" }), "https://api.xiaomimimo.com/v1");
  assert.equal(resolveBaseUrl({ apiKey: "tp-abc" }), "https://token-plan-cn.xiaomimimo.com/v1");
  assert.equal(resolveBaseUrl({ apiKey: "ttp-abc", region: "sgp" }), "https://token-plan-sgp.xiaomimimo.com/v1");
  assert.equal(resolveBaseUrl({ apiKey: "tp-abc", baseUrl: "https://token-plan-ams.xiaomimimo.com/v1/" }), "https://token-plan-ams.xiaomimimo.com/v1");
  assert.equal(normalizeBase("https://example.com"), "https://example.com/v1");
  assert.equal(normalizeBase("https://example.com/v1/"), "https://example.com/v1");
});

test("api: keyKind classifies schemes", () => {
  assert.equal(keyKind("tp-1"), "token-plan");
  assert.equal(keyKind("ttp-1"), "token-plan-team");
  assert.equal(keyKind("sk-1"), "pay-as-you-go");
  assert.equal(keyKind(""), "none");
});

function jsonResponse(payload, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload, text: async () => JSON.stringify(payload) };
}

test("api: listModels maps live discovery and caches", async () => {
  let calls = 0;
  const client = new MimoClient({
    apiKey: "tp-1",
    baseUrl: "https://token-plan-cn.xiaomimimo.com/v1",
    fetcher: async (url) => {
      calls += 1;
      assert.ok(String(url).endsWith("/models"));
      return jsonResponse({ object: "list", data: [{ id: "mimo-v2.6-pro" }, { id: "mimo-v2.6-flash" }, { id: "mimo-v2.5-asr" }, { id: "mimo-v2.5-tts" }] });
    }
  });
  const first = await client.listModels({ force: true, now: 1000 });
  assert.equal(first.source, "live");
  assert.deepEqual(first.models.map(m => m.id), ["mimo-v2.6-pro", "mimo-v2.6-flash", "mimo-v2.5-asr", "mimo-v2.5-tts"]);
  assert.deepEqual(first.models.map(m => m.kind), ["llm", "llm", "asr", "tts"]);
  const second = await client.listModels({ now: 2000 });
  assert.equal(calls, 1, "second read must hit the cache");
});

test("api: listModels falls back to the known catalog", async () => {
  const client = new MimoClient({
    apiKey: "tp-1",
    baseUrl: "https://token-plan-cn.xiaomimimo.com/v1",
    fetcher: async () => { throw new Error("network down"); }
  });
  const result = await client.listModels({ force: true, now: 0 });
  assert.equal(result.source, "fallback");
  assert.deepEqual(result.models.map(m => m.id), KNOWN_MODELS.map(m => m.id));
});

test("api: tokenPlan normalizes the credits payload", async () => {
  const client = new MimoClient({
    apiKey: "tp-1",
    baseUrl: "https://token-plan-cn.xiaomimimo.com/v1",
    fetcher: async () => jsonResponse({
      object: "token_plan",
      plan_code: "code-plan-7b",
      period: { start_at: "2026-11-01 00:00:00", end_at: "2026-12-01 00:00:00" },
      quota: { total_credits: 700, used_credits: 123, remaining_credits: 577 },
      auto_renew: true,
      claw_enabled: false
    })
  });
  const plan = await client.tokenPlan();
  assert.equal(plan.planCode, "code-plan-7b");
  assert.equal(plan.quota.remainingCredits, 577);
  assert.equal(plan.autoRenew, true);
});

test("api: wavSeconds reads the data chunk", () => {
  const bytes = new Uint8Array(64 + 32000); // header + 1 second at 16 kHz mono PCM16
  const view = new DataView(bytes.buffer);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, bytes.length - 8, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true);
  view.setUint32(28, 32000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, 32000, true);
  assert.equal(wavSeconds(bytes), 1);
});

function writeAscii(view, offset, text) {
  for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
}
