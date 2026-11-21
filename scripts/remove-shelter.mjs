// Remove ONE inert shelter, named by its key. Read-only unless --apply is given.
//
//   node scripts/remove-shelter.mjs --env production test123            dry run: counts every row that points at it
//   node scripts/remove-shelter.mjs --env production test123 --apply     deletes the shelter row, in one transaction
//
// WHAT "INERT" MEANS: no row, in ANY public table that carries shelter_id (the list is read from the catalogue
// each run, not hard-coded), points at the shelter, other than its own credentials rows (the two ON DELETE
// CASCADE tables, which are printed). That covers web addresses (shelter_hosts, ON DELETE RESTRICT), roles,
// logins (user_roles), receipts and content. Every other foreign key to shelters(id) is NO ACTION, so a
// delete would fail on the first row anyway; this refuses first and says how many of each.
// REFUSES: `lanna` by name, more than one shelter, an unknown key, an uninert shelter.
// Changes no schema (docs/decisions/2026-11-21-remove-one-shelter-script.md).
import { parseEnvArg, loadEnv, projectRef } from "./lib/env.mjs";
import { exitWith } from "./lib/exit.mjs";

const PROTECTED = ["lanna"];
const CASCADE_OK = ["shelter_calendar_credentials", "shelter_drive_credentials"];

const { name: envName, rest } = parseEnvArg(process.argv.slice(2));
const apply = rest.includes("--apply");
const keys = rest.filter((a) => !a.startsWith("--"));
const stop = (m, c = 2) => { console.error(m); return c; };

async function main() {
  if (!process.argv.includes("--env")) return stop("Name the environment: --env test|uat|production.");
  if (keys.length !== 1) return stop(`Give exactly one shelter key (got ${keys.length}).`);
  const key = keys[0];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(key)) return stop(`"${key}" is not a shelter key.`);
  if (PROTECTED.includes(key)) return stop(`REFUSED: "${key}" is the live shelter and is never removed by this script.`, 1);

  const env = loadEnv(envName);
  const ref = projectRef(env);
  console.log(`${apply ? "APPLY" : "Read-only"} on ${envName} (project ${ref}), shelter "${key}".\n`);
  const q = async (query) => {
    const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const t = await r.text();
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${t.slice(0, 300)}`);
    return JSON.parse(t);
  };

  const found = await q(`select id, name, created_at from public.shelters where key = '${key}'`);
  if (found.length !== 1) return stop(`No shelter with key "${key}" on ${ref}.`);
  const { id, name } = found[0];
  console.log(`Found: ${name} (${id}), created ${found[0].created_at}.`);

  const tables = (await q(`select c.table_name t from information_schema.columns c join information_schema.tables x using (table_schema, table_name)
    where c.table_schema='public' and c.column_name='shelter_id' and x.table_type='BASE TABLE' order by 1`)).map((r) => r.t);
  const counts = await q(tables.map((t) => `select '${t}' t, count(*)::int n from public."${t}" where shelter_id='${id}'`).join(" union all "));
  const blocking = counts.filter((r) => r.n > 0 && !CASCADE_OK.includes(r.t));
  const cascading = counts.filter((r) => r.n > 0 && CASCADE_OK.includes(r.t));
  console.log(`Checked ${tables.length} tables carrying shelter_id.`);
  for (const r of cascading) console.log(`  will go with it (ON DELETE CASCADE): ${r.t} ${r.n}`);
  if (blocking.length) {
    console.log("\nREFUSED: not inert. Rows still pointing at it:");
    for (const r of blocking) console.log(`  ${r.t}: ${r.n}`);
    return 1;
  }
  console.log("Inert: no rows in any other table.");
  if (!apply) { console.log("\nDry run: nothing changed. Add --apply to delete the shelter row."); return 0; }

  // Re-check and delete in one statement-level transaction; key AND id must still match, one row only.
  const del = await q(`with d as (delete from public.shelters where id='${id}' and key='${key}' returning 1) select count(*)::int n from d`);
  if (del[0].n !== 1) return stop(`Delete removed ${del[0].n} rows (expected 1).`, 1);
  const left = await q(`select count(*)::int n from public.shelters where id='${id}'`);
  console.log(`\nDeleted "${key}". Rows left with that id: ${left[0].n}.`);
  return 0;
}
const code = await main();
await exitWith(typeof code === "number" ? code : 0);
