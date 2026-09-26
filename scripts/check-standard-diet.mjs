// Rollback harness for 0087_standard_diet_flag.sql against DEV only.
// One transaction: plant two edge cases, the migration (twice), assertions
// against real rows, then a deliberate `raise exception` carrying the
// evidence — so nothing can commit. Works before and after 0087 is applied
// (after, the backfill has nothing left to do and says so).
//
//   node scripts/check-standard-diet.mjs     (from the repo root; dev only)
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

const migration = readFileSync(join(root, "supabase/migrations/0087_standard_diet_flag.sql"), "utf8");

// "Living" and "current" exactly as the migration means them.
const living = `
  select r.id from residents r
  join private.resident_current_state s on s.resident_id = r.id
  where s.current_status not in ('Deceased', 'Adopted')`;
const current = (resident) => `
  exists (select 1 from resident_diets rd where rd.resident_id = ${resident}
           and rd.start_date <= shelter_today()
           and (rd.end_date is null or rd.end_date >= shelter_today()))`;

const sql = `
begin;

create temp table h (k text primary key, id uuid, n bigint);

do $p$
declare v_id uuid;
begin
  -- Plant F: a living resident whose current diets end yesterday and whose
  -- next one is booked for today + 5. The backfill must stop at today + 4.
  select l.id into v_id from (${living}) l where ${current("l.id")} order by l.id limit 1;
  if v_id is null then raise exception 'FAIL setup: no living resident with a current diet in dev'; end if;
  update resident_diets set end_date = shelter_today() - 1
   where resident_id = v_id and start_date <= shelter_today() - 1
     and (end_date is null or end_date >= shelter_today());
  delete from resident_diets where resident_id = v_id and start_date >= shelter_today();
  insert into resident_diets (resident_id, diet_type_id, start_date)
  select v_id, id, shelter_today() + 5 from diet_types order by name limit 1;
  insert into h values ('future', v_id, null);

  -- Before: living residents without a current diet (F included).
  insert into h select 'before', null, count(*) from (${living}) l where not ${current("l.id")};
  insert into h select 'rows_before', null, count(*) from resident_diets;
  -- Deceased/adopted residents with no current diet must stay without one.
  insert into h select 'gone_before', null, count(*) from resident_diets rd
    join private.resident_current_state s on s.resident_id = rd.resident_id
   where s.current_status in ('Deceased', 'Adopted');
end;
$p$;

${migration}

do $h$
declare
  v_std uuid; v_other uuid; v_id uuid;
  v_n bigint; v_before bigint; v_rows_before bigint;
  v_start date; v_end date;
  v_report text := '';
begin
  -- A. shape: not-null boolean default false; the partial unique index
  select count(*) into v_n from information_schema.columns
   where table_schema = 'public' and table_name = 'diet_types' and column_name = 'is_standard'
     and data_type = 'boolean' and is_nullable = 'NO' and column_default = 'false';
  if v_n <> 1 then raise exception 'FAIL A: is_standard column not as expected'; end if;
  select count(*) into v_n from pg_indexes
   where indexname = 'diet_types_one_standard' and indexdef ilike '%unique%' and indexdef ilike '%where is_standard%';
  if v_n <> 1 then raise exception 'FAIL A: diet_types_one_standard missing or not a partial unique index'; end if;

  -- B. exactly one standard, and it is the named one
  select count(*) into v_n from diet_types where is_standard;
  if v_n <> 1 then raise exception 'FAIL B: % standard diet types', v_n; end if;
  select id into v_std from diet_types where is_standard;
  if not exists (select 1 from diet_types where id = v_std and lower(name) = lower('Standard Kibble + Chicken')) then
    raise exception 'FAIL B: the flagged row is not Standard Kibble + Chicken';
  end if;

  -- C. nobody living is left without a current diet
  select n into v_before from h where k = 'before';
  select n into v_rows_before from h where k = 'rows_before';
  select count(*) into v_n from (${living}) l where not ${current("l.id")};
  if v_n <> 0 then raise exception 'FAIL C: % living resident(s) still without a current diet', v_n; end if;

  -- D. exactly one row per such resident, all standard, from today, with the note
  select count(*) into v_n from resident_diets;
  if v_n - v_rows_before <> v_before then
    raise exception 'FAIL D: % rows added for % residents', v_n - v_rows_before, v_before;
  end if;
  select count(*) into v_n from resident_diets
   where notes like 'Backfilled with the shelter''s standard diet (0087)%'
     and (diet_type_id <> v_std or start_date <> shelter_today());
  if v_n <> 0 then raise exception 'FAIL D: % backfilled row(s) not standard-from-today', v_n; end if;

  -- E. deceased and adopted residents got nothing
  select count(*) into v_n from resident_diets rd
    join private.resident_current_state s on s.resident_id = rd.resident_id
   where s.current_status in ('Deceased', 'Adopted');
  if v_n <> (select n from h where k = 'gone_before') then raise exception 'FAIL E: a deceased or adopted resident was backfilled'; end if;

  -- F. the booked-ahead resident gets the standard only until the day before
  select id into v_id from h where k = 'future';
  select start_date, end_date into v_start, v_end from resident_diets
   where resident_id = v_id and diet_type_id = v_std and start_date = shelter_today();
  if v_end is distinct from shelter_today() + 4 then
    raise exception 'FAIL F: booked-ahead resident backfilled % to % (want today to today + 4)', v_start, v_end;
  end if;

  -- G. a second standard is refused
  select id into v_other from diet_types where not is_standard order by name limit 1;
  if v_other is not null then
    begin
      update diet_types set is_standard = true where id = v_other;
      raise exception 'FAIL G: a second standard diet was accepted';
    exception when unique_violation then null;
    end;
  end if;

  insert into h values ('other', v_other, null), ('std', v_std, null);
end;
$h$;

-- H. moving the standard (clear, then set) works, and re-running the file
-- keeps the moved flag and adds no rows
do $m$
declare v_other uuid := (select id from h where k = 'other');
begin
  if v_other is null then return; end if;
  update diet_types set is_standard = false where id = (select id from h where k = 'std');
  update diet_types set is_standard = true where id = v_other;
  insert into h select 'rows_moved', null, count(*) from resident_diets;
end;
$m$;

${migration}

do $f$
declare
  v_other uuid := (select id from h where k = 'other');
  v_n bigint;
begin
  if v_other is not null then
    if not exists (select 1 from diet_types where id = v_other and is_standard) then
      raise exception 'FAIL H: re-run moved the standard back';
    end if;
    select count(*) - (select n from h where k = 'rows_moved') into v_n from resident_diets;
    if v_n <> 0 then raise exception 'FAIL H: re-run added % rows', v_n; end if;
  end if;

  raise exception 'HARNESS-OK shape: is_standard not null default false + partial unique index | one standard, the named one | % living resident(s) without a current diet before (incl. 1 planted booked-ahead), 0 after, one standard-from-today row each | deceased/adopted untouched | booked-ahead resident stops at today + 4 | second standard refused | move then re-run keeps the moved flag and adds no rows',
    (select n from h where k = 'before');
end;
$f$;
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
