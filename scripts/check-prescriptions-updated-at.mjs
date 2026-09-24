// Rollback harness for 0078_prescriptions_diets_updated_at.sql against DEV only.
// One transaction: the migration (twice), assertions against real rows, then a
// deliberate `raise exception` carrying the evidence — so nothing can commit.
//
//   node scripts/check-prescriptions-updated-at.mjs     (from the repo root; dev only)
//
// Run it after the migration is applied, so existing rows carry the apply
// time and an edit in this transaction (now() = later) is distinguishable
// from a kept value. Exits 0 when every assertion held. Writes nothing.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync(join(root, "supabase/migrations/0078_prescriptions_diets_updated_at.sql"), "utf8");

// The same cases for both tables. Each runs in a sub-block that ends by
// raising 'undo', so every case starts from the row's back-filled value.
const cases = (table, insertCols) => `
  -- ${table}: a live resident's row, so the deceased lock stays out of the way
  select t.id, t.updated_at into v_id, v_old from ${table} t
   where not resident_is_deceased(t.resident_id) order by t.created_at limit 1;
  if v_id is null then raise exception 'FAIL setup: no ${table} row for a live resident in dev'; end if;
  if v_old >= now() then raise exception 'FAIL setup: ${table} row already at now() — run after the apply'; end if;

  -- A. back-fill: no nulls (the column is not null), none earlier than created_at
  select count(*), count(*) filter (where updated_at < created_at), count(distinct updated_at)
    into v_rows, v_bad, v_distinct from ${table};
  if v_bad <> 0 then raise exception 'FAIL A ${table}: % rows with updated_at before created_at', v_bad; end if;
  v_report := v_report || format(' | ${table}: rows=%s distinct updated_at=%s', v_rows, v_distinct);

  -- B. changing end_date moves it
  begin
    update ${table} set end_date = coalesce(end_date, start_date) + 1 where id = v_id returning updated_at into v_new;
    raise exception 'undo';
  exception when raise_exception then
    if sqlerrm <> 'undo' then raise; end if;
  end;
  if v_new is distinct from now() then raise exception 'FAIL B ${table}: end_date edit left updated_at at % (was %)', v_new, v_old; end if;

  -- C. changing an unrelated column (notes) moves it too
  begin
    update ${table} set notes = coalesce(notes, '') || ' harness 0078' where id = v_id returning updated_at into v_new;
    raise exception 'undo';
  exception when raise_exception then
    if sqlerrm <> 'undo' then raise; end if;
  end;
  if v_new is distinct from now() then raise exception 'FAIL C ${table}: notes edit left updated_at at %', v_new; end if;

  -- D. a no-op update keeps it
  begin
    update ${table} set notes = notes, end_date = end_date where id = v_id returning updated_at into v_new;
    raise exception 'undo';
  exception when raise_exception then
    if sqlerrm <> 'undo' then raise; end if;
  end;
  if v_new is distinct from v_old then raise exception 'FAIL D ${table}: no-op update moved updated_at % -> %', v_old, v_new; end if;

  -- E. setting it by hand does nothing: alone it is a no-op, so it keeps the old value
  begin
    update ${table} set updated_at = '2000-01-01' where id = v_id returning updated_at into v_new;
    raise exception 'undo';
  exception when raise_exception then
    if sqlerrm <> 'undo' then raise; end if;
  end;
  if v_new is distinct from v_old then raise exception 'FAIL E ${table}: hand-set updated_at stuck at %', v_new; end if;

  -- F. an insert gets now(), even when it asks for a backdated value
  begin
    insert into ${table} (${insertCols}, end_date, updated_at)
    select ${insertCols}, start_date, '2000-01-01' from ${table} where id = v_id
    returning updated_at into v_new;
    raise exception 'undo';
  exception when raise_exception then
    if sqlerrm <> 'undo' then raise; end if;
  end;
  if v_new is distinct from now() then raise exception 'FAIL F ${table}: insert got updated_at %', v_new; end if;

  -- G. a lock-bypassed write to a deceased resident's row (the cascade's path) moves it
  v_id := null;
  select t.id into v_id from ${table} t where resident_is_deceased(t.resident_id) limit 1;
  if v_id is not null then
    begin
      perform set_config('app.deceased_lock_bypass', 'on', true);
      update ${table} set end_date = coalesce(end_date, start_date) + 1 where id = v_id returning updated_at into v_new;
      raise exception 'undo';
    exception when raise_exception then
      if sqlerrm <> 'undo' then raise; end if;
    end;
    perform set_config('app.deceased_lock_bypass', '', true);
    if v_new is distinct from now() then raise exception 'FAIL G ${table}: bypassed cascade write left updated_at at %', v_new; end if;
    v_report := v_report || ' bypass-write=moved';
  else
    v_report := v_report || ' bypass-write=no deceased row in dev';
  end if;
`;

const sql = `
begin;
${migration}
-- a second run of the whole file must be harmless
${migration}

do $h$
declare
  v_id uuid; v_old timestamptz; v_new timestamptz;
  v_rows int; v_bad int; v_distinct int; v_n int;
  v_report text := '';
begin
  -- shape: both columns timestamptz not null with a default; both triggers present
  select count(*) into v_n from information_schema.columns
   where table_schema = 'public' and table_name in ('prescriptions', 'resident_diets')
     and column_name = 'updated_at' and data_type = 'timestamp with time zone'
     and is_nullable = 'NO' and column_default = 'now()';
  if v_n <> 2 then raise exception 'FAIL shape: % of 2 columns are timestamptz not null default now()', v_n; end if;
  select count(*) into v_n from pg_trigger
   where not tgisinternal and tgname in ('prescriptions_touch_updated_at', 'resident_diets_touch_updated_at');
  if v_n <> 2 then raise exception 'FAIL shape: % of 2 triggers present', v_n; end if;

${cases("prescriptions", "resident_id, medication_id, start_date")}
${cases("resident_diets", "resident_id, diet_type_id, start_date")}

  raise exception 'HARNESS-OK shape: 2 columns timestamptz not null default now(), 2 triggers%  | per table: back-fill not null and >= created_at, end_date edit moves, notes edit moves, no-op keeps, hand-set ignored, backdated insert gets now() | file ran twice', v_report;
end;
$h$;
rollback;
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
