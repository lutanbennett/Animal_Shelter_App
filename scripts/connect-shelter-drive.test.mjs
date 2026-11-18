import test from "node:test";
import assert from "node:assert/strict";
import { validateInputs, verifyWithGoogle, buildConnectSql } from "./lib/connect-shelter-drive.mjs";
import { encryptSecret, decryptSecret } from "../src/lib/google/drive-credentials-crypto.ts";
import { decideCredentials, decideRootFolder, credentialsFromRow, FALLBACK_SHELTER_KEY } from "../src/lib/google/shelter-drive-decide.ts";

const KEY = Buffer.alloc(32, 5).toString("base64");
const good = { shelterKey: "second", folderId: "1AbCdEfGhIjKlMnOpQ", clientId: "123-abc.apps.googleusercontent.com", clientSecret: "GOCSPX-secretvalue", refreshToken: "1//0gRefreshTokenValue" };

test("validation rejects odd values, including SQL-shaped ones", () => {
  assert.deepEqual(validateInputs(good), []);
  assert.ok(validateInputs({ ...good, shelterKey: "x'; drop table shelters;--" }).includes("shelter key"));
  assert.ok(validateInputs({ ...good, folderId: "" }).includes("Drive folder id"));
});

test("the SQL holds ciphertext only, decrypts back, and is one statement writing row and folder together", async () => {
  const sql = await buildConnectSql({ ...good, email: "a@b.org" }, KEY);
  assert.ok(!sql.includes(good.refreshToken) && !sql.includes(good.clientSecret));
  const enc = sql.match(/'(v1:[^']+)'/g).map((s) => s.slice(1, -1));
  assert.equal(enc.length, 2);
  assert.deepEqual(await Promise.all(enc.map((e) => decryptSecret(e, KEY))), [good.clientSecret, good.refreshToken]);
  assert.match(sql, /insert into shelter_drive_credentials/);
  assert.match(sql, /update shelters set drive_root_folder_id/);
  assert.equal(sql.trim().split(";").filter(Boolean).length, 1);
});

test("a missing key fails loudly and builds nothing", async () => {
  await assert.rejects(buildConnectSql({ ...good, email: "a@b.org" }, undefined), /DRIVE_CREDENTIALS_KEY/);
});

const reply = (ok, body) => ({ ok, status: ok ? 200 : 400, json: async () => body });
test("verification stops when Google refuses, the folder is trashed, or it is not a folder", async () => {
  const mk = (tokenOk, file) => async (url) => url.includes("oauth2") ? reply(tokenOk, tokenOk ? { access_token: "t" } : { error: "invalid_grant" })
    : url.includes("/about") ? reply(true, { user: { emailAddress: "x@y.org" } }) : reply(true, file);
  const folder = { name: "F", trashed: false, mimeType: "application/vnd.google-apps.folder" };
  assert.deepEqual(await verifyWithGoogle(good, mk(true, folder)), { email: "x@y.org", folderName: "F" });
  await assert.rejects(verifyWithGoogle(good, mk(false, folder)), /refused the refresh token/);
  await assert.rejects(verifyWithGoogle(good, mk(true, { ...folder, trashed: true })), /trash/);
  await assert.rejects(verifyWithGoogle(good, mk(true, { ...folder, mimeType: "text/plain" })), /not a folder/);
});

// The refusal that protects Lanna, and Lanna's own unchanged behaviour.
const rowFor = async (over = {}) => ({ shelter_id: "s1", oauth_client_id: "cid", oauth_client_secret_enc: await encryptSecret("sec", KEY), refresh_token_enc: await encryptSecret("rt", KEY), ...over });
const lannaEnv = () => { process.env.GOOGLE_OAUTH_CLIENT_ID = "lanna-id"; process.env.GOOGLE_OAUTH_CLIENT_SECRET = "lanna-sec"; process.env.GOOGLE_OAUTH_REFRESH_TOKEN = "lanna-rt"; };

test("a shelter with no row, or an incomplete one, is refused rather than given Lanna's variables", async () => {
  lannaEnv();
  await assert.rejects(decideCredentials(null, "second"), /not connected/);
  await assert.rejects(decideCredentials(null, undefined), /not connected/);
  await assert.rejects(decideCredentials(await rowFor({ refresh_token_enc: null }), "second"), /incomplete/);
});
test("Lanna with no row still uses the environment variables, unchanged", async () => {
  lannaEnv();
  const c = await decideCredentials(null, FALLBACK_SHELTER_KEY);
  assert.equal(c.source, "env"); assert.equal(c.clientId, "lanna-id"); assert.equal(c.cacheKey, "env");
});
test("a shelter with a complete row uses its own account, not the environment's", async () => {
  process.env.DRIVE_CREDENTIALS_KEY = KEY;
  const c = await credentialsFromRow(await rowFor());
  assert.equal(c.source, "shelter"); assert.equal(c.refreshToken, "rt"); assert.equal(c.cacheKey, "s1");
});
test("folder: another shelter with none gets null, never Lanna's; Lanna keeps the variable; an own folder wins", () => {
  assert.equal(decideRootFolder(null, "second", "LANNA_FOLDER"), null);
  assert.equal(decideRootFolder("  ", "second", "LANNA_FOLDER"), null);
  assert.equal(decideRootFolder(null, FALLBACK_SHELTER_KEY, "LANNA_FOLDER"), "LANNA_FOLDER");
  assert.equal(decideRootFolder("OWN", "second", "LANNA_FOLDER"), "OWN");
});
