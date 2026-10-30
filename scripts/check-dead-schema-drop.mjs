// dead-schema-drop (0243): the drops change no forecast, and nothing that is meant to survive is lost.
// Against DEV only, one transaction that is always rolled back; it runs 0243's own text inside it, so it
// works before and after the file is applied for real.
//
//   node scripts/check-dead-schema-drop.mjs            (from the repo root; dev only)
//
//   forecast  diet_forecast and stock_diet_forecast, over October 2026 and over every date, are identical
//             (rows, counts, quantity, cost) before and after
//   gone      the bridge triggers, set_standard_diet, the legacy columns and role_home_tiles no longer exist
//   kept      picker_diet_types, stock_diet_types, picker_diets and special_diet_list still answer for an admin;
//             the two restated views keep every column but the dropped ones
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { exitWith } from "./lib/exit.mjs";

const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync("supabase/migrations/0243_dead_schema_drop.sql", "utf8");

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
create temp table bs_all  as select * from stock_diet_forecast(date '2000-01-01', date '2100-01-01');
create temp table b_pick  as select id, name, unit, name_th from picker_diet_types;
create temp table b_stock as select id, name, unit, stock_on_hand, stock_counted_at, reorder_lead_days, safety_stock, sort_order, name_th from stock_diet_types;
create temp table b_special as select count(*) n from special_diet_list;

${migration}

do $cmp$
declare n_diff int;
begin
  insert into res values ('forecast_rows', (select count(*) from b_all)::text);
  select count(*) into n_diff from (
    (select * from b_month except select * from diet_forecast(date '2026-10-01', date '2026-10-31'))
    union all (select * from diet_forecast(date '2026-10-01', date '2026-10-31') except select * from b_month)
    union all (select * from b_all except select * from diet_forecast(date '2000-01-01', date '2100-01-01'))
    union all (select * from diet_forecast(date '2000-01-01', date '2100-01-01') except select * from b_all)) x;
  insert into res values ('diet_forecast_differences', n_diff::text);
  select count(*) into n_diff from (
    (select * from bs_all except select * from stock_diet_forecast(date '2000-01-01', date '2100-01-01'))
    union all (select * from stock_diet_forecast(date '2000-01-01', date '2100-01-01') except select * from bs_all)) x;
  insert into res values ('stock_diet_forecast_differences', n_diff::text);
  select count(*) into n_diff from ((select * from b_pick except select id, name, unit, name_th from picker_diet_types)
    union all (select id, name, unit, name_th from picker_diet_types except select * from b_pick)) x;
  insert into res values ('picker_diet_types_differences', n_diff::text);
  select count(*) into n_diff from ((select * from b_stock except select id, name, unit, stock_on_hand, stock_counted_at, reorder_lead_days, safety_stock, sort_order, name_th from stock_diet_types)
    union all (select id, name, unit, stock_on_hand, stock_counted_at, reorder_lead_days, safety_stock, sort_order, name_th from stock_diet_types except select * from b_stock)) x;
  insert into res values ('stock_diet_types_differences', n_diff::text);
  insert into res values ('special_diet_list_rows_before_after', (select n from b_special)::text || ' / ' || (select count(*) from special_diet_list)::text);
  insert into res values ('picker_diets_rows', (select count(*) from picker_diets)::text);
  insert into res values ('triggers_left', (select count(*) from pg_trigger where tgname in ('resident_diets_fill_recipe', 'diet_types_mirror_recipe'))::text);
  insert into res values ('functions_left', (select count(*) from pg_proc where proname in ('set_standard_diet', 'resident_diets_fill_recipe', 'diet_types_mirror_recipe', 'role_home_tiles_guard'))::text);
  insert into res values ('columns_left', (select count(*) from information_schema.columns where table_schema = 'public'
    and ((table_name = 'diet_types' and column_name in ('daily_qty_small', 'daily_qty_medium', 'daily_qty_large', 'is_standard'))
      or (table_name = 'resident_diets' and column_name in ('diet_type_id', 'daily_quantity'))))::text);
  insert into res values ('role_home_tiles_left', (select count(*) from pg_tables where tablename = 'role_home_tiles')::text);
  insert into res values ('view_grants_ok', (select bool_and(has_table_privilege('authenticated', v, 'select') and not has_table_privilege('anon', v, 'select'))
    from unnest(array['picker_diet_types', 'stock_diet_types']) v)::text);
end $cmp$;
select k, v from res;
rollback;
`;

const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: harness }),
});
const body = await r.json();
if (!r.ok || !Array.isArray(body)) {
  console.error(JSON.stringify(body, null, 1));
  await exitWith(1);
} else {
  const got = Object.fromEntries(body.map((x) => [x.k, x.v]));
  for (const [k, v] of Object.entries(got)) console.log(`${k}: ${v}`);
  const want = {
    diet_forecast_differences: "0",
    stock_diet_forecast_differences: "0",
    picker_diet_types_differences: "0",
    stock_diet_types_differences: "0",
    triggers_left: "0",
    functions_left: "0",
    columns_left: "0",
    role_home_tiles_left: "0",
    view_grants_ok: "true",
  };
  const bad = Object.entries(want).filter(([k, v]) => got[k] !== v);
  if (bad.length) {
    console.error("FAILED:", bad.map(([k]) => k).join(", "));
    await exitWith(1);
  } else {
    console.log("ok");
  }
}
