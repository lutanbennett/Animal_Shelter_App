// Rollback harness for *_medical_soft_delete.sql against DEV only.
// One transaction: seed a harness resident (record_intake, with an intake
// weight), then check
// what archiving does, ending in a deliberate `raise exception` carrying the
// evidence — so nothing can commit. Run it after the file is applied on dev.
// The file is no longer replayed (0127 dropped a function it calls).
//
//   node scripts/check-medical-soft-delete.mjs     (from the repo root; dev only)
//
// It checks
//   A  archiving a weight frees its day and its visit (a replacement is
//      accepted); restoring while a live one holds the slot is refused
//   B  immunization: record_immunization / _bulk / _fanout still upsert
//      against the partial key (no 42P10), an archived dose frees its key,
//      leaves is_vaccinated, immunization_next_due (falling back to the dose
//      before it) and the duplicate check
//   C  an archived prescription leaves medication_forecast and the public
//      in_treatment count
//   D  an archived vet visit leaves the cashflow forecast
//   E  a vet's resident scope drops an archived visit, and returns on restore
//   F  archiving is one UPDATE and writes exactly one audit_log row
//   G  the consistency check: archived_by / archive_reason need archived_at
//   H  every row that existed before the harness has no archived_at
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
const file = readdirSync(dir).find((f) => /^\d+_medical_soft_delete\.sql$/.test(f));
if (!file) throw new Error("no *_medical_soft_delete.sql in supabase/migrations");
const migration = readFileSync(join(dir, file), "utf8");

function pgQuote(s) {
  return `'${s.replace(/'/g, "''")}'`;
}

const sql = `
begin;

create temp table harness (k text primary key, id uuid);
create temp table harness_before as
select
  (select count(*) from weight where archived_at is not null) as w,
  (select count(*) from prescriptions where archived_at is not null) as p,
  (select count(*) from vet_appointments where archived_at is not null) as v,
  (select count(*) from immunization_records where archived_at is not null) as i;

-- Run one statement as a login. Returns the row count; -1 if a privilege
-- refused it, -2 for any other error.
create function pg_temp.vet_ids(p_uid uuid) returns uuid[] language plpgsql as $f$
declare v uuid[];
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  select coalesce(array_agg(x), array[]::uuid[]) into v from current_vet_resident_ids() x;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

do $setup$
declare
  v_res uuid;
  v_vet uuid := gen_random_uuid();
  v_clinic uuid := gen_random_uuid();
begin
  select id into v_res from record_intake(
    p_name => 'Harness soft delete', p_intake_date => date '2026-08-01', p_weight_kg => 10,
    p_diet_type_id => (select id from diet_types order by is_standard desc nulls last limit 1));
  update residents set is_public_visible = true where id = v_res;
  insert into harness values ('res', v_res), ('vet_user', v_vet), ('clinic', v_clinic);
  insert into harness select 'intake_w', id from weight where resident_id = v_res;

  insert into vets (id, name, clinic_name) values (v_clinic, 'Harness clinic', 'Harness clinic');
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (v_vet, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'harness-soft-delete-' || v_vet || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now());
  insert into user_roles (user_id, role) values (v_vet, 'vet');
  -- 0127: a vet login's clinic is its linked doctor's (the home-clinic trigger links it)
  insert into vet_doctors (name, user_id, vet_id) values ('Harness vet doctor', v_vet, v_clinic);
end $setup$;

-- Not replayed (0127): 0124's vet_owns_visit and friends were redefined onto
-- current_user_vet_ids() by 0125, and replaying the file would put back calls to
-- current_user_vet_id(), which no longer exists. The assertions run against the
-- live definitions instead.

do $h$
declare
  v_res uuid := (select id from harness where k = 'res');
  v_vet uuid := (select id from harness where k = 'vet_user');
  v_clinic uuid := (select id from harness where k = 'clinic');
  v_intake uuid := (select id from harness where k = 'intake_w');
  v_visit uuid := gen_random_uuid();
  v_visit2 uuid := gen_random_uuid();
  v_w uuid;
  v_w2 uuid;
  v_type uuid := (select id from immunization_types where interval_months is not null order by name limit 1);
  v_type2 uuid := (select id from immunization_types where id <> (select id from immunization_types where interval_months is not null order by name limit 1) order by name limit 1);
  v_i1 uuid;
  v_i2 uuid;
  v_med uuid := (select id from medication order by name limit 1);
  v_freq uuid := (select id from frequency where doses_per_day is not null order by label limit 1);
  v_rx uuid;
  v_n int;
  v_a numeric;
  v_b numeric;
  v_inc int;
  v_audit int;
  v_report text := '';
  v_future date := date '2027-03-10';
begin
  if v_intake is null then raise exception 'HARNESS-FAIL setup: record_intake wrote no weight'; end if;
  if v_type is null or v_med is null or v_freq is null then
    raise exception 'HARNESS-FAIL setup: dev needs an immunization type with an interval, a medication and a per-day frequency';
  end if;

  -- H: nothing that existed before has been archived.
  if (select w + p + v + i from harness_before) <> 0 then
    raise exception 'HARNESS-FAIL H: % rows were already archived before the harness', (select w + p + v + i from harness_before);
  end if;
  v_report := v_report || 'H: no existing row has archived_at | ';

  -- Indexes and constraint as the file says.
  if (select indexdef from pg_indexes where indexname = 'weight_one_per_day') not like '%archived_at IS NULL%'
     or (select indexdef from pg_indexes where indexname = 'weight_one_per_visit') not like '%archived_at IS NULL%'
     or (select indexdef from pg_indexes where indexname = 'immunization_records_one_per_type_day') not like '%archived_at IS NULL%' then
    raise exception 'HARNESS-FAIL indexes: a unique key is not partial on archived_at';
  end if;
  if exists (select 1 from pg_constraint where conname = 'immunization_records_resident_id_immunization_type_id_date__key') then
    raise exception 'HARNESS-FAIL indexes: the old unconditional immunization key is still there';
  end if;

  -- A: weights.
  insert into vet_appointments (id, resident_id, vet_id, appointment_date, reason)
  values (v_visit, v_res, v_clinic, timestamptz '2026-08-05 10:00+07', 'Harness visit');
  insert into weight (resident_id, date, weight_kg, vet_appointment_id)
  values (v_res, date '2026-08-05', 11, v_visit) returning id into v_w;

  begin
    insert into weight (resident_id, date, weight_kg) values (v_res, date '2026-08-05', 99);
    raise exception 'HARNESS-FAIL A: a second live reading on a day was accepted';
  exception when unique_violation then null; end;

  select count(*) into v_audit from audit_log where table_name = 'weight' and row_id = v_w;
  update weight set archived_at = now(), archive_reason = 'harness' where id = v_w;
  if (select count(*) from audit_log where table_name = 'weight' and row_id = v_w) <> v_audit + 1 then
    raise exception 'HARNESS-FAIL F: archiving a weight wrote % audit rows, not 1',
      (select count(*) from audit_log where table_name = 'weight' and row_id = v_w) - v_audit;
  end if;
  if (select (new_row ->> 'archived_at') is null from audit_log where table_name = 'weight' and row_id = v_w order by id desc limit 1) then
    raise exception 'HARNESS-FAIL F: the audit row does not carry archived_at';
  end if;
  v_report := v_report || 'F: archive = one audit row carrying archived_at | ';

  -- the same day AND the same visit are free again
  insert into weight (resident_id, date, weight_kg, vet_appointment_id)
  values (v_res, date '2026-08-05', 11.5, v_visit) returning id into v_w2;
  begin
    update weight set archived_at = null, archive_reason = null where id = v_w;
    raise exception 'HARNESS-FAIL A: restore beside a live reading on the same day was accepted';
  exception when unique_violation then null; end;
  v_report := v_report || 'A: archived weight frees its day and visit; restore over a live one refused | ';

  -- intake weight can be archived and replaced on its day too
  update weight set archived_at = now() where id = v_intake;
  insert into weight (resident_id, date, weight_kg) values (v_res, date '2026-08-01', 10.5);

  -- G: consistency check
  begin
    update weight set archived_by = null, archive_reason = 'orphan reason', archived_at = null where id = v_w2;
    raise exception 'HARNESS-FAIL G: a reason without archived_at was accepted';
  exception when check_violation then null; end;
  v_report := v_report || 'G: reason needs archived_at | ';

  -- B: immunizations.
  perform record_immunization(v_res, v_type, date '2026-08-02');
  perform record_immunization(v_res, v_type, date '2026-08-02', 'Dr Harness');
  select count(*) into v_n from immunization_records where resident_id = v_res and immunization_type_id = v_type and date_administered = date '2026-08-02';
  if v_n <> 1 then raise exception 'HARNESS-FAIL B: record_immunization twice left % rows', v_n; end if;
  perform record_immunizations_bulk(array[v_res], v_type, date '2026-08-02');
  perform record_immunizations_fanout(array[v_res], array[v_type], date '2026-08-02');
  select count(*) into v_n from immunization_records where resident_id = v_res and immunization_type_id = v_type and date_administered = date '2026-08-02';
  if v_n <> 1 then raise exception 'HARNESS-FAIL B: bulk/fanout over a live dose left % rows', v_n; end if;
  select id into v_i1 from immunization_records where resident_id = v_res and immunization_type_id = v_type and date_administered = date '2026-08-02';

  if not (select is_vaccinated from public_resident_profiles where id = v_res) then
    raise exception 'HARNESS-FAIL B: a live dose does not make the public profile vaccinated';
  end if;
  -- an earlier dose, so next_due has something to fall back to
  perform record_immunization(v_res, v_type, date '2026-07-01');
  if (select last_administered from immunization_next_due where resident_id = v_res and immunization_type_id = v_type) <> date '2026-08-02' then
    raise exception 'HARNESS-FAIL B: next_due is not from the newest dose';
  end if;

  update immunization_records set archived_at = now() where id = v_i1;
  if (select last_administered from immunization_next_due where resident_id = v_res and immunization_type_id = v_type) <> date '2026-07-01' then
    raise exception 'HARNESS-FAIL B: archived latest dose still drives next_due';
  end if;
  -- the key is free: recording it again makes a new live row
  perform record_immunization(v_res, v_type, date '2026-08-02');
  select count(*) into v_n from immunization_records where resident_id = v_res and immunization_type_id = v_type and date_administered = date '2026-08-02';
  if v_n <> 2 or (select count(*) from immunization_records where resident_id = v_res and immunization_type_id = v_type and date_administered = date '2026-08-02' and archived_at is null) <> 1 then
    raise exception 'HARNESS-FAIL B: re-recording an archived key did not add one live row (% rows)', v_n;
  end if;
  perform record_immunizations_bulk(array[v_res], v_type, date '2026-08-02');
  perform record_immunizations_fanout(array[v_res], array[v_type], date '2026-08-02');
  if exists (select 1 from immunization_duplicate_check where resident_id = v_res) then
    raise exception 'HARNESS-FAIL B: an archived dose beside a live one is flagged as a duplicate';
  end if;
  -- archive everything: no longer vaccinated, and not in next_due
  update immunization_records set archived_at = now() where resident_id = v_res and archived_at is null;
  if (select is_vaccinated from public_resident_profiles where id = v_res) then
    raise exception 'HARNESS-FAIL B: archived doses still make the public profile vaccinated';
  end if;
  if exists (select 1 from immunization_next_due where resident_id = v_res) then
    raise exception 'HARNESS-FAIL B: archived doses still appear in immunization_next_due';
  end if;
  v_report := v_report || 'B: upserts work against the partial key; archive frees it, leaves is_vaccinated, next_due, duplicates | ';

  -- C: prescriptions.
  select coalesce(max(prescription_count), 0) into v_a from medication_forecast(current_date, current_date + 30) where medication_id = v_med;
  select in_treatment into v_inc from public_shelter_stats;
  insert into prescriptions (resident_id, medication_id, frequency_id, start_date, dose_quantity)
  values (v_res, v_med, v_freq, current_date, 1) returning id into v_rx;
  select coalesce(max(prescription_count), 0) into v_b from medication_forecast(current_date, current_date + 30) where medication_id = v_med;
  if v_b <> v_a + 1 then raise exception 'HARNESS-FAIL C: a live prescription is not in the forecast (% -> %)', v_a, v_b; end if;
  if (select in_treatment from public_shelter_stats) <> v_inc + 1 then
    raise exception 'HARNESS-FAIL C: a live prescription is not in in_treatment';
  end if;
  update prescriptions set archived_at = now() where id = v_rx;
  select coalesce(max(prescription_count), 0) into v_b from medication_forecast(current_date, current_date + 30) where medication_id = v_med;
  if v_b <> v_a then raise exception 'HARNESS-FAIL C: an archived prescription is still in the forecast'; end if;
  if (select in_treatment from public_shelter_stats) <> v_inc then
    raise exception 'HARNESS-FAIL C: an archived prescription still counts as in treatment';
  end if;
  v_report := v_report || 'C: archived prescription leaves medication_forecast and in_treatment | ';

  -- D: cashflow (vet).
  select coalesce(sum(amount), 0) into v_a from cashflow_forecast(date_trunc('month', v_future)::date, (date_trunc('month', v_future) + interval '1 month - 1 day')::date) where category = 'vet';
  insert into vet_appointments (id, resident_id, vet_id, appointment_date, reason, status, cost)
  values (v_visit2, v_res, v_clinic, v_future::timestamptz + interval '10 hours', 'Harness future visit', 'scheduled', 777);
  select coalesce(sum(amount), 0) into v_b from cashflow_forecast(date_trunc('month', v_future)::date, (date_trunc('month', v_future) + interval '1 month - 1 day')::date) where category = 'vet';
  if v_b <> v_a + 777 then raise exception 'HARNESS-FAIL D: a live scheduled visit is not in the forecast (% -> %)', v_a, v_b; end if;
  -- E (live half): the vet sees the resident through that visit
  if not (v_res = any (pg_temp.vet_ids(v_vet))) then
    raise exception 'HARNESS-FAIL E: the vet cannot see a resident they have a live visit with';
  end if;
  update vet_appointments set archived_at = now() where id = v_visit2;
  select coalesce(sum(amount), 0) into v_b from cashflow_forecast(date_trunc('month', v_future)::date, (date_trunc('month', v_future) + interval '1 month - 1 day')::date) where category = 'vet';
  if v_b <> v_a then raise exception 'HARNESS-FAIL D: an archived visit still costs money (% -> %)', v_a, v_b; end if;
  v_report := v_report || 'D: archived visit leaves the cashflow forecast | ';

  -- E: the other visit (v_visit, same clinic) is still live, so scope holds; archive it too.
  if not (v_res = any (pg_temp.vet_ids(v_vet))) then
    raise exception 'HARNESS-FAIL E: scope was lost while one live visit remained';
  end if;
  update vet_appointments set archived_at = now() where id = v_visit;
  if v_res = any (pg_temp.vet_ids(v_vet)) then
    raise exception 'HARNESS-FAIL E: archived visits still give the vet sight of the resident';
  end if;
  update vet_appointments set archived_at = null where id = v_visit;
  if not (v_res = any (pg_temp.vet_ids(v_vet))) then
    raise exception 'HARNESS-FAIL E: restoring the visit did not restore the vet''s scope';
  end if;
  v_report := v_report || 'E: vet scope drops archived visits and returns on restore | ';

  raise exception '%', format('HARNESS-OK %s asserted live | %s', ${pgQuote(file)}, v_report);
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
