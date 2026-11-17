// Fails when a public base table has no shelter_id and is not recorded in docs/tenancy-shared-tables-registry.json, or a record is stale.
// Reads the live catalogue through the Management API (like check-tenancy-catalogue.mjs), so it needs SUPABASE_ACCESS_TOKEN.
//   node scripts/check-tenancy-shared-tables.mjs [--env test|uat|production]
import fs from "node:fs";
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";

const { name } = parseEnvArg(process.argv.slice(2));
const env = loadEnv(name);
if (!env.SUPABASE_ACCESS_TOKEN) { console.error("SUPABASE_ACCESS_TOKEN is required. NOT CHECKED."); process.exit(2); }
const query = `select c.relname as name, exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname = 'shelter_id' and not a.attisdropped) as scoped
  from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r','p') order by 1`;
const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef(env)}/database/query`, {
  method: "POST", headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ query }),
});
const rows = await res.json();
if (!res.ok || !Array.isArray(rows) || !rows.length) { console.error(`catalogue read failed (HTTP ${res.status}). NOT CHECKED.`); process.exit(2); }
const reg = JSON.parse(fs.readFileSync("docs/tenancy-shared-tables-registry.json", "utf8")).tables;
const unscoped = rows.filter((r) => !r.scoped).map((r) => r.name);
const bad = [];
for (const t of unscoped) if (!reg[t]) bad.push(`UNRECORDED  ${t}: no shelter_id and not in the registry`);
for (const [t, why] of Object.entries(reg)) {
  const row = rows.find((r) => r.name === t);
  if (!row) bad.push(`STALE  ${t}: no such table; delete its record`);
  else if (row.scoped) bad.push(`STALE  ${t}: now has shelter_id; delete its record`);
  if (!why || why.length < 10) bad.push(`NO REASON  ${t}`);
}
console.log(`${rows.length - unscoped.length} scoped, ${unscoped.length} unscoped, ${Object.keys(reg).length} recorded`);
bad.forEach((b) => console.log(b));
console.log(bad.length ? "NOT CLEAN" : "every unscoped table is recorded");
process.exit(bad.length ? 1 : 0);
