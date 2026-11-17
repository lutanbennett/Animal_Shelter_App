// Part 8 of the tenancy programme (#b4cmn). Two halves.
//  1. FILES: no src/ or worker/ file may read GOOGLE_DRIVE_ROOT_FOLDER_ID except the settings reader (docs/shelter-settings-registry.json
//     records any other, with a reason). New code reads it through driveRootFolderId().
//  2. VALUES (with --env): each shelter's stored drive_root_folder_id equals this environment's variable, which is the proof that a converted
//     reader resolves to exactly what it replaced. A value that differs, or is empty while the variable is set, is reported.
//   node scripts/check-shelter-settings.mjs [--env test|uat|production]
import fs from "node:fs";
import { execSync } from "node:child_process";
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";

const reg = JSON.parse(fs.readFileSync("docs/shelter-settings-registry.json", "utf8"));
const bad = [];
const hits = [];
for (const f of execSync("git ls-files src worker", { encoding: "utf8" }).split(/\r?\n/).filter((f) => /\.(ts|tsx|mjs|js)$/.test(f))) {
  if (!fs.existsSync(f)) continue;
  fs.readFileSync(f, "utf8").split(/\r?\n/).forEach((l, i) => { if (/process\.env\.GOOGLE_DRIVE_ROOT_FOLDER_ID|env\.GOOGLE_DRIVE_ROOT_FOLDER_ID|env\["GOOGLE_DRIVE_ROOT_FOLDER_ID"\]/.test(l) && !/^\s*(\/\/|\*)/.test(l)) hits.push(`${f}:${i + 1}`); });
}
const allowed = new Map(reg.driveRootFolderIdReaders.map((r) => [r.file, r.reason]));
for (const h of hits) if (!allowed.has(h.split(":")[0])) bad.push(`NEW READER  ${h}: read it through driveRootFolderId() (src/lib/shelter-settings.ts), or record the file with a reason`);
for (const [f, why] of allowed) {
  if (!hits.some((h) => h.startsWith(f + ":"))) bad.push(`STALE  ${f}: no longer reads it; delete its record`);
  if (!why || why.length < 15) bad.push(`NO REASON  ${f}`);
}
console.log(`${hits.length} direct reads in src/ and worker/, ${allowed.size} recorded`);

const args = process.argv.slice(2);
if (args.includes("--env")) {
  const { name } = parseEnvArg(args);
  const env = loadEnv(name);
  const root = env.GOOGLE_DRIVE_ROOT_FOLDER_ID?.trim();
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef(env)}/database/query`, {
    method: "POST", headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: "select key, drive_root_folder_id, display_name, short_name from shelters where key = 'lanna'" }),
  });
  const rows = await res.json();
  if (!res.ok || !Array.isArray(rows)) { console.error(`read failed (HTTP ${res.status}). VALUES NOT CHECKED.`); process.exit(2); }
  for (const r of rows) {
    if (!r.drive_root_folder_id) bad.push(`UNPOPULATED  ${r.key}: empty, so readers use the variable (safe, but run populate-shelter-settings.mjs --apply)`);
    else if (r.drive_root_folder_id !== root) bad.push(`DIFFERS  ${r.key}: stored value is not this environment's GOOGLE_DRIVE_ROOT_FOLDER_ID`);
  }
  // 0400: the stored names must equal the literals the converted readers replaced, so Lanna's output cannot differ.
  const want = { display_name: "Lanna Care for Animals", short_name: "Lanna Care" };
  for (const r of rows) for (const [col, lit] of Object.entries(want)) if (r[col] !== lit) bad.push(`NAME DIFFERS  ${r.key}.${col}: stored ${JSON.stringify(r[col])}, the code it replaced said ${JSON.stringify(lit)}`);
  console.log(`${rows.length} shelter(s) compared with ${name}'s variable`);
}
bad.forEach((b) => console.log(b));
console.log(bad.length ? "NOT CLEAN" : "no new reader of the Drive folder variable, and stored values match");
process.exit(bad.length ? 1 : 0);
