// diets-servings-app: the forecast agrees with the per-serving shape the app now writes.
// Against DEV only, one transaction that is always rolled back.
//
//   node scripts/check-diets-servings-app.mjs
//
// Builds a throwaway diet (50 g of an ingredient per serving, servings 1 / 1.5 / 2.5 as the app's
// saveServings writes them: qty_* = amount x servings), puts a Small, a Medium and a Large dog on it
// for 7 days (the Large dog at portion_factor 0.75), and compares diet_forecast() with the hand
// calculation: 50x1x7 + 50x1.5x7 + 50x2.5x0.75x7 = 350 + 525 + 656.25 = 1531.25 g.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const harness = `
begin;
create temp table res (k text, v text);
do $t$
declare
  v_admin uuid; v_ing uuid; v_diet uuid; v_s uuid; v_m uuid; v_l uuid; v_before numeric; v_after numeric;
begin
  select ur.user_id into v_admin from user_roles ur join roles r on r.id = ur.role_id
   where r.key = 'admin' and ur.archived_at is null limit 1;
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  select id into v_ing from diet_types where unit = 'g' order by name limit 1;
  select r.id into v_s from residents r join resident_current_state s on s.resident_id = r.id where s.current_status <> 'Deceased' and r.size = 'Small' limit 1;
  select r.id into v_m from residents r join resident_current_state s on s.resident_id = r.id where s.current_status <> 'Deceased' and r.size = 'Medium' limit 1;
  -- dev has no Large resident on record, so one is made Large inside this rolled-back transaction.
  select r.id into v_l from residents r join resident_current_state s on s.resident_id = r.id where s.current_status <> 'Deceased' and r.id not in (v_s, v_m) limit 1;
  update residents set size = 'Large' where id = v_l;
  insert into res values ('sizes_found', (v_s is not null and v_m is not null and v_l is not null)::text);
  insert into diets (name, servings_small, servings_medium, servings_large) values ('ZZ proof servings', 1, 1.5, 2.5) returning id into v_diet;
  select coalesce(quantity, 0) into v_before from diet_forecast(date '2026-10-19', date '2026-10-25') where diet_type_id = v_ing;
  insert into diet_ingredients (diet_id, diet_type_id, qty_per_serving)
    values (v_diet, v_ing, 50);
  insert into resident_diets (resident_id, diet_id, start_date, end_date) values
    (v_s, v_diet, date '2026-10-19', date '2026-10-25'),
    (v_m, v_diet, date '2026-10-19', date '2026-10-25');
  insert into resident_diets (resident_id, diet_id, start_date, end_date, portion_factor)
    values (v_l, v_diet, date '2026-10-19', date '2026-10-25', 0.75);
  select coalesce(quantity, 0) into v_after from diet_forecast(date '2026-10-19', date '2026-10-25') where diet_type_id = v_ing;
  insert into res values ('delta', (v_after - coalesce(v_before, 0))::text);
end $t$;
do $o$ begin raise exception 'HARNESS-RESULT %', (select json_agg(row_to_json(res)) from res); end $o$;
rollback;`;

const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: harness }),
});
const text = await r.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
const m = /HARNESS-RESULT (.*)/.exec(msg);
if (!m) throw new Error(`no result (status ${r.status}): ${msg.slice(0, 2000)}`);
const rows = JSON.parse(m[1]);
const get = (k) => rows.find((x) => x.k === k)?.v;
let fails = 0;
const check = (ok, what) => { console.log(`${ok ? "ok   " : "FAIL "} ${what}`); if (!ok) fails++; };
check(get("sizes_found") === "true", "dev has a Small, a Medium and a further resident");
check(Number(get("delta")) === 1531.25, `forecast delta ${get("delta")} g = hand calculation 1531.25 g`);
process.exit(fails ? 1 : 0);
