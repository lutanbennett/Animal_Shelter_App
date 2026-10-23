// diets-proportion: lists every diet ingredient line whose Medium and Large amounts are not in the diet's own
// proportion to Small (default 1 : 1.5 : 2). Read-only: one `begin ... rollback`, nothing is changed.
//
//   node scripts/check-diets-proportion.mjs                      (dev)
//   node scripts/check-diets-proportion.mjs --env production     (the real list; read before a deploy)
//
// Exits 1 when there are any, 0 when there are none. This is the list 0250's `do $report$` block raises as NOTICEs,
// which never reach anyone: apply-migrations.mjs goes through the Management API, and that does not return notices
// (docs/decisions/2026-10-23-migration-notices-are-invisible.md).
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { loadEnv, projectRef, parseEnvArg } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const { name } = parseEnvArg(process.argv.slice(2));
const env = loadEnv(name);
const ref = projectRef(env);

const query = `begin;
do $o$ begin raise exception 'HARNESS-RESULT %', (
  select coalesce(json_agg(json_build_object(
    'diet', d.name, 'ingredient', dt.name, 'unit', di.serving_unit,
    's', di.qty_small, 'm', di.qty_medium, 'l', di.qty_large,
    'want_m', round(d.servings_medium / d.servings_small * di.qty_small, 3),
    'want_l', round(d.servings_large / d.servings_small * di.qty_small, 3),
    'sv_m', d.servings_medium / d.servings_small, 'sv_l', d.servings_large / d.servings_small
  ) order by d.name, dt.name), '[]')
  from diet_ingredients di join diets d on d.id = di.diet_id join diet_types dt on dt.id = di.diet_type_id
  where abs(di.qty_medium - d.servings_medium / d.servings_small * di.qty_small) > 0.005
     or abs(di.qty_large - d.servings_large / d.servings_small * di.qty_small) > 0.005
); end $o$;
rollback;`;

const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});
const text = await r.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
const m = /HARNESS-RESULT (.*)/.exec(msg);
if (!m) throw new Error(`no result (status ${r.status}): ${msg.slice(0, 1500)}`);
const rows = JSON.parse(m[1]);

const n = (x) => String(Number(x));
console.log(`Diet ingredient lines out of proportion on ${name} (${ref}): ${rows.length}\n`);
for (const x of rows) {
  const ratio = (v) => (Number(x.s) ? n(Math.round((Number(v) / Number(x.s)) * 100) / 100) : "?");
  console.log(`${x.diet} / ${x.ingredient} (${x.unit ?? "no unit"})`);
  console.log(`   Small ${n(x.s)}   Medium ${n(x.m)}   Large ${n(x.l)}   = 1 : ${ratio(x.m)} : ${ratio(x.l)}  (this diet's servings expect 1 : ${n(x.sv_m)} : ${n(x.sv_l)})`);
  console.log(`   In proportion, Medium would be ${n(x.want_m)} and Large ${n(x.want_l)}`);
}
if (rows.length) {
  console.log(`\n${rows.length} line(s) need a ruling: keep the shape as it is, or correct the amounts.`);
  process.exitCode = 1;
} else {
  console.log("Every line is in proportion.");
}
