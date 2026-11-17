// The logic behind scripts/connect-shelter-drive.mjs, kept apart so a test can run it with no network and no database.
// Everything here is either pure or takes its network call as an argument.
import { encryptSecret } from "../../src/lib/google/drive-credentials-crypto.ts";

const ID = /^[A-Za-z0-9_-]{10,200}$/;
const CLIENT_ID = /^[A-Za-z0-9._-]{10,300}$/;
const TOKEN = /^[A-Za-z0-9._\/-]{10,2000}$/;
const SECRET = /^[A-Za-z0-9._-]{8,300}$/;
const SHELTER_KEY = /^[a-z0-9_-]{1,60}$/;

/** Refuses anything that is not plainly what it should be, so nothing odd ever reaches the SQL below. */
export function validateInputs({ shelterKey, folderId, clientId, clientSecret, refreshToken }) {
  const bad = [];
  if (!SHELTER_KEY.test(shelterKey ?? "")) bad.push("shelter key");
  if (!ID.test(folderId ?? "")) bad.push("Drive folder id");
  if (!CLIENT_ID.test(clientId ?? "")) bad.push("OAuth client id");
  if (!SECRET.test(clientSecret ?? "")) bad.push("OAuth client secret");
  if (!TOKEN.test(refreshToken ?? "")) bad.push("refresh token");
  return bad;
}

/**
 * Proves the three values work BEFORE anything is stored: the token mints an access token, and that token can see the
 * folder and the folder is not in the trash. Returns the account's email. Throws a sentence a person can act on.
 */
export async function verifyWithGoogle({ clientId, clientSecret, refreshToken, folderId }, fetchImpl = fetch) {
  const tok = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
  });
  const t = await tok.json().catch(() => ({}));
  if (!tok.ok || !t.access_token) throw new Error(`Google refused the refresh token (${t.error ?? tok.status}${t.error_description ? `: ${t.error_description}` : ""}). Nothing was stored.`);
  const auth = { Authorization: `Bearer ${t.access_token}` };
  const f = await fetchImpl(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,trashed,mimeType&supportsAllDrives=true`, { headers: auth });
  const file = await f.json().catch(() => ({}));
  if (!f.ok) throw new Error(`This Google account cannot open folder ${folderId} (HTTP ${f.status}). Nothing was stored.`);
  if (file.trashed) throw new Error("That folder is in the trash. Nothing was stored.");
  if (file.mimeType !== "application/vnd.google-apps.folder") throw new Error("That id is a file, not a folder. Nothing was stored.");
  const a = await fetchImpl("https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)", { headers: auth });
  const about = await a.json().catch(() => ({}));
  const email = about?.user?.emailAddress;
  if (!a.ok || !email) throw new Error("Google would not say which account this token acts as. Nothing was stored.");
  return { email, folderName: file.name };
}

const lit = (v) => `'${String(v).replace(/'/g, "''")}'`;

/**
 * ONE statement, so it is all-or-nothing: the credentials row and the shelter's folder id are written together or not at
 * all (a row without a folder is still a refused shelter, so a half-write must be impossible). It matches the shelter by
 * key and reports how many shelters it matched, so a mistyped key writes nothing and says so.
 */
export async function buildConnectSql({ shelterKey, folderId, clientId, clientSecret, refreshToken, email }, key = process.env.DRIVE_CREDENTIALS_KEY) {
  const secretEnc = await encryptSecret(clientSecret, key); // throws if the key is missing: never writes plaintext or an unusable value
  const tokenEnc = await encryptSecret(refreshToken, key);
  return `with s as (select id from shelters where key = ${lit(shelterKey)}),
c as (
  insert into shelter_drive_credentials (shelter_id, oauth_client_id, oauth_client_secret_enc, refresh_token_enc, drive_account_email, token_status, last_checked_at, last_error, dead_alerted_at, updated_at)
  select id, ${lit(clientId)}, ${lit(secretEnc)}, ${lit(tokenEnc)}, ${lit(email)}, 'ok', now(), null, null, now() from s
  on conflict (shelter_id) do update set oauth_client_id = excluded.oauth_client_id, oauth_client_secret_enc = excluded.oauth_client_secret_enc,
    refresh_token_enc = excluded.refresh_token_enc, drive_account_email = excluded.drive_account_email, token_status = 'ok',
    last_checked_at = now(), last_error = null, dead_alerted_at = null, updated_at = now()
  returning shelter_id),
u as (update shelters set drive_root_folder_id = ${lit(folderId)} where id in (select id from s) returning id)
select (select count(*) from s)::int as shelters_matched, (select count(*) from c)::int as credentials_written, (select count(*) from u)::int as folder_written`;
}
