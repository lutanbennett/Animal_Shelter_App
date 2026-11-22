import test from "node:test";
import assert from "node:assert/strict";
import { classifyCredentialError, deadAlertBody } from "./shelter-drive-alert.ts";
import { DriveCredentialsError, decryptSecret } from "./drive-credentials-crypto.ts";

test("a missing key is unknown, not a dead token (no key, no network)", async () => {
  await assert.rejects(decryptSecret("v1:aaaa:bbbb", undefined), (err) => {
    assert.equal(classifyCredentialError(err).status, "unknown");
    return true;
  });
});

test("every error that is ours is unknown", async () => {
  const ours = [
    new DriveCredentialsError("DRIVE_CREDENTIALS_KEY is not valid base64."),
    new DriveCredentialsError("DRIVE_CREDENTIALS_KEY must be 32 bytes"),
    new DriveCredentialsError("could not be decrypted: wrong DRIVE_CREDENTIALS_KEY, or the value was altered."),
    new Error("anything unexpected"),
  ];
  for (const e of ours) assert.equal(classifyCredentialError(e).status, "unknown");
  await assert.rejects(decryptSecret("v1:aaaa:bbbb", Buffer.alloc(32, 1).toString("base64")), (e) => classifyCredentialError(e).status === "unknown");
});

test("a malformed stored value and an incomplete row are the shelter's connection: dead", async () => {
  await assert.rejects(decryptSecret("garbage", Buffer.alloc(32, 1).toString("base64")), (e) => classifyCredentialError(e).status === "dead");
  assert.equal(classifyCredentialError(new DriveCredentialsError("incomplete", "theirs")).status, "dead");
});

test("the mail says what to do and names no internal identifier or Google", () => {
  const body = deadAlertBody("Lanna Care", "https://x.example/admin");
  assert.match(body, /Lanna Care/);
  assert.match(body, /reconnect/i);
  assert.match(body, /https:\/\/x\.example\/admin/);
  assert.doesNotMatch(body, /DRIVE_CREDENTIALS_KEY|Google said|invalid_grant|secret|base64/i);
});
