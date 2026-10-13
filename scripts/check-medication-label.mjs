// Rollback harness for 0129_medication_label.sql against DEV only.
//
//   node scripts/check-medication-label.mjs     (from the repo root; dev only)
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

const migration = readFileSync(join(root, "supabase/migrations/0129_medication_label.sql"), "utf8");

const sql = `
begin;
${migration}
${migration}

do $h$
declare
  v_m uuid; v_d uuid; v_got text;
begin
  -- A. (dropped) "every existing row has no label" held only on the day 0129 was applied; staff have
  -- since attached real labels on dev (rule 4 of docs/decisions/2026-10-02-replay-or-assert-live.md).
  -- B and C prove a new row starts null.

  -- B. omitted -> null; an id round-trips; clear -> null (medication)
  insert into medication (name, dose_unit) values ('harness-0129 tablet', 'tablet') returning id into v_m;
  if (select label_drive_file_id from medication where id = v_m) is not null then raise exception 'FAIL B omitted not null'; end if;
  update medication set label_drive_file_id = '1AbC_dEf-0129' where id = v_m;
  select label_drive_file_id into v_got from medication where id = v_m;
  if v_got is distinct from '1AbC_dEf-0129' then raise exception 'FAIL B medication round-trip %', v_got; end if;
  update medication set label_drive_file_id = null where id = v_m;
  if (select label_drive_file_id from medication where id = v_m) is not null then raise exception 'FAIL B clear'; end if;

  -- C. the same on diet_types
  insert into diet_types (name, unit, daily_qty_small, daily_qty_medium, daily_qty_large)
    values ('harness-0129 food', 'cup', 1, 1, 1) returning id into v_d;
  if (select label_drive_file_id from diet_types where id = v_d) is not null then raise exception 'FAIL C omitted not null'; end if;
  update diet_types set label_drive_file_id = '1XyZ-0129' where id = v_d;
  select label_drive_file_id into v_got from diet_types where id = v_d;
  if v_got is distinct from '1XyZ-0129' then raise exception 'FAIL C diet round-trip %', v_got; end if;

  -- D. no trigger names it, and no view the PUBLIC SITE (anon) can read exposes it. Was "no view at
  -- all": 0136 and 0161 on purpose put it in two signed-in-only views (medication_list_medications,
  -- stock_medications) so the label shows in the app. The privacy line is anon, so that is the line.
  if exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
              where not t.tgisinternal and c.relname in ('medication', 'diet_types')
                and pg_get_triggerdef(t.oid) ilike '%label_drive_file_id%') then
    raise exception 'FAIL D a trigger names label_drive_file_id'; end if;
  if exists (select 1 from pg_views where schemaname = 'public' and definition ilike '%label_drive_file_id%'
              and has_table_privilege('anon', format('public.%I', viewname), 'select')) then
    raise exception 'FAIL D a view anon can read names label_drive_file_id'; end if;

  raise exception 'HARNESS-OK omitted->null, id round-trips, clear->null on medication | id round-trips on diet_types | no trigger names the column, and no view anon can read does | file ran twice';
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
