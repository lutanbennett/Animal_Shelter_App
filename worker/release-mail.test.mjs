import test from "node:test";
import assert from "node:assert/strict";
import { handleReleaseRequest, releaseMailOffReason } from "./release-mail.mjs";

const get = (env) => handleReleaseRequest(new Request("https://x.test/api/releases/mail-status"), env);

test("mail-status reports a configured Worker as sending", async () => {
  const res = await get({ RELEASE_MAIL_ENV: "UAT", RELEASE_MAIL_FROM: "releases@lannacare.org", RELEASE_MAIL: {} });
  assert.deepEqual(await res.json(), { environment: "UAT", from: "releases@lannacare.org", hasBinding: true, off: null });
});

test("mail-status says why a Worker will not send, and never leaks the binding or keys", async () => {
  const res = await get({ RELEASE_MAIL_ENV: "", SUPABASE_SERVICE_ROLE_KEY: "secret" });
  const text = JSON.stringify(await res.json());
  assert.match(text, /not UAT or Production/);
  assert.doesNotMatch(text, /secret/);
});

test("off reasons", () => {
  assert.match(releaseMailOffReason({ RELEASE_MAIL_ENV: "UAT" }), /no RELEASE_MAIL binding/);
  assert.match(releaseMailOffReason({ RELEASE_MAIL_ENV: "UAT", RELEASE_MAIL: {} }), /no RELEASE_MAIL_FROM/);
});

test("other methods on mail-status fall through", async () => {
  const res = await handleReleaseRequest(new Request("https://x.test/api/releases/mail-status", { method: "POST" }), {});
  assert.equal(res, null);
});
