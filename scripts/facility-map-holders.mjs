// Read-only: which roles hold facility.map, and does each also hold facility.enclosures at Read or better?
// A role holding facility.map WITHOUT facility.enclosures would lose its route to the enclosures area when
// migration 0212 retires facility.map. Expected: none. Writes nothing.
//   node scripts/facility-map-holders.mjs [--env production]
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";
import { exitWith } from "./lib/exit.mjs";

const { name: envName } = parseEnvArg(process.argv.slice(2));
const env = loadEnv(envName);
const ref = projectRef(env);
const sql = `select r.key as role,
  (select level from role_permissions where role_id = r.id and activity = 'facility.map') as map_level,
  (select level from role_permissions where role_id = r.id and activity = 'facility.enclosures') as enclosures_level,
  exists (select 1 from role_extras where role_id = r.id and activity = 'facility.map') as map_is_an_extra
  from roles r
  where exists (select 1 from role_permissions where role_id = r.id and activity = 'facility.map')
     or exists (select 1 from role_extras where role_id = r.id and activity = 'facility.map')
  order by r.key`;
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
if (!res.ok) { console.error(await res.text()); await exitWith(1); throw new Error("query failed"); }
const rows = await res.json();
console.table(rows);
const stranded = rows.filter((r) => !r.enclosures_level);
console.log(`Environment: ${envName}. Roles holding facility.map: ${rows.length}. Without facility.enclosures at Read: ${stranded.length}${stranded.length ? " -> " + stranded.map((r) => r.role).join(", ") + "  (DO NOT APPLY 0212)" : " (safe to retire)"}`);
await exitWith(stranded.length ? 1 : 0);
