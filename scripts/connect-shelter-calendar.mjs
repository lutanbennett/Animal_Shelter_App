// Connects a shelter to ITS OWN Google Calendar (#calsh piece 1): checks the credentials against Google, refuses the fallback
// shelter's calendar, encrypts the secrets, and writes the shelter_calendar_credentials row in one statement.
//
//   node scripts/connect-shelter-calendar.mjs --shelter <key> --calendar <calendar id> [--env test|uat|production] [--apply]
//
// Without --apply it checks everything with Google and prints what it WOULD write; nothing is stored.
// The secrets come from the environment (never the command line, which ends up in history):
//   SHELTER_GOOGLE_CLIENT_ID, SHELTER_GOOGLE_CLIENT_SECRET, SHELTER_GOOGLE_REFRESH_TOKEN
// and, optionally, SHELTER_GOOGLE_ACCOUNT_EMAIL (shown to Admin so a wrong account is noticed; the token's scope cannot look it up).
// The refresh token needs the calendar.events scope; mint it as scripts/connect-shelter-drive.mjs describes.
// Needs DRIVE_CREDENTIALS_KEY in the environment's file; without it the script stops before storing anything.
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";
import { validateInputs, refuseFallbackCalendar, verifyWithGoogle, buildConnectSql } from "./lib/connect-shelter-calendar.mjs";
import { exitWith } from "./lib/exit.mjs";

const args = process.argv.slice(2);
const arg = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const { name } = parseEnvArg(args);
async function main() {
const env = loadEnv(name);
const input = {
  shelterKey: arg("--shelter"), calendarId: arg("--calendar"),
  clientId: process.env.SHELTER_GOOGLE_CLIENT_ID, clientSecret: process.env.SHELTER_GOOGLE_CLIENT_SECRET, refreshToken: process.env.SHELTER_GOOGLE_REFRESH_TOKEN,
  accountEmail: process.env.SHELTER_GOOGLE_ACCOUNT_EMAIL || undefined,
};
const bad = validateInputs(input);
if (bad.length) { console.error(`Missing or malformed: ${bad.join(", ")}. See the usage at the top of this file.`); return 2; }
const refusal = refuseFallbackCalendar(input, env.GOOGLE_CALENDAR_ID ?? process.env.GOOGLE_CALENDAR_ID);
if (refusal) { console.error(refusal); return 1; }
const key = env.DRIVE_CREDENTIALS_KEY ?? process.env.DRIVE_CREDENTIALS_KEY;
if (!key) { console.error("DRIVE_CREDENTIALS_KEY is not set for this environment; nothing was stored."); return 2; }

let verified;
try { verified = await verifyWithGoogle(input); } catch (e) { console.error(e.message); return 1; }
console.log(`Google accepts it: calendar "${verified.calendarName}" can be read.`);
if (!args.includes("--apply")) { console.log(`Would connect shelter "${input.shelterKey}" on ${name}. Re-run with --apply.`); return 0; }

const sql = await buildConnectSql(input, key);
const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef(env)}/database/query`, {
  method: "POST", headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: sql }),
});
const body = await res.json().catch(() => null);
if (!res.ok) {
  const dup = JSON.stringify(body ?? "").includes("shelter_calendar_credentials_calendar_id_key");
  console.error(dup ? "Another shelter already uses that calendar; nothing was stored." : `Database refused it (HTTP ${res.status}); nothing was stored.`);
  return 1;
}
const r = body?.[0];
if (!r || r.shelters_matched !== 1) { console.error(`No shelter keyed "${input.shelterKey}" here; nothing was stored.`); return 1; }
console.log(`Connected "${input.shelterKey}": credentials written ${r.credentials_written}.`);
return 0;
}

await exitWith(await main());
