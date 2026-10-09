// The conversion ends on a query, not a prefix: no pg_policies row whose text names an app_role value or
// calls current_user_role() (decisions/2026-10-05-perm-convert-orphans.md; the lesson of the nine policies
// perm-convert-medical's `management_%` sweep missed, and, since 2026-10-07, of the 43 admin and 2 volunteer
// policies this script could not see because it looked only for management and staff:
// decisions/2026-10-07-perm-convert-admin.md).
//
//   node scripts/check-policy-role-names.mjs            (from the repo root; dev only)
//   node scripts/check-policy-role-names.mjs --final    (the end state: any row at all is a failure)
//
// A read-only query. Two modes:
//
//   default   every table that still has such a policy must be OWNED below, by the stream that converts
//             it, and every owned table must still have one. So a new role-named policy anywhere fails
//             this until someone says who converts it; and a table converted by one stream cannot stay on
//             the list. One entry per table. The owners are also checked against
//             docs/roles-and-permissions.md §15, "Where the orphans landed": a table there and not here,
//             or here and not there, fails.
//   --final   the assertion perm-drop-enum waits on: zero rows. perm-convert-vet, the last stream, runs this
//             and empties OWNERS in the same change.
//
// What counts as "names a role": any of 'management' 'staff' 'vet' 'admin' 'volunteer' cast to app_role, or a
// bare call of current_user_role() (which is how every admin_* policy is written and how a future one would
// be). Matches on the text, not the policy name: a name prefix is what missed the first nine.
//
// Both modes also ask a second question of every policy: is each scope function it calls (sees_all_*(),
// has_shelter_floor(), each TRUE for public_viewer) ANDed with a has_permission() cell? scripts/lib/scope-guard.mjs
// has the walk and what "ANDed" means. A policy that is right but fails the walk goes in SCOPE_DELIBERATE with
// its reason; it then passes and is listed. Its static twin, which CI does run, is check-new-policy-role-names.mjs.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { unguardedScopeCalls } from "./lib/scope-guard.mjs";

const final = process.argv.includes("--final");
const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

// table -> the stream that converts it. Remove an entry in the PR that converts the table.
// EMPTY since perm-convert-vet (0167, 2026-10-09): the vet's 54 policies, the last, now ask is_clinic_login()
// (roles.scope_clinical = 'own_clinic') and no policy names a role. A new entry here means a policy that names a
// role was added after the end state: convert it rather than owning it (check-new-policy-role-names.mjs, in CI,
// should have refused it first).
export const OWNERS = {};

// "table.policy" -> why its scope function needs no cell beside it (or why the walk misreads it). Each entry is
// printed every run. Empty on 2026-10-08: all 41 policies calling one were ANDed with a cell.
export const SCOPE_DELIBERATE = {};

const TEXT = "(coalesce(qual, '') || coalesce(with_check, ''))";
const query = `
select tablename, policyname, cmd,
       (${TEXT} like '%''management''::app_role%') as management,
       (${TEXT} like '%''staff''::app_role%') as staff,
       (${TEXT} like '%''vet''::app_role%') as vet,
       (${TEXT} like '%''admin''::app_role%') as admin,
       (${TEXT} like '%''volunteer''::app_role%') as volunteer,
       (${TEXT} like '%current_user_role()%') as bare
  from pg_policies
 where schemaname = 'public'
   and (${TEXT} ~ '''(management|staff|vet|admin|volunteer)''::app_role' or ${TEXT} like '%current_user_role()%')
 order by tablename, policyname`;
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});
const rows = await res.json();
if (!Array.isArray(rows)) throw new Error(`query failed (${res.status}): ${JSON.stringify(rows).slice(0, 500)}`);

const byTable = new Map();
for (const r of rows) byTable.set(r.tablename, [...(byTable.get(r.tablename) ?? []), r.policyname]);
const named = (r) => ["management", "staff", "vet", "admin", "volunteer"].filter((k) => r[k]).concat(r.bare ? ["current_user_role()"] : []);
const tally = new Map();
for (const r of rows) for (const k of named(r)) tally.set(k, (tally.get(k) ?? 0) + 1);
const tallyLine = [...tally].map(([k, n]) => `${k} ${n}`).join(", ") || "none";

let fails = 0;
const fail = (s) => { fails++; console.log(`FAIL  ${s}`); };

// Scope functions beside a cell. USING and WITH CHECK are judged apart: each must hold on its own.
const scopeQuery = `
select tablename, policyname, cmd, qual, with_check
  from pg_policies
 where schemaname = 'public'
   and ${TEXT} ~* '(sees_all_[a-z_]+|has_shelter_floor)\\s*\\('
 order by tablename, policyname`;
const scopeRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: scopeQuery }),
});
const scopeRows = await scopeRes.json();
if (!Array.isArray(scopeRows)) throw new Error(`scope query failed (${scopeRes.status}): ${JSON.stringify(scopeRows).slice(0, 500)}`);
let scopeBad = 0;
const scopeSeen = new Set();
for (const r of scopeRows) {
  const key = `${r.tablename}.${r.policyname}`;
  const loose = [["using", r.qual], ["with check", r.with_check]]
    .flatMap(([clause, t]) => (t ? unguardedScopeCalls(t).map((fn) => `${fn}() in ${clause}`) : []));
  if (!loose.length) continue;
  if (SCOPE_DELIBERATE[key]) {
    scopeSeen.add(key);
    console.log(`deliberate  ${key} (${r.cmd}): ${loose.join(", ")}\n    why: ${SCOPE_DELIBERATE[key]}`);
    continue;
  }
  scopeBad++;
  fail(`${key} (${r.cmd}) calls ${loose.join(", ")} with no has_permission() ANDed beside it, so public_viewer passes it: add the cell, or put the policy in SCOPE_DELIBERATE with why`);
}
for (const k of Object.keys(SCOPE_DELIBERATE)) if (!scopeSeen.has(k)) fail(`${k} is in SCOPE_DELIBERATE but no longer fails the scope walk, or is gone: remove it`);
const fnCount = new Set(scopeRows.flatMap((r) => [...`${r.qual ?? ""} ${r.with_check ?? ""}`.matchAll(/\b(sees_all_[a-z_]+|has_shelter_floor)\s*\(/gi)].map((m) => m[1])));
console.log(`${scopeRows.length} policies call a scope function (${[...fnCount].sort().join(", ") || "none"}); ${scopeRows.length - scopeBad - scopeSeen.size} with a cell ANDed beside every call, ${scopeSeen.size} deliberate, ${scopeBad} without`);

if (final) {
  if (rows.length === 0) console.log("ok    no policy names an app_role value or calls current_user_role()");
  else for (const [t, p] of byTable) fail(`${t} still names a role: ${p.join(", ")}`);
} else {
  for (const [t, p] of byTable) if (!OWNERS[t]) fail(`${t} names a role and nothing owns it (${p.join(", ")}): add it to OWNERS and to §15`);
  for (const t of Object.keys(OWNERS)) if (!byTable.has(t)) fail(`${t} is listed as owned by ${OWNERS[t]} but no policy on it names a role any more: remove it from OWNERS and §15`);

  // §15 must say the same thing, in words a reader can find.
  const paper = readFileSync(join(root, "docs/roles-and-permissions.md"), "utf8");
  const at = paper.indexOf("### Where the orphans landed");
  if (at < 0) fail("§15 has no '### Where the orphans landed' section");
  else {
    const next = paper.indexOf("\n## ", at);
    const section = paper.slice(at, next < 0 ? undefined : next);
    for (const t of Object.keys(OWNERS)) if (!section.includes(`\`${t}\``)) fail(`${t} is owned in OWNERS but §15's "Where the orphans landed" does not name it`);
  }

  const owners = new Map();
  for (const [t, p] of byTable) if (OWNERS[t]) owners.set(OWNERS[t], [...(owners.get(OWNERS[t]) ?? []), `${t} (${p.length})`]);
  console.log(`${rows.length} policies on ${byTable.size} tables still name a role (${tallyLine}); each has an owner:`);
  for (const [o, ts] of owners) console.log(`  ${o}: ${ts.length} tables, ${ts.reduce((n, s) => n + Number(s.match(/\((\d+)\)$/)[1]), 0)} policies`);
}
console.log(fails ? `\nRESULT: RED (${fails})` : final ? "\nRESULT: GREEN (the end state; every scope function has a cell beside it)" : "\nRESULT: GREEN (every remaining role-named policy has an owner, and §15 says so; every scope function has a cell beside it)");
process.exitCode = fails ? 1 : 0;
