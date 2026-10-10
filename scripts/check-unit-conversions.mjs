// Rollback harness for 0118_unit_conversions.sql against DEV only. One
// transaction: the migration twice (re-runnable), throwaway items, the
// conversion table's constraints and roles, the point-in-time factor on
// receipts and counts, record_stocktake() with and without "entered", and a
// check that rows written the old way are untouched — then a deliberate
// `raise exception` carrying the evidence, so nothing can commit.
//
//   node scripts/check-unit-conversions.mjs     (from the repo root; dev only)
//
// Exits 0 when every assertion held. Writes nothing.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync(join(root, "supabase/migrations/0118_unit_conversions.sql"), "utf8");

const sql = `
begin;
${migration}
-- a second run of the whole file must be harmless
${migration}

create temp table who (who text primary key, uid uuid);
insert into who values
  ('management', gen_random_uuid()), ('volunteer', gen_random_uuid());
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'harness-0118-' || who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
  from who;
insert into user_roles (user_id, role) select uid, who::app_role from who;
grant select on who to authenticated;

create temp table ids (k text primary key, id uuid);
grant select on ids to authenticated;
with d as (
  insert into diet_types (name, unit, daily_qty_small, daily_qty_medium, daily_qty_large)
  values ('harness-0118 kibble', 'cup', 1, 1, 1) returning id
)
insert into ids select 'kibble', id from d;
with m as (
  insert into medication (name, dose_unit) values ('harness-0118 pill', 'tablet') returning id
)
insert into ids select 'pill', id from m;

do $$
declare
  v_kibble uuid := (select id from ids where k = 'kibble');
  v_pill uuid := (select id from ids where k = 'pill');
  v_bag uuid;
  v_ok boolean; v_n integer; v_t1 timestamptz; v_q numeric; v_rep text := '';
  v_old_count uuid; v_old_receipt uuid; v_ent jsonb; v_err text;
begin
  -- A. rows written the old way (no entered) are valid and stay null
  insert into stock_counts (stocktake_id, item_kind, diet_type_id, counted_quantity, unit, counted_at)
    values (gen_random_uuid(), 'diet_type', v_kibble, 500, 'cup', now() - interval '2 days') returning id into v_old_count;
  insert into stock_receipts (item_kind, diet_type_id, quantity, received_at)
    values ('diet_type', v_kibble, 200, now() - interval '1 day') returning id into v_old_receipt;
  if (select entered from stock_counts where id = v_old_count) is not null
     or (select entered from stock_receipts where id = v_old_receipt) is not null then
    raise exception 'FAIL A old-style row has entered set'; end if;
  v_rep := v_rep || ' | A old-style counts and receipts still insert, entered null';

  -- B. conversions: good rows
  insert into item_unit_conversions (item_kind, diet_type_id, unit, base_units_per, is_purchase_unit)
    values ('diet_type', v_kibble, 'bag (20 kg)', 200, true) returning id into v_bag;
  insert into item_unit_conversions (item_kind, diet_type_id, unit, base_units_per, is_count_unit)
    values ('diet_type', v_kibble, 'kg', 10, true);
  insert into item_unit_conversions (item_kind, medication_id, unit, base_units_per, is_purchase_unit, is_count_unit)
    values ('medication', v_pill, 'box', 50, true, true);
  v_rep := v_rep || ' | B conversions insert (one row may be both purchase and count unit)';

  -- C. each constraint refuses
  v_ok := false; begin insert into item_unit_conversions (item_kind, diet_type_id, unit, base_units_per) values ('diet_type', v_kibble, 'x', 0);
  exception when check_violation then v_ok := true; end;
  if not v_ok then raise exception 'FAIL C zero factor accepted'; end if;
  v_ok := false; begin insert into item_unit_conversions (item_kind, diet_type_id, unit, base_units_per) values ('diet_type', v_kibble, '  ', 1);
  exception when check_violation then v_ok := true; end;
  if not v_ok then raise exception 'FAIL C blank unit accepted'; end if;
  v_ok := false; begin insert into item_unit_conversions (item_kind, diet_type_id, unit, base_units_per) values ('diet_type', v_kibble, ' KG ', 1);
  exception when unique_violation then v_ok := true; end;
  if not v_ok then raise exception 'FAIL C duplicate unit (case/space) accepted'; end if;
  v_ok := false; begin insert into item_unit_conversions (item_kind, diet_type_id, unit, base_units_per, is_purchase_unit) values ('diet_type', v_kibble, 'sack', 100, true);
  exception when unique_violation then v_ok := true; end;
  if not v_ok then raise exception 'FAIL C second purchase unit accepted'; end if;
  v_ok := false; begin insert into item_unit_conversions (item_kind, diet_type_id, unit, base_units_per, is_count_unit) values ('diet_type', v_kibble, 'sack', 100, true);
  exception when unique_violation then v_ok := true; end;
  if not v_ok then raise exception 'FAIL C second count unit accepted'; end if;
  v_ok := false; begin insert into item_unit_conversions (item_kind, diet_type_id, medication_id, unit, base_units_per) values ('diet_type', v_kibble, v_pill, 'y', 1);
  exception when check_violation then v_ok := true; end;
  if not v_ok then raise exception 'FAIL C both item ids accepted'; end if;
  v_rep := v_rep || ' | C zero factor, blank/duplicate unit, second purchase/count unit, two item ids all refused';

  -- D. updated_at moves on edit
  -- (now() is fixed inside a transaction, so assert the trigger, not a moved time)
  if not exists (select 1 from pg_trigger where tgrelid = 'item_unit_conversions'::regclass
                  and tgname = 'item_unit_conversions_touch_updated_at') then
    raise exception 'FAIL D updated_at trigger missing'; end if;
  update item_unit_conversions set note = 'approx' where id = v_bag;

  -- E. the point-in-time factor: a receipt of 2 bags keeps 200 after the factor is edited
  v_ent := '[{"quantity":2,"unit":"bag (20 kg)","factor":200}]'::jsonb;
  insert into stock_receipts (item_kind, diet_type_id, quantity, entered, received_at)
    values ('diet_type', v_kibble, 400, v_ent, now()) returning id into v_old_receipt;
  update item_unit_conversions set base_units_per = 180 where id = v_bag;
  select quantity into v_q from stock_receipts where id = v_old_receipt;
  if v_q <> 400 or (select entered from stock_receipts where id = v_old_receipt) <> v_ent then
    raise exception 'FAIL E receipt changed when the factor was edited'; end if;
  v_rep := v_rep || ' | E editing a factor (200 to 180) leaves an earlier receipt at 400 cups with factor 200';

  -- F. entered must add up; mixed entry works; malformed refused
  insert into stock_receipts (item_kind, diet_type_id, quantity, entered)
    values ('diet_type', v_kibble, 300, '[{"quantity":1,"unit":"bag (20 kg)","factor":200},{"quantity":10,"unit":"kg","factor":10}]');
  v_ok := false; begin insert into stock_receipts (item_kind, diet_type_id, quantity, entered) values ('diet_type', v_kibble, 399, v_ent);
  exception when check_violation then v_ok := true; end;
  if not v_ok then raise exception 'FAIL F mismatched entered accepted (receipt)'; end if;
  v_ok := false; begin insert into stock_counts (stocktake_id, item_kind, diet_type_id, counted_quantity, entered) values (gen_random_uuid(), 'diet_type', v_kibble, 5, '[{"quantity":1,"unit":"kg","factor":0}]');
  exception when check_violation then v_ok := true; end;
  if not v_ok then raise exception 'FAIL F zero factor accepted (count)'; end if;
  v_ok := false; begin insert into stock_counts (stocktake_id, item_kind, diet_type_id, counted_quantity, entered) values (gen_random_uuid(), 'diet_type', v_kibble, 5, '{"quantity":1}');
  exception when check_violation then v_ok := true; end;
  if not v_ok then raise exception 'FAIL F non-array entered accepted'; end if;
  v_ok := false; begin insert into stock_counts (stocktake_id, item_kind, diet_type_id, counted_quantity, entered) values (gen_random_uuid(), 'diet_type', v_kibble, 5, '[]');
  exception when check_violation then v_ok := true; end;
  if not v_ok then raise exception 'FAIL F empty entered accepted'; end if;
  v_rep := v_rep || ' | F mixed entry (1 bag + 10 kg = 300) saved; mismatch, zero factor, non-array, empty all refused';

  -- G. record_stocktake as management (Staff until 0173 retired it): old shape unchanged, then with entered
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'management'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform record_stocktake(null, jsonb_build_array(jsonb_build_object('id', v_kibble, 'count', 123)));
  reset role;
  select entered into v_ent from stock_counts where diet_type_id = v_kibble and counted_quantity = 123;
  if v_ent is not null then raise exception 'FAIL G old-shape stocktake stored entered'; end if;
  if (select stock_on_hand from diet_types where id = v_kibble) <> 123 then raise exception 'FAIL G old-shape stock_on_hand'; end if;

  set local role authenticated;
  perform record_stocktake(
    jsonb_build_array(jsonb_build_object('id', v_pill, 'count', 75,
      'entered', '[{"quantity":1,"unit":"box","factor":50},{"quantity":25,"unit":"tablet","factor":1}]'::jsonb)),
    jsonb_build_array(jsonb_build_object('id', v_kibble, 'count', 340,
      'entered', '[{"quantity":1,"unit":"bag (20 kg)","factor":200},{"quantity":14,"unit":"kg","factor":10}]'::jsonb)));
  reset role;
  if (select stock_on_hand from diet_types where id = v_kibble) <> 340
     or (select stock_on_hand from medication where id = v_pill) <> 75 then raise exception 'FAIL G stock_on_hand not base units'; end if;
  select entered into v_ent from stock_counts where diet_type_id = v_kibble and counted_quantity = 340;
  if jsonb_array_length(v_ent) <> 2 or (select unit from stock_counts where diet_type_id = v_kibble and counted_quantity = 340) <> 'cup' then
    raise exception 'FAIL G entered not stored / unit not base: %', v_ent; end if;

  -- a mismatching entered is refused with nothing written
  select count(*) into v_n from stock_counts where diet_type_id = v_kibble;
  v_err := null;
  begin
    set local role authenticated;
    perform record_stocktake(null, jsonb_build_array(jsonb_build_object('id', v_kibble, 'count', 10,
      'entered', '[{"quantity":1,"unit":"kg","factor":10.5}]'::jsonb)));
    reset role;
  exception when others then v_err := sqlerrm; reset role; end;
  if v_err is null or v_err not like '%do not add up%' then raise exception 'FAIL G mismatched entered accepted: %', v_err; end if;
  if (select count(*) from stock_counts where diet_type_id = v_kibble) <> v_n
     or (select stock_on_hand from diet_types where id = v_kibble) <> 340 then raise exception 'FAIL G mismatch wrote something'; end if;
  v_rep := v_rep || ' | G record_stocktake: old shape unchanged, entered stored beside base-unit count, mismatch refused with nothing written';

  -- H. the existing usage view still reads base quantities
  select count(*) into v_n from stock_count_intervals where diet_type_id = v_kibble;
  if v_n < 1 then raise exception 'FAIL H stock_count_intervals returned nothing'; end if;
  v_rep := v_rep || ' | H stock_count_intervals unchanged';

  -- I. roles on the conversion table
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'volunteer'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into v_n from item_unit_conversions where diet_type_id = v_kibble;
  if v_n <> 2 then reset role; raise exception 'FAIL I volunteer cannot read conversions (% rows)', v_n; end if;
  v_ok := false;
  begin insert into item_unit_conversions (item_kind, diet_type_id, unit, base_units_per) values ('diet_type', v_kibble, 'tin', 3);
  exception when insufficient_privilege or others then v_ok := true; end;
  reset role;
  if not v_ok then raise exception 'FAIL I volunteer wrote a conversion'; end if;
  -- (a staff login was the second refused writer here until 0173 retired the role)
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'management'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into item_unit_conversions (item_kind, diet_type_id, unit, base_units_per) values ('diet_type', v_kibble, 'tin', 3);
  reset role;
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  set local role anon;
  v_ok := false;
  begin perform 1 from item_unit_conversions;
  exception when insufficient_privilege then v_ok := true; end;
  reset role;
  if not v_ok then raise exception 'FAIL I anon read conversions'; end if;
  v_rep := v_rep || ' | I volunteer reads but cannot write, management writes, anon refused';

  -- J. cascade
  delete from diet_types where id = v_kibble;
  select count(*) into v_n from item_unit_conversions where diet_type_id = v_kibble;
  if v_n <> 0 then raise exception 'FAIL J conversions survived their diet type'; end if;
  v_rep := v_rep || ' | J deleting an item deletes its conversions';

  raise exception 'HARNESS-OK 0118 twice%', v_rep;
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
