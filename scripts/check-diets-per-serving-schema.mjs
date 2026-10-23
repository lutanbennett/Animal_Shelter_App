// diets-per-serving-schema (0250): the forecasts do not move, the back-fill is the Small amount, and a recipe in
// exact proportion forecasts the same under the new shape as under the old one.
// Against DEV only, one transaction that is always rolled back; it applies 0250's own text inside that
// transaction, so it works before and after the file is applied for real.
//
//   node scripts/check-diets-per-serving-schema.mjs            (from the repo root; dev only)
//
//   before/after  diet_forecast and stock_diet_forecast, over one month and over every date the data covers,
//                 are compared row by row before and after the migration text runs (the file leaves them alone)
//   back-fill     every line has qty_per_serving = qty_small / servings_small; servings default to 1 / 1.5 / 2
//   proportion    a recipe in exact proportion (cups, converted): the old forecast equals
//                 qty_per_serving x servings(size) x portion_factor x conversion, for the dog's size
//   bridge        an edit to Small re-derives the serving; an explicit serving is left alone
//   out of line   prints every line whose Medium/Large are not 1.5x / 2x Small (within 0.005)
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync("supabase/migrations/0250_diets_one_amount_per_serving.sql", "utf8");

const harness = `
begin;
create temp table res (k text, v text);
do $setup$
declare v_admin uuid;
begin
  select ur.user_id into v_admin from user_roles ur join roles r on r.id = ur.role_id
   where r.key = 'admin' and ur.archived_at is null limit 1;
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated', 'aal', 'aal1')::text, true);
end $setup$;

create temp table b_month as select * from diet_forecast(date '2026-10-01', date '2026-10-31');
create temp table b_all   as select * from diet_forecast(date '2000-01-01', date '2100-01-01');
create temp table bs_month as select * from stock_diet_forecast(date '2026-10-01', date '2026-10-31');
create temp table bs_all   as select * from stock_diet_forecast(date '2000-01-01', date '2100-01-01');

${migration}

do $cmp$
declare n_diff int; t text;
begin
  foreach t in array array['month', 'all'] loop
    execute format($q$select count(*) from (
      select 1 from b_%1$s b full join diet_forecast(%2$s) a on a.diet_type_id = b.diet_type_id
      where b.diet_type_id is null or a.diet_type_id is null
         or b.diet_count <> a.diet_count or b.resident_count <> a.resident_count
         or abs(b.quantity - a.quantity) > 1e-9 or abs(coalesce(b.cost, 0) - coalesce(a.cost, 0)) > 1e-9) x$q$, t,
      case t when 'month' then $$date '2026-10-01', date '2026-10-31'$$ else $$date '2000-01-01', date '2100-01-01'$$ end) into n_diff;
    insert into res values ('forecast_diff_' || t, n_diff::text);
    execute format($q$select count(*) from (
      select 1 from bs_%1$s b full join stock_diet_forecast(%2$s) a on a.diet_type_id = b.diet_type_id
      where b.diet_type_id is null or a.diet_type_id is null
         or b.diet_count <> a.diet_count or b.resident_count <> a.resident_count
         or abs(b.quantity - a.quantity) > 1e-9) x$q$, t,
      case t when 'month' then $$date '2026-10-01', date '2026-10-31'$$ else $$date '2000-01-01', date '2100-01-01'$$ end) into n_diff;
    insert into res values ('stock_forecast_diff_' || t, n_diff::text);
  end loop;
  insert into res select 'null_servings', count(*)::text from diet_ingredients where qty_per_serving is null;
  insert into res select 'backfill_wrong', count(*)::text from diet_ingredients di join diets d on d.id = di.diet_id
    where abs(di.qty_per_serving - di.qty_small / d.servings_small) > 1e-12;
  insert into res select 'default_servings_wrong', count(*)::text from diets
    where servings_small <> 1 or servings_medium <> 1.5 or servings_large <> 2;
  insert into res select 'lines', count(*)::text from diet_ingredients;
  insert into res select 'out_of_proportion', coalesce(json_agg(json_build_object('diet', d.name, 'ingredient', dt.name, 's', di.qty_small, 'm', di.qty_medium, 'l', di.qty_large) order by d.name, dt.name), '[]')::text
    from diet_ingredients di join diets d on d.id = di.diet_id join diet_types dt on dt.id = di.diet_type_id
    where abs(di.qty_medium - d.servings_medium / d.servings_small * di.qty_small) > 0.005
       or abs(di.qty_large - d.servings_large / d.servings_small * di.qty_small) > 0.005;
end $cmp$;

-- A recipe in exact proportion (cups; small 2 / medium 3 / large 4 = 2 per serving at 1 / 1.5 / 2) on a live dog.
do $prop$
declare
  rd record; v_diet uuid; v_k uuid; v_from date; v_to date; got numeric; want numeric; sz resident_size; f numeric; srv numeric;
begin
  select x.* into rd from resident_diets x
    join residents r on r.id = x.resident_id
    join resident_current_state s on s.resident_id = x.resident_id
   where s.current_status not in ('Deceased', 'Adopted', 'Fostered') and x.end_date is null
   order by x.start_date limit 1;
  if rd.id is null then insert into res values ('prop_skipped', 'no live resident_diets row'); return; end if;
  select coalesce(size, 'Medium') into sz from residents where id = rd.resident_id;
  f := coalesce(rd.portion_factor, 1);
  v_from := greatest(rd.start_date, date '2026-10-01'); v_to := v_from + 9;
  insert into diet_types (name, unit, cost_per_unit)
    values ('H-kibble', 'kg', 50) returning id into v_k;
  insert into item_unit_conversions (item_kind, diet_type_id, unit, base_units_per) values ('diet_type', v_k, 'cup', 0.1);
  insert into diets (name) values ('H-exact') returning id into v_diet;
  insert into diet_ingredients (diet_id, diet_type_id, serving_unit, qty_small, qty_medium, qty_large)
    values (v_diet, v_k, 'cup', 2, 3, 4);
  update resident_diets set diet_id = v_diet, start_date = least(start_date, v_from) where id = rd.id;
  insert into res select 'prop_serving_filled', qty_per_serving::text from diet_ingredients where diet_id = v_diet;
  srv := (select case sz when 'Small' then servings_small when 'Large' then servings_large else servings_medium end from diets where id = v_diet);
  -- the new shape: qty_per_serving x servings(size) x portion_factor x conversion, over 10 days
  want := 10 * (select qty_per_serving from diet_ingredients where diet_id = v_diet) * srv * f * 0.1;
  select quantity into got from diet_forecast(v_from, v_to) where diet_type_id = v_k;
  insert into res values ('prop_forecast', case when abs(got - want) < 1e-9 then 'ok' else format('old %s new %s', got, want) end);
  select quantity into got from stock_diet_forecast(v_from, v_to) where diet_type_id = v_k;
  insert into res values ('prop_stock_forecast', case when abs(got - want) < 1e-9 then 'ok' else format('old %s new %s', got, want) end);

  -- bridge: an edit to Small re-derives the serving; an explicit serving is left alone
  update diet_ingredients set qty_small = 4 where diet_id = v_diet;
  insert into res select 'bridge_edit', qty_per_serving::text from diet_ingredients where diet_id = v_diet;
  update diet_ingredients set qty_small = 5, qty_per_serving = 9 where diet_id = v_diet;
  insert into res select 'bridge_explicit', qty_per_serving::text from diet_ingredients where diet_id = v_diet;
end $prop$;

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

let fails = 0, ok = 0;
const check = (k, want, what) => {
  const v = get(k);
  if (v === want || (v !== undefined && !isNaN(Number(v)) && !isNaN(Number(want)) && Number(v) === Number(want))) { ok++; console.log(`ok    ${what} (${v})`); } else { fails++; console.log(`FAIL  ${what} - got ${v}`); }
};
for (const t of ["month", "all"]) {
  check(`forecast_diff_${t}`, "0", `diet_forecast identical before/after (${t})`);
  check(`stock_forecast_diff_${t}`, "0", `stock_diet_forecast identical before/after (${t})`);
}
check("null_servings", "0", `every one of ${get("lines")} lines has qty_per_serving`);
check("backfill_wrong", "0", "qty_per_serving = qty_small / servings_small");
check("default_servings_wrong", "0", "servings default to 1 / 1.5 / 2");
if (get("prop_skipped")) console.log(`NOTE  proportion checks skipped: ${get("prop_skipped")}`);
else {
  check("prop_serving_filled", "2", "an exact-proportion recipe gets serving 2 (small 2)");
  check("prop_forecast", "ok", "diet_forecast equals the per-serving formula for a recipe in exact proportion");
  check("prop_stock_forecast", "ok", "stock_diet_forecast equals it too");
  check("bridge_edit", "4", "an edit to Small re-derives the serving");
  check("bridge_explicit", "9", "an explicit serving is left alone");
}
const out = JSON.parse(get("out_of_proportion") ?? "[]");
console.log(`\n${out.length} line(s) not in 1 : 1.5 : 2 proportion (each is Lutan's call):`);
for (const o of out) console.log(`  ${o.diet} / ${o.ingredient}: small ${o.s}, medium ${o.m}, large ${o.l}`);
console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN");
process.exitCode = fails ? 1 : 0;
