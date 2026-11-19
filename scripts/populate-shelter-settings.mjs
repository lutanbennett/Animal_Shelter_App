// Copies this environment's own values into the per-shelter settings (shelters.drive_root_folder_id, 0398), for the Lanna
// shelter (key lanna). Re-runnable; writes only when the column is empty, so it never overwrites a shelter's own value.
//   node scripts/populate-shelter-settings.mjs [--env test|uat|production] [--apply]
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";
import { exitWith } from "./lib/exit.mjs";

const args = process.argv.slice(2);
const { name } = parseEnvArg(args);
async function main() {
const env = loadEnv(name);
const root = env.GOOGLE_DRIVE_ROOT_FOLDER_ID?.trim();
if (!root || !/^[A-Za-z0-9_-]+$/.test(root)) { console.error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not set or not an id here."); return 2; }
async function q(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef(env)}/database/query`, {
    method: "POST", headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ query }),
  });
  const body = await res.json();
  if (!res.ok) { console.error(`query failed (HTTP ${res.status})`); throw Object.assign(new Error("query failed"), { exitCode: 2 }); }
  return body;
}
const shelters = await q("select id, key, drive_root_folder_id from shelters where key = 'lanna'");
if (shelters.length !== 1) { console.error("No shelter keyed lanna here."); return 2; }
const [s] = shelters;
if (s.drive_root_folder_id) { console.log(`${s.key}: already set (${s.drive_root_folder_id === root ? "matches the environment" : "DIFFERS from the environment"}); nothing to do.`); return 0; }
if (!args.includes("--apply")) { console.log(`${s.key}: empty; would set it to this environment's folder id. Re-run with --apply.`); return 0; }
await q(`update shelters set drive_root_folder_id = '${root}' where id = '${s.id}' and drive_root_folder_id is null`);
console.log(`${s.key}: set.`);
return 0;
}

await exitWith(await main().catch((e) => {
  if (e.exitCode === undefined) console.error(e);
  return e.exitCode ?? 1;
}));
