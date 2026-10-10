// Rollback harness for *_vet_own_clinic_writes.sql against DEV only. One
// transaction: fixtures, what a doctor login's own JWT can write before the file, the
// file (twice), what each session can write afterwards, then a deliberate
// `raise exception` carrying the evidence, so nothing can commit. Safe to run
// before or after the file is applied.
//
//   node scripts/check-doctor-own-clinic-writes.mjs     (from the repo root; dev only)
//
// Fixtures: clinics "own" (the doctor's) and "other"; one resident, "mixed",
// with a visit at each clinic, and on each visit a prescription, procedure
// and blood test (plus a blood-test file on the other clinic's). All driven
// as the doctor's JWT through RLS, not the UI.
//
//   0  before the file the doctor could rewrite other's visit (skipped once applied)
//   A  other clinic: visit update, delete, insert refused
//   B  other clinic's prescription/procedure/blood test: insert refused,
//      update 0, delete 0; its files: insert refused, record_attachment refused
//   C  own clinic still works: visit insert/update/delete, children,
//      a visit-less child, a file on own blood test; and the doctor still reads
//      both clinics' rows on the shared resident
//   D  a doctor cannot move its own visit out to the other clinic, nor a child
//      onto the other clinic's visit
//   E  doctors and bulk_appointments: other clinic refused, own ok
//   F  admin and management still rewrite the other clinic's visit
//
// Exits 0 when every assertion held.
// NOTE: asserts the LIVE schema; the 0110 file is no longer replayed because 0125 redefines its
// functions and policies (docs/decisions/2026-10-02-replay-or-assert-live.md).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const dir = join(root, "supabase/migrations");
const file = readdirSync(dir).find((f) => /^\d+_vet_own_clinic_writes\.sql$/.test(f));
if (!file) throw new Error("no *_vet_own_clinic_writes.sql in supabase/migrations");
const migration = readFileSync(join(dir, file), "utf8");

const sql = `
begin;

create function pg_temp.try(p_uid uuid, p_sql text) returns bigint language plpgsql as $f$
declare v bigint;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  begin
    execute p_sql;
    get diagnostics v = row_count;
  exception
    when insufficient_privilege then v := -1;
    when others then v := -2;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

create temp table harness_ids (who text primary key, id uuid not null);
insert into harness_ids
select w, gen_random_uuid() from unnest(array[
  'doctor', 'admin', 'mgmt', 'own_clinic', 'other_clinic', 'mixed',
  'own_visit', 'oth_visit', 'oth_rx', 'oth_proc', 'oth_blood', 'own_rx', 'own_proc', 'own_blood',
  'oth_file', 'oth_doctor', 'oth_bulk']) w;
grant select on harness_ids to authenticated;

create function pg_temp.hid(p text) returns uuid language sql as $$ select id from harness_ids where who = p $$;

do $setup$
declare
  r record;
  v_own uuid := pg_temp.hid('own_clinic');
  v_oth uuid := pg_temp.hid('other_clinic');
  v_res uuid := pg_temp.hid('mixed');
  v_med uuid := (select id from medication limit 1);
begin
  insert into clinics (id, name) values (v_own, 'Harness clinic own'), (v_oth, 'Harness clinic other');
  for r in select * from harness_ids where who in ('doctor', 'admin', 'mgmt') loop
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (r.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-own-writes-' || r.who || '-' || r.id || '@example.invalid',
            '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || r.who), now(), now());
  end loop;
  insert into user_roles (user_id, role) values (pg_temp.hid('doctor'), 'doctor');
  -- 0127: a doctor login's clinics are its linked doctor's (doctor_clinics, 0172)
  with d as (insert into doctors (name, user_id) values ('Harness doctor', pg_temp.hid('doctor')) returning id)
    insert into doctor_clinics (clinic_id, doctor_id) select v_own, id from d;
  insert into user_roles (user_id, role) values
    (pg_temp.hid('admin'), 'admin'), (pg_temp.hid('mgmt'), 'management');  -- no staff: 0173 retired it

  insert into residents (id, name, species) values (v_res, 'Harness mixed', 'Dog');
  insert into clinic_visits (id, resident_id, clinic_id, appointment_date, status) values
    (pg_temp.hid('own_visit'), v_res, v_own, now() - interval '2 days', 'completed'),
    (pg_temp.hid('oth_visit'), v_res, v_oth, now() - interval '9 days', 'completed');
  insert into prescriptions (id, resident_id, medication_id, start_date, clinic_visit_id) values
    (pg_temp.hid('oth_rx'), v_res, v_med, current_date - 9, pg_temp.hid('oth_visit')),
    (pg_temp.hid('own_rx'), v_res, v_med, current_date - 2, pg_temp.hid('own_visit'));
  insert into procedures (id, resident_id, clinic_visit_id, procedure_type_id, date) values
    (pg_temp.hid('oth_proc'), v_res, pg_temp.hid('oth_visit'), (select id from procedure_types limit 1), current_date - 9),
    (pg_temp.hid('own_proc'), v_res, pg_temp.hid('own_visit'), (select id from procedure_types limit 1), current_date - 2);
  insert into blood_tests (id, resident_id, clinic_visit_id, blood_test_type_id, date) values
    (pg_temp.hid('oth_blood'), v_res, pg_temp.hid('oth_visit'), (select id from blood_test_types limit 1), current_date - 9),
    (pg_temp.hid('own_blood'), v_res, pg_temp.hid('own_visit'), (select id from blood_test_types limit 1), current_date - 2);
  insert into attachments (id, owner_type, owner_id, drive_file_id)
  values (pg_temp.hid('oth_file'), 'blood_test', pg_temp.hid('oth_blood'), 'harnessOthFile0001');
  insert into doctors (id, name) values (pg_temp.hid('oth_doctor'), 'Harness Dr Other');
  insert into doctor_clinics (clinic_id, doctor_id) values (v_oth, pg_temp.hid('oth_doctor'));
  insert into bulk_appointments (id, clinic_id, appointment_date) values (pg_temp.hid('oth_bulk'), v_oth, now());
end $setup$;

create temp table harness_before (applied_already boolean, doctor_rewrote_other bigint);
grant all on harness_before to authenticated;
insert into harness_before
select exists (select 1 from pg_proc where proname in ('vet_owns_visit', 'clinic_login_owns_visit')),
       pg_temp.try(pg_temp.hid('doctor'), format('update clinic_visits set notes = ''x'' where id = %L', pg_temp.hid('oth_visit')));


do $h$
declare
  v_doctor uuid := pg_temp.hid('doctor');
  v_own uuid := pg_temp.hid('own_clinic');
  v_oth uuid := pg_temp.hid('other_clinic');
  v_res uuid := pg_temp.hid('mixed');
  v_ov uuid := pg_temp.hid('own_visit');
  v_xv uuid := pg_temp.hid('oth_visit');
  v_med uuid := (select id from medication limit 1);
  v_applied boolean := (select applied_already from harness_before);
  v_before bigint := (select doctor_rewrote_other from harness_before);
  n bigint;
  v_who text;
  v_report text := '';
begin
  -- 0
  if v_applied then v_report := v_report || '0: skipped, applied on dev | ';
  elsif v_before <> 1 then raise exception 'HARNESS-FAIL 0: before the file the doctor updated % of other''s visit, expected 1', v_before;
  else v_report := v_report || '0: before the file the doctor rewrote other''s visit (1 row) | ';
  end if;

  -- A: other clinic's visit
  n := pg_temp.try(v_doctor, format('update clinic_visits set notes = ''x'' where id = %L', v_xv));
  if n <> 0 then raise exception 'HARNESS-FAIL A: doctor updated % of other''s visit', n; end if;
  n := pg_temp.try(v_doctor, format('delete from clinic_visits where id = %L', v_xv));
  if n <> 0 then raise exception 'HARNESS-FAIL A: doctor deleted % of other''s visit', n; end if;
  n := pg_temp.try(v_doctor, format('insert into clinic_visits (resident_id, clinic_id, appointment_date) values (%L, %L, now())', v_res, v_oth));
  if n <> -1 then raise exception 'HARNESS-FAIL A: doctor booked a visit at other clinic: %', n; end if;
  n := pg_temp.try(v_doctor, format('insert into clinic_visits (resident_id, clinic_id, appointment_date) values (%L, null, now())', v_res));
  if n <> -1 then raise exception 'HARNESS-FAIL A: doctor booked a visit with no clinic: %', n; end if;
  v_report := v_report || 'A: other''s visit: update 0, delete 0, insert at other refused, insert with no clinic refused | ';

  -- B: other clinic's children and files
  n := pg_temp.try(v_doctor, format('update prescriptions set notes = ''x'' where id = %L', pg_temp.hid('oth_rx')));
  if n <> 0 then raise exception 'HARNESS-FAIL B: doctor updated % of other''s prescription', n; end if;
  n := pg_temp.try(v_doctor, format('delete from prescriptions where id = %L', pg_temp.hid('oth_rx')));
  if n <> 0 then raise exception 'HARNESS-FAIL B: doctor deleted % of other''s prescription', n; end if;
  n := pg_temp.try(v_doctor, format('update procedures set notes = ''x'' where id = %L', pg_temp.hid('oth_proc')));
  if n <> 0 then raise exception 'HARNESS-FAIL B: doctor updated % of other''s procedure', n; end if;
  n := pg_temp.try(v_doctor, format('delete from procedures where id = %L', pg_temp.hid('oth_proc')));
  if n <> 0 then raise exception 'HARNESS-FAIL B: doctor deleted % of other''s procedure', n; end if;
  n := pg_temp.try(v_doctor, format('update blood_tests set results = ''x'' where id = %L', pg_temp.hid('oth_blood')));
  if n <> 0 then raise exception 'HARNESS-FAIL B: doctor updated % of other''s blood test', n; end if;
  n := pg_temp.try(v_doctor, format('delete from blood_tests where id = %L', pg_temp.hid('oth_blood')));
  if n <> 0 then raise exception 'HARNESS-FAIL B: doctor deleted % of other''s blood test', n; end if;
  n := pg_temp.try(v_doctor, format('insert into prescriptions (resident_id, medication_id, start_date, clinic_visit_id) values (%L, %L, current_date - 9, %L)', v_res, v_med, v_xv));
  if n <> -1 then raise exception 'HARNESS-FAIL B: doctor added a prescription to other''s visit: %', n; end if;
  n := pg_temp.try(v_doctor, format('insert into procedures (resident_id, clinic_visit_id, procedure_type_id, date) values (%L, %L, (select id from procedure_types limit 1), current_date - 9)', v_res, v_xv));
  if n <> -1 then raise exception 'HARNESS-FAIL B: doctor added a procedure to other''s visit: %', n; end if;
  n := pg_temp.try(v_doctor, format('insert into blood_tests (resident_id, clinic_visit_id, blood_test_type_id, date) values (%L, %L, (select id from blood_test_types limit 1), current_date - 9)', v_res, v_xv));
  if n <> -1 then raise exception 'HARNESS-FAIL B: doctor added a blood test to other''s visit: %', n; end if;
  n := pg_temp.try(v_doctor, format('insert into attachments (owner_type, owner_id, drive_file_id) values (''blood_test'', %L, ''harnessDocFile00001'')', pg_temp.hid('oth_blood')));
  if n <> -1 then raise exception 'HARNESS-FAIL B: doctor added a file to other''s blood test: %', n; end if;
  n := pg_temp.try(v_doctor, format('delete from attachments where id = %L', pg_temp.hid('oth_file')));
  if n <> 0 then raise exception 'HARNESS-FAIL B: doctor deleted % of other''s blood-test file', n; end if;
  n := pg_temp.try(v_doctor, format('select record_attachment(''blood_test'', %L, ''harnessDocFile00002'')', pg_temp.hid('oth_blood')));
  if n >= 0 then raise exception 'HARNESS-FAIL B: record_attachment let the doctor file other''s blood test'; end if;
  v_report := v_report || 'B: other''s rx/procedure/blood test: update 0, delete 0, insert refused; file insert, delete and record_attachment refused | ';

  -- C: own clinic and reads still work
  n := pg_temp.try(v_doctor, format('update clinic_visits set notes = ''x'' where id = %L', v_ov));
  if n <> 1 then raise exception 'HARNESS-FAIL C: doctor updated % of own visit', n; end if;
  n := pg_temp.try(v_doctor, format('insert into clinic_visits (resident_id, clinic_id, appointment_date) values (%L, %L, now() - interval ''1 day'')', v_res, v_own));
  if n <> 1 then raise exception 'HARNESS-FAIL C: doctor booking at own clinic gave %', n; end if;
  n := pg_temp.try(v_doctor, format('delete from clinic_visits where resident_id = %L and appointment_date > now() - interval ''25 hours'' and clinic_id = %L', v_res, v_own));
  if n <> 1 then raise exception 'HARNESS-FAIL C: doctor deleting own new visit gave %', n; end if;
  n := pg_temp.try(v_doctor, format('insert into prescriptions (resident_id, medication_id, start_date, clinic_visit_id) values (%L, %L, current_date - 2, %L)', v_res, v_med, v_ov));
  if n <> 1 then raise exception 'HARNESS-FAIL C: doctor rx on own visit gave %', n; end if;
  n := pg_temp.try(v_doctor, format('insert into prescriptions (resident_id, medication_id, start_date) values (%L, %L, current_date - 2)', v_res, v_med));
  if n <> 1 then raise exception 'HARNESS-FAIL C: clinic visit-less rx gave %', n; end if;
  n := pg_temp.try(v_doctor, format('update prescriptions set notes = ''x'' where id = %L', pg_temp.hid('own_rx')));
  if n <> 1 then raise exception 'HARNESS-FAIL C: doctor updated % of own rx', n; end if;
  n := pg_temp.try(v_doctor, format('update procedures set notes = ''x'' where id = %L', pg_temp.hid('own_proc')));
  if n <> 1 then raise exception 'HARNESS-FAIL C: doctor updated % of own procedure', n; end if;
  n := pg_temp.try(v_doctor, format('update blood_tests set results = ''x'' where id = %L', pg_temp.hid('own_blood')));
  if n <> 1 then raise exception 'HARNESS-FAIL C: doctor updated % of own blood test', n; end if;
  n := pg_temp.try(v_doctor, format('select record_attachment(''blood_test'', %L, ''harnessDocFile00003'')', pg_temp.hid('own_blood')));
  if n <> 1 then raise exception 'HARNESS-FAIL C: record_attachment on own blood test gave %', n; end if;
  n := pg_temp.try(v_doctor, format('select 1 from clinic_visits where resident_id = %L', v_res));
  if n <> 2 then raise exception 'HARNESS-FAIL C: doctor reads % of mixed''s 2 visits', n; end if;
  n := pg_temp.try(v_doctor, format('select 1 from blood_tests where resident_id = %L', v_res));
  if n <> 2 then raise exception 'HARNESS-FAIL C: doctor reads % of mixed''s 2 blood tests', n; end if;
  n := pg_temp.try(v_doctor, format('select 1 from attachments where id = %L', pg_temp.hid('oth_file')));
  if n <> 1 then raise exception 'HARNESS-FAIL C: doctor reads % of other''s blood-test file, expected 1 (read-only, not hidden)', n; end if;
  v_report := v_report || 'C: own visit update/insert/delete 1, own rx/procedure/blood test/file ok, visit-less rx ok, both clinics still read | ';

  -- D: cannot move things across
  n := pg_temp.try(v_doctor, format('update clinic_visits set clinic_id = %L where id = %L', v_oth, v_ov));
  if n <> -1 then raise exception 'HARNESS-FAIL D: doctor moved own visit to other clinic: %', n; end if;
  n := pg_temp.try(v_doctor, format('update prescriptions set clinic_visit_id = %L where id = %L', v_xv, pg_temp.hid('own_rx')));
  if n <> -1 then raise exception 'HARNESS-FAIL D: doctor moved own rx onto other''s visit: %', n; end if;
  v_report := v_report || 'D: moving own visit to other clinic, own rx onto other''s visit: refused | ';

  -- E: doctors and bulk bookings
  n := pg_temp.try(v_doctor, format('update doctors set name = ''Renamed'' where id = %L', pg_temp.hid('oth_doctor')));
  if n <> 0 then raise exception 'HARNESS-FAIL E: doctor renamed % of other''s doctors', n; end if;
  n := pg_temp.try(v_doctor, format('with d as (insert into doctors (name) values (''Harness Dr X'') returning id) insert into doctor_clinics (clinic_id, doctor_id) select %L, id from d', v_oth));
  if n <> -1 then raise exception 'HARNESS-FAIL E: doctor added a doctor to other clinic: %', n; end if;
  n := pg_temp.try(v_doctor, format('with d as (insert into doctors (name) values (''Harness Dr Own'') returning id) insert into doctor_clinics (clinic_id, doctor_id) select %L, id from d', v_own));
  if n <> 1 then raise exception 'HARNESS-FAIL E: doctor adding own doctor gave %', n; end if;
  n := pg_temp.try(v_doctor, format('insert into bulk_appointments (clinic_id, appointment_date) values (%L, now())', v_oth));
  if n <> -1 then raise exception 'HARNESS-FAIL E: doctor made a bulk booking for other: %', n; end if;
  n := pg_temp.try(v_doctor, format('select count(*) from schedule_bulk_appointments(array[%L]::uuid[], %L, now())', v_res, v_oth));
  if n >= 0 then raise exception 'HARNESS-FAIL E: schedule_bulk_appointments booked at other clinic'; end if;
  n := pg_temp.try(v_doctor, format('select count(*) from schedule_bulk_appointments(array[%L]::uuid[], %L, now())', v_res, v_own));
  if n <> 1 then raise exception 'HARNESS-FAIL E: schedule_bulk_appointments at own clinic gave %', n; end if;
  v_report := v_report || 'E: other''s doctor rename 0, doctor/bulk insert refused, bulk RPC at other refused, own ok | ';

  -- F: other roles unchanged
  foreach v_who in array array['admin', 'mgmt'] loop
    n := pg_temp.try(pg_temp.hid(v_who), format('update clinic_visits set notes = ''x'', clinic_id = %L where id = %L', v_oth, v_xv));
    if n <> 1 then raise exception 'HARNESS-FAIL F: % updated % of other''s visit', v_who, n; end if;
  end loop;
  v_report := v_report || 'F: admin/management rewrite other''s visit (1 each)';

  raise exception '%', format('HARNESS-OK %s asserted live | %s | %s', ${JSON.stringify(file).replace(/"/g, "'")},
    case when v_applied then 'applied on dev' else 'pending on dev' end, v_report);
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
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
