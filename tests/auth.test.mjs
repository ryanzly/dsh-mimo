import test from "node:test";
import assert from "node:assert/strict";
import { createCipheriv, createHash, createPrivateKey, createPublicKey, diffieHellman, generateKeyPairSync, randomBytes } from "node:crypto";
import { buildAuthorizeUrl, decryptCallback, generateKeyPair, MimoLoginSession } from "../lib/mimo-auth.js";

/** Encrypt one payload exactly like the platform does, against a base64url X25519 public key. */
function platformEncrypt(publicKeyBase64url, payload) {
  // pk is base64url of the full SPKI DER, exactly what buildAuthorizeUrl sends.
  const publicKey = createPublicKey({
    key: Buffer.from(publicKeyBase64url, "base64url"),
    format: "der",
    type: "spki"
  });
  const ephemeral = generateKeyPairSync("x25519", {
    publicKeyEncoding: { type: "spki", format: "der" },
    privateKeyEncoding: { type: "pkcs8", format: "der" }
  });
  const ephemeralPrivate = createPrivateKey({ key: ephemeral.privateKey, format: "der", type: "pkcs8" });
  const shared = diffieHellman({ privateKey: ephemeralPrivate, publicKey });
  const key = createHash("sha256").update(shared).digest();
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const ct = Buffer.concat([cipher.update(JSON.stringify(payload), "utf-8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: ephemeral raw public key (32 bytes) || nonce(12) || ciphertext || tag(16)
  return Buffer.concat([Buffer.from(ephemeral.publicKey).subarray(-32), nonce, ct, tag]).toString("base64url");
}

test("auth: decrypt round-trips a platform-shaped callback blob", () => {
  const { publicKey, privateKeyDer } = generateKeyPair();
  const payload = { sk: "mimo-code-cli-key-deadbeef", uid: "uid-42", url: "https://token-plan-cn.xiaomimimo.com/v1" };
  const blob = platformEncrypt(publicKey, payload);
  const result = decryptCallback(privateKeyDer, blob);
  assert.deepEqual(result, payload);
});

test("auth: garbage blob throws", () => {
  const { privateKeyDer } = generateKeyPair();
  assert.throws(() => decryptCallback(privateKeyDer, "not-a-valid-blob"));
});

test("auth: authorize URL carries pk, redirect_uri, kn and key_name", () => {
  const url = new URL(buildAuthorizeUrl("PUBKEY", "http://127.0.0.1:1234/", "dsh-mimo-key-1", "mimocode"));
  assert.equal(url.origin + url.pathname, "https://platform.xiaomimimo.com/authorize");
  assert.equal(url.searchParams.get("pk"), "PUBKEY");
  assert.equal(url.searchParams.get("redirect_uri"), "http://127.0.0.1:1234/");
  assert.equal(url.searchParams.get("kn"), "mimocode");
  assert.equal(url.searchParams.get("key_name"), "dsh-mimo-key-1");
});

test("auth: login session accepts the manual code path", async () => {
  const session = new MimoLoginSession({ keyName: "dsh-mimo-key-test", open: () => {} });
  await session.start();
  assert.equal(session.status().state, "pending");
  const blob = platformEncrypt(session.publicKey, { sk: "sk-xyz", uid: "u1", url: "" });
  assert.equal(session.submitCode(blob), true);
  const result = await session.done;
  assert.equal(result.sk, "sk-xyz");
  assert.equal(session.status().state, "done");
});

test("auth: cancel settles the session as failed", async () => {
  const session = new MimoLoginSession({ open: () => {} });
  await session.start();
  session.cancel();
  await assert.rejects(() => session.done);
  assert.equal(session.status().state, "failed");
});
