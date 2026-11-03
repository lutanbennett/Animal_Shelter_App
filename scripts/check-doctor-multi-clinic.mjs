// Doctors who work at more than one clinic, and the doctor logins attached to
// them, asserted against the LIVE schema on DEV. One transaction: fixtures,
// assertions through real JWTs and RLS, then a deliberate `raise exception`
// carrying the evidence, so nothing can commit.
//
//   node scripts/check-doctor-multi-clinic.mjs     (from the repo root; dev only)
//
// It used to replay 0127 (*_drop_user_roles_vet_id.sql) twice. 0172 renamed every
// table, column and function that file names (vets -> clinics, vet_doctors ->
// doctors, the vet role -> doctor) and dropped doctors' clinic column, so a replay
// cannot run; it asserts the live schema instead
// (docs/decisions/2026-10-02-replay-or-assert-live.md). The one assertion only a
// replay could make, that 0127 back-filled a legacy login with a doctor, went
// with it; the "single" login below is what that back-fill produced.
//
// Fixtures: clinics A, B, C; residents rA / rB / rC with one visit each at
// that clinic; a doctor login "multi" linked to a doctor who works at A and B;
// a doctor login "single" whose doctor works only at A; a doctor login
// with no doctor; admin, management, and "clerk": a custom role on the management enum holding the
// retired Staff role's cells (no clinics.doctors), the shape 0147 refuses a merge to. A doctor is two rows since 0172:
// doctors {name, user_id?}, then a doctor_clinics link per clinic.
//
//   A  the moved guarantee: a visit whose doctor does not work at its clinic
//      is refused (insert, update, by id, by typed name never mismatches);
//      a link a visit uses cannot be deleted; an unused one can; a doctor
//      marked no longer there keeps their past visits; doctors has no clinic column
//   B  one spelling per clinic: a clash on a new doctor's link, on rename, on a
//      new link; the same name at two clinics stays two people (not merged by name)
//   C  no per-clinic reach (0264): current_user_clinic_ids() is {} for every login, and residents follow
//      resident.record alone, linked to a clinic or not
//   D  visits follow visit.book (insert) and medical.visits (update) with no clinic term; the doctor-at-clinic
//      guarantee is a foreign key, so it holds under any login's JWT
//   E  a doctor's login: only an admin at aal2 sets it; unique both ways
//   F  doctors and doctor_clinics are written with clinics.doctors and no clinic term (0182); a login-linked
//      doctor's links stay admin-only
//   G  merge_doctors across clinics: links, visits and login follow
//   H  user_roles.clinic_id, its check, current_user_vet_id() and (0172)
//      current_user_vet_ids() are gone and nothing in the catalogue calls them;
//      audit_log writes once per change
//
//
// REWRITTEN 2026-11-03 (docs/decisions/2026-11-03-clinic-harness-rewrite.md): C, D and F asserted the
// retired per-clinic model (0108/0110) and are now card-shaped; the actors hold harness roles with exactly
// the cells under test instead of borrowing the real doctor and management roles. A had been failing (-1)
// for a different reason: moving a visit re-resolves the typed doctor name at the new clinic and ADDS a
// doctor there, which asks clinics.doctors; the real management role did not hold it on dev.
//
// Exits 0 when every assertion held.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const { runHarness } = await import(pathToFileURL(join(root, "scripts/lib/rollback-harness.mjs")).href);
const { exitWith } = await import(pathToFileURL(join(root, "scripts/lib/exit.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

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
  'multi', 'single', 'nolink', 'admin', 'mgmt', 'clerk', 'ds',
  'ca', 'cb', 'cc', 'ra', 'rb', 'rc', 'va', 'vb', 'vc',
  'dm', 'dx', 'dy', 'dz']) w;
grant select on harness_ids to authenticated;
create function pg_temp.hid(p text) returns uuid language sql as $f$ select id from harness_ids where who = p $f$;

do $setup$
declare
  r record;
  a uuid := pg_temp.hid('ca'); b uuid := pg_temp.hid('cb'); c uuid := pg_temp.hid('cc');
begin
  insert into clinics (id, name) values (a, 'Harness clinic A'), (b, 'Harness clinic B'), (c, 'Harness clinic C');
  for r in select * from harness_ids where who in ('multi', 'single', 'nolink', 'admin', 'mgmt', 'clerk') loop
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (r.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-multi-' || r.who || '-' || r.id || '@example.invalid',
            '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || r.who), now(), now());
  end loop;
  -- Card-shaped actors (2026-11-03): no real role is borrowed, because what a role holds changes. 'mgmt' holds
  -- the cells that book, edit visits, list clinics and add/merge doctors; the doctor logins hold the booking
  -- cells and read the clinics list but NOT clinics.doctors; admin is the real admin (outside the card system).
  insert into roles (key, name, kind) values ('harness_multi_mgmt', 'Harness mgmt cells', 'custom'), ('harness_multi_doclogin', 'Harness doctor-login cells', 'custom');
  insert into role_permissions (role_id, activity, level)
    select (select id from roles where key = 'harness_multi_mgmt'), x.a, x.l from (values ('visit.book', 2), ('medical.visits', 2), ('medical.prescriptions', 2), ('resident.record', 2), ('clinics.list', 2), ('clinics.doctors', 2)) x(a, l)
    union all
    select (select id from roles where key = 'harness_multi_doclogin'), x.a, x.l from (values ('visit.book', 2), ('medical.visits', 2), ('medical.prescriptions', 2), ('resident.record', 1), ('clinics.list', 1)) x(a, l);
  insert into user_roles (user_id, role_id)
  select v.c0, ro.id from (values (pg_temp.hid('multi'), 'harness_multi_doclogin'), (pg_temp.hid('single'), 'harness_multi_doclogin'), (pg_temp.hid('nolink'), 'harness_multi_doclogin'), (pg_temp.hid('admin'), 'admin'), (pg_temp.hid('mgmt'), 'harness_multi_mgmt')) as v(c0, role_key)
  join roles ro on ro.key = v.role_key;
  -- clerk: Staff was this login until 0173 retired it; a custom role carrying its cells reaches the same path
  insert into roles (key, name, kind) values ('harness_multi_clerk', 'Harness clerk', 'custom');
  insert into role_permissions (role_id, activity, level)
    select (select id from roles where key = 'harness_multi_clerk'), rp.activity, rp.level
      from role_permissions rp join roles s on s.id = rp.role_id where s.key = 'staff';
  insert into user_roles (user_id, role_id)
  select pg_temp.hid('clerk'), id from roles where key = 'harness_multi_clerk';
  -- single: a doctor login whose doctor works only at A (owner context, so the login guard lets it through)
  insert into doctors (id, name, user_id) values (pg_temp.hid('ds'), 'Harness single', pg_temp.hid('single'));
  insert into doctor_clinics (clinic_id, doctor_id) values (a, pg_temp.hid('ds'));

  insert into residents (id, name, species) values
    (pg_temp.hid('ra'), 'Harness rA', 'Dog'), (pg_temp.hid('rb'), 'Harness rB', 'Dog'), (pg_temp.hid('rc'), 'Harness rC', 'Dog');
  insert into clinic_visits (id, resident_id, clinic_id, appointment_date, status) values
    (pg_temp.hid('va'), pg_temp.hid('ra'), a, now() - interval '3 days', 'completed'),
    (pg_temp.hid('vb'), pg_temp.hid('rb'), b, now() - interval '3 days', 'completed'),
    (pg_temp.hid('vc'), pg_temp.hid('rc'), c, now() - interval '3 days', 'completed');
end $setup$;

do $h$
declare
  a uuid := pg_temp.hid('ca'); b uuid := pg_temp.hid('cb'); c uuid := pg_temp.hid('cc');
  multi uuid := pg_temp.hid('multi'); single uuid := pg_temp.hid('single'); nolink uuid := pg_temp.hid('nolink');
  adm uuid := pg_temp.hid('admin'); mgmt uuid := pg_temp.hid('mgmt'); clerk uuid := pg_temp.hid('clerk');
  ra uuid := pg_temp.hid('ra'); rb uuid := pg_temp.hid('rb'); rc uuid := pg_temp.hid('rc');
  va uuid := pg_temp.hid('va'); vb uuid := pg_temp.hid('vb'); vc uuid := pg_temp.hid('vc');
  dm uuid := pg_temp.hid('dm'); dx uuid := pg_temp.hid('dx'); dy uuid := pg_temp.hid('dy'); dz uuid := pg_temp.hid('dz');
  n bigint; t text; k int; v_new uuid; v_fresh uuid; v_before int; v_after int;
  v_report text := '';
begin
  ----------------------------------------------------------------- A
  -- dm: works at A and B and is multi's own doctor. dx: A only. dy: B only.
  insert into doctors (id, name) values (dm, 'Harness Dr Multi'), (dx, 'Harness Dr X'), (dy, 'Harness Dr Y');
  insert into doctor_clinics (clinic_id, doctor_id) values (a, dm), (b, dm), (a, dx), (b, dy);
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'doctors' and column_name in ('clinic_id', 'vet_id')) then
    raise exception 'HARNESS-FAIL A: doctors still has a clinic column (0172 dropped it)'; end if;

  -- by id, as the table owner: a doctor from another clinic is refused
  begin
    insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_id) values (ra, a, now(), dy);
    raise exception 'HARNESS-FAIL A: visit at A accepted dy, who works only at B';
  exception when foreign_key_violation then null; end;
  insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_id) values (ra, b, now(), dm);
  insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_id) values (ra, a, now(), dm);
  -- ... and through a role that bypasses nothing
  n := pg_temp.try(mgmt, format('insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_id) values (%L, %L, now(), %L)', ra, a, dy));
  if n <> -3 then raise exception 'HARNESS-FAIL A: management booking a wrong-clinic doctor gave %', n; end if;
  -- an update that moves a visit to a clinic its doctor is not at, or swaps the doctor
  insert into clinic_visits (id, resident_id, clinic_id, appointment_date, doctor_id) values (gen_random_uuid(), ra, b, now(), dy) returning id into v_new;
  n := pg_temp.try(mgmt, format('update clinic_visits set clinic_id = %L where id = %L', a, v_new));
  -- 0102 behaviour: moving a visit re-resolves the typed name at the new clinic
  -- (finds or adds that clinics own doctor), so it never keeps a doctor from elsewhere.
  if n <> 1 or exists (
       select 1 from clinic_visits x
        where x.id = v_new and (x.doctor_id = dy or not exists (
          select 1 from doctor_clinics l where l.doctor_id = x.doctor_id and l.clinic_id = x.clinic_id)))
  then raise exception 'HARNESS-FAIL A: moving a visit left it with a doctor who is not at its new clinic (%)', n; end if;
  insert into clinic_visits (id, resident_id, clinic_id, appointment_date, doctor_id) values (gen_random_uuid(), rb, b, now(), dy) returning id into v_new;
  n := pg_temp.try(mgmt, format('update clinic_visits set doctor_id = %L where id = %L', dx, v_new));
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
  -- the clash is on the LINK (doctor_clinics' (clinic_id, name_key)), as the app sees it
  begin
    insert into doctors (name) values ('  HARNESS dr   x ') returning id into v_fresh;
    insert into doctor_clinics (clinic_id, doctor_id) values (a, v_fresh);
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

  ----------------------------------------------------------------- C (0264: no per-clinic reach)
  -- 0108 narrowed a doctor login's reach to its clinics; 0264 made current_user_clinic_ids() a constant '{}' and
  -- dropped every doctor_*_clinic policy. What a login sees is now decided by its cards alone (resident.record).
  update doctors set user_id = multi where id = dm;   -- owner context: no auth.uid(), so the login guard lets it through
  if pg_temp.scalar(multi, 'select current_user_clinic_ids()::text') is distinct from '{}' then
    raise exception 'HARNESS-FAIL C: multi''s clinics are %', pg_temp.scalar(multi, 'select current_user_clinic_ids()::text'); end if;
  if pg_temp.scalar(single, 'select current_user_clinic_ids()::text') is distinct from '{}' then
    raise exception 'HARNESS-FAIL C: single''s clinics are %', pg_temp.scalar(single, 'select current_user_clinic_ids()::text'); end if;
  if pg_temp.scalar(nolink, 'select current_user_clinic_ids()::text') is distinct from '{}' then
    raise exception 'HARNESS-FAIL C: unlinked doctor login has clinics %', pg_temp.scalar(nolink, 'select current_user_clinic_ids()::text'); end if;
  if pg_temp.scalar(mgmt, 'select current_user_clinic_ids()::text') is distinct from '{}' then
    raise exception 'HARNESS-FAIL C: management has doctor clinics'; end if;

  -- the same card gives every login the same reach, linked to a clinic or not
  foreach t in array array['multi', 'single', 'nolink'] loop
    if pg_temp.scalar(pg_temp.hid(t), format('select count(*) from residents where id in (%L, %L, %L)', ra, rb, rc)) <> '3' then
      raise exception 'HARNESS-FAIL C: % holding resident.record read does not see all three residents', t; end if;
  end loop;
  if pg_temp.scalar(multi, format('select count(*) from resident_current_state where resident_id = %L', rc)) <> '1' then
    raise exception 'HARNESS-FAIL C: multi cannot see C''s resident through the view'; end if;
  -- ... an inactive link changes nothing about what is seen
  update doctor_clinics set active = false where doctor_id = dm and clinic_id = b;
  if pg_temp.scalar(multi, format('select count(*) from residents where id in (%L, %L, %L)', ra, rb, rc)) <> '3' then
    raise exception 'HARNESS-FAIL C: an inactive link narrowed what multi sees'; end if;
  update doctor_clinics set active = true where doctor_id = dm and clinic_id = b;
  -- ... and without the card nothing is seen, however many clinics the doctor works at
  delete from user_roles where user_id = nolink;
  if pg_temp.scalar(nolink, format('select count(*) from residents where id in (%L, %L, %L)', ra, rb, rc)) <> '0' then
    raise exception 'HARNESS-FAIL C: a login with no cards sees residents'; end if;
  insert into user_roles (user_id, role_id) select nolink, id from roles where key = 'harness_multi_doclogin';
  v_report := v_report || 'C: current_user_clinic_ids() is {} for every login, residents follow resident.record alone (multi, single and unlinked all see A, B and C), a login with no cards sees none | ';

  ----------------------------------------------------------------- D (0264: visits follow visit.book / medical.visits)
  -- insert asks visit.book, update asks medical.visits, and neither asks which clinic. No delete policy exists.
  n := pg_temp.try(multi, format('insert into clinic_visits (resident_id, clinic_id, appointment_date) values (%L, %L, now())', ra, a));
  if n <> 1 then raise exception 'HARNESS-FAIL D: multi booking at A gave %', n; end if;
  n := pg_temp.try(multi, format('insert into clinic_visits (resident_id, clinic_id, appointment_date) values (%L, %L, now())', rb, b));
  if n <> 1 then raise exception 'HARNESS-FAIL D: multi booking at B gave %', n; end if;
  n := pg_temp.try(multi, format('insert into clinic_visits (resident_id, clinic_id, appointment_date) values (%L, %L, now())', ra, c));
  if n <> 1 then raise exception 'HARNESS-FAIL D: booking at C, where multi''s doctor does not work, gave % (visit.book alone decides)', n; end if;
  n := pg_temp.try(single, format('insert into clinic_visits (resident_id, clinic_id, appointment_date) values (%L, %L, now())', ra, b));
  if n <> 1 then raise exception 'HARNESS-FAIL D: single booking at B gave %', n; end if;
  n := pg_temp.try(multi, format('update clinic_visits set notes = ''x'' where id = %L', vc));
  if n <> 1 then raise exception 'HARNESS-FAIL D: multi updating C''s visit gave % (medical.visits alone decides)', n; end if;
  n := pg_temp.try(multi, format('update clinic_visits set clinic_id = %L where id = %L', c, va));
  if n <> 1 then raise exception 'HARNESS-FAIL D: multi moving A->C gave %', n; end if;
  update clinic_visits set clinic_id = a where id = va;
  n := pg_temp.try(multi, format('delete from clinic_visits where id = %L', vc));
  if n <> 0 then raise exception 'HARNESS-FAIL D: multi deleted % visits (no delete policy exists)', n; end if;
  -- a login holding neither booking card
  delete from user_roles where user_id = nolink;
  n := pg_temp.try(nolink, format('insert into clinic_visits (resident_id, clinic_id, appointment_date) values (%L, %L, now())', ra, a));
  if n <> -1 then raise exception 'HARNESS-FAIL D: a login without visit.book booked: %', n; end if;
  n := pg_temp.try(nolink, format('update clinic_visits set notes = ''x'' where id = %L', va));
  if n <> 0 then raise exception 'HARNESS-FAIL D: a login without medical.visits updated % visits', n; end if;
  insert into user_roles (user_id, role_id) select nolink, id from roles where key = 'harness_multi_doclogin';
  -- prescriptions follow medical.prescriptions, not the visit's clinic (medication id read as the owner: the login need not read the list)
  n := pg_temp.try(multi, format('insert into prescriptions (resident_id, medication_id, start_date, clinic_visit_id) values (%L, %L, current_date, %L)', rb, (select id from medication limit 1), vb));
  if n <> 1 then raise exception 'HARNESS-FAIL D: multi prescribing on B''s visit gave %', n; end if;
  -- the doctor guarantee is a foreign key, not a card: it holds for a doctor login's own JWT too
  n := pg_temp.try(multi, format('insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_id) values (%L, %L, now(), %L)', ra, a, dy));
  if n >= 0 then raise exception 'HARNESS-FAIL D: multi booked at A with B-only doctor (%)', n; end if;
  n := pg_temp.try(multi, format('insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_id) values (%L, %L, now(), %L)', ra, b, dm));
  if n <> 1 then raise exception 'HARNESS-FAIL D: multi booking at B with the shared doctor gave %', n; end if;
  v_report := v_report || 'D: insert asks visit.book and update asks medical.visits with no clinic term (multi and single book and edit at any clinic, including one their doctor does not work at, and move a visit), no delete, no cards no booking, doctor guarantee still a foreign key | ';

  ----------------------------------------------------------------- E
  update doctors set user_id = null where id = dm;
  n := pg_temp.try(mgmt, format('update doctors set user_id = %L where id = %L', multi, dm));
  -- refused either way: an error from the login trigger (-1) or, since 0147, no row visible to update (0)
  if n not in (-1, 0) then raise exception 'HARNESS-FAIL E: management set a doctor''s login: %', n; end if;
  n := pg_temp.try(mgmt, format('update doctors set user_id = %L where id = %L', multi, dm));
  if n <> -1 then raise exception 'HARNESS-FAIL E: management set a login: %', n; end if;
  n := pg_temp.try(single, format('update doctors set user_id = %L where id = %L', single, dx));
  if n not in (-1, 0) then raise exception 'HARNESS-FAIL E: a doctor login linked itself to another doctor (%)', n; end if;  -- 0: no clinics.doctors, so doctors_update_perm shows it no row
  n := pg_temp.try(adm, format('update doctors set user_id = %L where id = %L', multi, dm), 'aal1');
  if n <> -1 then raise exception 'HARNESS-FAIL E: an admin at aal1 set a login: %', n; end if;
  n := pg_temp.try(adm, format('update doctors set user_id = %L where id = %L', multi, dm), 'aal2');
  if n <> 1 then raise exception 'HARNESS-FAIL E: an admin at aal2 could not set a login: %', n; end if;
  n := pg_temp.try(adm, format('update doctors set user_id = %L where id = %L', multi, dx), 'aal2');
  if n <> -4 then raise exception 'HARNESS-FAIL E: one login given to two doctors: %', n; end if;
  n := pg_temp.try(mgmt, format('insert into doctors (name, user_id) values (''Harness Dr Sneaky'', %L)', single));
  if n <> -1 then raise exception 'HARNESS-FAIL E: management inserted a doctor with a login: %', n; end if;
  v_report := v_report || 'E: login set only by admin@aal2, unique per login | ';

  ----------------------------------------------------------------- F (0182: doctors are written with clinics.doctors, never by clinic)
  -- A doctor login used to be fenced to its own clinics when it edited the list. Every doctors / doctor_clinics
  -- write now asks clinics.doctors and nothing about clinics. 'multi' does not hold it; 'mgmt' does.
  insert into doctors (name) values ('Harness Dr Cee') returning id into v_new;   -- works only at C
  insert into doctor_clinics (clinic_id, doctor_id) values (c, v_new);
  n := pg_temp.try(multi, format('insert into doctor_clinics (clinic_id, doctor_id) values (%L, %L)', c, dm));
  if n <> -1 then raise exception 'HARNESS-FAIL F: multi, without clinics.doctors, linked their own doctor to C: %', n; end if;
  n := pg_temp.try(multi, format('insert into doctor_clinics (clinic_id, doctor_id) values (%L, %L)', a, v_new));
  if n <> -1 then raise exception 'HARNESS-FAIL F: multi, without clinics.doctors, took Dr Cee into A: %', n; end if;
  n := pg_temp.try(multi, format('update doctors set name = ''Hijack'' where id = %L', v_new));
  if n <> 0 then raise exception 'HARNESS-FAIL F: multi, without clinics.doctors, renamed % doctors', n; end if;
  n := pg_temp.try(multi, format('update doctors set name = ''Harness Dr Multi'' where id = %L', dm));
  if n <> 0 then raise exception 'HARNESS-FAIL F: multi, without clinics.doctors, edited their own doctor: %', n; end if;
  n := pg_temp.try(multi, format('insert into doctors (id, name) values (%L, ''Harness Dr Fresh'')', gen_random_uuid()));
  if n <> -1 then raise exception 'HARNESS-FAIL F: multi, without clinics.doctors, added a doctor: %', n; end if;
  -- holding clinics.doctors, the clinic is not part of the answer: a doctor is listed at any clinic
  v_fresh := gen_random_uuid();
  n := pg_temp.try(mgmt, format('insert into doctors (id, name) values (%L, ''Harness Dr Fresh'')', v_fresh));
  if n <> 1 then raise exception 'HARNESS-FAIL F: mgmt adding a new doctor gave %', n; end if;
  n := pg_temp.try(mgmt, format('insert into doctor_clinics (clinic_id, doctor_id) values (%L, %L)', a, v_fresh));
  if n <> 1 then raise exception 'HARNESS-FAIL F: mgmt listing the new doctor at A gave %', n; end if;
  n := pg_temp.try(mgmt, format('insert into doctor_clinics (clinic_id, doctor_id) values (%L, %L)', c, v_fresh));
  if n <> 1 then raise exception 'HARNESS-FAIL F: mgmt listing the doctor at C as well gave %', n; end if;
  -- the one guard that is not a card: a doctor who has a login keeps its clinics unless an admin changes them
  n := pg_temp.try(mgmt, format('insert into doctor_clinics (clinic_id, doctor_id) values (%L, %L)', c, dm));
  if n <> -1 then raise exception 'HARNESS-FAIL F: management widened a login-linked doctor''s clinics: %', n; end if;
  n := pg_temp.try(mgmt, format('delete from doctor_clinics where doctor_id = %L and clinic_id = %L', dm, a));
  if n <> 0 then raise exception 'HARNESS-FAIL F: management removed a login-linked doctor''s link: %', n; end if;
  update doctors set name = 'Harness Dr Multi C' where name = 'Harness Dr Multi' and id <> dm;   -- the C listing, until it is merged in G
  n := pg_temp.try(adm, format('insert into doctor_clinics (clinic_id, doctor_id) values (%L, %L)', c, dm));
  if n <> 1 then raise exception 'HARNESS-FAIL F: admin could not widen a login-linked doctor: %', n; end if;
  delete from doctor_clinics where doctor_id = dm and clinic_id = c;
  n := pg_temp.try(mgmt, format('insert into doctor_clinics (clinic_id, doctor_id) values (%L, %L)', c, dx));
  if n <> 1 then raise exception 'HARNESS-FAIL F: management linking a loginless doctor gave %', n; end if;
  v_report := v_report || 'F: doctor writes ask clinics.doctors with no clinic term (without it multi is refused everywhere, with it mgmt lists a doctor at any clinic); a login-linked doctor''s links only an admin changes (and a widened link changes what multi sees: nothing) | ';

  ----------------------------------------------------------------- G
  -- the same person listed at A and at C under one name: merge across clinics
  select id into dz from doctors where name = 'Harness Dr Multi C' limit 1;   -- the one added at C
  if dz is null then raise exception 'HARNESS-FAIL G: no second Dr Multi to merge'; end if;
  -- dm has a login: management cannot merge it, an admin can
  n := pg_temp.try(mgmt, format('select merge_doctors(%L, %L)', dz, dm));
  if n <> -1 then raise exception 'HARNESS-FAIL G: management merged a doctor who has a login: %', n; end if;
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
  update doctors set user_id = null where user_id = single;   -- single's doctor gives the login up
  insert into doctors (id, name, user_id) values (dz, 'Harness Dr Twin', single);
  insert into doctor_clinics (clinic_id, doctor_id) values (a, dz);
  n := pg_temp.try(adm, format('select merge_doctors(%L, %L)', dz, dm));
  if n <> 1 then raise exception 'HARNESS-FAIL G: merging a login-bearing doctor into a loginless one gave %', n; end if;
  if (select user_id from doctors where id = dm) is distinct from single then raise exception 'HARNESS-FAIL G: the login did not follow the merge'; end if;
  insert into doctors (id, name, user_id) values (dz, 'Harness Dr Twin 2', nolink);
  insert into doctor_clinics (clinic_id, doctor_id) values (a, dz);
  n := pg_temp.try(adm, format('select merge_doctors(%L, %L)', dz, dm));
  if n <> -2 then raise exception 'HARNESS-FAIL G: two logins were merged: %', n; end if;
  -- the usual case: one person listed under one name at two clinics
  delete from doctors where id = dz;
  insert into doctors (id, name) values (dz, 'Harness Dr Same');
  insert into doctor_clinics (clinic_id, doctor_id) values (c, dz);
  insert into doctors (name) values ('Harness Dr Same') returning id into v_new;
  insert into doctor_clinics (clinic_id, doctor_id) values (b, v_new);
  insert into clinic_visits (resident_id, clinic_id, appointment_date, doctor_id) values (rc, c, now(), dz);
  -- since 0147 a login past the role gate without the clinics.doctors cell is refused (Staff was this probe until
  -- 0173 retired it; now the clerk); management merges
  n := pg_temp.try(clerk, format('select merge_doctors(%L, %L)', dz, v_new));
  if n not in (-1,-4) then raise exception 'HARNESS-FAIL G: the clerk merged doctors: %', n; end if;
  n := pg_temp.try(mgmt, format('select merge_doctors(%L, %L)', dz, v_new));
  if n <> 1 then raise exception 'HARNESS-FAIL G: merging identical names across clinics gave %', n; end if;
  if (select count(*) from doctor_clinics where doctor_id = v_new) <> 2
     or not exists (select 1 from clinic_visits where clinic_id = c and doctor_id = v_new) then
    raise exception 'HARNESS-FAIL G: identical-name merge did not leave one person at B and C with the visit'; end if;
  v_report := v_report || 'G: cross-clinic merge moves links, visits and login; management refused on a login, the clerk (no doctors cell) refused by the function gate (0178), two logins refused | ';

  ----------------------------------------------------------------- H
  if exists (select 1 from information_schema.columns where table_name = 'user_roles' and column_name = 'clinic_id') then
    raise exception 'HARNESS-FAIL H: user_roles.clinic_id still exists'; end if;
  if to_regprocedure('current_user_vet_id()') is not null or to_regprocedure('current_user_vet_ids()') is not null then
    raise exception 'HARNESS-FAIL H: current_user_vet_id() or current_user_vet_ids() still exists'; end if;
  if exists (select 1 from pg_constraint where conname = 'user_roles_vet_id_only_for_vets')
     or exists (select 1 from pg_trigger where tgname = 'user_roles_clear_vet_id') then
    raise exception 'HARNESS-FAIL H: the old check or trigger survived'; end if;
  select count(*) into k from (
    select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prosrc ~ 'current_user_vet_ids?[[:space:]]*[(]'
    union all select policyname from pg_policies
     where coalesce(qual, '') || coalesce(with_check, '') ~ 'current_user_vet_ids?[[:space:]]*[(]'
    union all select viewname from pg_views where schemaname = 'public' and definition ~ 'current_user_vet_ids?[[:space:]]*[(]'
  ) x;
  if k <> 0 then raise exception 'HARNESS-FAIL H: % function/policy/view still reference current_user_vet_id(s)()', k; end if;
  select count(*) into v_before from audit_log where table_name = 'clinic_visits' and row_id = va;
  update clinic_visits set notes = 'audit once' where id = va;
  select count(*) into v_after from audit_log where table_name = 'clinic_visits' and row_id = va;
  if v_after - v_before <> 1 then raise exception 'HARNESS-FAIL H: one visit update wrote % audit rows', v_after - v_before; end if;
  v_report := v_report || 'H: column/check/trigger and both old scope functions gone, no catalogue caller, one audit row per visit change';

  raise exception '%', format('HARNESS-OK doctor multi-clinic, live schema | %s', v_report);
end;
$h$;
rollback;
`;

const ok = await runHarness(ref, env, "doctor-multi-clinic", sql);
await exitWith(ok ? 0 : 1);
