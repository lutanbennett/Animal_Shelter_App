// Rollback harness for what a doctor login reads and writes, against DEV only. One transaction: 0172 (twice, if it
// is still pending on dev), fixtures, then what each kind of session can read and write, then a deliberate
// `raise exception` carrying the evidence, so nothing can commit. Safe to run before or after 0172 is applied.
// Was check-vet-resident-scope.mjs (0108), which proved the clinic scope; 0172 widened the reads.
//
//   node scripts/check-doctor-resident-scope.mjs     (from the repo root; dev only)
//
// The rule (Lutan, 2026-10-09, option (c); docs/decisions/2026-10-09-clinics-and-doctors.md):
//   SEES    every resident with a live clinical record at a clinic its doctor currently works at, whoever the
//           doctor was, PLUS every resident on a live visit where its own doctor was the doctor, at any clinic.
//   CHANGES only records at the clinics it currently works at (0110), unchanged.
//
// Fixtures: clinics own (the doctor works there), left (worked there, link inactive) and other; the login's
// doctor D and a colleague C at own; residents
//   seen       a completed visit at own, no doctor recorded     -> seen (clinic scope; a doctor is optional)
//   colleague  a visit at own whose doctor is C                 -> seen (clinic scope)
//   cancelled  only a cancelled visit at own                    -> seen
//   mixed      a visit at own and one at other                  -> seen, both visits shown
//   past       one visit at left, D the doctor                  -> SEEN (doctor scope), NOT writable
//   other      a visit at other by nobody, a weight, a placement, a prescription, a bio -> not seen
//   none       no clinical record anywhere                      -> not seen
//
// It checks
//   N  no function body (public, private) or view still names a renamed object or the 'vet' role, and no
//      table, column, index, constraint, trigger or policy name says vet, but the four compatibility views
//   A  the doctor reads exactly seen, colleague, cancelled, mixed and past, through the table and both views
//   B  other and none by id: 0 rows from residents and the three views
//   C  other's clinical rows: 0 from every table and view; mixed shows both visits; past shows its visit,
//      its prescription and its weight
//   D  writes: refused for other and for past (a clinic the doctor has left); allowed for seen
//   E  a doctor login with no doctor record reads no resident
//   F  admin, management and the service role read every resident; a volunteer none (0134)
//   G  translations: none of other's rows
//   H  private.has_app_access() is true for every app role, the doctor included (its body named 'vet')
//   I  a doctor typed by name on a visit is listed at that clinic: a doctors row and its doctor_clinics link
//   J  schedule_bulk_appointments() books with p_clinic_id; the compatibility views read and refuse writes
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
const file = readdirSync(dir).find((f) => /^\d+_clinics_and_doctors\.sql$/.test(f));
if (!file) throw new Error("no *_clinics_and_doctors.sql in supabase/migrations");
const migration = readFileSync(join(dir, file), "utf8");

async function run(body) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: body }),
  });
  const text = await res.text();
  let msg = text;
  try { msg = JSON.parse(text).message ?? text; } catch {}
  return { status: res.status, msg };
}

// Is 0172 live on dev? Decides whether the file is replayed inside the transaction.
const probe = await run(`select (to_regclass('public.clinics') is not null) as live`);
const live = /"live":\s*true/.test(probe.msg);

const assertions = `
create function pg_temp.try(p_uid uuid, p_sql text) returns bigint language plpgsql as $f$
declare v bigint;
begin
  if p_uid is null then
    perform set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
    set local role service_role;
  else
    perform set_config('request.jwt.claims',
      json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
    set local role authenticated;
  end if;
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

-- One value from a query run as a login; null on error.
create function pg_temp.val(p_uid uuid, p_sql text) returns text language plpgsql as $f$
declare v text;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  begin
    execute p_sql into v;
  exception when others then v := null;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

create temp table harness_ids (who text primary key, id uuid not null);
insert into harness_ids values
  ('doctor', gen_random_uuid()), ('unlinked', gen_random_uuid()), ('mgmt', gen_random_uuid()),
  ('admin', gen_random_uuid()), ('volunteer', gen_random_uuid()),
  ('own_clinic', gen_random_uuid()), ('left_clinic', gen_random_uuid()), ('other_clinic', gen_random_uuid()),
  ('doc_d', gen_random_uuid()), ('doc_c', gen_random_uuid()),
  ('seen', gen_random_uuid()), ('colleague', gen_random_uuid()), ('cancelled', gen_random_uuid()),
  ('mixed', gen_random_uuid()), ('past', gen_random_uuid()), ('other', gen_random_uuid()), ('none', gen_random_uuid());
grant select on harness_ids to authenticated, service_role;

do $setup$
declare
  r record;
  v_own uuid := (select id from harness_ids where who = 'own_clinic');
  v_left uuid := (select id from harness_ids where who = 'left_clinic');
  v_oth uuid := (select id from harness_ids where who = 'other_clinic');
  v_d uuid := (select id from harness_ids where who = 'doc_d');
  v_c uuid := (select id from harness_ids where who = 'doc_c');
  v_visit uuid;
begin
  -- A mobile doctor's clinic: a name and nothing else (0172: every other field optional).
  insert into clinics (id, name)
  select id, 'Harness ' || who from harness_ids where who in ('own_clinic', 'left_clinic', 'other_clinic');
  for r in select * from harness_ids where who in ('doctor', 'unlinked', 'mgmt', 'admin', 'volunteer') loop
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (r.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-doctor-scope-' || r.who || '-' || r.id || '@example.invalid',
            '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || r.who), now(), now());
  end loop;
  insert into user_roles (user_id, role)
  select id, case who when 'mgmt' then 'management' when 'unlinked' then 'doctor' else who end::app_role
  from harness_ids where who in ('doctor', 'unlinked', 'mgmt', 'admin', 'volunteer');

  insert into doctors (id, name, user_id) values
    (v_d, 'Harness Doctor D ' || v_d, (select id from harness_ids where who = 'doctor')),
    (v_c, 'Harness Colleague C ' || v_c, null);
  insert into doctor_clinics (clinic_id, doctor_id, active) values
    (v_own, v_d, true), (v_left, v_d, false), (v_own, v_c, true);

  insert into residents (id, name, species, bio)
  select id, 'Harness ' || who, 'Dog', case when who in ('seen', 'other') then 'Harness bio ' || who end
  from harness_ids where who in ('seen', 'colleague', 'cancelled', 'mixed', 'past', 'other', 'none');

  insert into clinic_visits (resident_id, clinic_id, doctor_id, appointment_date, status) values
    ((select id from harness_ids where who = 'seen'), v_own, null, now() - interval '3 days', 'completed'),
    ((select id from harness_ids where who = 'colleague'), v_own, v_c, now() - interval '4 days', 'completed'),
    ((select id from harness_ids where who = 'cancelled'), v_own, null, now() + interval '3 days', 'cancelled'),
    ((select id from harness_ids where who = 'mixed'), v_own, null, now() - interval '2 days', 'completed'),
    ((select id from harness_ids where who = 'mixed'), v_oth, null, now() - interval '9 days', 'completed');

  insert into clinic_visits (resident_id, clinic_id, doctor_id, appointment_date, status)
  values ((select id from harness_ids where who = 'past'), v_left, v_d, now() - interval '40 days', 'completed')
  returning id into v_visit;
  insert into weight (resident_id, date, weight_kg, clinic_visit_id)
  values ((select id from harness_ids where who = 'past'), current_date - 40, 8.5, v_visit);
  insert into prescriptions (resident_id, medication_id, start_date, clinic_visit_id)
  values ((select id from harness_ids where who = 'past'), (select id from medication limit 1), current_date - 40, v_visit);

  insert into clinic_visits (resident_id, clinic_id, appointment_date, status)
  values ((select id from harness_ids where who = 'other'), v_oth, now() - interval '5 days', 'completed')
  returning id into v_visit;
  insert into weight (resident_id, date, weight_kg, clinic_visit_id)
  values ((select id from harness_ids where who = 'other'), current_date - 5, 12.5, v_visit);
  insert into placement_history (resident_id, placement_type, start_date)
  values ((select id from harness_ids where who = 'other'), 'Intake', now() - interval '30 days');
  insert into prescriptions (resident_id, medication_id, start_date, clinic_visit_id)
  values ((select id from harness_ids where who = 'other'), (select id from medication limit 1), current_date - 5, v_visit);
end $setup$;

do $h$
declare
  v_doc uuid := (select id from harness_ids where who = 'doctor');
  v_unl uuid := (select id from harness_ids where who = 'unlinked');
  v_own uuid := (select id from harness_ids where who = 'own_clinic');
  v_left uuid := (select id from harness_ids where who = 'left_clinic');
  v_seen uuid := (select id from harness_ids where who = 'seen');
  v_coll uuid := (select id from harness_ids where who = 'colleague');
  v_canc uuid := (select id from harness_ids where who = 'cancelled');
  v_mixed uuid := (select id from harness_ids where who = 'mixed');
  v_past uuid := (select id from harness_ids where who = 'past');
  v_other uuid := (select id from harness_ids where who = 'other');
  v_none uuid := (select id from harness_ids where who = 'none');
  v_harness text := format('(%L, %L, %L, %L, %L, %L, %L)', v_seen, v_coll, v_canc, v_mixed, v_past, v_other, v_none);
  v_visible text := format('(%L, %L, %L, %L, %L)', v_seen, v_coll, v_canc, v_mixed, v_past);
  v_total bigint := (select count(*) from residents);
  v_bad text;
  n bigint;
  t text;
  v_who text;
  v_report text := '';
begin
  -- N: nothing left that names the old objects or the old role.
  select string_agg(n.nspname || '.' || p.proname, ', ') into v_bad
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname in ('public', 'private')
     and p.proname <> 'undo_deceased_placement'  -- reads a death's old cascade key on purpose
     and p.prosrc ~ $re$('vet'|\\mvets\\M|vet_appointment|vet_doctor|\\mvet_id\\M|current_vet_|current_user_vet|vet_visit_estimate|vet_contacts|vet_owns|vet_may|vet_can)$re$;
  if v_bad is not null then raise exception 'HARNESS-FAIL N: function bodies still name the old objects: %', v_bad; end if;
  select string_agg(c.relname, ', ') into v_bad
    from pg_class c
   where c.relnamespace in ('public'::regnamespace, 'private'::regnamespace) and c.relkind in ('v', 'm')
     and c.relname not in ('vets', 'vet_doctors', 'vet_doctor_clinics', 'vet_appointments')
     and pg_get_viewdef(c.oid) ~ $re$(\\mvets\\M|vet_appointment|vet_doctor|\\mvet_id\\M|current_vet_|current_user_vet)$re$;
  if v_bad is not null then raise exception 'HARNESS-FAIL N: views still name the old objects: %', v_bad; end if;
  select string_agg(x, ', ') into v_bad from (
    select c.relname as x from pg_class c
     where c.relnamespace = 'public'::regnamespace and c.relname ~ 'vet'
       and c.relname not in ('vets', 'vet_doctors', 'vet_doctor_clinics', 'vet_appointments')
    union all select table_name || '.' || column_name from information_schema.columns
     where table_schema = 'public' and column_name ~ 'vet'
       and table_name not in ('vets', 'vet_doctors', 'vet_doctor_clinics', 'vet_appointments')
    union all select conname from pg_constraint where connamespace = 'public'::regnamespace and conname ~ 'vet'
    union all select tgname from pg_trigger where not tgisinternal and tgname ~ 'vet'
    union all select policyname from pg_policies where schemaname = 'public' and policyname ~ 'vet'
    union all select policyname || ' (expression)' from pg_policies
     where schemaname = 'public' and (qual ~ 'vet' or with_check ~ 'vet')
    union all select enumlabel from pg_enum where enumtypid = 'public.app_role'::regtype and enumlabel ~ 'vet'
    union all select key from roles where key ~ 'vet'
  ) s;
  if v_bad is not null then raise exception 'HARNESS-FAIL N: names still saying vet: %', v_bad; end if;
  v_report := v_report || 'N: no body, view or name says vet but the 4 compatibility views | ';

  -- A: exactly the five.
  n := pg_temp.try(v_doc, format('select 1 from residents where id in %s', v_harness));
  if n <> 5 then raise exception 'HARNESS-FAIL A: doctor read % harness residents, expected 5', n; end if;
  n := pg_temp.try(v_doc, format('select 1 from residents where id in %s', v_visible));
  if n <> 5 then raise exception 'HARNESS-FAIL A: doctor read % of the five it should', n; end if;
  n := pg_temp.try(v_doc, 'select 1 from residents');
  if n <> 5 then raise exception 'HARNESS-FAIL A: doctor read % residents in all of dev, expected 5', n; end if;
  foreach t in array array['resident_list_view', 'resident_current_state', 'current_placement'] loop
    n := pg_temp.try(v_doc, format('select 1 from %I where resident_id in %s', t, v_visible));
    if t <> 'current_placement' and n <> 5 then
      raise exception 'HARNESS-FAIL A: doctor read % of 5 from %', n, t;
    end if;
  end loop;
  v_report := v_report || format('A: doctor reads 5 of %s residents (no-doctor, colleague, cancelled, mixed, own patient at a left clinic), same in both views | ', v_total);

  -- B: other and none by id.
  foreach t in array array['residents|id', 'resident_list_view|resident_id', 'resident_current_state|resident_id', 'current_placement|resident_id'] loop
    n := pg_temp.try(v_doc, format('select 1 from %s where %s in (%L, %L)', split_part(t, '|', 1), split_part(t, '|', 2), v_other, v_none));
    if n <> 0 then raise exception 'HARNESS-FAIL B: doctor read % rows of other/none from %', n, t; end if;
  end loop;
  v_report := v_report || 'B: other and none by id: 0 from residents and 3 views | ';

  -- C: clinical rows.
  foreach t in array array['clinic_visits', 'prescriptions', 'procedures', 'blood_tests', 'weight',
                           'immunization_records', 'resident_diets', 'placement_history', 'adoption_updates',
                           'immunization_compliance', 'immunization_duplicate_check'] loop
    n := pg_temp.try(v_doc, format('select 1 from %I where resident_id = %L', t, v_other));
    if n <> 0 then raise exception 'HARNESS-FAIL C: doctor read % rows of other from %', n, t; end if;
  end loop;
  n := pg_temp.try(v_doc, format('select 1 from clinic_visits where resident_id = %L', v_mixed));
  if n <> 2 then raise exception 'HARNESS-FAIL C: doctor read % of mixed''s 2 visits', n; end if;
  foreach t in array array['clinic_visits', 'prescriptions', 'weight'] loop
    n := pg_temp.try(v_doc, format('select 1 from %I where resident_id = %L', t, v_past));
    if n <> 1 then raise exception 'HARNESS-FAIL C: doctor read % of past''s % (expected 1)', n, t; end if;
  end loop;
  v_report := v_report || 'C: 0 of other''s rows from 11; mixed 2 visits; past''s visit, prescription and weight 1 each | ';

  -- D: writes. A clinic the doctor has left is read-only to it, as another clinic's always was (0110).
  n := pg_temp.try(v_doc, format('insert into weight (resident_id, date, weight_kg) values (%L, current_date, 10)', v_other));
  if n >= 0 then raise exception 'HARNESS-FAIL D: doctor weight insert for other gave %', n; end if;
  n := pg_temp.try(v_doc, format('insert into weight (resident_id, date, weight_kg) values (%L, current_date, 10)', v_past));
  if n >= 0 then raise exception 'HARNESS-FAIL D: doctor weight insert for past (left clinic) gave %', n; end if;
  n := pg_temp.try(v_doc, format('insert into clinic_visits (resident_id, clinic_id, appointment_date) values (%L, %L, now())', v_past, v_left));
  if n >= 0 then raise exception 'HARNESS-FAIL D: doctor booked past at the clinic it left: %', n; end if;
  n := pg_temp.try(v_doc, format('update clinic_visits set notes = ''harness'' where resident_id = %L', v_past));
  if n <> 0 then raise exception 'HARNESS-FAIL D: doctor updated % of past''s visits', n; end if;
  n := pg_temp.try(v_doc, format('update weight set notes = ''harness'' where resident_id = %L', v_past));
  if n <> 0 then raise exception 'HARNESS-FAIL D: doctor updated % of past''s weights', n; end if;
  n := pg_temp.try(v_doc, format('select record_attachment(''resident'', %L, ''harnessFilePast000'')', v_past));
  if n >= 0 then raise exception 'HARNESS-FAIL D: doctor recorded an attachment on past'; end if;
  n := pg_temp.try(v_doc, format('select set_resident_microchip(%L, ''900000000000001'')', v_past));
  if n >= 0 then raise exception 'HARNESS-FAIL D: doctor set past''s microchip'; end if;
  n := pg_temp.try(v_doc, format('insert into weight (resident_id, date, weight_kg) values (%L, current_date, 11)', v_seen));
  if n <> 1 then raise exception 'HARNESS-FAIL D: doctor weight insert for seen gave %', n; end if;
  n := pg_temp.try(v_doc, format('insert into clinic_visits (resident_id, clinic_id, appointment_date) values (%L, %L, now())', v_seen, v_own));
  if n <> 1 then raise exception 'HARNESS-FAIL D: doctor booking seen at own clinic gave %', n; end if;
  n := pg_temp.try(v_doc, format('select record_attachment(''resident'', %L, ''harnessFileSeen000'', null, ''Medical'')', v_seen));
  if n <> 1 then raise exception 'HARNESS-FAIL D: doctor attachment on seen gave %', n; end if;
  v_report := v_report || 'D: other and past: weight, visit, update, attachment, microchip all refused; seen: weight, visit and attachment allowed | ';

  -- E: a doctor login with no doctor record.
  foreach t in array array['residents', 'resident_list_view', 'resident_current_state', 'current_placement', 'clinic_visits', 'weight'] loop
    n := pg_temp.try(v_unl, format('select 1 from %I', t));
    if n <> 0 then raise exception 'HARNESS-FAIL E: unlinked doctor login read % rows from %', n, t; end if;
  end loop;
  v_report := v_report || 'E: unlinked doctor login reads 0 everywhere | ';

  -- F: every other role unchanged.
  foreach v_who in array array['admin', 'mgmt'] loop
    n := pg_temp.try((select id from harness_ids h where h.who = v_who), 'select 1 from residents');
    if n <> v_total then raise exception 'HARNESS-FAIL F: % read % of % residents', v_who, n, v_total; end if;
    n := pg_temp.try((select id from harness_ids h where h.who = v_who), 'select 1 from resident_current_state');
    if n <> v_total then raise exception 'HARNESS-FAIL F: % read % of % from resident_current_state', v_who, n, v_total; end if;
  end loop;
  foreach v_who in array array['select 1 from residents', 'select 1 from resident_current_state', 'select 1 from weight'] loop
    n := pg_temp.try((select id from harness_ids h where h.who = 'volunteer'), v_who);
    if n <> 0 then raise exception 'HARNESS-FAIL F: volunteer read % rows of (%)', n, v_who; end if;
  end loop;
  n := pg_temp.try(null, 'select 1 from resident_current_state');
  if n <> v_total then raise exception 'HARNESS-FAIL F: service role read % of %', n, v_total; end if;
  v_report := v_report || format('F: admin/management and service role read all %s, a volunteer none | ', v_total);

  -- G: translations of other's bio.
  n := pg_temp.try(v_doc, format('select 1 from translations where table_name = ''residents'' and row_id = %L', v_other));
  if n <> 0 then raise exception 'HARNESS-FAIL G: doctor read % of other''s translations', n; end if;
  n := pg_temp.try(v_doc, format('select 1 from translation_queue where table_name = ''residents'' and row_id = %L', v_other));
  if n <> 0 then raise exception 'HARNESS-FAIL G: doctor read % of other''s translation_queue rows', n; end if;
  v_report := v_report || 'G: 0 of other''s translations (table and queue) | ';

  -- H: the app's front door, for every role that opens it.
  foreach v_who in array array['doctor', 'admin', 'mgmt', 'volunteer'] loop
    t := pg_temp.val((select id from harness_ids h where h.who = v_who), 'select private.has_app_access()::text');
    if t is distinct from 'true' then raise exception 'HARNESS-FAIL H: has_app_access() for % gave %', v_who, coalesce(t, 'an error'); end if;
  end loop;
  v_report := v_report || 'H: has_app_access() true for doctor, admin, management, volunteer | ';

  -- I: a doctor typed by name is listed at that clinic.
  insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_name)
  values (v_seen, v_own, now(), '  Harness Typed Doctor  ');
  if not exists (select 1 from doctors d join doctor_clinics c on c.doctor_id = d.id
                  where d.name = 'Harness Typed Doctor' and c.clinic_id = v_own and c.active) then
    raise exception 'HARNESS-FAIL I: a typed doctor name made no doctor at the clinic';
  end if;
  if not exists (select 1 from clinic_visits v join doctors d on d.id = v.doctor_id
                  where v.resident_id = v_seen and d.name = 'Harness Typed Doctor') then
    raise exception 'HARNESS-FAIL I: the visit was not linked to the doctor it listed';
  end if;
  v_report := v_report || 'I: a typed name lists a doctor at the clinic and links the visit | ';

  -- J: bulk booking, and the old names.
  n := pg_temp.try((select id from harness_ids where who = 'admin'),
    format('select schedule_bulk_appointments(array[%L, %L]::uuid[], %L, now() + interval ''1 day'')', v_seen, v_coll, v_own));
  if n <> 2 then raise exception 'HARNESS-FAIL J: bulk booking with p_clinic_id gave %', n; end if;
  n := pg_temp.try((select id from harness_ids where who = 'admin'), format('select 1 from vets where id = %L', v_own));
  if n <> 1 then raise exception 'HARNESS-FAIL J: admin read % of own clinic through vets', n; end if;
  n := pg_temp.try((select id from harness_ids where who = 'admin'), 'insert into vets (id, name) values (gen_random_uuid(), ''Harness via old name'')');
  if n >= 0 then raise exception 'HARNESS-FAIL J: an insert through the old name vets was accepted'; end if;
  n := pg_temp.try(v_doc, format('select 1 from vet_appointments where resident_id = %L', v_other));
  if n <> 0 then raise exception 'HARNESS-FAIL J: the doctor read other''s visit through vet_appointments (%)', n; end if;
  v_report := v_report || 'J: bulk booking 2; vets reads, refuses an insert, and keeps the table''s policies';

  raise exception '%', format('HARNESS-OK %s | %s | %s', ${JSON.stringify(file).replace(/"/g, "'")},
    current_setting('harness.state'), v_report);
end;
$h$;
rollback;
`;

const body = `
begin;
select set_config('harness.state', ${live ? "'asserted live on dev'" : "'pending on dev: replayed twice in this transaction'"}, true);
${live ? "" : migration + "\n" + migration}
${assertions}
`;

const { status, msg } = await run(body);
console.log(`status ${status}`);
console.log(msg);
// exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
