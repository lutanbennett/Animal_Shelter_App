import test from "node:test";
import assert from "node:assert/strict";
import { mustChangePassword, signedInWithPassword, openedByRecoveryLink, requiresCurrentPassword } from "./password-change.ts";

// A decoded-not-verified access token with the given amr claim.
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const token = (claims) => `${b64({ alg: "none" })}.${b64(claims)}.sig`;
const NOW = 1_000_000;

test("mustChangePassword reads app_metadata, only for literal true", () => {
  assert.equal(mustChangePassword({ app_metadata: { must_change_password: true } }), true);
  for (const u of [null, undefined, {}, { app_metadata: {} }, { app_metadata: { must_change_password: "true" } }, { app_metadata: { must_change_password: 1 } }]) {
    assert.equal(mustChangePassword(u), false, JSON.stringify(u));
  }
});

test("a user_metadata flag does not count (the user can edit that one)", () => {
  assert.equal(mustChangePassword({ app_metadata: {}, user_metadata: { must_change_password: true } }), false);
});

test("signedInWithPassword: password in amr is yes; Google-only is no", () => {
  assert.equal(signedInWithPassword(token({ amr: [{ method: "password", timestamp: 1 }] })), true);
  assert.equal(signedInWithPassword(token({ amr: ["password"] })), true);
  assert.equal(signedInWithPassword(token({ amr: [{ method: "oauth", timestamp: 1 }] })), false);
});

test("signedInWithPassword: anything unreadable counts as a password sign-in", () => {
  for (const t of [null, undefined, "", "garbage", "a.b.c", "a.!!!.c", token({}), token({ amr: [] })]) {
    assert.equal(signedInWithPassword(t), true, String(t));
  }
});

test("openedByRecoveryLink: a fresh otp/recovery entry is yes", () => {
  assert.equal(openedByRecoveryLink(token({ amr: [{ method: "otp", timestamp: NOW - 60 }] }), NOW), true);
  assert.equal(openedByRecoveryLink(token({ amr: [{ method: "recovery", timestamp: NOW - 60 }] }), NOW), true);
});

test("openedByRecoveryLink: the 30-minute window is inclusive and no longer", () => {
  assert.equal(openedByRecoveryLink(token({ amr: [{ method: "otp", timestamp: NOW - 1800 }] }), NOW), true);
  assert.equal(openedByRecoveryLink(token({ amr: [{ method: "otp", timestamp: NOW - 1801 }] }), NOW), false);
});

test("openedByRecoveryLink: the NEWEST entry decides, so a later password sign-in cancels it", () => {
  const t = token({ amr: [{ method: "otp", timestamp: NOW - 100 }, { method: "password", timestamp: NOW - 10 }] });
  assert.equal(openedByRecoveryLink(t, NOW), false);
});

test("openedByRecoveryLink: unreadable or missing is NOT recovery (yes would waive the old-password check)", () => {
  for (const t of [null, undefined, "", "garbage", "a.b.c", token({}), token({ amr: [] }), token({ amr: ["otp"] }), token({ amr: [{ method: "otp" }] })]) {
    assert.equal(openedByRecoveryLink(t, NOW), false, String(t));
  }
});

test("requiresCurrentPassword: yes for an ordinary session", () => {
  assert.equal(requiresCurrentPassword({ app_metadata: {} }, token({ amr: [{ method: "password", timestamp: NOW }] })), true);
  assert.equal(requiresCurrentPassword(null, null), true);
});

test("requiresCurrentPassword: waived only after a forced change", () => {
  assert.equal(requiresCurrentPassword({ app_metadata: { must_change_password: true } }, null), false);
});
