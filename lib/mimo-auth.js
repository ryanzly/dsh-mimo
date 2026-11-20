/**
 * MiMo open-platform browser authorization.
 *
 * Protocol-compatible with MiMo Code's login: the plugin generates an X25519
 * key pair, opens https://platform.xiaomimimo.com/authorize with the public
 * key, and the platform redirects back to a loopback server with one `u`
 * parameter. That blob is ephemeralPublicKey(32) || nonce(12) || AES-256-GCM
 * ciphertext || tag(16); after ECDH + SHA-256 key derivation it decrypts to
 * { sk, uid, url } — the freshly issued API key (mimo-*-key-*), the account
 * uid and the account's recommended base URL (Token Plan cluster when the
 * account has a subscription). A manual paste path accepts the same blob.
 */
import { createServer } from "node:http";
import { exec } from "node:child_process";
import { createDecipheriv, createHash, createPrivateKey, createPublicKey, diffieHellman, generateKeyPairSync, randomBytes } from "node:crypto";

export const PLATFORM_URL = process.env.MIMO_PLATFORM_URL || "https://platform.xiaomimimo.com";
const TIMEOUT_MS = 5 * 60 * 1000;

export function generateKeyPair() {
  const keyPair = generateKeyPairSync("x25519", {
    publicKeyEncoding: { type: "spki", format: "der" },
    privateKeyEncoding: { type: "pkcs8", format: "der" }
  });
  return { publicKey: Buffer.from(keyPair.publicKey).toString("base64url"), privateKeyDer: keyPair.privateKey };
}

/**
 * Decrypt one platform callback blob with the paired private key.
 * @returns {{ sk?: string, uid: string, url?: string }}
 */
export function decryptCallback(privateKeyDer, encryptedBase64) {
  const encrypted = Buffer.from(encryptedBase64, "base64url");
  const ephemeralPub = encrypted.subarray(0, 32);
  const nonce = encrypted.subarray(32, 44);
  const ciphertextAndTag = encrypted.subarray(44);
  const tag = ciphertextAndTag.subarray(ciphertextAndTag.length - 16);
  const ciphertext = ciphertextAndTag.subarray(0, ciphertextAndTag.length - 16);

  const privateKey = createPrivateKey({ key: privateKeyDer, format: "der", type: "pkcs8" });
  const ephemeralPublicKey = createPublicKey({
    key: Buffer.concat([Buffer.from("302a300506032b656e032100", "hex"), ephemeralPub]),
    format: "der",
    type: "spki"
  });
  const sharedSecret = diffieHellman({ privateKey, publicKey: ephemeralPublicKey });
  const derivedKey = createHash("sha256").update(sharedSecret).digest();
  const decipher = createDecipheriv("aes-256-gcm", derivedKey, nonce);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(decrypted.toString("utf-8"));
}

export function buildAuthorizeUrl(publicKey, redirectUri, keyName, kn = "mimocode") {
  const params = new URLSearchParams({ pk: publicKey, redirect_uri: redirectUri, kn, key_name: keyName });
  return `${PLATFORM_URL}/authorize?${params.toString()}`;
}

export function openBrowser(url) {
  if (process.env.CI || process.env.NODE_ENV === "test") return;
  const command = process.platform === "darwin" ? `open "${url}"` : process.platform === "win32" ? `start "" "${url}"` : `xdg-open "${url}"`;
  exec(command, () => {});
}

/**
 * One in-flight authorization: loopback server + decryptable result.
 * Created fresh per attempt; `cancel()` makes every waiter reject.
 */
export class MimoLoginSession {
  constructor({ keyName, kn = "mimocode", open = openBrowser } = {}) {
    this.keyName = keyName || `dsh-mimo-key-${randomBytes(4).toString("hex")}`;
    this.kn = kn;
    this.open = open;
    this.state = "pending";
    this.result = null;
    this.error = null;
    this.waiters = [];
    const { publicKey, privateKeyDer } = generateKeyPair();
    this.publicKey = publicKey;
    this.privateKeyDer = privateKeyDer;
    this.server = createServer((req, res) => this.onRequest(req, res));
    this.done = new Promise((resolve, reject) => { this.finishResolve = resolve; this.finishReject = reject; });
    this.done.catch(() => {});
    this.timer = setTimeout(() => this.fail(new Error("Authorization timeout")), TIMEOUT_MS);
  }

  async start() {
    await new Promise((resolve, reject) => {
      this.server.listen(0, "127.0.0.1", resolve);
      this.server.on("error", reject);
    });
    const addr = this.server.address();
    const port = typeof addr === "object" && addr ? addr.port : 0;
    this.redirectUri = `http://127.0.0.1:${port}/`;
    this.url = buildAuthorizeUrl(this.publicKey, this.redirectUri, this.keyName, this.kn);
    this.manualUrl = buildAuthorizeUrl(this.publicKey, `${PLATFORM_URL}/authorize/code/callback`, this.keyName, this.kn);
    this.open(this.url);
    return { url: this.url, manualUrl: this.manualUrl, keyName: this.keyName };
  }

  onRequest(req, res) {
    const url = new URL(req.url || "/", "http://localhost");
    const u = url.searchParams.get("u");
    if (!u) {
      res.writeHead(302, { Location: `${PLATFORM_URL}/authorize/callback?status=error&message=missing_data` });
      res.end();
      return;
    }
    try {
      const result = decryptCallback(this.privateKeyDer, u);
      res.writeHead(302, { Location: `${PLATFORM_URL}/authorize/callback?status=success` });
      res.end();
      this.succeed(result);
    } catch {
      res.writeHead(302, { Location: `${PLATFORM_URL}/authorize/callback?status=error&message=decrypt_failed` });
      res.end();
      this.fail(new Error("Decryption failed"));
    }
  }

  /** Accept the manual paste path: the user copies the `u` blob from the platform page. */
  submitCode(code) {
    try {
      this.succeed(decryptCallback(this.privateKeyDer, String(code ?? "").trim()));
      return true;
    } catch {
      return false;
    }
  }

  succeed(result) {
    if (this.state !== "pending") return;
    this.state = "done";
    this.result = result;
    clearTimeout(this.timer);
    this.server.close();
    this.finishResolve(result);
  }

  fail(error) {
    if (this.state !== "pending") return;
    this.state = "failed";
    this.error = error;
    clearTimeout(this.timer);
    this.server.close();
    this.finishReject(error);
  }

  cancel() { this.fail(new Error("Authorization cancelled")); }

  status() {
    return {
      state: this.state,
      keyName: this.keyName,
      url: this.url ?? "",
      manualUrl: this.manualUrl ?? "",
      uid: this.result?.uid ?? "",
      baseUrl: this.result?.url ?? "",
      error: this.error ? String(this.error.message ?? this.error) : ""
    };
  }
}
