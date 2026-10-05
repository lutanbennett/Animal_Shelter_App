// Loads the Director's draft of who does what (src/lib/roles-draft/draft-N.json) into
// role_permissions for the roles it names, and prints every cell that changes, both ways.
//
//   node scripts/load-role-draft.mjs                       # dry run against test: the diff only
//   node scripts/load-role-draft.mjs --apply               # write it to test
//   node scripts/load-role-draft.mjs --draft 2 --apply     # a second draft is another file
//   node scripts/load-role-draft.mjs --env production      # REFUSED, see below
//
// WRITES ARE A REPLACE, NOT A MERGE. A role named by the draft ends up holding exactly the
// draft's cells (her ticks, plus the reads a ticked job starts from, marked "implied"). A cell
// the role holds today that the draft does not give is deleted. Roles the draft does not name
// (Management, Staff, Admin, public viewer) are not touched.
//
// PRODUCTION IS NOT THIS SCRIPT'S TO TOUCH BY DEFAULT. The first draft is for test.lannacare.org
// only (backlog, 2026-10-05); production waits until she has looked at each role and approved.
// `--env production` is refused unless `--allow-production` is also given, and even then it is
// the Director's draft going live, which is its own step with its own go-ahead.
//
// CREDENTIALS. role_permissions takes writes from an admin at aal2 only (0132), enforced by RLS
// policies. This script does not go through RLS: it sends SQL through the Supabase Management API
// with SUPABASE_ACCESS_TOKEN, as apply-migrations.mjs does, which runs as the database owner. That
// is why no login, and no 2-step code, is involved.
//
// AUDIT. role_permissions carries the audit_log trigger, so every cell inserted, changed or
// deleted writes a row to audit_log with no actor (there is no logged-in person). The script
// counts them before and after and prints the number, so a bulk load is never mistaken for
// someone clicking in Settings.
import { readFileSync } from "node:fs";
import { ACTIVITIES } from "../src/lib/permissions/catalogue.ts";
import { cellsFor } from "../src/lib/roles-draft/resolve.ts";
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";

const { name: envName, rest } = parseEnvArg(process.argv.slice(2));
const apply = rest.includes("--apply");
const allowProduction = rest.includes("--allow-production");
const di = rest.indexOf("--draft");
const draftNo = di >= 0 ? Number(rest[di + 1]) : 1;

if (envName !== "test" && !allowProduction) {
  console.error(
    `load-role-draft: --env ${envName} is refused. The draft is for test.lannacare.org until the Director has looked at each role and approved it.\n` +
      "Nothing was read from or sent to any database.",
  );
  process.exit(2);
}
if (!Number.isInteger(draftNo) || draftNo < 1) {
  console.error("--draft needs a number, e.g. --draft 2");
  process.exit(2);
}

const draft = JSON.parse(readFileSync(new URL(`../src/lib/roles-draft/draft-${draftNo}.json`, import.meta.url), "utf8"));
const kinds = Object.fromEntries(ACTIVITIES.map((a) => [a.key, a.kind]));
const target = Object.fromEntries(Object.keys(draft.roles).map((r) => [r, cellsFor(draft, r, kinds)]));

const env = loadEnv(envName);
const ref = projectRef(env);
const token = env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN is required.");
  process.exit(2);
}

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    let message = text;
    try {
      message = JSON.parse(text).message ?? text;
    } catch {
      // keep the raw body
    }
    throw new Error(message);
  }
  return text ? JSON.parse(text) : [];
}

const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;
const word = (level, kind) => (level == null ? "none" : kind === "yesno" ? "yes" : level === 2 ? "edit" : "read");

console.log(`Environment: ${envName} — project ${ref} — draft ${draftNo} — ${apply ? "APPLY" : "dry run (nothing is written)"}`);

const keys = Object.keys(draft.roles);
const rolesFound = await query(`select key from roles where key in (${keys.map(lit).join(",")})`);
const missing = keys.filter((k) => !rolesFound.some((r) => r.key === k));
if (missing.length) {
  console.error(`These roles are in the draft but not in the database: ${missing.join(", ")}`);
  process.exit(1);
}
const current = await query(
  `select r.key as role, p.activity, p.level from role_permissions p join roles r on r.id = p.role_id where r.key in (${keys.map(lit).join(",")})`,
);

const changes = []; // { role, activity, before, after, source, rows }
for (const role of keys) {
  const now = new Map(current.filter((c) => c.role === role).map((c) => [c.activity, c.level]));
  const want = new Map(target[role].map((c) => [c.activity, c]));
  for (const activity of new Set([...now.keys(), ...want.keys()])) {
    const before = now.get(activity) ?? null;
    const w = want.get(activity);
    const after = w ? w.level : null;
    if (before !== after) changes.push({ role, activity, before, after, source: w?.source, rows: w?.rows, because: w?.because });
  }
}

for (const role of keys) {
  console.log(`\n${draft.roles[role].label} (${role}): ${current.filter((c) => c.role === role).length} cells today, ${target[role].length} in the draft`);
  const mine = changes.filter((c) => c.role === role).sort((a, b) => a.activity.localeCompare(b.activity));
  if (mine.length === 0) console.log("  no change");
  for (const c of mine) {
    const kind = kinds[c.activity];
    const note = c.source === "implied" ? `  [implied: ${c.because}]` : c.rows ? `  [sheet row ${c.rows.join(", ")}]` : "";
    console.log(`  ${c.activity.padEnd(32)} ${word(c.before, kind).padEnd(5)} -> ${word(c.after, kind).padEnd(5)}${note}`);
  }
}

console.log("\nMarks on the sheet that were not ticks (each loaded as no; the Director's call, not ours):");
for (const u of draft.unclear) console.log(`  ${draft.roles[u.role].label}, row ${u.row} (${draft.rows.find((r) => r.row === u.row).label}): ${u.mark}`);

const gained = changes.filter((c) => c.before == null).length;
const lost = changes.filter((c) => c.after == null).length;
const moved = changes.length - gained - lost;
console.log(`\n${changes.length} cells change: ${gained} gained, ${lost} lost, ${moved} changed level.`);

if (!apply) {
  console.log("Dry run. Add --apply to write this.");
  process.exit(0);
}
if (changes.length === 0) {
  console.log("Nothing to write.");
  process.exit(0);
}

const auditCount = async () => Number((await query("select count(*)::int as n from audit_log where table_name = 'role_permissions'"))[0].n);
const auditBefore = await auditCount();

const statements = ["begin;"];
for (const c of changes) {
  const roleId = `(select id from roles where key = ${lit(c.role)})`;
  statements.push(
    c.after == null
      ? `delete from role_permissions where role_id = ${roleId} and activity = ${lit(c.activity)};`
      : `insert into role_permissions (role_id, activity, level) values (${roleId}, ${lit(c.activity)}, ${c.after}) on conflict (role_id, activity) do update set level = excluded.level;`,
  );
}
statements.push("commit;");
await query(statements.join("\n"));

const auditAfter = await auditCount();
console.log(`Written. audit_log gained ${auditAfter - auditBefore} role_permissions rows (actor empty: a script, not a person in Settings).`);
