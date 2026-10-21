// diets-recipes-schema (0239): the back-fill changes no forecast, and a recipe expands into ingredients.
// Against DEV only, one transaction that is always rolled back; it applies 0239's own text inside that
// transaction, so it works before and after the file is applied for real.
//
//   node scripts/check-diets-recipes-schema.mjs            (from the repo root; dev only)
//
//   before/after  diet_forecast and stock_diet_forecast, over one month and over every date the data covers,
//                 are compared row by row (quantity to 1e-9, counts exactly, cost exactly) before and after the
//                 migration text runs
//   recipe        a three-ingredient recipe in cups, converted to kg, expands to each ingredient's own line
//   guards        a serving unit with no conversion is refused; the old-app bridge fills diet_id
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync("supabase/migrations/0239_diets_are_recipes.sql", "utf8");

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
declare
  n_rows int; n_diff int; t text; s text;
begin
  foreach t in array array['month', 'all'] loop
    execute format($q$select count(*) from b_%1$s$q$, t) into n_rows;
    insert into res values ('forecast_rows_' || t, n_rows::text);
    execute format($q$select count(*) from (
      select coalesce(b.diet_type_id, a.diet_type_id) from b_%1$s b
      full join diet_forecast(%2$s) a on a.diet_type_id = b.diet_type_id
      where b.diet_type_id is null or a.diet_type_id is null
         or b.diet_count <> a.diet_count or b.resident_count <> a.resident_count
         or abs(b.quantity - a.quantity) > 1e-9
         or abs(coalesce(b.cost, 0) - coalesce(a.cost, 0)) > 1e-9) x$q$, t,
      case t when 'month' then $$date '2026-10-01', date '2026-10-31'$$ else $$date '2000-01-01', date '2100-01-01'$$ end)
      into n_diff;
    insert into res values ('forecast_diff_' || t, n_diff::text);
    execute format($q$select count(*) from (
      select 1 from bs_%1$s b
      full join stock_diet_forecast(%2$s) a on a.diet_type_id = b.diet_type_id
      where b.diet_type_id is null or a.diet_type_id is null
         or b.diet_count <> a.diet_count or b.resident_count <> a.resident_count
         or abs(b.quantity - a.quantity) > 1e-9) x$q$, t,
      case t when 'month' then $$date '2026-10-01', date '2026-10-31'$$ else $$date '2000-01-01', date '2100-01-01'$$ end)
      into n_diff;
    insert into res values ('stock_forecast_diff_' || t, n_diff::text);
  end loop;
  insert into res select 'diet_types', count(*)::text from diet_types;
  insert into res select 'diets', count(*)::text from diets;
  insert into res select 'diet_ingredients', count(*)::text from diet_ingredients;
  insert into res select 'resident_diets_without_recipe', count(*)::text from resident_diets where diet_id is null;
  insert into res select 'standard_flag_mismatch', count(*)::text from diet_types dt join diets d on d.name = dt.name where dt.is_standard <> d.is_standard;
end $cmp$;

-- Recipe expansion: re-point one live diet row at a new three-ingredient recipe in cups.
do $recipe$
declare
  rd record; v_diet uuid; v_k uuid; v_c uuid; v_r uuid;
  v_from date; v_to date; got numeric; want numeric; sz resident_size; q numeric[]; f numeric;
begin
  select x.* into rd from resident_diets x
    join residents r on r.id = x.resident_id
    join resident_current_state s on s.resident_id = x.resident_id
   where s.current_status not in ('Deceased', 'Adopted', 'Fostered') and x.end_date is null
   order by x.start_date limit 1;
  if rd.id is null then insert into res values ('recipe_skipped', 'no live resident_diets row'); return; end if;
  select coalesce(size, 'Medium') into sz from residents where id = rd.resident_id;
  f := coalesce(rd.portion_factor, 1);
  v_from := greatest(rd.start_date, date '2026-10-01'); v_to := v_from + 9;

  insert into diet_types (name, unit, cost_per_unit, daily_qty_small, daily_qty_medium, daily_qty_large)
    values ('H-kibble', 'kg', 50, 1, 1, 1), ('H-chicken', 'kg', 120, 1, 1, 1), ('H-rice', 'kg', 30, 1, 1, 1);
  select id into v_k from diet_types where name = 'H-kibble';
  select id into v_c from diet_types where name = 'H-chicken';
  select id into v_r from diet_types where name = 'H-rice';
  insert into item_unit_conversions (item_kind, diet_type_id, unit, base_units_per) values
    ('diet_type', v_k, 'cup', 0.1), ('diet_type', v_c, 'cup', 0.15), ('diet_type', v_r, 'cup', 0.2);
  insert into diets (name) values ('H-standard') returning id into v_diet;
  insert into diet_ingredients (diet_id, diet_type_id, serving_unit, qty_small, qty_medium, qty_large) values
    (v_diet, v_k, 'cup', 1, 1, 1), (v_diet, v_c, 'cup', 1.5, 1.5, 1.5), (v_diet, v_r, 'CUP', 1.5, 1.5, 1.5);
  update resident_diets set diet_id = v_diet, start_date = least(start_date, v_from) where id = rd.id;

  select quantity into got from diet_forecast(v_from, v_to) where diet_type_id = v_k;
  want := 10 * 1 * 0.1 * f;
  insert into res values ('recipe_kibble', case when abs(got - want) < 1e-9 then 'ok' else format('got %s want %s', got, want) end);
  select quantity into got from diet_forecast(v_from, v_to) where diet_type_id = v_c;
  want := 10 * 1.5 * 0.15 * f;
  insert into res values ('recipe_chicken', case when abs(got - want) < 1e-9 then 'ok' else format('got %s want %s', got, want) end);
  select quantity into got from stock_diet_forecast(v_from, v_to) where diet_type_id = v_r;
  want := 10 * 1.5 * 0.2 * f;
  insert into res values ('recipe_rice_stock', case when abs(got - want) < 1e-9 then 'ok' else format('got %s want %s', got, want) end);

  begin
    insert into diet_ingredients (diet_id, diet_type_id, serving_unit, qty_small, qty_medium, qty_large)
      values (v_diet, v_k, 'scoop', 1, 1, 1);
    insert into res values ('unknown_unit_refused', 'NOT refused');
  exception when others then insert into res values ('unknown_unit_refused', 'ok');
  end;

  -- old-app bridge: a row naming only diet_type_id gets its recipe; a new diet type gets its own.
  insert into diet_types (name, unit, daily_qty_small, daily_qty_medium, daily_qty_large) values ('H-bridge', 'g', 1, 2, 3);
  insert into res select 'bridge_recipe', count(*)::text from diets d join diet_ingredients di on di.diet_id = d.id where d.name = 'H-bridge';
  update diet_types set daily_qty_medium = 5 where name = 'H-bridge';
  insert into res select 'bridge_mirrors_qty', di.qty_medium::text from diets d join diet_ingredients di on di.diet_id = d.id where d.name = 'H-bridge';
end $recipe$;

do $o$ begin raise exception 'HARNESS-RESULT %', (select json_agg(row_to_json(res)) from res); end $o$;
rollback;`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: harness }),
});
const text = await res.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
const m = /HARNESS-RESULT (.*)/.exec(msg);
if (!m) throw new Error(`no result (status ${res.status}): ${msg.slice(0, 2000)}`);
const rows = JSON.parse(m[1]);
const get = (k) => rows.find((r) => r.k === k)?.v;

let fails = 0, ok = 0;
const check = (k, want, what) => {
  const v = get(k);
  if (v === want) { ok++; console.log(`ok    ${what} (${v})`); } else { fails++; console.log(`FAIL  ${what} - got ${v}`); }
};
for (const t of ["month", "all"]) {
  console.log(`${t}: ${get(`forecast_rows_${t}`)} ingredient rows before`);
  check(`forecast_diff_${t}`, "0", `diet_forecast identical before/after (${t})`);
  check(`stock_forecast_diff_${t}`, "0", `stock_diet_forecast identical before/after (${t})`);
}
check("resident_diets_without_recipe", "0", "every resident diet points at a recipe");
check("standard_flag_mismatch", "0", "the standard flag carried over");
check("diets", get("diet_types"), "one recipe per diet type");
check("diet_ingredients", get("diet_types"), "one ingredient line per diet type");
for (const k of ["recipe_kibble", "recipe_chicken", "recipe_rice_stock", "unknown_unit_refused"]) check(k, "ok", k);
check("bridge_recipe", "1", "a new diet type gets its one-ingredient recipe");
check("bridge_mirrors_qty", "5", "an edit to a diet type's quantity reaches its recipe");
if (get("recipe_skipped")) console.log(`NOTE  recipe checks skipped: ${get("recipe_skipped")}`);
console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN");
process.exitCode = fails ? 1 : 0;
