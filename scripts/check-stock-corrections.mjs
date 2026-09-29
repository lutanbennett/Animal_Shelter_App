// Rollback harness for 0112_stock_count_source.sql against DEV only. One
// transaction: the migration re-run, throwaway items, the back-fill tag, a
// typed correction through record_stock_correction() (row written, source,
// unit, counted_at agreeing with the 0083 stamp), the clear-to-blank case,
// the refusals, record_stocktake() still writing source 'count', and the
// interval view ignoring corrections — then a deliberate `raise exception`
// carrying the evidence, so nothing can commit.
//
//   node scripts/check-stock-corrections.mjs     (from the repo root; dev only)
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

const migration = readFileSync(join(root, "supabase/migrations/0112_stock_count_source.sql"), "utf8");

const sql = `
begin;
-- a second run of the whole file must be harmless
${migration}

create temp table who (who text primary key, uid uuid);
insert into who values ('management', gen_random_uuid()), ('staff', gen_random_uuid());
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'harness-0112-' || who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
  from who;
insert into user_roles (user_id, role) select uid, who::app_role from who;
grant select on who to authenticated;

create temp table ids (k text primary key, id uuid);
grant select on ids to authenticated;
with m as (
  insert into medication (name, dose_unit) values ('harness-0112 pill', 'tablet') returning id
)
insert into ids select 'pill', id from m;
with d as (
  insert into diet_types (name, unit, daily_qty_small, daily_qty_medium, daily_qty_large)
  values ('harness-0112 kibble', 'g', 1, 1, 1) returning id
)
insert into ids select 'kibble', id from d;

do $$
declare
  v_pill uuid := (select id from ids where k = 'pill');
  v_kibble uuid := (select id from ids where k = 'kibble');
  v_mgr uuid := (select uid from who where who = 'management');
  r record;
  v_n integer;
  v_at timestamptz;
  v_err text;
  v_report text := '';
begin
  -- S1 back-fill tag: a null-counted_by row from before the column is 'backfill' on re-run.
  insert into stock_counts (stocktake_id, item_kind, medication_id, counted_quantity, unit, counted_at)
    values (gen_random_uuid(), 'medication', v_pill, 100, 'tablet', '2026-01-01T03:00:00Z');
  insert into stock_counts (stocktake_id, item_kind, medication_id, counted_quantity, unit, counted_at, counted_by)
    values (gen_random_uuid(), 'medication', v_pill, 60, 'tablet', '2026-01-15T03:00:00Z', v_mgr);
  update stock_counts set source = 'count' where medication_id = v_pill;
  update stock_counts set source = 'backfill'
   where counted_by is null and source = 'count' and medication_id = v_pill;
  select count(*) into v_n from stock_counts where medication_id = v_pill and source = 'backfill';
  if v_n <> 1 then raise exception 'S1 expected one backfill row, got %', v_n; end if;
  v_report := v_report || ' | S1 null counted_by is tagged backfill, a user count stays count';

  -- S2 a management cell edit writes a correction row and stamps once.
  perform set_config('request.jwt.claims', json_build_object('sub', v_mgr, 'role', 'authenticated')::text, true);
  set local role authenticated;
  v_at := record_stock_correction('medication', v_pill, 45);
  reset role;
  select * into r from stock_counts where medication_id = v_pill and source = 'correction';
  if r.counted_quantity <> 45 or r.unit <> 'tablet' or r.counted_by is distinct from v_mgr then
    raise exception 'S2 correction row wrong: %', row_to_json(r);
  end if;
  if r.counted_at <> v_at or r.counted_at <> (select stock_counted_at from medication where id = v_pill) then
    raise exception 'S2 counted_at disagrees with the 0083 stamp';
  end if;
  if (select stock_on_hand from medication where id = v_pill) <> 45 then raise exception 'S2 stock_on_hand not set'; end if;
  v_report := v_report || ' | S2 correction row: quantity, unit, counted_by, counted_at = stamp';

  -- S3 diet twin.
  set local role authenticated;
  perform record_stock_correction('diet_type', v_kibble, 2500);
  reset role;
  select count(*) into v_n from stock_counts where diet_type_id = v_kibble and source = 'correction' and counted_quantity = 2500 and unit = 'g';
  if v_n <> 1 then raise exception 'S3 diet correction missing'; end if;

  -- S4 the interval view ignores corrections.
  insert into stock_counts (stocktake_id, item_kind, medication_id, counted_quantity, unit, counted_at, counted_by, source)
    values (gen_random_uuid(), 'medication', v_pill, 30, 'tablet', '2026-02-01T03:00:00Z', v_mgr, 'count');
  update stock_counts set counted_at = '2026-01-20T03:00:00Z' where medication_id = v_pill and source = 'correction';
  select count(*) into v_n from stock_count_intervals where medication_id = v_pill;
  if v_n <> 2 then raise exception 'S4 expected 2 intervals (three counts), got %', v_n; end if;
  select * into r from stock_count_intervals where medication_id = v_pill and to_quantity = 30;
  if r.from_quantity <> 60 or r.used <> 30 then raise exception 'S4 correction leaked into the interval: %', row_to_json(r); end if;
  v_report := v_report || ' | S3 diet twin, S4 intervals pair counts and skip the correction';

  -- S5 blank clears the item and writes no row.
  select count(*) into v_n from stock_counts where medication_id = v_pill;
  set local role authenticated;
  perform record_stock_correction('medication', v_pill, null);
  reset role;
  if (select stock_on_hand from medication where id = v_pill) is not null then raise exception 'S5 not cleared'; end if;
  if (select count(*) from stock_counts where medication_id = v_pill) <> v_n then raise exception 'S5 wrote a row for a blank'; end if;
  v_report := v_report || ' | S5 blank clears, no row';

  -- S6 record_stocktake still writes source count.
  set local role authenticated;
  perform record_stocktake(jsonb_build_array(jsonb_build_object('id', v_pill, 'count', 12)), null);
  reset role;
  select count(*) into v_n from stock_counts where medication_id = v_pill and counted_quantity = 12 and source = 'count';
  if v_n <> 1 then raise exception 'S6 stocktake row is not source count'; end if;
  v_report := v_report || ' | S6 stocktake rows are source count';

  -- S7 refusals.
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'staff'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform record_stock_correction('medication', v_pill, 5);
    reset role;
    raise exception 'S7 staff was allowed';
  exception when others then
    reset role;
    get stacked diagnostics v_err = message_text;
    if v_err not like 'Not authorized%' then raise exception 'S7 staff: %', v_err; end if;
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', v_mgr, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform record_stock_correction('medication', v_pill, -1);
    reset role;
    raise exception 'S7 negative accepted';
  exception when others then
    reset role;
    get stacked diagnostics v_err = message_text;
    if v_err not like 'A stock count cannot be negative%' then raise exception 'S7 negative: %', v_err; end if;
  end;
  set local role authenticated;
  begin
    perform record_stock_correction('medication', gen_random_uuid(), 5);
    reset role;
    raise exception 'S7 unknown item accepted';
  exception when others then
    reset role;
    get stacked diagnostics v_err = message_text;
    if v_err not like 'That item was not found%' then raise exception 'S7 unknown: %', v_err; end if;
  end;
  begin
    insert into stock_counts (stocktake_id, item_kind, medication_id, counted_quantity, source)
      values (gen_random_uuid(), 'medication', v_pill, 1, 'nonsense');
    raise exception 'S7 bad source accepted';
  exception when check_violation then null;
  end;
  v_report := v_report || ' | S7 staff, negative, unknown item and bad source refused';

  raise exception 'HARNESS-OK 0112 twice%', v_report;
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
