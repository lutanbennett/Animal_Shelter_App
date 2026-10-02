// Rollback harness for 0128_safety_stock.sql against DEV only.
//
//   node scripts/check-safety-stock.mjs     (from the repo root; dev only)
//
// One transaction: the migration (twice), assertions against real rows, then a
// deliberate `raise exception` carrying the evidence — nothing can commit.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync(join(root, "supabase/migrations/0128_safety_stock.sql"), "utf8");

const sql = `
begin;
${migration}
${migration}

do $h$
declare
  v_m uuid; v_d uuid; v_got numeric; v_nn int; v_bad boolean;
  v_rows int;
begin
  -- A. nothing back-filled: every existing row is null = none
  select count(safety_stock) into v_nn from medication;
  if v_nn <> 0 then raise exception 'FAIL A % medication rows carry a safety stock', v_nn; end if;
  select count(safety_stock) into v_nn from diet_types;
  if v_nn <> 0 then raise exception 'FAIL A % diet rows carry a safety stock', v_nn; end if;

  -- B. omitted -> null; fractional values round-trip at full precision; 0 is not null
  insert into medication (name, dose_unit) values ('harness-0128 fluid', 'ml') returning id into v_m;
  select safety_stock into v_got from medication where id = v_m;
  if v_got is not null then raise exception 'FAIL B omitted is %, not null', v_got; end if;
  update medication set safety_stock = 2500.125 where id = v_m;
  select safety_stock into v_got from medication where id = v_m;
  if v_got <> 2500.125 then raise exception 'FAIL B medication round-trip %', v_got; end if;
  update medication set safety_stock = 0 where id = v_m;
  select safety_stock into v_got from medication where id = v_m;
  if v_got is distinct from 0 then raise exception 'FAIL B zero stored as %', v_got; end if;
  update medication set safety_stock = null where id = v_m;
  if (select safety_stock from medication where id = v_m) is not null then raise exception 'FAIL B clear to null'; end if;

  -- C. negative is rejected (medication and diet_types)
  v_bad := false;
  begin update medication set safety_stock = -1 where id = v_m;
  exception when check_violation then v_bad := true; end;
  if not v_bad then raise exception 'FAIL C medication accepted -1'; end if;

  insert into diet_types (name, unit, daily_qty_small, daily_qty_medium, daily_qty_large)
    values ('harness-0128 food', 'cup', 1, 1, 1) returning id into v_d;
  update diet_types set safety_stock = 12.5 where id = v_d;
  select safety_stock into v_got from diet_types where id = v_d;
  if v_got <> 12.5 then raise exception 'FAIL C diet round-trip %', v_got; end if;
  v_bad := false;
  begin update diet_types set safety_stock = -0.5 where id = v_d;
  exception when check_violation then v_bad := true; end;
  if not v_bad then raise exception 'FAIL C diet accepted -0.5'; end if;

  -- D. the 0083 stamp triggers fire on insert / update of stock_on_hand only, so a safety_stock edit
  --    cannot re-stamp stock_counted_at (now() is constant in a transaction: assert the trigger
  --    definitions rather than timestamps)
  if exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
              where not t.tgisinternal and c.relname in ('medication', 'diet_types')
                and pg_get_triggerdef(t.oid) ilike '%safety_stock%') then
    raise exception 'FAIL D a trigger names safety_stock'; end if;

  raise exception 'HARNESS-OK existing rows all null (nothing back-filled) | omitted->null, 2500.125 and 12.5 round-trip, 0 distinct from null, clear->null | negative rejected on both tables | no trigger names safety_stock | file ran twice';
end $h$;
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
