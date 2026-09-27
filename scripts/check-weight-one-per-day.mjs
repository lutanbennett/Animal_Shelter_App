// Rollback harness for *_weight_one_per_visit_and_day.sql against DEV only.
// One transaction: seed a harness resident (through record_intake, with an
// intake weight) and two visits, plant a same-visit duplicate while the
// index is still absent, run the file twice, then check what each rule
// refuses and allows, ending in a deliberate `raise exception` carrying the
// evidence — so nothing can commit. Safe to run before or after the file is
// applied.
//
//   node scripts/check-weight-one-per-day.mjs     (from the repo root; dev only)
//
// It checks
//   0  the file's clean-up: two readings planted on one visit before the
//      file ends with only the newer linked, the older kept and unlinked
//      (skipped, and said so, once the file is applied — the index then
//      refuses the plant itself)
//   A  a second reading on a visit that already has one is refused
//      (weight_one_per_visit), on a different day, so it's that rule
//   B  a second reading on a day that already has one is refused
//      (weight_one_per_day), unlinked, so it's that rule — including a
//      visit's reading on the day of the intake reading
//   C  what should still work: unlinked readings on different days, and a
//      reading on the other visit
//   D  the intake case the form takes: correcting the intake reading in
//      place (new kg, linked to the same-day visit) is allowed
//   E  same-day duplicates present when the file runs make it refuse, naming
//      the resident, rather than choose between them
//
// Exits 0 when every assertion held. Writes nothing even on success.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const dir = join(root, "supabase/migrations");
const file = readdirSync(dir).find((f) => /^\d+_weight_one_per_visit_and_day\.sql$/.test(f));
if (!file) throw new Error("no *_weight_one_per_visit_and_day.sql in supabase/migrations");
const migration = readFileSync(join(dir, file), "utf8");

const sql = `
begin;

create temp table harness (k text primary key, id uuid);

-- Whether the file was already applied decides whether the plant can happen.
create temp table harness_before as
select exists (select 1 from pg_indexes where indexname = 'weight_one_per_visit') as applied_already;

do $setup$
declare
  v_res uuid;
  v_v1 uuid := gen_random_uuid();
  v_v2 uuid := gen_random_uuid();
  v_w uuid;
begin
  select id into v_res from record_intake(
    p_name => 'Harness weight one-per-day', p_intake_date => date '2026-08-01', p_weight_kg => 10,
    p_diet_type_id => (select id from diet_types order by is_standard desc nulls last limit 1));
  insert into harness values ('res', v_res), ('v1', v_v1), ('v2', v_v2);
  insert into harness select 'intake_w', id from weight where resident_id = v_res;

  insert into vet_appointments (id, resident_id, appointment_date, reason)
  values (v_v1, v_res, timestamptz '2026-08-01 10:00+07', 'Harness visit same day as intake'),
         (v_v2, v_res, timestamptz '2026-08-10 10:00+07', 'Harness visit later');

  if not (select applied_already from harness_before) then
    -- Two readings on one visit, different days, created in order.
    insert into weight (id, resident_id, date, weight_kg, vet_appointment_id, created_at)
    values (gen_random_uuid(), v_res, date '2026-08-02', 11, v_v2, now() - interval '1 minute')
    returning id into v_w;
    insert into harness values ('plant_old', v_w);
    insert into weight (resident_id, date, weight_kg, vet_appointment_id)
    values (v_res, date '2026-08-10', 12, v_v2)
    returning id into v_w;
    insert into harness values ('plant_new', v_w);
  end if;
end $setup$;

${migration}

${migration}

do $h$
declare
  v_res uuid := (select id from harness where k = 'res');
  v_v1 uuid := (select id from harness where k = 'v1');
  v_v2 uuid := (select id from harness where k = 'v2');
  v_intake uuid := (select id from harness where k = 'intake_w');
  v_applied boolean := (select applied_already from harness_before);
  v_con text;
  v_report text := '';
begin
  if v_intake is null then raise exception 'HARNESS-FAIL setup: record_intake wrote no weight'; end if;

  -- 0: the clean-up kept both planted readings, and only the newer is linked.
  if v_applied then
    v_report := v_report || '0: skipped, file already applied on dev | ';
    insert into weight (resident_id, date, weight_kg, vet_appointment_id)
    values (v_res, date '2026-08-10', 12, v_v2);
  else
    if (select vet_appointment_id from weight where id = (select id from harness where k = 'plant_old')) is not null then
      raise exception 'HARNESS-FAIL 0: the older reading on the visit is still linked';
    end if;
    if (select vet_appointment_id from weight where id = (select id from harness where k = 'plant_new')) is distinct from v_v2 then
      raise exception 'HARNESS-FAIL 0: the newer reading lost its visit';
    end if;
    v_report := v_report || '0: planted pair → older unlinked and kept, newer still linked | ';
  end if;

  -- A: a second reading on visit 2 (which now has one), on a free day.
  begin
    insert into weight (resident_id, date, weight_kg, vet_appointment_id)
    values (v_res, date '2026-08-11', 12.5, v_v2);
    raise exception 'HARNESS-FAIL A: a second reading on one visit was accepted';
  exception when unique_violation then
    get stacked diagnostics v_con = constraint_name;
    if v_con <> 'weight_one_per_visit' then raise exception 'HARNESS-FAIL A: refused by % instead', v_con; end if;
  end;
  v_report := v_report || 'A: second reading on a visit refused by weight_one_per_visit | ';

  -- B: a second reading on a day that has one, unlinked; then linked to the
  -- visit on the intake day — the collision the per-day rule exists for.
  begin
    insert into weight (resident_id, date, weight_kg) values (v_res, date '2026-08-10', 12.2);
    raise exception 'HARNESS-FAIL B: a second unlinked reading on one day was accepted';
  exception when unique_violation then
    get stacked diagnostics v_con = constraint_name;
    if v_con <> 'weight_one_per_day' then raise exception 'HARNESS-FAIL B: refused by % instead', v_con; end if;
  end;
  begin
    insert into weight (resident_id, date, weight_kg, vet_appointment_id)
    values (v_res, date '2026-08-01', 10.4, v_v1);
    raise exception 'HARNESS-FAIL B: a visit reading on the intake reading''s day was accepted';
  exception when unique_violation then
    get stacked diagnostics v_con = constraint_name;
    if v_con <> 'weight_one_per_day' then raise exception 'HARNESS-FAIL B: intake day refused by % instead', v_con; end if;
  end;
  v_report := v_report || 'B: second reading on a day refused by weight_one_per_day (unlinked, and a visit on intake day) | ';

  -- C: what still works.
  insert into weight (resident_id, date, weight_kg) values (v_res, date '2026-08-20', 12.6);
  insert into weight (resident_id, date, weight_kg) values (v_res, date '2026-08-21', 12.7);
  v_report := v_report || 'C: unlinked readings on two different days accepted | ';

  -- D: correct the intake reading in place and link it to the same-day visit.
  update weight set weight_kg = 10.4, vet_appointment_id = v_v1 where id = v_intake;
  if (select count(*) from weight where resident_id = v_res and date = date '2026-08-01') <> 1 then
    raise exception 'HARNESS-FAIL D: intake day does not have exactly one reading';
  end if;
  if (select vet_appointment_id from weight where id = v_intake) is distinct from v_v1 then
    raise exception 'HARNESS-FAIL D: the corrected intake reading is not linked to the visit';
  end if;
  v_report := v_report || 'D: intake reading corrected in place and linked to the same-day visit | ';

  -- E: same-day duplicates at apply time make the file refuse.
  begin
    drop index weight_one_per_day;
    insert into weight (resident_id, date, weight_kg) values (v_res, date '2026-08-20', 99);
    begin
      execute ${pgQuote(migration)};
      raise exception 'HARNESS-FAIL E: the file ran over a same-day duplicate';
    exception when raise_exception then
      if sqlerrm like 'HARNESS-FAIL%' then raise; end if;
      if sqlerrm not like ('%more than one reading on the same day%' || v_res || '%') then
        raise exception 'HARNESS-FAIL E: refused, but with %', sqlerrm;
      end if;
    end;
    raise exception 'harness-e-undo';
  exception when raise_exception then
    if sqlerrm <> 'harness-e-undo' then raise; end if;
  end;
  if not exists (select 1 from pg_indexes where indexname = 'weight_one_per_day') then
    raise exception 'HARNESS-FAIL E: the index did not come back after the undo';
  end if;
  v_report := v_report || 'E: same-day duplicate at apply time → file refuses, naming the resident';

  raise exception '%', format('HARNESS-OK %s ran twice | %s | %s', ${pgQuote(file)},
    case when v_applied then 'applied on dev' else 'pending on dev' end, v_report);
end;
$h$;
rollback;
`;

function pgQuote(s) {
  return `'${s.replace(/'/g, "''")}'`;
}

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
