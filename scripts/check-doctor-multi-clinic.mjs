// Rollback harness for *_drop_user_roles_vet_id.sql against DEV only. One
// transaction: fixtures, the file (twice), assertions through real JWTs and
// RLS, then a deliberate `raise exception` carrying the evidence, so nothing
// can commit. Safe to run before or after the file is applied.
//
//   node scripts/check-doctor-multi-clinic.mjs     (from the repo root; dev only)
//
// Fixtures: clinics A, B, C; residents rA / rB / rC with one visit each at
// that clinic; a vet login "multi" linked to a doctor who works at A and B;
// a legacy vet login whose only clinic is user_roles.clinic_id = A (the column is
// re-added inside the transaction if 0127 already dropped it, so the back-fill is
// exercised whether or not the file is applied); a vet login
// with no clinic; admin, management, staff.
//
//   A  the moved guarantee: a visit whose doctor does not work at its clinic
//      is refused (insert, update, by id, by typed name never mismatches);
//      a link a visit uses cannot be deleted; an unused one can; a doctor
//      marked no longer there keeps their past visits
//   B  one spelling per clinic: a clash on insert, on rename, on a new link;
//      the same name at two clinics stays two people (not merged by name)
//   C  0108 still holds: the multi vet sees A's and B's residents and not C's;
//      the legacy vet sees only A's; the unlinked vet sees none; an inactive
//      link drops that clinic from the vet's view
//   D  0110 still holds: the multi vet writes at A and B and is refused at C
//      (insert, update, delete, move A->C, a prescription on C's visit)
//   E  a doctor's login: only an admin at aal2 sets it; unique both ways
//   F  nobody widens a vet's reach: a vet cannot link themselves to C or take
//      another clinic's doctor; staff cannot touch a login-linked doctor's links
//   G  merge_doctors across clinics: links, visits and login follow
//   H  the legacy login was back-filled with a doctor at A before the column
//      went; user_roles.clinic_id, its check and current_user_vet_id() are gone and
//      nothing in the catalogue calls it; audit_log writes once per change
//
// Exits 0 when every assertion held.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const dir = join(root, "supabase/migrations");
const file = readdirSync(dir).find((f) => /^\d+_drop_user_roles_vet_id\.sql$/.test(f));
if (!file) throw new Error("no *_drop_user_roles_vet_id.sql in supabase/migrations");
const migration = readFileSync(join(dir, file), "utf8");

const sql = `
begin;

-- Runs p_sql as p_uid through RLS. Returns the row count, or -1 for
-- insufficient_privilege (RLS / a guard), -3 for a foreign key violation, -4 for
-- a unique violation, -2 for anything else. p_aal sets the JWT's aal.
create function pg_temp.try(p_uid uuid, p_sql text, p_aal text default 'aal2') returns bigint language plpgsql as $f$
declare v bigint;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', p_aal)::text, true);
  set local role authenticated;
  begin
    execute p_sql;
    get diagnostics v = row_count;
  exception
    when insufficient_privilege then v := -1;
    when foreign_key_violation then v := -3;
    when unique_violation then v := -4;
    when others then v := -2;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

-- A scalar read as p_uid through RLS.
create function pg_temp.scalar(p_uid uuid, p_sql text) returns text language plpgsql as $f$
declare v text;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
  execute p_sql into v;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

create temp table harness_ids (who text primary key, id uuid not null);
insert into harness_ids
select w, gen_random_uuid() from unnest(array[
  'multi', 'legacy', 'nolink', 'admin', 'mgmt', 'staff',
  'ca', 'cb', 'cc', 'ra', 'rb', 'rc', 'va', 'vb', 'vc',
  'dm', 'dx', 'dy', 'dz']) w;
grant select on harness_ids to authenticated;
create function pg_temp.hid(p text) returns uuid language sql as $f$ select id from harness_ids where who = p $f$;

do $setup$
declare
  r record;
  a uuid := pg_temp.hid('ca'); b uuid := pg_temp.hid('cb'); c uuid := pg_temp.hid('cc');
begin
  insert into vets (id, name, clinic_name) values
    (a, 'Harness A', 'Harness clinic A'), (b, 'Harness B', 'Harness clinic B'), (c, 'Harness C', 'Harness clinic C');
  for r in select * from harness_ids where who in ('multi', 'legacy', 'nolink', 'admin', 'mgmt', 'staff') loop
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (r.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-multi-' || r.who || '-' || r.id || '@example.invalid',
            '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || r.who), now(), now());
  end loop;
  insert into user_roles (user_id, role) values
    (pg_temp.hid('multi'), 'vet'), (pg_temp.hid('nolink'), 'vet'),
    (pg_temp.hid('admin'), 'admin'), (pg_temp.hid('mgmt'), 'management'), (pg_temp.hid('staff'), 'staff');
  alter table user_roles add column if not exists clinic_id uuid references vets (id) on delete set null;
  insert into user_roles (user_id, role, clinic_id) values (pg_temp.hid('legacy'), 'vet', a);

  insert into residents (id, name, species) values
    (pg_temp.hid('ra'), 'Harness rA', 'Dog'), (pg_temp.hid('rb'), 'Harness rB', 'Dog'), (pg_temp.hid('rc'), 'Harness rC', 'Dog');
  insert into clinic_visits (id, resident_id, clinic_id, appointment_date, status) values
    (pg_temp.hid('va'), pg_temp.hid('ra'), a, now() - interval '3 days', 'completed'),
    (pg_temp.hid('vb'), pg_temp.hid('rb'), b, now() - interval '3 days', 'completed'),
    (pg_temp.hid('vc'), pg_temp.hid('rc'), c, now() - interval '3 days', 'completed');
end $setup$;

${migration}
${migration}

do $h$
declare
  a uuid := pg_temp.hid('ca'); b uuid := pg_temp.hid('cb'); c uuid := pg_temp.hid('cc');
  multi uuid := pg_temp.hid('multi'); legacy uuid := pg_temp.hid('legacy'); nolink uuid := pg_temp.hid('nolink');
  adm uuid := pg_temp.hid('admin'); mgmt uuid := pg_temp.hid('mgmt'); stf uuid := pg_temp.hid('staff');
  ra uuid := pg_temp.hid('ra'); rb uuid := pg_temp.hid('rb'); rc uuid := pg_temp.hid('rc');
  va uuid := pg_temp.hid('va'); vb uuid := pg_temp.hid('vb'); vc uuid := pg_temp.hid('vc');
  dm uuid := pg_temp.hid('dm'); dx uuid := pg_temp.hid('dx'); dy uuid := pg_temp.hid('dy'); dz uuid := pg_temp.hid('dz');
  n bigint; t text; k int; v_new uuid; v_before int; v_after int;
  v_report text := '';
begin
  ----------------------------------------------------------------- A
  -- dm: works at A and B and is multi's own doctor. dx: A only. dy: B only.
  insert into doctors (id, clinic_id, name) values (dm, a, 'Harness Dr Multi'), (dx, a, 'Harness Dr X'), (dy, b, 'Harness Dr Y');
  insert into doctor_clinics (clinic_id, doctor_id) values (b, dm);
  select count(*) into k from doctor_clinics where doctor_id in (dm, dx, dy);
  if k <> 4 then raise exception 'HARNESS-FAIL A: expected 4 links (home trigger + one added), got %', k; end if;

  -- by id, as the table owner: a doctor from another clinic is refused
  begin
    insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_id) values (ra, a, now(), dy);
    raise exception 'HARNESS-FAIL A: visit at A accepted dy, who works only at B';
  exception when foreign_key_violation then null; end;
  insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_id) values (ra, b, now(), dm);
  insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_id) values (ra, a, now(), dm);
  -- ... and through a role that bypasses nothing
  n := pg_temp.try(stf, format('insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_id) values (%L, %L, now(), %L)', ra, a, dy));
  if n <> -3 then raise exception 'HARNESS-FAIL A: staff booking a wrong-clinic doctor gave %', n; end if;
  -- an update that moves a visit to a clinic its doctor is not at, or swaps the doctor
  insert into clinic_visits (id, resident_id, clinic_id, appointment_date, doctor_id) values (gen_random_uuid(), ra, b, now(), dy) returning id into v_new;
  n := pg_temp.try(stf, format('update clinic_visits set clinic_id = %L where id = %L', a, v_new));
  -- 0102 behaviour: moving a visit re-resolves the typed name at the new clinic
  -- (finds or adds that clinics own doctor), so it never keeps a doctor from elsewhere.
  if n <> 1 or exists (
       select 1 from clinic_visits x
        where x.id = v_new and (x.doctor_id = dy or not exists (
          select 1 from doctor_clinics l where l.doctor_id = x.doctor_id and l.clinic_id = x.clinic_id)))
  then raise exception 'HARNESS-FAIL A: moving a visit left it with a doctor who is not at its new clinic (%)', n; end if;
  insert into clinic_visits (id, resident_id, clinic_id, appointment_date, doctor_id) values (gen_random_uuid(), rb, b, now(), dy) returning id into v_new;
  n := pg_temp.try(stf, format('update clinic_visits set doctor_id = %L where id = %L', dx, v_new));
  if n <> -3 then raise exception 'HARNESS-FAIL A: swapping to a doctor not at the clinic gave %', n; end if;
  -- a typed name at a clinic finds or adds a doctor THERE and never crosses clinics
  insert into clinic_visits (id, resident_id, clinic_id, appointment_date, doctor_name) values (gen_random_uuid(), ra, a, now(), '  HARNESS  dr   multi ') returning id into v_new;
  if (select doctor_id from clinic_visits where id = v_new) is distinct from dm then raise exception 'HARNESS-FAIL A: typed name did not find the shared doctor at A'; end if;
  insert into clinic_visits (id, resident_id, clinic_id, appointment_date, doctor_name) values (gen_random_uuid(), rc, c, now(), 'Harness Dr Multi') returning id into v_new;
  if (select doctor_id from clinic_visits where id = v_new) = dm then raise exception 'HARNESS-FAIL A: typed name at C reused a doctor who is not at C'; end if;
  if not exists (select 1 from doctor_clinics where doctor_id = (select doctor_id from clinic_visits where id = v_new) and clinic_id = c) then
    raise exception 'HARNESS-FAIL A: the doctor added at C has no link to C'; end if;
  -- a link a visit uses cannot be deleted; deactivating keeps the past visits
  begin
    delete from doctor_clinics where doctor_id = dm and clinic_id = b;
    raise exception 'HARNESS-FAIL A: deleted a link that a visit uses';
  exception when foreign_key_violation then null; end;
  update doctor_clinics set active = false where doctor_id = dm and clinic_id = b;
  if (select doctor_id from clinic_visits where resident_id = ra and clinic_id = b and doctor_id = dm limit 1) is distinct from dm then
    raise exception 'HARNESS-FAIL A: past visit lost its doctor when the doctor left the clinic'; end if;
  update doctor_clinics set active = true where doctor_id = dm and clinic_id = b;
  delete from doctor_clinics where doctor_id = dx and clinic_id = a and not exists (select 1 from clinic_visits where doctor_id = dx);
  if exists (select 1 from doctor_clinics where doctor_id = dx) then raise exception 'HARNESS-FAIL A: an unused link could not be deleted'; end if;
  insert into doctor_clinics (clinic_id, doctor_id) values (a, dx);
  v_report := v_report || 'A: wrong-clinic doctor refused (insert, move, swap), typed names stay in clinic, used link undeletable, leaving keeps visits | ';

  ----------------------------------------------------------------- B
  begin
    insert into doctors (clinic_id, name) values (a, '  HARNESS dr   x ');
    raise exception 'HARNESS-FAIL B: a second spelling of Dr X at A was accepted';
  exception when unique_violation then null; end;
  begin
    update doctors set name = 'harness dr multi' where id = dx;
    raise exception 'HARNESS-FAIL B: renaming dx onto dm at A was accepted';
  exception when unique_violation then null; end;
  begin
    insert into doctor_clinics (clinic_id, doctor_id) select a, id from doctors where name = 'Harness Dr Multi' and id <> dm and exists (select 1 from doctor_clinics where doctor_id = doctors.id and clinic_id = c);
    raise exception 'HARNESS-FAIL B: a second doctor with the same name was linked to A';
  exception when unique_violation then null; end;
  update doctors set name = 'Harness Dr Renamed' where id = dm;
  if exists (select 1 from doctor_clinics where doctor_id = dm and name_key <> 'harness dr renamed') then raise exception 'HARNESS-FAIL B: rename did not re-key the links'; end if;
  if (select count(distinct doctor_id) from clinic_visits where doctor_id = dm) <> 1 or exists (select 1 from clinic_visits where doctor_id = dm and doctor_name <> 'Harness Dr Renamed') then
    raise exception 'HARNESS-FAIL B: rename did not reach the visits'; end if;
  update doctors set name = 'Harness Dr Multi' where id = dm;
  -- the same name at two clinics is two people until someone merges them
  select count(*) into k from doctors where name = 'Harness Dr Multi';
  if k <> 2 then raise exception 'HARNESS-FAIL B: expected 2 people named Dr Multi (A/B shared one, C added one), got %', k; end if;
  v_report := v_report || 'B: one spelling per clinic on insert/rename/link, rename re-keys, same name elsewhere stays separate | ';

  ----------------------------------------------------------------- C (0108)
  update doctors set user_id = multi where id = dm;   -- owner context: no auth.uid(), so the login guard lets it through
  if pg_temp.scalar(multi, 'select array_to_string(array(select x from unnest(current_user_clinic_ids()) x order by x), '','')')
     is distinct from (select string_agg(x::text, ',' order by x) from unnest(array[a, b]) x) then
    raise exception 'HARNESS-FAIL C: multi''s clinics are %', pg_temp.scalar(multi, 'select current_user_clinic_ids()::text'); end if;
  if pg_temp.scalar(legacy, 'select current_user_clinic_ids()::text') is distinct from ('{' || a || '}') then
    raise exception 'HARNESS-FAIL C: legacy vet clinics are %', pg_temp.scalar(legacy, 'select current_user_clinic_ids()::text'); end if;
  if pg_temp.scalar(nolink, 'select current_user_clinic_ids()::text') is distinct from '{}' then
    raise exception 'HARNESS-FAIL C: unlinked vet has clinics %', pg_temp.scalar(nolink, 'select current_user_clinic_ids()::text'); end if;
  if pg_temp.scalar(stf, 'select current_user_clinic_ids()::text') is distinct from '{}' then
    raise exception 'HARNESS-FAIL C: staff has vet clinics'; end if;

  t := pg_temp.scalar(multi, format('select count(*) from residents where id in (%L, %L, %L)', ra, rb, rc));
  if t <> '2' or pg_temp.scalar(multi, format('select count(*) from residents where id = %L', rc)) <> '0' then
    raise exception 'HARNESS-FAIL C: multi sees % of the three harness residents (want A and B, not C)', t; end if;
  if pg_temp.scalar(multi, format('select count(*) from resident_current_state where resident_id = %L', rc)) <> '0' then
    raise exception 'HARNESS-FAIL C: the owner-rights view showed C''s resident to multi'; end if;
  if pg_temp.scalar(legacy, format('select count(*) from residents where id in (%L, %L)', ra, rc)) <> '1' then
    raise exception 'HARNESS-FAIL C: legacy vet does not see exactly A''s resident'; end if;
  if pg_temp.scalar(nolink, format('select count(*) from residents where id in (%L, %L, %L)', ra, rb, rc)) <> '0' then
    raise exception 'HARNESS-FAIL C: unlinked vet sees residents'; end if;
  update doctor_clinics set active = false where doctor_id = dm and clinic_id = b;
  if pg_temp.scalar(multi, format('select count(*) from residents where id in (%L, %L, %L)', ra, rb, rc)) <> '1' then
    raise exception 'HARNESS-FAIL C: an inactive link still showed B''s residents'; end if;
  update doctor_clinics set active = true where doctor_id = dm and clinic_id = b;
  v_report := v_report || 'C: multi sees A+B not C, legacy sees A only, unlinked sees none, inactive link and view honoured | ';

  ----------------------------------------------------------------- D (0110)
  n := pg_temp.try(multi, format('insert into clinic_visits (resident_id, clinic_id, appointment_date) values (%L, %L, now())', ra, a));
  if n <> 1 then raise exception 'HARNESS-FAIL D: multi booking at A gave %', n; end if;
  n := pg_temp.try(multi, format('insert into clinic_visits (resident_id, clinic_id, appointment_date) values (%L, %L, now())', rb, b));
  if n <> 1 then raise exception 'HARNESS-FAIL D: multi booking at B gave %', n; end if;
  n := pg_temp.try(multi, format('insert into clinic_visits (resident_id, clinic_id, appointment_date) values (%L, %L, now())', ra, c));
  if n <> -1 then raise exception 'HARNESS-FAIL D: multi booking at C gave %', n; end if;
  n := pg_temp.try(multi, format('update clinic_visits set notes = ''x'' where id = %L', vc));
  if n <> 0 then raise exception 'HARNESS-FAIL D: multi updated % of C''s visits', n; end if;
  n := pg_temp.try(multi, format('delete from clinic_visits where id = %L', vc));
  if n <> 0 then raise exception 'HARNESS-FAIL D: multi deleted % of C''s visits', n; end if;
  n := pg_temp.try(multi, format('update clinic_visits set notes = ''x'' where id = %L', va));
  if n <> 1 then raise exception 'HARNESS-FAIL D: multi updating A''s visit gave %', n; end if;
  n := pg_temp.try(multi, format('update clinic_visits set clinic_id = %L where id = %L', c, va));
  if n <> -1 then raise exception 'HARNESS-FAIL D: multi moved a visit from A to C: %', n; end if;
  n := pg_temp.try(multi, format('update clinic_visits set clinic_id = %L where id = %L', b, va));
  if n <> 1 then raise exception 'HARNESS-FAIL D: multi moving A->B (both theirs) gave %', n; end if;
  update clinic_visits set clinic_id = a where id = va;
  n := pg_temp.try(legacy, format('insert into clinic_visits (resident_id, clinic_id, appointment_date) values (%L, %L, now())', ra, b));
  if n <> -1 then raise exception 'HARNESS-FAIL D: legacy vet booking at B gave %', n; end if;
  -- prescriptions follow their visit's clinic
  n := pg_temp.try(multi, format('insert into prescriptions (resident_id, medication_id, start_date, clinic_visit_id) values (%L, (select id from medication limit 1), current_date, %L)', rb, vb));
  if n <> 1 then raise exception 'HARNESS-FAIL D: multi prescribing on B''s visit gave %', n; end if;
  n := pg_temp.try(multi, format('insert into prescriptions (resident_id, medication_id, start_date, clinic_visit_id) values (%L, (select id from medication limit 1), current_date, %L)', rc, vc));
  if n >= 0 then raise exception 'HARNESS-FAIL D: multi prescribed on C''s visit (%)', n; end if;
  -- the doctor guarantee holds for a vet's own JWT too
  n := pg_temp.try(multi, format('insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_id) values (%L, %L, now(), %L)', ra, a, dy));
  if n >= 0 then raise exception 'HARNESS-FAIL D: multi booked at A with B-only doctor (%)', n; end if;
  n := pg_temp.try(multi, format('insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_id) values (%L, %L, now(), %L)', ra, b, dm));
  if n <> 1 then raise exception 'HARNESS-FAIL D: multi booking at B with the shared doctor gave %', n; end if;
  v_report := v_report || 'D: multi writes A and B, refused at C (insert/update/delete/move/prescription), legacy refused at B, doctor guarantee under vet JWT | ';

  ----------------------------------------------------------------- E
  update doctors set user_id = null where id = dm;
  n := pg_temp.try(stf, format('update doctors set user_id = %L where id = %L', multi, dm));
  -- refused either way: an error from the login trigger (-1) or, since 0147, no row visible to update (0)
  if n not in (-1, 0) then raise exception 'HARNESS-FAIL E: staff set a doctor''s login: %', n; end if;
  n := pg_temp.try(mgmt, format('update doctors set user_id = %L where id = %L', multi, dm));
  if n <> -1 then raise exception 'HARNESS-FAIL E: management set a login: %', n; end if;
  n := pg_temp.try(legacy, format('update doctors set user_id = %L where id = %L', legacy, dx));
  if n <> -1 then raise exception 'HARNESS-FAIL E: a vet linked themselves to a doctor (%)', n; end if;
  n := pg_temp.try(adm, format('update doctors set user_id = %L where id = %L', multi, dm), 'aal1');
  if n <> -1 then raise exception 'HARNESS-FAIL E: an admin at aal1 set a login: %', n; end if;
  n := pg_temp.try(adm, format('update doctors set user_id = %L where id = %L', multi, dm), 'aal2');
  if n <> 1 then raise exception 'HARNESS-FAIL E: an admin at aal2 could not set a login: %', n; end if;
  n := pg_temp.try(adm, format('update doctors set user_id = %L where id = %L', multi, dx), 'aal2');
  if n <> -4 then raise exception 'HARNESS-FAIL E: one login given to two doctors: %', n; end if;
  n := pg_temp.try(stf, format('insert into doctors (clinic_id, name, user_id) values (%L, ''Harness Dr Sneaky'', %L)', a, legacy));
  if n <> -1 then raise exception 'HARNESS-FAIL E: staff inserted a doctor with a login: %', n; end if;
  v_report := v_report || 'E: login set only by admin@aal2, unique per login | ';

  ----------------------------------------------------------------- F
  insert into doctors (clinic_id, name) values (c, 'Harness Dr Cee') returning id into v_new;   -- works only at C
  n := pg_temp.try(multi, format('insert into doctor_clinics (clinic_id, doctor_id) values (%L, %L)', c, dm));
  if n <> -1 then raise exception 'HARNESS-FAIL F: multi linked their own doctor to C: %', n; end if;
  n := pg_temp.try(multi, format('insert into doctor_clinics (clinic_id, doctor_id) values (%L, %L)', a, v_new));
  if n <> -1 then raise exception 'HARNESS-FAIL F: multi took C-only Dr Cee into A: %', n; end if;
  n := pg_temp.try(multi, format('update doctors set name = ''Hijack'' where id = %L', v_new));
  if n <> 0 then raise exception 'HARNESS-FAIL F: multi renamed % of C-only doctors', n; end if;
  n := pg_temp.try(multi, format('update doctors set name = ''Harness Dr Multi'' where id = %L', dm));
  if n <> 1 then raise exception 'HARNESS-FAIL F: multi editing their own doctor gave %', n; end if;
  n := pg_temp.try(multi, format('update doctor_clinics set clinic_id = %L where doctor_id = %L and clinic_id = %L', c, dm, a));
  if n >= 0 then raise exception 'HARNESS-FAIL F: multi moved their link to C (%)', n; end if;
  n := pg_temp.try(multi, 'insert into doctors (clinic_id, name) values (' || quote_literal(a) || ', ''Harness Dr Fresh'')');
  if n <> 1 then raise exception 'HARNESS-FAIL F: multi listing a new doctor at A gave %', n; end if;
  n := pg_temp.try(multi, 'insert into doctors (clinic_id, name) values (' || quote_literal(c) || ', ''Harness Dr Fresh C'')');
  if n <> -1 then raise exception 'HARNESS-FAIL F: multi listing a doctor at C gave %', n; end if;
  n := pg_temp.try(stf, format('insert into doctor_clinics (clinic_id, doctor_id) values (%L, %L)', c, dm));
  if n <> -1 then raise exception 'HARNESS-FAIL F: staff widened a login-linked doctor''s clinics: %', n; end if;
  n := pg_temp.try(stf, format('delete from doctor_clinics where doctor_id = %L and clinic_id = %L', dm, a));
  if n <> 0 then raise exception 'HARNESS-FAIL F: staff removed a login-linked doctor''s link: %', n; end if;
  update doctors set name = 'Harness Dr Multi C' where name = 'Harness Dr Multi' and id <> dm;   -- the C listing, until it is merged in G
  n := pg_temp.try(adm, format('insert into doctor_clinics (clinic_id, doctor_id) values (%L, %L)', c, dm));
  if n <> 1 then raise exception 'HARNESS-FAIL F: admin could not widen a login-linked doctor: %', n; end if;
  if pg_temp.scalar(multi, format('select count(*) from residents where id = %L', rc)) <> '1' then
    raise exception 'HARNESS-FAIL F: after admin added C, multi should see C''s resident'; end if;
  delete from doctor_clinics where doctor_id = dm and clinic_id = c;
  n := pg_temp.try(stf, format('insert into doctor_clinics (clinic_id, doctor_id) values (%L, %L)', c, dx));
  if n <> 1 then raise exception 'HARNESS-FAIL F: staff linking a loginless doctor gave %', n; end if;
  v_report := v_report || 'F: no vet/staff widening of a vet''s reach; admin can, and the vet then sees C | ';

  ----------------------------------------------------------------- G
  -- the same person listed at A and at C under one name: merge across clinics
  select id into dz from doctors where name = 'Harness Dr Multi C' limit 1;   -- the one added at C
  if dz is null then raise exception 'HARNESS-FAIL G: no second Dr Multi to merge'; end if;
  -- dm has a login: staff cannot merge it, an admin can
  n := pg_temp.try(stf, format('select merge_doctors(%L, %L)', dz, dm));
  if n <> -1 then raise exception 'HARNESS-FAIL G: staff merged a doctor who has a login: %', n; end if;
  n := pg_temp.try(adm, format('select merge_doctors(%L, %L)', dz, dm));
  if n <> 1 then raise exception 'HARNESS-FAIL G: admin merge gave %', n; end if;
  if exists (select 1 from doctors where id = dz) then raise exception 'HARNESS-FAIL G: merged-away doctor still exists'; end if;
  if not exists (select 1 from doctor_clinics where doctor_id = dm and clinic_id = c) then raise exception 'HARNESS-FAIL G: link to C did not follow the merge'; end if;
  if exists (select 1 from clinic_visits where doctor_id = dz) then raise exception 'HARNESS-FAIL G: visits still point at the merged-away doctor'; end if;
  if (select doctor_id from clinic_visits where resident_id = rc and clinic_id = c and doctor_id = dm limit 1) is null then raise exception 'HARNESS-FAIL G: C''s visit did not move to the surviving doctor'; end if;
  if pg_temp.scalar(multi, format('select count(*) from residents where id = %L', rc)) <> '1' then
    raise exception 'HARNESS-FAIL G: the merge added C to multi''s clinics, so C''s resident should be visible'; end if;
  -- login transfers from the loser to the survivor; two logins never merge
  update doctors set user_id = null where id = dm;
  update doctors set user_id = null where user_id = legacy;   -- the back-filled doctor gives the login up
  insert into doctors (id, clinic_id, name, user_id) values (dz, a, 'Harness Dr Twin', legacy);
  n := pg_temp.try(adm, format('select merge_doctors(%L, %L)', dz, dm));
  if n <> 1 then raise exception 'HARNESS-FAIL G: merging a login-bearing doctor into a loginless one gave %', n; end if;
  if (select user_id from doctors where id = dm) is distinct from legacy then raise exception 'HARNESS-FAIL G: the login did not follow the merge'; end if;
  insert into doctors (id, clinic_id, name, user_id) values (dz, a, 'Harness Dr Twin 2', nolink);
  n := pg_temp.try(adm, format('select merge_doctors(%L, %L)', dz, dm));
  if n <> -2 then raise exception 'HARNESS-FAIL G: two logins were merged: %', n; end if;
  -- the usual case: one person listed under one name at two clinics
  delete from doctors where id = dz;
  insert into doctors (id, clinic_id, name) values (dz, c, 'Harness Dr Same');
  insert into doctors (clinic_id, name) values (b, 'Harness Dr Same') returning id into v_new;
  insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_id) values (rc, c, now(), dz);
  -- since 0147 staff, who hold no clinics.doctors cell, are refused; management merges
  n := pg_temp.try(stf, format('select merge_doctors(%L, %L)', dz, v_new));
  if n <> -4 then raise exception 'HARNESS-FAIL G: staff merged doctors: %', n; end if;
  n := pg_temp.try(mgmt, format('select merge_doctors(%L, %L)', dz, v_new));
  if n <> 1 then raise exception 'HARNESS-FAIL G: merging identical names across clinics gave %', n; end if;
  if (select count(*) from doctor_clinics where doctor_id = v_new) <> 2
     or not exists (select 1 from clinic_visits where clinic_id = c and doctor_id = v_new) then
    raise exception 'HARNESS-FAIL G: identical-name merge did not leave one person at B and C with the visit'; end if;
  v_report := v_report || 'G: cross-clinic merge moves links, visits and login; staff refused on a login, two logins refused | ';

  ----------------------------------------------------------------- H
  -- the back-fill: the legacy login got a doctor, linked to it and to A
  if not exists (select 1 from doctors d join doctor_clinics l on l.doctor_id = d.id
                  where d.name = 'Harness legacy' and l.clinic_id = a and l.active)
  then raise exception 'HARNESS-FAIL H: the legacy login was not back-filled with a doctor at A'; end if;
  if exists (select 1 from information_schema.columns where table_name = 'user_roles' and column_name = 'clinic_id') then
    raise exception 'HARNESS-FAIL H: user_roles.clinic_id still exists'; end if;
  if to_regprocedure('current_user_vet_id()') is not null then
    raise exception 'HARNESS-FAIL H: current_user_vet_id() still exists'; end if;
  if exists (select 1 from pg_constraint where conname = 'user_roles_vet_id_only_for_vets')
     or exists (select 1 from pg_trigger where tgname = 'user_roles_clear_vet_id') then
    raise exception 'HARNESS-FAIL H: the old check or trigger survived'; end if;
  select count(*) into k from (
    select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prosrc ~ 'current_user_vet_id[[:space:]]*[(]'
    union all select policyname from pg_policies
     where coalesce(qual, '') || coalesce(with_check, '') ~ 'current_user_vet_id[[:space:]]*[(]'
    union all select viewname from pg_views where schemaname = 'public' and definition ~ 'current_user_vet_id[[:space:]]*[(]'
  ) x;
  if k <> 0 then raise exception 'HARNESS-FAIL H: % function/policy/view still reference current_user_vet_id()', k; end if;
  select count(*) into v_before from audit_log where table_name = 'clinic_visits' and row_id = va;
  update clinic_visits set notes = 'audit once' where id = va;
  select count(*) into v_after from audit_log where table_name = 'clinic_visits' and row_id = va;
  if v_after - v_before <> 1 then raise exception 'HARNESS-FAIL H: one visit update wrote % audit rows', v_after - v_before; end if;
  v_report := v_report || 'H: legacy login back-filled, column/check/trigger/singular function gone, no catalogue caller, one audit row per visit change';

  raise exception '%', format('HARNESS-OK %s ran twice | %s', ${JSON.stringify(file).replace(/"/g, "'")}, v_report);
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
