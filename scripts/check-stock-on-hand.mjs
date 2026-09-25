// Rollback harness for 0083_stock_on_hand.sql against DEV only.
// One transaction: the migration (twice), assertions against real rows, then a
// deliberate `raise exception` carrying the evidence — so nothing can commit.
//
//   node scripts/check-stock-on-hand.mjs     (from the repo root; dev only)
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

const migration = readFileSync(join(root, "supabase/migrations/0083_stock_on_hand.sql"), "utf8");

// The same cases for both tables. Each runs in a sub-block that ends by
// raising 'undo', so every case starts from the row as it stands in dev.
// `rename` is an update that does not name stock_on_hand.
const cases = (table, rename, insertCols) => `
  select t.id into v_id from ${table} t order by t.name limit 1;
  if v_id is null then raise exception 'FAIL setup: no ${table} row in dev'; end if;

  -- A. existing rows untouched: all three columns null everywhere
  select count(*), count(*) filter (where stock_on_hand is not null or stock_counted_at is not null or reorder_lead_days is not null)
    into v_rows, v_bad from ${table};
  if v_bad <> 0 then raise exception 'FAIL A ${table}: % rows with a non-null new column', v_bad; end if;
  v_report := v_report || format(' | ${table}: rows=%s all-null', v_rows);

  -- B. setting a count stamps now(), and a hand-set time in the same write is overwritten
  begin
    update ${table} set stock_on_hand = 120.5, stock_counted_at = '2000-01-01' where id = v_id
      returning stock_counted_at into v_new;
    -- C. an update that does not name stock_on_hand keeps the stamp, even when it tries to set it
    update ${table} set stock_counted_at = '2000-01-01' where id = v_id returning stock_counted_at into v_new2;
    if v_new2 is distinct from v_new then raise exception 'FAIL C ${table}: hand-set stock_counted_at stuck at %', v_new2; end if;
    update ${table} set ${rename} where id = v_id returning stock_counted_at into v_new2;
    if v_new2 is distinct from v_new then raise exception 'FAIL C ${table}: unrelated edit moved stock_counted_at to %', v_new2; end if;
    -- D. clearing the count clears the stamp
    update ${table} set stock_on_hand = null where id = v_id returning stock_counted_at into v_new2;
    if v_new2 is not null then raise exception 'FAIL D ${table}: cleared count left stock_counted_at at %', v_new2; end if;
    raise exception 'undo';
  exception when raise_exception then
    if sqlerrm <> 'undo' then raise; end if;
  end;
  if v_new is distinct from now() then raise exception 'FAIL B ${table}: count set stock_counted_at to %', v_new; end if;

  -- E. re-saving the same count restamps (a stocktake that confirmed it).
  -- now() is fixed for the transaction, so check the stamp is rewritten
  -- over a planted old value that only the keep trigger could preserve.
  begin
    alter table ${table} disable trigger ${table}_stock_1_keep;
    alter table ${table} disable trigger ${table}_stock_2_stamp;
    update ${table} set stock_on_hand = 7, stock_counted_at = '2000-01-01' where id = v_id;
    alter table ${table} enable trigger ${table}_stock_1_keep;
    alter table ${table} enable trigger ${table}_stock_2_stamp;
    update ${table} set stock_on_hand = 7 where id = v_id returning stock_counted_at into v_new;
    raise exception 'undo';
  exception when raise_exception then
    if sqlerrm <> 'undo' then raise; end if;
  end;
  if v_new is distinct from now() then raise exception 'FAIL E ${table}: same-count save left stock_counted_at at %', v_new; end if;

  -- F. zero is accepted (out of stock); negative stock and non-positive lead days are refused
  begin
    update ${table} set stock_on_hand = 0, reorder_lead_days = 14 where id = v_id returning stock_counted_at into v_new;
    raise exception 'undo';
  exception when raise_exception then
    if sqlerrm <> 'undo' then raise; end if;
  end;
  if v_new is distinct from now() then raise exception 'FAIL F ${table}: zero count not stamped'; end if;
  begin
    update ${table} set stock_on_hand = -1 where id = v_id;
    raise exception 'FAIL F ${table}: negative stock accepted';
  exception when check_violation then null;
  end;
  begin
    update ${table} set reorder_lead_days = 0 where id = v_id;
    raise exception 'FAIL F ${table}: zero lead days accepted';
  exception when check_violation then null;
  end;

  -- G. an insert with a count gets now(); one without gets null, whatever it asks for
  begin
    insert into ${table} (${insertCols}, stock_on_hand, stock_counted_at)
    select ${insertCols.replace(/\bname\b/, "name || ' harness 0083'")}, 3, '2000-01-01' from ${table} where id = v_id
    returning stock_counted_at into v_new;
    insert into ${table} (${insertCols}, stock_counted_at)
    select ${insertCols.replace(/\bname\b/, "name || ' harness 0083b'")}, '2000-01-01' from ${table} where id = v_id
    returning stock_counted_at into v_new2;
    raise exception 'undo';
  exception when raise_exception then
    if sqlerrm <> 'undo' then raise; end if;
  end;
  if v_new is distinct from now() then raise exception 'FAIL G ${table}: insert with count got %', v_new; end if;
  if v_new2 is not null then raise exception 'FAIL G ${table}: insert without count got %', v_new2; end if;
`;

const sql = `
begin;
${migration}
-- a second run of the whole file must be harmless
${migration}

do $h$
declare
  v_id uuid; v_new timestamptz; v_new2 timestamptz;
  v_rows int; v_bad int; v_n int;
  v_report text := '';
begin
  -- shape: 3 columns x 2 tables, all nullable with no default; 4 triggers
  select count(*) into v_n from information_schema.columns
   where table_schema = 'public' and table_name in ('medication', 'diet_types')
     and is_nullable = 'YES' and column_default is null
     and ((column_name = 'stock_on_hand' and data_type = 'numeric')
       or (column_name = 'stock_counted_at' and data_type = 'timestamp with time zone')
       or (column_name = 'reorder_lead_days' and data_type = 'integer'));
  if v_n <> 6 then raise exception 'FAIL shape: % of 6 columns as expected', v_n; end if;
  select count(*) into v_n from pg_trigger
   where not tgisinternal and tgname in ('medication_stock_1_keep', 'medication_stock_2_stamp',
                                         'diet_types_stock_1_keep', 'diet_types_stock_2_stamp');
  if v_n <> 4 then raise exception 'FAIL shape: % of 4 triggers present', v_n; end if;

${cases("medication", "cost_per_unit = coalesce(cost_per_unit, 0) + 1", "name, dose_unit")}
${cases("diet_types", "cost_per_unit = cost_per_unit + 1", "name, unit, daily_qty_small, daily_qty_medium, daily_qty_large")}

  raise exception 'HARNESS-OK shape: 6 nullable columns, 4 triggers%  | per table: existing rows all-null, count stamps now() over a hand-set time, unrelated edit and hand-set keep the stamp, clearing clears it, same-count re-save restamps, 0 accepted, -1 stock and 0 lead days refused, insert with count stamped / without null | file ran twice', v_report;
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
