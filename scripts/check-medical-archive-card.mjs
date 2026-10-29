// Rollback harness for the app's Archive on the four medical record types,
// against DEV only. It runs the exact UPDATE that archiveMedicalRecord
// (src/app/residents/[id]/archive-actions.ts) issues, as each role, under
// the real RLS, and counts the rows each one changed. One transaction that
// ends in a deliberate `raise exception` carrying the evidence, so nothing
// can commit.
//
//   node scripts/check-medical-archive-roles.mjs     (from the repo root; dev only)
//
// Renamed from check-medical-archive-roles.mjs and restated 2026-10-29 (harness-restate-nine,
// docs/decisions/2026-10-29-harness-restate-nine.md): the question is which CELL lets a row be archived,
// not which role. The principals are throwaway roles holding exactly:
//   archiver  medical.archive plus the four edit cells the tables' update policies ask
//             (medical.weight, medical.prescriptions, medical.visits, medical.immunizations)
//   editor    the same four edit cells and NOT medical.archive
//   nothing   one unrelated cell
// It checks (see also docs/decisions/2026-10-02-medical-archive-roles.md and 2026-10-12-medical-archive-trigger.md):
//   A  medical.archive with the edit cells archives and restores a weight, prescription, visit and
//      immunization (1 row each), and each archive writes ONE audit row
//   B  the edit cells WITHOUT medical.archive are refused by the 0187 trigger (-1) on every one of
//      the four tables. (It used to split own-clinic and other-clinic rows; the clinic scope is gone,
//      so there is one outcome.)
//   C  a login holding neither archives nothing
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

-- Runs the archive UPDATE as a login on one of the four tables; returns rows changed, or -1 when 0187's trigger refuses it.
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
exception when insufficient_privilege then
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return -1;
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
exception when insufficient_privilege then
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return -1;
end $f$;

do $setup$
declare
  v_res uuid;
  v_seed uuid := gen_random_uuid();
  v_mgmt uuid := gen_random_uuid();
  v_doctor uuid := gen_random_uuid();
  v_vol uuid := gen_random_uuid();
  v_own uuid := gen_random_uuid();
  v_other uuid := gen_random_uuid();
begin
  insert into harness values ('mgmt', v_mgmt), ('doctor', v_doctor), ('vol', v_vol),
    ('own', v_own), ('other', v_other);

  insert into clinics (id, name) values (v_own, 'Harness own clinic'),
    (v_other, 'Harness other clinic');
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'harness-archive-' || u || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
  from unnest(array[v_mgmt, v_doctor, v_vol]) u;
  insert into roles (key, name, kind) values ('h0187_archiver', 'h archiver', 'custom'), ('h0187_editor', 'h editor', 'custom'), ('h0187_nothing', 'h nothing', 'custom');
  insert into role_permissions (role_id, activity, level)
  select roles.id, act, 2 from roles, unnest(array['medical.weight', 'medical.prescriptions', 'medical.visits', 'medical.immunizations']) act
   where roles.key in ('h0187_archiver', 'h0187_editor');
  insert into role_permissions (role_id, activity, level) select roles.id, 'medical.archive', 2 from roles where roles.key = 'h0187_archiver';
  insert into role_permissions (role_id, activity, level) select roles.id, 'maintenance.photos', 2 from roles where roles.key = 'h0187_nothing';
  insert into user_roles (user_id, role_id)
  select v.c0, ro.id from (values (v_mgmt, 'h0187_archiver'), (v_doctor, 'h0187_editor'), (v_vol, 'h0187_nothing')) as v(c0, role_key)
  join roles ro on ro.key = v.role_key;
  -- 0248: record_intake asks has_permission('resident.register'), so it needs a login. Run it as a disposable Admin login (true without a card,
  -- so editing cards on Who does what cannot move this seed), then drop the claims.
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (v_seed, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-archive-seed-' || v_seed || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now());
  insert into user_roles (user_id, role_id) select v_seed, id from roles where key = 'admin';
  perform set_config('request.jwt.claims', json_build_object('sub', v_seed, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  select id into v_res from record_intake(
    p_name => 'Harness archive roles', p_intake_date => date '2026-08-01', p_weight_kg => 10,
    p_diet_id => (select id from diets order by is_standard desc nulls last limit 1));
  perform set_config('request.jwt.claims', '', true);
  insert into harness values ('res', v_res);
end $setup$;

do $h$
declare
  v_res uuid := (select id from harness where k = 'res');
  v_mgmt uuid := (select id from harness where k = 'mgmt');
  v_doctor uuid := (select id from harness where k = 'doctor');
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
  insert into clinic_visits (id, resident_id, clinic_id, appointment_date, reason)
  values (v_visit_own, v_res, v_own, date '2026-08-10', 'own'),
         (v_visit_other, v_res, v_other, date '2026-08-11', 'other');
  insert into weight (resident_id, date, weight_kg) values (v_res, date '2026-08-12', 11) returning id into v_w;
  insert into immunization_records (resident_id, immunization_type_id, date_administered)
  values (v_res, v_type, date '2026-08-12') returning id into v_i;
  insert into prescriptions (resident_id, medication_id, frequency_id, start_date, dose_quantity)
  values (v_res, v_med, v_freq, date '2026-08-12', 1) returning id into v_rx;
  insert into prescriptions (resident_id, medication_id, frequency_id, start_date, dose_quantity, clinic_visit_id)
  values (v_res, v_med, v_freq, date '2026-08-12', 1, v_visit_own) returning id into v_rx_own;
  insert into prescriptions (resident_id, medication_id, frequency_id, start_date, dose_quantity, clinic_visit_id)
  values (v_res, v_med, v_freq, date '2026-08-12', 1, v_visit_other) returning id into v_rx_other;

  -- A: medical.archive with the edit cells, all four, one audit row each.
  select count(*) into v_audit from audit_log where row_id = v_w and table_name = 'weight';
  if pg_temp.archive_as(v_mgmt, 'weight', v_w) <> 1 then raise exception 'HARNESS-FAIL A: the archiver could not archive a weight'; end if;
  if (select count(*) from audit_log where row_id = v_w and table_name = 'weight') <> v_audit + 1 then
    raise exception 'HARNESS-FAIL A: archiving a weight wrote % audit rows, not 1',
      (select count(*) from audit_log where row_id = v_w and table_name = 'weight') - v_audit;
  end if;
  if pg_temp.restore_as(v_mgmt, 'weight', v_w) <> 1 then raise exception 'HARNESS-FAIL A: the archiver could not restore a weight'; end if;
  if pg_temp.archive_as(v_mgmt, 'prescriptions', v_rx) <> 1 then raise exception 'HARNESS-FAIL A: the archiver could not archive a prescription'; end if;
  if pg_temp.archive_as(v_mgmt, 'clinic_visits', v_visit_other) <> 1 then raise exception 'HARNESS-FAIL A: the archiver could not archive a visit'; end if;
  if pg_temp.archive_as(v_mgmt, 'immunization_records', v_i) <> 1 then raise exception 'HARNESS-FAIL A: the archiver could not archive an immunization'; end if;
  if pg_temp.restore_as(v_mgmt, 'clinic_visits', v_visit_other) <> 1 then raise exception 'HARNESS-FAIL A: the archiver could not restore a visit'; end if;
  v_report := v_report || 'A: medical.archive archives all four, restores, one audit row per archive | ';

  -- B: the edit cells without medical.archive. Since 0187 the trigger refuses the archive (-1) on all four tables.
  if pg_temp.archive_as(v_doctor, 'prescriptions', v_rx_own) <> -1 then raise exception 'HARNESS-FAIL B: an editor archived a prescription past the trigger'; end if;
  if pg_temp.archive_as(v_doctor, 'prescriptions', v_rx_other) <> -1 then raise exception 'HARNESS-FAIL B: an editor archived a second prescription past the trigger'; end if;
  if pg_temp.archive_as(v_doctor, 'clinic_visits', v_visit_other) <> -1 then raise exception 'HARNESS-FAIL B: an editor archived a visit past the trigger'; end if;
  if pg_temp.archive_as(v_doctor, 'clinic_visits', v_visit_own) <> -1 then raise exception 'HARNESS-FAIL B: an editor archived a second visit past the trigger'; end if;
  if pg_temp.archive_as(v_doctor, 'weight', v_w) <> -1 then raise exception 'HARNESS-FAIL B: an editor archived a weight past the trigger'; end if;
  perform pg_temp.restore_as(v_mgmt, 'immunization_records', v_i);
  if pg_temp.archive_as(v_doctor, 'immunization_records', v_i) <> -1 then raise exception 'HARNESS-FAIL B: an editor archived an immunization past the trigger'; end if;
  v_report := v_report || 'B: the edit cells without medical.archive are refused by the 0187 trigger on all four tables | ';

  -- C: a login holding neither.
  select count(*) into v_n from (values
    (pg_temp.archive_as(v_vol, 'weight', v_w)),
    (pg_temp.archive_as(v_vol, 'prescriptions', v_rx_other)),
    (pg_temp.archive_as(v_vol, 'clinic_visits', v_visit_other)),
    (pg_temp.archive_as(v_vol, 'immunization_records', (select id from immunization_records where resident_id = v_res limit 1)))
  ) x(n) where n <> 0;
  if v_n <> 0 then raise exception 'HARNESS-FAIL C: a login without either archived something'; end if;
  v_report := v_report || 'C: a login without the cells archives nothing | ';

  -- D: archiving twice.
  if pg_temp.archive_as(v_mgmt, 'prescriptions', v_rx) <> 0 then raise exception 'HARNESS-FAIL D: archived an archived row again'; end if;
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
