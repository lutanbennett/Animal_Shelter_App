// Rollback harness for 0096_stock_receipts.sql against DEV only. One
// transaction: LIVE schema (0096 is not replayed: 0112 redefined stock_count_intervals), throwaway items, counts and
// deliveries, the usage sum through stock_count_intervals, the unit snapshot,
// the constraints and each role's access — then a deliberate
// `raise exception` carrying the evidence, so nothing can commit.
//
//   node scripts/check-stock-receipts.mjs     (from the repo root; dev only)
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

create temp table who (who text primary key, uid uuid);
-- 'admin' answers every card check without holding a card, so it does not move when a card is edited on
-- Settings -> Who does what; 'plain' is a throwaway custom role holding one cell that has nothing to do with stock.
-- Neither management, the volunteer nor the doctor is pinned: their cells are live data (docs/decisions/2026-10-26-harness-sweep-batch-2.md).
insert into who values ('admin', gen_random_uuid()), ('plain', gen_random_uuid());
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'harness-0096-' || who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
  from who;
insert into roles (key, name, kind) values ('harness_0096_plain', 'Harness plain', 'custom');
insert into role_permissions (role_id, activity, level)
  values ((select id from roles where key = 'harness_0096_plain'), 'facility.enclosures', 1);
insert into user_roles (user_id, role_id)
  select s.c0, ro.id from (select uid as c0, case who when 'admin' then 'admin' else 'harness_0096_plain' end as role_key from who) s
  join roles ro on ro.key = s.role_key;
grant select on who to authenticated, anon;

create temp table ids (k text primary key, id uuid);
grant select on ids to authenticated, anon;
with m as (
  insert into medication (name, dose_unit) values ('harness-0096 pill', 'tablet'), ('harness-0096 other', 'tablet')
  returning id, name
)
insert into ids select case name when 'harness-0096 pill' then 'pill' else 'other' end, id from m;
with d as (
  insert into diet_types (name, unit)
  values ('harness-0096 kibble', 'g') returning id
)
insert into ids select 'kibble', id from d;

do $$
declare
  v_pill uuid := (select id from ids where k = 'pill');
  v_other uuid := (select id from ids where k = 'other');
  v_kibble uuid := (select id from ids where k = 'kibble');
  t1 timestamptz := '2026-01-01T03:00:00Z';
  t2 timestamptz := '2026-01-15T03:00:00Z';
  t3 timestamptz := '2026-02-01T03:00:00Z';
  t4 timestamptz := '2026-02-15T03:00:00Z';
  r record;
  v_n integer;
  v_id uuid;
  v_unit text;
  v_report text := '';
  v_err text;
begin
  -- Counts as record_stocktake would write them.
  insert into stock_counts (stocktake_id, item_kind, medication_id, counted_quantity, unit, counted_at) values
    (gen_random_uuid(), 'medication', v_pill, 100, 'tablet', t1),
    (gen_random_uuid(), 'medication', v_pill, 60, 'tablet', t2),
    (gen_random_uuid(), 'medication', v_pill, 150, 'tablet', t3),
    (gen_random_uuid(), 'medication', v_other, 40, 'tablet', t1),
    (gen_random_uuid(), 'medication', v_other, 25, 'tablet', t2);
  insert into stock_counts (stocktake_id, item_kind, diet_type_id, counted_quantity, unit, counted_at) values
    (gen_random_uuid(), 'diet_type', v_kibble, 5000, 'g', t1),
    (gen_random_uuid(), 'diet_type', v_kibble, 3000, 'g', t2);

  -- Deliveries. The caller's unit is ignored: 'ml' must be stamped 'tablet'.
  insert into stock_receipts (item_kind, medication_id, quantity, unit, received_at) values
    ('medication', v_pill, 7, 'ml', t1),                          -- AT the first count: before it, no interval
    ('medication', v_pill, 30, 'ml', t1 + interval '3 days'),     -- A->B
    ('medication', v_pill, 20, null, t2),                         -- AT the second count: on the shelf, A->B
    ('medication', v_pill, 100, null, t2 + interval '1 second');  -- B->C
  insert into stock_receipts (item_kind, diet_type_id, quantity, received_at, cost, note) values
    ('diet_type', v_kibble, 2000, t1 + interval '1 day', 450, 'harness');

  -- S1 the sum.
  select * into r from stock_count_intervals where medication_id = v_pill and from_counted_at = t1;
  if r.received <> 50 or r.receipts <> 2 or r.used <> 90 or r.unit_changed then
    raise exception 'S1 A->B wrong: %', row_to_json(r);
  end if;
  select * into r from stock_count_intervals where medication_id = v_pill and from_counted_at = t2;
  if r.received <> 100 or r.receipts <> 1 or r.used <> 10 then
    raise exception 'S1 B->C wrong: %', row_to_json(r);
  end if;
  select count(*) into v_n from stock_count_intervals where medication_id = v_pill;
  if v_n <> 2 then raise exception 'S1 expected 2 intervals for 3 counts, got %', v_n; end if;
  -- Telescoping: used over A->C = the two intervals added.
  select sum(used) into v_n from stock_count_intervals where medication_id = v_pill;
  if v_n <> 100 + (30 + 20 + 100) - 150 then raise exception 'S1 intervals do not add up: %', v_n; end if;
  select * into r from stock_count_intervals where medication_id = v_other;
  if r.received <> 0 or r.receipts <> 0 or r.used <> 15 then
    raise exception 'S1 another item picked up this one''s deliveries: %', row_to_json(r);
  end if;
  select * into r from stock_count_intervals where diet_type_id = v_kibble;
  if r.received <> 2000 or r.used <> 4000 or r.medication_id is not null then
    raise exception 'S1 diet interval wrong: %', row_to_json(r);
  end if;
  v_report := v_report || ' | S1 A->B received 50 (count-instant delivery in, first-count-instant out) used 90; B->C used 10; intervals add up; items and kinds separate';

  -- S2 the unit snapshot.
  select count(*) into v_n from stock_receipts where medication_id = v_pill and unit is distinct from 'tablet';
  if v_n <> 0 then raise exception 'S2 caller unit was kept on % rows', v_n; end if;
  update medication set dose_unit = 'capsule' where id = v_pill;
  select id into v_id from stock_receipts where medication_id = v_pill and quantity = 30;
  -- 0235: only a delivery's cost can change, so a quantity or unit edit is refused and the stamp cannot move.
  begin
    update stock_receipts set quantity = 31, unit = 'capsule' where id = v_id;
    raise exception 'S2 an edit of quantity and unit was accepted';
  exception when insufficient_privilege then null;
  end;
  select unit into v_unit from stock_receipts where id = v_id;
  if v_unit <> 'tablet' then raise exception 'S2 refused edit still changed the unit: %', v_unit; end if;
  insert into stock_counts (stocktake_id, item_kind, medication_id, counted_quantity, unit, counted_at)
    values (gen_random_uuid(), 'medication', v_pill, 140, 'capsule', t4);
  insert into stock_receipts (item_kind, medication_id, quantity, received_at)
    values ('medication', v_pill, 10, t3 + interval '1 day') returning unit into v_unit;
  if v_unit <> 'capsule' then raise exception 'S2 new receipt not stamped with the current unit: %', v_unit; end if;
  select * into r from stock_count_intervals where medication_id = v_pill and from_counted_at = t3;
  if not r.unit_changed or r.used is not null then raise exception 'S2 subtracted across a unit change: %', row_to_json(r); end if;
  -- a receipt in another unit inside an otherwise one-unit interval also blocks the sum
  begin
    update stock_receipts set medication_id = v_other where id = v_id;
    raise exception 'S2 a receipt was moved to another item';
  exception when insufficient_privilege then null;
  end;
  insert into stock_receipts (item_kind, medication_id, quantity, received_at)
    values ('medication', v_pill, 1, t1 + interval '5 days');  -- stamped 'capsule' amid 'tablet' counts
  select * into r from stock_count_intervals where medication_id = v_pill and from_counted_at = t1;
  if not r.unit_changed or r.used is not null then raise exception 'S2 odd-unit receipt was summed: %', row_to_json(r); end if;
  v_report := v_report || ' | S2 unit stamped from the item not the caller, an edit or move is refused (0235) so the stamp cannot drift; no sum across a count or receipt unit change';

  -- S3 constraints.
  foreach v_err in array array[
    $q$insert into stock_receipts (item_kind, medication_id, quantity) values ('medication', '$q$ || v_pill || $q$', 0)$q$,
    $q$insert into stock_receipts (item_kind, medication_id, quantity) values ('medication', '$q$ || v_pill || $q$', -5)$q$,
    $q$insert into stock_receipts (item_kind, medication_id, quantity, cost) values ('medication', '$q$ || v_pill || $q$', 1, -1)$q$,
    $q$insert into stock_receipts (item_kind, diet_type_id, quantity) values ('medication', '$q$ || v_kibble || $q$', 1)$q$,
    $q$insert into stock_receipts (item_kind, medication_id, diet_type_id, quantity) values ('medication', '$q$ || v_pill || $q$', '$q$ || v_kibble || $q$', 1)$q$,
    $q$insert into stock_receipts (item_kind, quantity) values ('diet_type', 1)$q$,
    $q$insert into stock_receipts (item_kind, medication_id, quantity) values ('vaccine', '$q$ || v_pill || $q$', 1)$q$
  ] loop
    begin
      execute v_err;
      raise exception 'S3 accepted: %', v_err;
    exception when check_violation then null;
    end;
  end loop;
  v_report := v_report || ' | S3 zero, negative, negative cost, wrong kind, both items, no item, unknown kind refused';

  -- S4 roles. Admin records the delivery.
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'admin'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into stock_receipts (item_kind, medication_id, quantity, recorded_by)
    values ('medication', v_other, 5, gen_random_uuid()) returning id into v_id;
  reset role;
  if (select recorded_by from stock_receipts where id = v_id) is distinct from (select uid from who where who = 'admin') then
    raise exception 'S4 recorded_by not stamped from the caller';
  end if;

  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'admin'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    update stock_receipts set note = 'fixed by admin' where id = v_id;
    reset role;
    raise exception 'S4 a delivery note was edited';
  exception when insufficient_privilege then reset role;
  end;
  -- 0235: the cost is the one column an update may change (the bills inbox writes it)
  set local role authenticated;
  update stock_receipts set cost = 12 where id = v_id;
  get diagnostics v_n = row_count;
  reset role;
  if v_n <> 1 then raise exception 'S4 a cost edit by the delivery holder changed % rows', v_n; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'plain'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into v_n from stock_count_intervals where medication_id = v_pill;
  begin
    insert into stock_receipts (item_kind, medication_id, quantity) values ('medication', v_other, 1);
    reset role;
    raise exception 'S4 a login with no stock cell recorded a delivery';
  exception when insufficient_privilege then null;
  end;
  reset role;
  if v_n <> 0 then raise exception 'S4 a login with no stock cell reads % intervals', v_n; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'plain'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  select (select count(*) from stock_receipts) + (select count(*) from stock_count_intervals) into v_n;
  reset role;
  if v_n <> 0 then raise exception 'S4 a login with no stock cell sees % stock rows', v_n; end if;

  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  set local role anon;
  begin
    perform 1 from stock_receipts;
    reset role;
    raise exception 'S4 anon read stock_receipts';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from stock_count_intervals;
    reset role;
    raise exception 'S4 anon read stock_count_intervals';
  exception when insufficient_privilege then null;
  end;
  reset role;
  v_report := v_report || ' | S4 admin records (recorded_by forced to caller) and may change a cost but not a note (0235); a login with no stock cell reads nothing, records nothing and sees no receipts or intervals; anon refused by the grant';

  -- S5 cascade.
  delete from diet_types where id = v_kibble;
  select count(*) into v_n from stock_receipts where diet_type_id = v_kibble;
  if v_n <> 0 then raise exception 'S5 receipts survived their diet type'; end if;
  v_report := v_report || ' | S5 deleting an item deletes its receipts';

  raise exception 'HARNESS-OK 0096 (live)%', v_report;
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
