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
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const final = process.argv.includes("--final");
const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

// table -> the stream that converts it. Remove an entry in the PR that converts the table.
// What is left after perm-convert-admin (0153) is the vet's: its policies never ask a cell (0135, "Last"),
// and converting them is blocked on whether the vet keeps the paper's reference-data cells while on hold.
const VET = "perm-convert-vet";
export const OWNERS = Object.fromEntries([
  "adoption_updates", "attachments", "blood_test_types", "blood_tests", "bulk_appointments", "diet_types",
  "enclosures", "frequency", "immunization_records", "immunization_types", "medication", "placement_history",
  "prescriptions", "procedure_types", "procedures", "recurring_job_assignees", "recurring_job_occurrence_assignees",
  "recurring_job_occurrences", "recurring_jobs", "resident_diets", "residents", "shelter_friends", "translations",
  "vet_appointments", "vet_doctor_clinics", "vet_doctors", "vets", "weight", "zones",
].map((t) => [t, VET]));

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
console.log(fails ? `\nRESULT: RED (${fails})` : final ? "\nRESULT: GREEN (the end state)" : "\nRESULT: GREEN (every remaining role-named policy has an owner, and §15 says so)");
process.exitCode = fails ? 1 : 0;
