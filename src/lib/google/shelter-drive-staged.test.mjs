import test from "node:test";
import assert from "node:assert/strict";
import { decideCredentials, stageConsent, FALLBACK_SHELTER_KEY } from "./shelter-drive-decide.ts";
import { encryptSecret } from "./drive-credentials-crypto.ts";

const KEY = Buffer.alloc(32, 9).toString("base64");
process.env.DRIVE_CREDENTIALS_KEY = KEY;
process.env.GOOGLE_OAUTH_CLIENT_ID = "env-id";
process.env.GOOGLE_OAUTH_CLIENT_SECRET = "env-secret";
process.env.GOOGLE_OAUTH_REFRESH_TOKEN = "env-refresh";
const row = async (staged) => ({ shelter_id: "s1", oauth_client_id: "cid", oauth_client_secret_enc: await encryptSecret("sec", KEY), refresh_token_enc: await encryptSecret("rt", KEY), staged });

test("a live row is the shelter's account", async () => {
  assert.equal((await decideCredentials(await row(false), "x")).source, "shelter");
  assert.equal((await decideCredentials(await row(undefined), "x")).source, "shelter");
});
test("a staged row is read as no row: the fallback shelter stays on the environment account", async () => {
  assert.equal((await decideCredentials(await row(true), FALLBACK_SHELTER_KEY)).source, "env");
});
test("a staged row never lets another shelter borrow the environment account: it refuses", async () => {
  await assert.rejects(decideCredentials(await row(true), "other"));
});
test("consent stages only for the fallback shelter with no row yet", () => {
  assert.equal(stageConsent(false, FALLBACK_SHELTER_KEY), true);
  assert.equal(stageConsent(false, "new-shelter"), false);
  assert.equal(stageConsent(true, FALLBACK_SHELTER_KEY), false);
});
