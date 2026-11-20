import test from "node:test";
import assert from "node:assert/strict";
import { MimoSettings, defaultSettings, maskKey } from "../lib/settings.js";

function memoryIo() {
  const files = new Map();
  return {
    files,
    readFileSync(path) { if (!files.has(path)) throw new Error("ENOENT"); return files.get(path); },
    writeFileSync(path, data) { files.set(path, String(data)); },
    renameSync(from, to) { files.set(to, files.get(from)); files.delete(from); },
    mkdirSync() {},
    chmodSync() {}
  };
}

test("settings: key is encrypted at rest and round-trips", () => {
  const io = memoryIo();
  const settings = new MimoSettings({ io, configPath: "/x/dsh-mimo.json", secretKeyPath: "/x/dsh-mimo.json.key" });
  settings.save({ apiKey: "tp-secret-123456", region: "sgp" });
  const raw = io.files.get("/x/dsh-mimo.json");
  assert.ok(!raw.includes("tp-secret-123456"), "plaintext key must not be persisted");
  assert.equal(settings.secret(), "tp-secret-123456");

  const reloaded = new MimoSettings({ io, configPath: "/x/dsh-mimo.json", secretKeyPath: "/x/dsh-mimo.json.key" });
  assert.equal(reloaded.secret(), "tp-secret-123456");
  assert.equal(reloaded.get("region"), "sgp");
});

test("settings: publicState masks the key", () => {
  const io = memoryIo();
  const settings = new MimoSettings({ io, configPath: "/x/c.json", secretKeyPath: "/x/c.json.key" });
  settings.save({ apiKey: "tp-abcdefghijklmnop" });
  const pub = settings.publicState();
  assert.equal(pub.hasKey, true);
  assert.ok(!pub.keyPreview.includes("abcdefgh"));
  assert.ok(pub.keyPreview.endsWith("mnop"));
});

test("settings: voice/asr patches merge", () => {
  const io = memoryIo();
  const settings = new MimoSettings({ io, configPath: "/x/c.json", secretKeyPath: "/x/c.json.key" });
  settings.save({ voice: { model: "mimo-v2.5-tts", autoRead: true }, asr: { language: "zh" } });
  settings.save({ voice: { style: "温柔" } });
  assert.equal(settings.get("voice").autoRead, true);
  assert.equal(settings.get("voice").style, "温柔");
  assert.equal(settings.get("asr").language, "zh");
});

test("maskKey keeps only scheme and tail", () => {
  assert.equal(maskKey(""), "");
  assert.equal(maskKey("tp-1234567890"), "tp-***7890");
  assert.deepEqual(defaultSettings().voice.autoRead, false);
});
