// Rollback harness for the app's Archive on the four medical record types,
// against DEV only. It runs the exact UPDATE that archiveMedicalRecord
// (src/app/residents/[id]/archive-actions.ts) issues, as each role, under
// the real RLS, and counts the rows each one changed. One transaction that
// ends in a deliberate `raise exception` carrying the evidence, so nothing
// can commit.
//
//   node scripts/check-medical-archive-roles.mjs     (from the repo root; dev only)
//
// It checks, per docs/decisions/2026-10-02-medical-archive-roles.md:
//   A  staff archives and restores a weight, prescription, visit and
//      immunization (1 row each), and each archive writes ONE audit row
//   B  a vet is refused (0 rows) on another clinic's visit and on a
//      prescription on it; on their own clinic's visit the database allows
//      the archive but not the restore (it drops the visit from their
//      scope), which is why the app offers vets no Archive at all
//   C  a volunteer archives nothing
//   D  a second archive of an archived row changes nothing (the .is(null) guard)
//
// Exits 0 when every assertion held. Writes nothing even on success.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;

create temp table harness (k text primary key, id uuid);

-- Runs the archive UPDATE as a login on one of the four tables; returns rows changed.
create function pg_temp.archive_as(p_uid uuid, p_table text, p_id uuid) returns int language plpgsql as $f$
declare n int;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  execute format(
    'update %I set archived_at = now(), archived_by = %L, archive_reason = %L where id = %L and archived_at is null',
    p_table, p_uid, 'harness', p_id);
  get diagnostics n = row_count;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return n;
end $f$;

create function pg_temp.restore_as(p_uid uuid, p_table text, p_id uuid) returns int language plpgsql as $f$
declare n int;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  execute format(
    'update %I set archived_at = null, archived_by = null, archive_reason = null where id = %L and archived_at is not null',
    p_table, p_id);
  get diagnostics n = row_count;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return n;
end $f$;

do $setup$
declare
  v_res uuid;
  v_staff uuid := gen_random_uuid();
  v_vet uuid := gen_random_uuid();
  v_vol uuid := gen_random_uuid();
  v_own uuid := gen_random_uuid();
  v_other uuid := gen_random_uuid();
begin
  select id into v_res from record_intake(
    p_name => 'Harness archive roles', p_intake_date => date '2026-08-01', p_weight_kg => 10,
    p_diet_type_id => (select id from diet_types order by is_standard desc nulls last limit 1));
  insert into harness values ('res', v_res), ('staff', v_staff), ('vet', v_vet), ('vol', v_vol),
    ('own', v_own), ('other', v_other);

  insert into vets (id, name, clinic_name) values (v_own, 'Harness own clinic', 'Harness own clinic'),
    (v_other, 'Harness other clinic', 'Harness other clinic');
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'harness-archive-' || u || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
  from unnest(array[v_staff, v_vet, v_vol]) u;
  insert into user_roles (user_id, role) values (v_staff, 'staff'), (v_vol, 'volunteer');
  insert into user_roles (user_id, role, vet_id) values (v_vet, 'vet', v_own);
end $setup$;

do $h$
declare
  v_res uuid := (select id from harness where k = 'res');
  v_staff uuid := (select id from harness where k = 'staff');
  v_vet uuid := (select id from harness where k = 'vet');
  v_vol uuid := (select id from harness where k = 'vol');
  v_own uuid := (select id from harness where k = 'own');
  v_other uuid := (select id from harness where k = 'other');
  v_visit_own uuid := gen_random_uuid();
  v_visit_other uuid := gen_random_uuid();
  v_w uuid; v_i uuid; v_rx uuid; v_rx_own uuid; v_rx_other uuid;
  v_type uuid := (select id from immunization_types order by name limit 1);
  v_med uuid := (select id from medication order by name limit 1);
  v_freq uuid := (select id from frequency order by label limit 1);
  v_n int; v_audit int;
  v_report text := '';
begin
  insert into vet_appointments (id, resident_id, vet_id, appointment_date, reason)
  values (v_visit_own, v_res, v_own, date '2026-08-10', 'own'),
         (v_visit_other, v_res, v_other, date '2026-08-11', 'other');
  insert into weight (resident_id, date, weight_kg) values (v_res, date '2026-08-12', 11) returning id into v_w;
  insert into immunization_records (resident_id, immunization_type_id, date_administered)
  values (v_res, v_type, date '2026-08-12') returning id into v_i;
  insert into prescriptions (resident_id, medication_id, frequency_id, start_date, dose_quantity)
  values (v_res, v_med, v_freq, date '2026-08-12', 1) returning id into v_rx;
  insert into prescriptions (resident_id, medication_id, frequency_id, start_date, dose_quantity, vet_appointment_id)
  values (v_res, v_med, v_freq, date '2026-08-12', 1, v_visit_own) returning id into v_rx_own;
  insert into prescriptions (resident_id, medication_id, frequency_id, start_date, dose_quantity, vet_appointment_id)
  values (v_res, v_med, v_freq, date '2026-08-12', 1, v_visit_other) returning id into v_rx_other;

  -- A: staff, all four, one audit row each.
  select count(*) into v_audit from audit_log where row_id = v_w and table_name = 'weight';
  if pg_temp.archive_as(v_staff, 'weight', v_w) <> 1 then raise exception 'HARNESS-FAIL A: staff could not archive a weight'; end if;
  if (select count(*) from audit_log where row_id = v_w and table_name = 'weight') <> v_audit + 1 then
    raise exception 'HARNESS-FAIL A: archiving a weight wrote % audit rows, not 1',
      (select count(*) from audit_log where row_id = v_w and table_name = 'weight') - v_audit;
  end if;
  if pg_temp.restore_as(v_staff, 'weight', v_w) <> 1 then raise exception 'HARNESS-FAIL A: staff could not restore a weight'; end if;
  if pg_temp.archive_as(v_staff, 'prescriptions', v_rx) <> 1 then raise exception 'HARNESS-FAIL A: staff could not archive a prescription'; end if;
  if pg_temp.archive_as(v_staff, 'vet_appointments', v_visit_other) <> 1 then raise exception 'HARNESS-FAIL A: staff could not archive a visit'; end if;
  if pg_temp.archive_as(v_staff, 'immunization_records', v_i) <> 1 then raise exception 'HARNESS-FAIL A: staff could not archive an immunization'; end if;
  if pg_temp.restore_as(v_staff, 'vet_appointments', v_visit_other) <> 1 then raise exception 'HARNESS-FAIL A: staff could not restore a visit'; end if;
  v_report := v_report || 'A: staff archives all four, restores, one audit row per archive | ';

  -- B: a vet. The database would let them archive their own clinic's
  -- visit and a prescription on it, and refuses the other clinic's. The app
  -- offers them nothing, because the archive is one-way for a vet: it drops
  -- the visit from their scope, so they cannot restore it.
  if pg_temp.archive_as(v_vet, 'prescriptions', v_rx_own) <> 1 then raise exception 'HARNESS-FAIL B: vet could not archive a prescription on their own visit'; end if;
  if pg_temp.restore_as(v_vet, 'prescriptions', v_rx_own) <> 1 then raise exception 'HARNESS-FAIL B: vet could not restore a prescription on their own live visit'; end if;
  if pg_temp.archive_as(v_vet, 'vet_appointments', v_visit_other) <> 0 then raise exception 'HARNESS-FAIL B: vet archived ANOTHER clinic''s visit'; end if;
  if pg_temp.archive_as(v_vet, 'prescriptions', v_rx_other) <> 0 then raise exception 'HARNESS-FAIL B: vet archived a prescription on ANOTHER clinic''s visit'; end if;
  if pg_temp.archive_as(v_vet, 'vet_appointments', v_visit_own) <> 1 then raise exception 'HARNESS-FAIL B: vet could not archive their own clinic''s visit'; end if;
  if pg_temp.restore_as(v_vet, 'vet_appointments', v_visit_own) <> 0 then
    raise exception 'HARNESS-FAIL B: a vet restored their own archived visit, so the decision''s reason (one-way for a vet) is stale';
  end if;
  v_report := v_report || 'B: vet refused (0 rows) on the other clinic; own-clinic archive is one-way, so not offered | ';

  -- C: a volunteer.
  select count(*) into v_n from (values
    (pg_temp.archive_as(v_vol, 'weight', v_w)),
    (pg_temp.archive_as(v_vol, 'prescriptions', v_rx_other)),
    (pg_temp.archive_as(v_vol, 'vet_appointments', v_visit_other)),
    (pg_temp.archive_as(v_vol, 'immunization_records', (select id from immunization_records where resident_id = v_res limit 1)))
  ) x(n) where n <> 0;
  if v_n <> 0 then raise exception 'HARNESS-FAIL C: a volunteer archived something'; end if;
  v_report := v_report || 'C: volunteer archives nothing | ';

  -- D: archiving twice.
  if pg_temp.archive_as(v_staff, 'prescriptions', v_rx) <> 0 then raise exception 'HARNESS-FAIL D: archived an archived row again'; end if;
  v_report := v_report || 'D: a second archive changes nothing | ';

  raise exception '%', format('HARNESS-OK %s', v_report);
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
