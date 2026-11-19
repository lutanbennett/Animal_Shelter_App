// Connects a shelter to ITS OWN Google account (#cn7gk): checks the credentials against Google, encrypts the secrets, and
// writes the shelter_drive_credentials row together with the shelter's Drive folder id, in one statement.
//
//   node scripts/connect-shelter-drive.mjs --shelter <key> --folder <drive folder id> [--env test|uat|production] [--apply]
//
// Without --apply it checks everything with Google and prints what it WOULD write; nothing is stored.
// The three secrets come from the environment (never the command line, which ends up in history):
//   SHELTER_GOOGLE_CLIENT_ID, SHELTER_GOOGLE_CLIENT_SECRET, SHELTER_GOOGLE_REFRESH_TOKEN
// Mint the refresh token with the shelter's own Google client and account:
//   GOOGLE_OAUTH_CLIENT_ID=<its client id> GOOGLE_OAUTH_CLIENT_SECRET=<its secret> node scripts/google-oauth-setup.mjs
// (a Desktop-app client: the loopback address it uses needs no redirect URI registered in Google Cloud).
// Needs DRIVE_CREDENTIALS_KEY in the environment's file; without it the script stops before storing anything.
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";
import { validateInputs, verifyWithGoogle, buildConnectSql } from "./lib/connect-shelter-drive.mjs";
import { exitWith } from "./lib/exit.mjs";
import { unknownArgs, unknownArgsMessage } from "./lib/args.mjs";

const args = process.argv.slice(2);
const arg = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const { name } = parseEnvArg(args);
async function main() {
// Before anything is read or written: a mistyped flag must not run as if it were the safe default (#sflag).
const unknown = unknownArgs(args, { flags: ["--apply"], valued: ["--env","--shelter","--folder"] });
if (unknown.length) { console.error(unknownArgsMessage("connect-shelter-drive", unknown)); return 2; }
const env = loadEnv(name);
const input = {
  shelterKey: arg("--shelter"), folderId: arg("--folder"),
  clientId: process.env.SHELTER_GOOGLE_CLIENT_ID, clientSecret: process.env.SHELTER_GOOGLE_CLIENT_SECRET, refreshToken: process.env.SHELTER_GOOGLE_REFRESH_TOKEN,
};
const bad = validateInputs(input);
if (bad.length) { console.error(`Missing or malformed: ${bad.join(", ")}. See the usage at the top of this file.`); return 2; }
const key = env.DRIVE_CREDENTIALS_KEY ?? process.env.DRIVE_CREDENTIALS_KEY;
if (!key) { console.error("DRIVE_CREDENTIALS_KEY is not set for this environment; nothing was stored."); return 2; }

let verified;
try { verified = await verifyWithGoogle(input); } catch (e) { console.error(e.message); return 1; }
console.log(`Google accepts it: acts as ${verified.email}, folder "${verified.folderName}".`);
if (!args.includes("--apply")) { console.log(`Would connect shelter "${input.shelterKey}" on ${name}. Re-run with --apply.`); return 0; }

const sql = await buildConnectSql({ ...input, email: verified.email }, key);
const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef(env)}/database/query`, {
  method: "POST", headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: sql }),
});
const body = await res.json().catch(() => null);
if (!res.ok) { console.error(`Database refused it (HTTP ${res.status}); nothing was stored.`); return 1; }
const r = body?.[0];
if (!r || r.shelters_matched !== 1) { console.error(`No shelter keyed "${input.shelterKey}" here; nothing was stored.`); return 1; }
console.log(`Connected "${input.shelterKey}": credentials written ${r.credentials_written}, folder written ${r.folder_written}.`);
return 0;
}

await exitWith(await main());
