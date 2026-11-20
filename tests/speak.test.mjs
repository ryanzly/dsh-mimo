import test from "node:test";
import assert from "node:assert/strict";
import { MimoService } from "../lib/index.js";

function fakeSettings(overrides = {}) {
  const state = {
    apiKey: "sk-test-key",
    baseUrl: "https://api.xiaomimimo.com/v1",
    region: "cn",
    voice: {},
    ...overrides
  };
  return { secret: () => state.apiKey, get: (key) => state[key] ?? "" };
}

function stubFetch(seen) {
  return async (url, init) => {
    seen.push({ url: String(url), body: JSON.parse(init.body) });
    return { ok: true, json: async () => ({ model: "mimo-v2.5-tts", choices: [{ message: { audio: { data: "UklGRg==" } } }] }) };
  };
}

test("speak: ships playable wav no matter what format is asked for", async () => {
  const seen = [];
  const service = new MimoService({}, { settings: fakeSettings(), fetch: stubFetch(seen) });
  const result = await service.speak({ text: "你好", format: "mp3" });
  assert.equal(result.format, "wav");
  assert.equal(result.audioBase64, "UklGRg==");
  assert.equal(result.chars, 2);
  assert.equal(seen[0].body.audio.format, "wav");
  assert.equal(seen[0].body.messages.at(-1).role, "assistant");
  assert.equal(seen[0].body.messages.at(-1).content, "你好");
});

test("speak: saved voice settings fill model/voice/style", async () => {
  const seen = [];
  const service = new MimoService({}, {
    settings: fakeSettings({ voice: { model: "mimo-v2.5-tts-voicedesign", voice: "冰糖", style: "温柔" } }),
    fetch: stubFetch(seen)
  });
  await service.speak({ text: "测试" });
  assert.equal(seen[0].body.model, "mimo-v2.5-tts-voicedesign");
  assert.equal(seen[0].body.audio.voice, "冰糖");
  assert.deepEqual(seen[0].body.messages, [{ role: "user", content: "温柔" }, { role: "assistant", content: "测试" }]);
});

test("speak: explicit request voice wins over settings", async () => {
  const seen = [];
  const service = new MimoService({}, {
    settings: fakeSettings({ voice: { voice: "茉莉" } }),
    fetch: stubFetch(seen)
  });
  await service.speak({ text: "测试", voice: "苏打", model: "mimo-v2.5-tts" });
  assert.equal(seen[0].body.audio.voice, "苏打");
  assert.equal(seen[0].body.model, "mimo-v2.5-tts");
});

test("speak: refuses without credentials instead of calling out", async () => {
  const service = new MimoService({}, {
    settings: fakeSettings({ apiKey: "" }),
    fetch: async () => { throw new Error("must not fetch"); }
  });
  await assert.rejects(() => service.speak({ text: "hi" }), (error) => error.code === "mimo/no-credentials");
});
