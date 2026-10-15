// Rollback harness for the pack-sizes feature (0199) against DEV only. One
// transaction: throwaway kibble bought in 20, 14 and 10 kg bags, deliveries
// at different sizes and prices (one donated), then the default-size triggers
// and item_latest_delivery_cost — the cost per cup the forecasts now use —
// checked by hand-worked baht. A deliberate `raise exception` carries the
// evidence, so nothing can commit.
//
//   node scripts/check-pack-sizes.mjs     (from the repo root; dev only)
//
// Exits 0 when every assertion held. Writes nothing.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;
create temp table ids (k text primary key, id uuid);

with d as (
  insert into diet_types (name, unit, daily_qty_small, daily_qty_medium, daily_qty_large, cost_per_unit)
  values ('harness-0199 kibble', 'cup', 1, 1, 1, 8) returning id
)
insert into ids select 'kibble', id from d;
with d as (
  insert into diet_types (name, unit, daily_qty_small, daily_qty_medium, daily_qty_large, cost_per_unit)
  values ('harness-0199 typed only', 'cup', 1, 1, 1, 4.5) returning id
)
insert into ids select 'typed', id from d;
with d as (
  insert into diet_types (name, unit, daily_qty_small, daily_qty_medium, daily_qty_large, cost_per_unit)
  values ('harness-0199 gift only', 'cup', 1, 1, 1, 6) returning id
)
insert into ids select 'gift', id from d;

do $$
declare
  v_k uuid := (select id from ids where k = 'kibble');
  v_t uuid := (select id from ids where k = 'typed');
  v_g uuid := (select id from ids where k = 'gift');
  v_rep text := '';
  v_n int;
  v_cost numeric;
  v_name text;
begin
  -- A. three bought-in sizes: 20 kg = 200 cups, 14 kg = 140, 10 kg = 100
  insert into item_unit_conversions (item_kind, diet_type_id, unit, base_units_per, is_purchase_unit) values
    ('diet_type', v_k, 'bag (10 kg)', 100, true),
    ('diet_type', v_k, 'bag (14 kg)', 140, true),
    ('diet_type', v_k, 'bag (20 kg)', 200, true);
  select count(*) into v_n from item_unit_conversions where diet_type_id = v_k and is_purchase_unit;
  if v_n <> 3 then raise exception 'FAIL A expected 3 bought-in sizes, got %', v_n; end if;
  select count(*) into v_n from item_unit_conversions where diet_type_id = v_k and is_default_purchase;
  if v_n <> 1 then raise exception 'FAIL A expected exactly 1 default, got %', v_n; end if;
  select unit into v_name from item_unit_conversions where diet_type_id = v_k and is_default_purchase;
  if v_name <> 'bag (10 kg)' then raise exception 'FAIL A first bought-in size should be the default, got %', v_name; end if;
  v_rep := v_rep || ' | A three sizes bought in, one default (the first)';

  -- B. making the 20 kg bag the usual one moves the flag
  update item_unit_conversions set is_default_purchase = true where diet_type_id = v_k and unit = 'bag (20 kg)';
  select unit into v_name from item_unit_conversions where diet_type_id = v_k and is_default_purchase;
  select count(*) into v_n from item_unit_conversions where diet_type_id = v_k and is_default_purchase;
  if v_name <> 'bag (20 kg)' or v_n <> 1 then raise exception 'FAIL B default did not move: % (% rows)', v_name, v_n; end if;
  v_rep := v_rep || ' | B default moved to 20 kg, still exactly one';

  -- C. no longer buying the usual size hands the flag on; the others stay bought in
  update item_unit_conversions set is_purchase_unit = false where diet_type_id = v_k and unit = 'bag (20 kg)';
  select count(*) into v_n from item_unit_conversions where diet_type_id = v_k and is_default_purchase;
  if v_n <> 1 then raise exception 'FAIL C expected a default after un-ticking, got % rows', v_n; end if;
  select count(*) into v_n from item_unit_conversions where diet_type_id = v_k and is_default_purchase and not is_purchase_unit;
  if v_n <> 0 then raise exception 'FAIL C default that is not bought in'; end if;
  update item_unit_conversions set is_purchase_unit = true where diet_type_id = v_k and unit = 'bag (20 kg)';
  v_rep := v_rep || ' | C un-ticking the usual size hands it on';

  -- D. deliveries at different sizes and prices (cups; baht).
  --    oldest: 2 x 20 kg = 400 cups for 3200  -> 8.00 a cup
  --    then  : 1 x 10 kg = 100 cups for  900  -> 9.00 a cup
  --    then  : 1 x 14 kg = 140 cups for  700  -> 5.00 a cup (on special)
  --    newest: 1 x 20 kg = 200 cups donated, cost 0 (must be ignored)
  insert into stock_receipts (item_kind, diet_type_id, quantity, cost, received_at) values
    ('diet_type', v_k, 400, 3200, now() - interval '4 days'),
    ('diet_type', v_k, 100,  900, now() - interval '3 days'),
    ('diet_type', v_k, 140,  700, now() - interval '2 days'),
    ('diet_type', v_k, 200,    0, now() - interval '1 day');
  select cost_per_base_unit into v_cost from item_latest_delivery_cost where diet_type_id = v_k;
  if v_cost is distinct from 5 then raise exception 'FAIL D latest priced delivery should be 5.00 a cup, got %', v_cost; end if;
  v_rep := v_rep || ' | D latest priced delivery (14 kg bag, 700 / 140) = ' || v_cost || ' a cup; the donated one ignored';
  -- 1000 cups forecast: 5000 baht from the delivery, 8000 at the old typed price
  v_rep := v_rep || ' | D 1000 cups = ' || (1000 * v_cost) || ' baht (typed price would say ' || 1000 * 8 || ')';

  -- E. an item with only a typed price has no view row, so the app falls back to it
  select count(*) into v_n from item_latest_delivery_cost where diet_type_id = v_t;
  if v_n <> 0 then raise exception 'FAIL E typed-only item has a delivery cost row'; end if;
  v_rep := v_rep || ' | E typed-only item: no view row (fallback 4.5 a cup)';

  -- F. an item whose only delivery is a gift keeps its typed price
  insert into stock_receipts (item_kind, diet_type_id, quantity, cost) values ('diet_type', v_g, 300, 0);
  select count(*) into v_n from item_latest_delivery_cost where diet_type_id = v_g;
  if v_n <> 0 then raise exception 'FAIL F a donated delivery produced a cost'; end if;
  v_rep := v_rep || ' | F gift-only item: no view row (fallback 6 a cup)';

  raise exception 'HARNESS-OK 0199 pack sizes%', v_rep;
end $$;
`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
console.log(`status ${res.status}`);
console.log(msg);
// exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
