// #ctlg8: neither shared card-catalogue table (card_grants, card_includes) may be writable by any login.
//
//   node scripts/check-card-catalogue-writes.mjs [--env test|production]     (read-only; needs SUPABASE_ACCESS_TOKEN, so NOT in the PR check job)
//
// Fails if either table has a PERMISSIVE policy for insert, update, delete or all, if row security is off, or if anon/authenticated
// hold an insert/update/delete privilege. Restrictive policies are ignored (they can only narrow). Reads are not asserted away.
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";
import { exitWith } from "./lib/exit.mjs";

const { name: envName } = parseEnvArg(process.argv.slice(2));
const env = loadEnv(envName);
const ref = projectRef(env);
const token = env.SUPABASE_ACCESS_TOKEN;
if (!ref || !token) {
  console.error("check-card-catalogue-writes: need the project and SUPABASE_ACCESS_TOKEN. Nothing was read.");
  process.exit(2);
}
async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return text ? JSON.parse(text) : [];
}
console.log(`Read-only check on ${envName} (${ref}).\n`);
const T = "'card_grants','card_includes'";
let failed = 0;

const pol = await query(`select tablename, policyname, cmd from pg_policies
  where schemaname='public' and tablename in (${T}) and permissive='PERMISSIVE' and cmd in ('INSERT','UPDATE','DELETE','ALL')`);
for (const p of pol) { failed++; console.log(`FAIL ${p.tablename} has a permissive ${p.cmd} policy ${p.policyname}: a login could write the shared catalogue.`); }
if (!pol.length) console.log("ok   no permissive insert/update/delete/all policy on either table.");

const rls = await query(`select relname from pg_class where relnamespace='public'::regnamespace and relname in (${T}) and not relrowsecurity`);
for (const r of rls) { failed++; console.log(`FAIL row security is off on ${r.relname}.`); }
if (!rls.length) console.log("ok   row security is on for both tables.");

const grants = await query(`select table_name, grantee, privilege_type from information_schema.role_table_grants
  where table_schema='public' and table_name in (${T}) and grantee in ('anon','authenticated') and privilege_type in ('INSERT','UPDATE','DELETE')`);
for (const g of grants) { failed++; console.log(`FAIL ${g.grantee} holds ${g.privilege_type} on ${g.table_name}.`); }
if (!grants.length) console.log("ok   anon and authenticated hold no write privilege on either table.");

await exitWith(failed ? 1 : 0);
