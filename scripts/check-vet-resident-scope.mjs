// Rollback harness for *_vet_resident_scope.sql against DEV only. One
// transaction: what a vet's own JWT reads before the file, the file (twice),
// then what each kind of session can read and write afterwards, then a
// deliberate `raise exception` carrying the evidence â€” so nothing can
// commit. Safe to run before or after the file is applied.
//
//   node scripts/check-vet-resident-scope.mjs     (from the repo root; dev only)
//
// Fixtures: two harness clinics, "own" (the vet's) and "other", and five
// residents â€”
//   seen      a completed visit at own
//   cancelled only a cancelled visit at own          (decisions.md: counts)
//   mixed     a visit at own and a visit at other    (decisions.md: both shown)
//   other     only a visit at other, with a weight, a placement, a
//             prescription and a bio
//   none      no clinical record anywhere
//
// It checks
//   0  before the file a vet reads `other` â€” the hole was real, and the
//      harness reaches RLS (skipped, and said so, once applied)
//   A  the vet reads exactly seen, cancelled and mixed among the harness
//      residents, and nothing outside its clinic's list anywhere in dev
//   B  `other` by id, as /residents/<id> asks for it: 0 rows from residents,
//      resident_list_view, resident_current_state, current_placement
//   C  `other`'s clinical rows: 0 from every table and view a vet reads;
//      `mixed` shows both clinics' visits
//   D  writes: a vet cannot insert a weight, a visit (even at own clinic)
//      or an attachment for `other`, or update its rows; it can for `seen`
//   E  a vet with no clinic reads no resident, through any path
//   F  admin, management, staff and volunteer still read every resident,
//      through the table and the view; the service role too
//   G  translations and translation_queue: none of `other`'s rows
//
// Exits 0 when every assertion held. Writes nothing even on success.
// NOTE: asserts the LIVE schema; the 0108 file is no longer replayed because 0125 redefines its
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
const file = readdirSync(dir).find((f) => /^\d+_vet_resident_scope\.sql$/.test(f));
if (!file) throw new Error("no *_vet_resident_scope.sql in supabase/migrations");
const migration = readFileSync(join(dir, file), "utf8");

const sql = `
begin;

-- Run one statement as a login (null = service role). Returns the row
-- count; -1 if RLS or a privilege refused it, -2 for any other error.
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

create temp table harness_ids (who text primary key, id uuid not null);
insert into harness_ids values
  ('vet', gen_random_uuid()), ('unlinked', gen_random_uuid()), ('mgmt', gen_random_uuid()),
  ('admin', gen_random_uuid()), ('staff', gen_random_uuid()), ('volunteer', gen_random_uuid()),
  ('own_clinic', gen_random_uuid()), ('other_clinic', gen_random_uuid()),
  ('seen', gen_random_uuid()), ('cancelled', gen_random_uuid()), ('mixed', gen_random_uuid()),
  ('other', gen_random_uuid()), ('none', gen_random_uuid());
grant select on harness_ids to authenticated, service_role;

do $setup$
declare
  r record;
  v_own uuid := (select id from harness_ids where who = 'own_clinic');
  v_oth uuid := (select id from harness_ids where who = 'other_clinic');
  v_visit uuid;
begin
  insert into vets (id, name, clinic_name)
  select id, 'Harness ' || who, 'Harness clinic ' || who from harness_ids where who in ('own_clinic', 'other_clinic');
  for r in select * from harness_ids where who in ('vet', 'unlinked', 'mgmt', 'admin', 'staff', 'volunteer') loop
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (r.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-vet-scope-' || r.who || '-' || r.id || '@example.invalid',
            '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || r.who), now(), now());
  end loop;
  insert into user_roles (user_id, role, vet_id)
  select id, 'vet', v_own from harness_ids where who = 'vet';
  insert into user_roles (user_id, role)
  select id, case who when 'mgmt' then 'management' when 'unlinked' then 'vet' else who end::app_role
  from harness_ids where who in ('unlinked', 'mgmt', 'admin', 'staff', 'volunteer');

  insert into residents (id, name, species, bio)
  select id, 'Harness ' || who, 'Dog', case when who in ('seen', 'other') then 'Harness bio ' || who end
  from harness_ids where who in ('seen', 'cancelled', 'mixed', 'other', 'none');

  insert into vet_appointments (resident_id, vet_id, appointment_date, status) values
    ((select id from harness_ids where who = 'seen'), v_own, now() - interval '3 days', 'completed'),
    ((select id from harness_ids where who = 'cancelled'), v_own, now() + interval '3 days', 'cancelled'),
    ((select id from harness_ids where who = 'mixed'), v_own, now() - interval '2 days', 'completed'),
    ((select id from harness_ids where who = 'mixed'), v_oth, now() - interval '9 days', 'completed');
  insert into vet_appointments (resident_id, vet_id, appointment_date, status)
  values ((select id from harness_ids where who = 'other'), v_oth, now() - interval '5 days', 'completed')
  returning id into v_visit;

  insert into weight (resident_id, date, weight_kg, vet_appointment_id)
  values ((select id from harness_ids where who = 'other'), current_date - 5, 12.5, v_visit);
  insert into placement_history (resident_id, placement_type, start_date)
  values ((select id from harness_ids where who = 'other'), 'Intake', now() - interval '30 days');
  insert into prescriptions (resident_id, medication_id, start_date, vet_appointment_id)
  values ((select id from harness_ids where who = 'other'), (select id from medication limit 1), current_date - 5, v_visit);
end $setup$;

create temp table harness_before (applied_already boolean, vet_reads_other bigint);
grant all on harness_before to authenticated, service_role;
insert into harness_before
select exists (select 1 from pg_proc where proname = 'current_vet_resident_ids'),
       pg_temp.try((select id from harness_ids where who = 'vet'),
         format('select 1 from residents where id = %L', (select id from harness_ids where who = 'other')));


do $h$
declare
  v_vet uuid := (select id from harness_ids where who = 'vet');
  v_unl uuid := (select id from harness_ids where who = 'unlinked');
  v_own uuid := (select id from harness_ids where who = 'own_clinic');
  v_seen uuid := (select id from harness_ids where who = 'seen');
  v_canc uuid := (select id from harness_ids where who = 'cancelled');
  v_mixed uuid := (select id from harness_ids where who = 'mixed');
  v_other uuid := (select id from harness_ids where who = 'other');
  v_none uuid := (select id from harness_ids where who = 'none');
  v_harness text := format('(%L, %L, %L, %L, %L)', v_seen, v_canc, v_mixed, v_other, v_none);
  v_total bigint := (select count(*) from residents);
  v_applied boolean := (select applied_already from harness_before);
  v_before bigint := (select vet_reads_other from harness_before);
  v_bad text;
  n bigint;
  t text;
  v_who text;
  v_report text := '';
begin
  -- 0: the hole was real, and the harness reaches RLS.
  if v_applied then
    v_report := v_report || '0: skipped, file already applied on dev | ';
  elsif v_before <> 1 then
    raise exception 'HARNESS-FAIL 0: before the file the vet read % rows of other, expected 1', v_before;
  else
    v_report := v_report || '0: before the file the vet read other (1 row) | ';
  end if;

  -- A: exactly the three the clinic treats, among the harness residents,
  -- and the vet's whole list is just those three (the clinic is new).
  n := pg_temp.try(v_vet, format('select 1 from residents where id in %s', v_harness));
  if n <> 3 then raise exception 'HARNESS-FAIL A: vet read % harness residents, expected 3', n; end if;
  n := pg_temp.try(v_vet, format('select 1 from residents where id in (%L, %L, %L)', v_seen, v_canc, v_mixed));
  if n <> 3 then raise exception 'HARNESS-FAIL A: vet read % of seen/cancelled/mixed', n; end if;
  n := pg_temp.try(v_vet, 'select 1 from residents');
  if n <> 3 then raise exception 'HARNESS-FAIL A: vet read % residents in all of dev, expected 3', n; end if;
  n := pg_temp.try(v_vet, 'select 1 from resident_list_view');
  if n <> 3 then raise exception 'HARNESS-FAIL A: vet read % rows of resident_list_view, expected 3', n; end if;
  n := pg_temp.try(v_vet, 'select 1 from resident_current_state');
  if n <> 3 then raise exception 'HARNESS-FAIL A: vet read % rows of resident_current_state, expected 3', n; end if;
  v_report := v_report || format('A: vet reads 3 of %s residents (seen, cancelled-only, mixed), same in both views | ', v_total);

  -- B: other and none by id.
  foreach t in array array['residents|id', 'resident_list_view|resident_id', 'resident_current_state|resident_id', 'current_placement|resident_id'] loop
    n := pg_temp.try(v_vet, format('select 1 from %s where %s in (%L, %L)', split_part(t, '|', 1), split_part(t, '|', 2), v_other, v_none));
    if n <> 0 then raise exception 'HARNESS-FAIL B: vet read % rows of other/none from %', n, t; end if;
  end loop;
  v_report := v_report || 'B: other and none by id: 0 from residents, resident_list_view, resident_current_state, current_placement | ';

  -- C: other's clinical rows; mixed shows both clinics' visits.
  foreach t in array array['vet_appointments', 'prescriptions', 'procedures', 'blood_tests', 'weight',
                           'immunization_records', 'resident_diets', 'placement_history', 'adoption_updates',
                           'immunization_compliance', 'immunization_duplicate_check'] loop
    n := pg_temp.try(v_vet, format('select 1 from %I where resident_id = %L', t, v_other));
    if n <> 0 then raise exception 'HARNESS-FAIL C: vet read % rows of other from %', n, t; end if;
  end loop;
  n := pg_temp.try(v_vet, format('select 1 from vet_appointments where resident_id = %L', v_mixed));
  if n <> 2 then raise exception 'HARNESS-FAIL C: vet read % of mixed''s 2 visits', n; end if;
  n := pg_temp.try(v_vet, format('select 1 from vet_appointments where resident_id = %L', v_canc));
  if n <> 1 then raise exception 'HARNESS-FAIL C: vet read % of cancelled''s visit', n; end if;
  v_report := v_report || 'C: 0 of other''s rows from 11 tables/views; mixed shows both clinics'' visits (2) | ';

  -- D: writes.
  n := pg_temp.try(v_vet, format('insert into weight (resident_id, date, weight_kg) values (%L, current_date, 10)', v_other));
  if n <> -1 then raise exception 'HARNESS-FAIL D: vet weight insert for other gave %', n; end if;
  n := pg_temp.try(v_vet, format('insert into vet_appointments (resident_id, vet_id, appointment_date) values (%L, %L, now())', v_other, v_own));
  if n <> -1 then raise exception 'HARNESS-FAIL D: vet booked other at own clinic: %', n; end if;
  n := pg_temp.try(v_vet, format('update weight set notes = ''vet'' where resident_id = %L', v_other));
  if n <> 0 then raise exception 'HARNESS-FAIL D: vet updated % of other''s weights', n; end if;
  n := pg_temp.try(v_vet, format('delete from vet_appointments where resident_id = %L', v_other));
  if n <> 0 then raise exception 'HARNESS-FAIL D: vet deleted % of other''s visits', n; end if;
  n := pg_temp.try(v_vet, format('select record_attachment(''resident'', %L, ''harnessFileOther00'')', v_other));
  if n >= 0 then raise exception 'HARNESS-FAIL D: vet recorded an attachment on other'; end if;
  n := pg_temp.try(v_vet, format('insert into weight (resident_id, date, weight_kg) values (%L, current_date, 11)', v_seen));
  if n <> 1 then raise exception 'HARNESS-FAIL D: vet weight insert for seen gave %', n; end if;
  n := pg_temp.try(v_vet, format('select record_attachment(''resident'', %L, ''harnessFileSeen000'')', v_seen));
  if n <> 1 then raise exception 'HARNESS-FAIL D: vet attachment on seen gave %', n; end if;
  n := pg_temp.try(v_vet, format('select 1 from attachments where drive_file_id = ''harnessFileSeen000''', v_seen));
  if n <> 1 then raise exception 'HARNESS-FAIL D: vet cannot read back seen''s attachment (%)', n; end if;
  v_report := v_report || 'D: other: weight/visit/attachment refused, update 0, delete 0; seen: weight 1, attachment 1 | ';

  -- E: a vet with no clinic.
  foreach t in array array['residents', 'resident_list_view', 'resident_current_state', 'current_placement', 'vet_appointments', 'weight'] loop
    n := pg_temp.try(v_unl, format('select 1 from %I', t));
    if n <> 0 then raise exception 'HARNESS-FAIL E: unlinked vet read % rows from %', n, t; end if;
  end loop;
  v_report := v_report || 'E: unlinked vet reads 0 from residents, both views, current_placement, visits, weights | ';

  -- F: every other role unchanged.
  foreach v_who in array array['admin', 'mgmt', 'staff', 'volunteer'] loop
    n := pg_temp.try((select id from harness_ids h where h.who = v_who), 'select 1 from residents');
    if n <> v_total then raise exception 'HARNESS-FAIL F: % read % of % residents', v_who, n, v_total; end if;
    n := pg_temp.try((select id from harness_ids h where h.who = v_who), 'select 1 from resident_current_state');
    if n <> v_total then raise exception 'HARNESS-FAIL F: % read % of % from resident_current_state', v_who, n, v_total; end if;
    n := pg_temp.try((select id from harness_ids h where h.who = v_who), format('select 1 from weight where resident_id = %L', v_other));
    if n <> 1 then raise exception 'HARNESS-FAIL F: % read % of other''s weight', v_who, n; end if;
  end loop;
  n := pg_temp.try(null, 'select 1 from resident_current_state');
  if n <> v_total then raise exception 'HARNESS-FAIL F: service role read % of %', n, v_total; end if;
  v_report := v_report || format('F: admin/management/staff/volunteer and service role read all %s | ', v_total);

  -- G: translations of other's bio.
  n := pg_temp.try(v_vet, format('select 1 from translations where table_name = ''residents'' and row_id = %L', v_other));
  if n <> 0 then raise exception 'HARNESS-FAIL G: vet read % of other''s translations', n; end if;
  n := pg_temp.try(v_vet, format('select 1 from translation_queue where table_name = ''residents'' and row_id = %L', v_other));
  if n <> 0 then raise exception 'HARNESS-FAIL G: vet read % of other''s translation_queue rows', n; end if;
  select count(*) into n from translations where table_name = 'residents' and row_id = v_other;
  v_report := v_report || format('G: vet reads 0 of other''s %s translation rows (table and queue); ', n);
  n := pg_temp.try(v_vet, format('select 1 from translations where table_name = ''residents'' and row_id = %L', v_seen));
  v_report := v_report || format('%s of seen''s', n);

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
// exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
