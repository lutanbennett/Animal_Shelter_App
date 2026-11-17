import test from "node:test";
import assert from "node:assert/strict";
import { encryptSecret, decryptSecret } from "./drive-credentials-crypto.ts";

const KEY = Buffer.alloc(32, 7).toString("base64");
const OTHER = Buffer.alloc(32, 9).toString("base64");

test("a secret round-trips and is not stored as plaintext", async () => {
  const enc = await encryptSecret("1//refresh-token", KEY);
  assert.ok(enc.startsWith("v1:"));
  assert.ok(!enc.includes("refresh-token"));
  assert.equal(await decryptSecret(enc, KEY), "1//refresh-token");
});

test("the same value encrypts differently each time", async () => {
  assert.notEqual(await encryptSecret("x", KEY), await encryptSecret("x", KEY));
});

test("a wrong key refuses rather than returning junk", async () => {
  const enc = await encryptSecret("x", KEY);
  await assert.rejects(decryptSecret(enc, OTHER), /could not be decrypted/);
});

test("a missing or short key fails loudly", async () => {
  await assert.rejects(encryptSecret("x", undefined), /DRIVE_CREDENTIALS_KEY is not set/);
  await assert.rejects(encryptSecret("x", Buffer.alloc(8).toString("base64")), /must be 32 bytes/);
});
