/**
 * dsh-mimo settings store.
 *
 * Secrets never leave the Host: the API key is encrypted at rest with a
 * per-installation AES-256-GCM key kept beside the config file (0600), and
 * Remote payloads only ever carry masked previews. Everything is injectable
 * for isolated tests.
 */
import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export const DEFAULT_CONFIG_PATH = join(homedir(), ".dsh", "dsh-mimo.json");
const ENC_PREFIX = "enc:v1:";

/** Full persisted state. Only this module touches the file. */
export function defaultSettings() {
  return {
    apiKey: "",
    baseUrl: "",
    region: "cn",
    keyName: "",
    uid: "",
    loginAt: 0,
    loginMethod: "",
    thinking: "high",
    voice: { model: "mimo-v2.5-tts", voice: "", style: "", autoRead: false },
    asr: { language: "auto" },
    updatedAt: ""
  };
}

/** Envelope of the encryption key: 32 random bytes, base64, file mode 0600. */
function loadSecretKey(io, keyPath) {
  try {
    const raw = io.readFileSync(keyPath, "utf-8").trim();
    const key = Buffer.from(raw, "base64");
    if (key.length === 32) return key;
  } catch { /* first run */ }
  const key = randomBytes(32);
  io.mkdirSync(dirname(keyPath), { recursive: true });
  io.writeFileSync(keyPath, key.toString("base64"), { mode: 0o600 });
  try { io.chmodSync(keyPath, 0o600); } catch { /* best effort */ }
  return key;
}

export class MimoSettings {
  /**
   * @param {{ configPath?: string, secretKeyPath?: string, secretKey?: Buffer,
   *           io?: object, now?: () => number }} [options]
   */
  constructor(options = {}) {
    this.io = options.io ?? { readFileSync, mkdirSync, writeFileSync, renameSync, chmodSync };
    this.path = options.configPath ?? DEFAULT_CONFIG_PATH;
    this.secretKeyPath = options.secretKeyPath ?? `${this.path}.key`;
    this.secretKey = options.secretKey;
    this.now = options.now ?? Date.now;
    this.state = this.read();
  }

  read() {
    try {
      const raw = this.io.readFileSync(this.path, "utf-8");
      const parsed = JSON.parse(raw);
      return { ...defaultSettings(), ...parsed, voice: { ...defaultSettings().voice, ...(parsed.voice ?? {}) }, asr: { ...defaultSettings().asr, ...(parsed.asr ?? {}) } };
    } catch {
      return defaultSettings();
    }
  }

  get(key) { return this.state[key]; }

  /** Merge a validated patch, encrypt the key when present, and persist atomically. */
  save(patch) {
    const next = { ...this.state, ...patch };
    if (patch.voice) next.voice = { ...this.state.voice, ...patch.voice };
    if (patch.asr) next.asr = { ...this.state.asr, ...patch.asr };
    if (typeof patch.apiKey === "string" && patch.apiKey !== "") next.apiKey = this.encryptSecret(patch.apiKey);
    next.updatedAt = new Date(this.now()).toISOString();
    this.state = next;
    this.flush();
    return this.publicState();
  }

  flush() {
    this.io.mkdirSync(dirname(this.path), { recursive: true });
    const tmp = `${this.path}.tmp`;
    this.io.writeFileSync(tmp, JSON.stringify(this.state, null, 2), { mode: 0o600 });
    this.io.renameSync(tmp, this.path);
    try { this.io.chmodSync(this.path, 0o600); } catch { /* best effort */ }
  }

  secret() {
    const value = this.state.apiKey;
    if (typeof value !== "string" || value === "") return "";
    return value.startsWith(ENC_PREFIX) ? this.decryptSecret(value) : value;
  }

  encryptSecret(plain) {
    if (!this.secretKey) this.secretKey = loadSecretKey(this.io, this.secretKeyPath);
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.secretKey, iv);
    const ct = Buffer.concat([cipher.update(plain, "utf-8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return ENC_PREFIX + Buffer.concat([iv, tag, ct]).toString("base64");
  }

  decryptSecret(value) {
    try {
      if (!this.secretKey) this.secretKey = loadSecretKey(this.io, this.secretKeyPath);
      const payload = Buffer.from(value.slice(ENC_PREFIX.length), "base64");
      const [iv, tag, ct] = [payload.subarray(0, 12), payload.subarray(12, 28), payload.subarray(28)];
      const decipher = createDecipheriv("aes-256-gcm", this.secretKey, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf-8");
    } catch {
      return "";
    }
  }

  /** Client-safe projection: the secret appears only as a masked preview. */
  publicState() {
    const key = this.secret();
    return {
      baseUrl: this.state.baseUrl ?? "",
      region: this.state.region ?? "cn",
      keyName: this.state.keyName ?? "",
      uid: this.state.uid ?? "",
      loginAt: this.state.loginAt ?? 0,
      loginMethod: this.state.loginMethod ?? "",
      thinking: this.state.thinking ?? "high",
      voice: { ...this.state.voice },
      asr: { ...this.state.asr },
      updatedAt: this.state.updatedAt ?? "",
      hasKey: key !== "",
      keyPreview: maskKey(key)
    };
  }
}

/** Show only the scheme and the last four characters of any key. */
export function maskKey(key) {
  if (typeof key !== "string" || key.length === 0) return "";
  if (key.length <= 8) return key[0] + "***";
  return `${key.slice(0, 3)}***${key.slice(-4)}`;
}
