// The conversion ends on a query, not a prefix: no pg_policies row whose text names
// 'management'::app_role or 'staff'::app_role (decisions/2026-10-05-perm-convert-orphans.md;
// the lesson of the nine policies perm-convert-medical's `management_%` sweep missed).
//
//   node scripts/check-policy-role-names.mjs            (from the repo root; dev only)
//   node scripts/check-policy-role-names.mjs --final    (the end state: any row at all is a failure)
//
// A read-only query. Two modes:
//
//   default   every table that still has such a policy must be OWNED below, by the stream that converts
//             it, and every owned table must still have one. So a new role-named policy anywhere fails
//             this until someone says who converts it; and a table converted by one stream cannot stay on
//             the list. The owners are also checked against docs/roles-and-permissions.md §15, "Where the
//             orphans landed": a table there and not here, or here and not there, fails.
//   --final   the assertion perm-drop-enum waits on: zero rows. perm-convert-settings, the last stream,
//             runs this and empties OWNERS in the same change.
//
// Matches on the text, not the policy name: a name prefix is what missed these.
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
export const OWNERS = {
  attachments: "photo split (A3 / A5)",
  maintenance_photos: "photo split (A3 / A5)",
  project_photos: "photo split (A3 / A5)",
};

const query = `
select tablename, policyname, cmd
  from pg_policies
 where schemaname = 'public'
   and ((coalesce(qual, '') || coalesce(with_check, '')) like '%''management''::app_role%'
     or (coalesce(qual, '') || coalesce(with_check, '')) like '%''staff''::app_role%')
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

let fails = 0;
const fail = (s) => { fails++; console.log(`FAIL  ${s}`); };

if (final) {
  if (rows.length === 0) console.log("ok    no policy names 'management'::app_role or 'staff'::app_role");
  else for (const [t, p] of byTable) fail(`${t} still names management or staff: ${p.join(", ")}`);
} else {
  for (const [t, p] of byTable) if (!OWNERS[t]) fail(`${t} names management or staff and nothing owns it (${p.join(", ")}): add it to OWNERS and to §15`);
  for (const t of Object.keys(OWNERS)) if (!byTable.has(t)) fail(`${t} is listed as owned by ${OWNERS[t]} but no policy on it names management or staff any more: remove it from OWNERS and §15`);

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
  console.log(`${rows.length} policies on ${byTable.size} tables still name management or staff; each has an owner:`);
  for (const [o, ts] of owners) console.log(`  ${o}: ${ts.join(", ")}`);
}
console.log(fails ? `\nRESULT: RED (${fails})` : final ? "\nRESULT: GREEN (the end state)" : "\nRESULT: GREEN (every remaining role-named policy has an owner, and §15 says so)");
process.exitCode = fails ? 1 : 0;
