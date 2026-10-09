-- consumer: src/lib/clinics, src/app/clinics, src/app/clinic-visits, src/app/management/clinics
--
-- vet-to-doctor-rename: the word "Vet" leaves the data. (docs/decisions/2026-10-09-clinics-and-doctors.md)
--
-- The model, confirmed by the Director in writing on 2026-10-08 ("Above is correct"):
--   a CLINIC is the place a resident is taken to and a visit is booked with;
--   a DOCTOR is a person who works at a clinic, at one or more of them;
--   a doctor may or may not have a login (at most one each way).
-- The shape was already right (0125, 0127); the names were not. So this file is a rename, plus three changes:
--   1. vets.name and vets.clinic_name fold into one clinic name, and clinic_name goes. A row where both are
--      filled in and DIFFER stops the file: which to keep is Lutan's call, not this file's (see the guard).
--   2. vet_doctors.vet_id, deprecated since 0125 as "first-listed clinic", goes. Every doctor's clinics are
--      their doctor_clinics links; the insert trigger that turned vet_id into a link goes with it.
--   3. What a doctor login SEES widens (Lutan, 2026-10-09, option (c)): every resident with a live clinical
--      record at a clinic the doctor currently works at (as before), PLUS every resident on a visit where this
--      doctor was the doctor, at any clinic, ones they have left included. What a doctor login may CHANGE does
--      not move: still only its current clinics' records (0110). So the old function keeps its body under a new
--      name, current_clinic_resident_ids(), and every write policy keeps calling it; only the SELECT policies
--      move to the new current_doctor_resident_ids(). Clinic-only alone hid a doctor's own patients once they
--      moved clinic; doctor-only alone would hide every visit with no doctor recorded (optional, always), and
--      every patient a colleague saw at the same clinic.
--
-- Renamed:  vets -> clinics, vet_doctors -> doctors, vet_doctor_clinics -> doctor_clinics,
--           vet_appointments -> clinic_visits; vet_id -> clinic_id (clinic_visits, doctor_clinics,
--           bulk_appointments); vet_appointment_id -> clinic_visit_id (prescriptions, procedures, blood_tests,
--           weight); site_content.vet_visit_estimate -> clinic_visit_estimate; view vet_contacts ->
--           doctor_contacts; app_role value 'vet' -> 'doctor' and the roles row with it; every function, trigger,
--           index, constraint and policy whose name said vet.
-- Policies, foreign keys, triggers and indexes point at objects, not names, so the renames carry them. Function
-- BODIES are text and name tables, columns and the 'vet' role, so every body that did is rewritten below.
--
-- Compatibility: views under the four old table names, with the old column names, READ-ONLY, for one release,
-- for anything outside the repo that reads them (an older backup's restore notes, a script on someone's
-- machine). Drop them in the release after next. The app's own code moves in the PR straight after this one.
--
-- audit_log keeps the 24 rows (dev) it holds under 'vet_appointments': it is append-only by trigger, so the
-- app maps the old name when it reads them (src/lib/audit). New rows say 'clinic_visits'.
--
-- Re-runnable: every rename checks first, every function is create-or-replace, every new policy is dropped first.

-- ---------------------------------------------------------------------------------------------------------
-- 0. The compatibility views from an earlier run of this file come out first, so the renames below see tables.
do $$
declare v text;
begin
  foreach v in array array['vets', 'vet_doctors', 'vet_doctor_clinics', 'vet_appointments'] loop
    if exists (select 1 from pg_class where oid = to_regclass('public.' || v) and relkind = 'v') then
      execute format('drop view public.%I', v);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------------------------------------
-- 1. The fold guard. A clinic whose two names both say something, and say different things, stops the file.
do $$
declare v_list text;
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name in ('vets', 'clinics') and column_name = 'clinic_name') then
    execute $q$
      select string_agg(format('%s: name %L, clinic_name %L', id, name, clinic_name), '; ')
        from public.$q$ || (case when to_regclass('public.clinics') is not null then 'clinics' else 'vets' end) || $q$
       where nullif(btrim(clinic_name), '') is not null
         and lower(btrim(name)) is distinct from lower(btrim(clinic_name))
    $q$ into v_list;
    if v_list is not null then
      raise exception 'clinics with two different names, agree which to keep before applying: %', v_list
        using errcode = 'check_violation',
              hint = 'Set name to the one to keep and clinic_name to null on each, then apply again.';
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------------------
-- 2. Tables, then columns.
do $$
declare r record;
begin
  for r in select * from (values
      ('vets', 'clinics'), ('vet_doctors', 'doctors'),
      ('vet_doctor_clinics', 'doctor_clinics'), ('vet_appointments', 'clinic_visits')) t(old, new)
  loop
    if exists (select 1 from pg_class where oid = to_regclass('public.' || r.old) and relkind = 'r')
       and to_regclass('public.' || r.new) is null then
      execute format('alter table public.%I rename to %I', r.old, r.new);
    end if;
  end loop;

  for r in select * from (values
      ('clinic_visits', 'vet_id', 'clinic_id'),
      ('doctor_clinics', 'vet_id', 'clinic_id'),
      ('bulk_appointments', 'vet_id', 'clinic_id'),
      ('prescriptions', 'vet_appointment_id', 'clinic_visit_id'),
      ('procedures', 'vet_appointment_id', 'clinic_visit_id'),
      ('blood_tests', 'vet_appointment_id', 'clinic_visit_id'),
      ('weight', 'vet_appointment_id', 'clinic_visit_id'),
      ('site_content', 'vet_visit_estimate', 'clinic_visit_estimate')) t(tbl, old, new)
  loop
    if exists (select 1 from information_schema.columns
                where table_schema = 'public' and table_name = r.tbl and column_name = r.old) then
      execute format('alter table public.%I rename column %I to %I', r.tbl, r.old, r.new);
    end if;
  end loop;
end $$;

-- The fold. Only an empty name takes clinic_name; the guard above has already refused any real disagreement.
do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'clinics' and column_name = 'clinic_name') then
    update public.clinics set name = btrim(clinic_name)
     where nullif(btrim(name), '') is null and nullif(btrim(clinic_name), '') is not null;
    alter table public.clinics drop column clinic_name;
  end if;
end $$;

comment on table public.clinics is
  'A clinic: the place a resident is taken to and a visit is booked with. Every field but the name is optional — a mobile doctor''s business is a clinic with no address (0172).';
comment on table public.doctors is
  'A person who works at one or more clinics (doctor_clinics). user_id: the login attached to this doctor, if any (0127, 0172).';
comment on table public.doctor_clinics is
  'Which clinics each doctor works at; active = false is a clinic they have left (0125, 0172).';
comment on table public.clinic_visits is
  'A resident''s visit to a clinic. The doctor is optional, always: nothing may make it required (0172).';


-- ---------------------------------------------------------------------------------------------------------
-- 3. Names that said vet: indexes, constraints, triggers and policies, wherever they are.
create or replace function pg_temp.vet_name(p text) returns text language sql immutable as $f$
  select regexp_replace(regexp_replace(regexp_replace(
           replace(replace(replace(replace(replace(p,
             'vet_appointment', 'clinic_visit'),
             'vet_visit', 'clinic_visit'),
             'vet_doctor', 'doctor'),
             'vet_key', 'clinic_key'),
             '_vet_id', '_clinic_id'),
           '^vets_', 'clinics_'),
         '_vets$', '_clinics'),
       '^vet_', 'doctor_');
$f$;

do $$
declare
  r record;
  v_new text;
begin
  -- A constraint's index is renamed with its constraint, so only free-standing indexes here.
  for r in
    select i.relname as name
      from pg_index x
      join pg_class i on i.oid = x.indexrelid
     where i.relnamespace = 'public'::regnamespace and i.relname ~ 'vet'
       and not exists (select 1 from pg_constraint c where c.conindid = x.indexrelid)
  loop
    v_new := pg_temp.vet_name(r.name);
    if v_new <> r.name then
      execute format('alter index public.%I rename to %I', r.name, v_new);
    end if;
  end loop;

  for r in
    select c.conname as name, c.conrelid::regclass as tbl
      from pg_constraint c
     where c.connamespace = 'public'::regnamespace and c.conname ~ 'vet' and c.conrelid <> 0
  loop
    v_new := pg_temp.vet_name(r.name);
    if v_new <> r.name then
      execute format('alter table %s rename constraint %I to %I', r.tbl, r.name, v_new);
    end if;
  end loop;

  -- Triggers fire in name order. Every vet-named trigger on a table takes the same prefix change
  -- (audit_vet_appointments -> audit_clinic_visits still sorts first), so the order holds.
  for r in
    select g.tgname as name, g.tgrelid::regclass as tbl
      from pg_trigger g
      join pg_class t on t.oid = g.tgrelid
     where not g.tgisinternal and g.tgname ~ 'vet' and t.relnamespace = 'public'::regnamespace
  loop
    v_new := pg_temp.vet_name(r.name);
    if v_new <> r.name then
      execute format('alter trigger %I on %s rename to %I', r.name, r.tbl, v_new);
    end if;
  end loop;

  for r in
    select p.policyname as name, p.tablename as tbl
      from pg_policies p
     where p.schemaname = 'public' and p.policyname ~ 'vet'
  loop
    v_new := pg_temp.vet_name(r.name);
    if v_new <> r.name then
      execute format('alter policy %I on public.%I rename to %I', r.name, r.tbl, v_new);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------------------------------------
-- 4. The role. Policies and the enum store the value, not its text, so they follow the rename; function bodies
-- are text, and every one that said 'vet' is rewritten in 5. roles.legacy_role is the same enum and follows too.
do $$
begin
  if exists (select 1 from pg_enum where enumtypid = 'public.app_role'::regtype and enumlabel = 'vet') then
    alter type public.app_role rename value 'vet' to 'doctor';
  end if;
end $$;
update public.roles set key = 'doctor', name = 'Doctor' where key = 'vet';

-- The gate every internal view asks first (0086). Its body named 'vet' as text, which after the rename is not a
-- value of app_role: left as it was, it would raise for every signed-in caller and close the app to everyone.
create or replace function private.has_app_access()
  returns boolean
  language sql
  stable
  set search_path = 'pg_catalog', 'public'
as $$
  select current_user::text not in ('anon', 'authenticated')
      or coalesce(
           public.current_user_role() in ('admin', 'management', 'staff', 'doctor', 'volunteer'),
           false
         );
$$;

-- ---------------------------------------------------------------------------------------------------------
-- 5. Functions: the name first (a rename keeps the OID, so every policy and trigger calling one still does),
-- then the body, which named the old tables, columns and role.
do $$
declare r record;
begin
  for r in select * from (values
      ('current_user_vet_ids()', 'current_user_clinic_ids'),
      ('current_vet_resident_ids()', 'current_clinic_resident_ids'),
      ('merge_vet_doctors(uuid, uuid)', 'merge_doctors'),
      ('vet_appointments_link_doctor()', 'clinic_visits_link_doctor'),
      ('vet_appointments_linked_rx_not_future()', 'clinic_visits_linked_rx_not_future'),
      ('vet_appointments_tidy_doctor_name()', 'clinic_visits_tidy_doctor_name'),
      ('vet_can_write_attachment(attachment_owner_type, uuid)', 'doctor_can_write_attachment'),
      ('vet_doctor_clinics_set_key()', 'doctor_clinics_set_key'),
      ('vet_doctor_key(text)', 'doctor_name_key'),
      ('vet_doctors_guard_login()', 'doctors_guard_login'),
      ('vet_doctors_propagate_name()', 'doctors_propagate_name'),
      ('vet_doctors_sync_link_keys()', 'doctors_sync_link_keys'),
      ('vet_doctors_tidy_name()', 'doctors_tidy_name'),
      ('vet_may_edit_doctor(uuid)', 'clinic_login_may_edit_doctor'),
      ('vet_owns_visit(uuid)', 'clinic_login_owns_visit')) t(old, new)
  loop
    if to_regprocedure('public.' || r.old) is not null then
      execute format('alter function public.%s rename to %I', r.old, r.new);
    end if;
  end loop;
end $$;

create or replace function public.current_user_clinic_ids()
  returns uuid[]
  language sql
  stable
  security definer
  set search_path = 'public'
as $$
  select coalesce(array_agg(distinct c.clinic_id), '{}'::uuid[])
    from doctors d
    join doctor_clinics c on c.doctor_id = d.id
   where d.user_id = auth.uid() and c.active
     and exists (
       select 1 from user_roles
        where user_id = auth.uid() and archived_at is null and role = 'doctor'
     );
$$;
comment on function public.current_user_clinic_ids() is
  'The clinics the calling doctor login currently works at (active links of its doctor). Empty for anyone else (0172).';

-- WRITE scope, unchanged from 0125/0127: a resident with a live record at one of the login's current clinics.
create or replace function public.current_clinic_resident_ids()
  returns setof uuid
  language sql
  stable
  security definer
  set search_path = 'public'
as $$
  select cv.resident_id
    from clinic_visits cv
   where cv.clinic_id = any ((select current_user_clinic_ids())::uuid[])
     and cv.archived_at is null
  union
  select p.resident_id
    from prescriptions p
    join clinic_visits cv on cv.id = p.clinic_visit_id
   where cv.clinic_id = any ((select current_user_clinic_ids())::uuid[])
     and cv.archived_at is null
     and p.archived_at is null
  union
  select pr.resident_id
    from procedures pr
    join clinic_visits cv on cv.id = pr.clinic_visit_id
   where cv.clinic_id = any ((select current_user_clinic_ids())::uuid[])
     and cv.archived_at is null
  union
  select bt.resident_id
    from blood_tests bt
    join clinic_visits cv on cv.id = bt.clinic_visit_id
   where cv.clinic_id = any ((select current_user_clinic_ids())::uuid[])
     and cv.archived_at is null;
$$;
comment on function public.current_clinic_resident_ids() is
  'What a doctor login may CHANGE: residents with a live clinical record at a clinic its doctor currently works at, whoever the doctor on it was. Every write policy calls this; reads call current_doctor_resident_ids() (0172).';

-- READ scope (Lutan, 2026-10-09, option (c)): the write scope, plus every resident on a live visit where this
-- login's doctor was the doctor, at any clinic, ones it has left included.
create or replace function public.current_doctor_resident_ids()
  returns setof uuid
  language sql
  stable
  security definer
  set search_path = 'public'
as $$
  select current_clinic_resident_ids()
  union
  select cv.resident_id
    from clinic_visits cv
    join doctors d on d.id = cv.doctor_id
   where d.user_id = auth.uid()
     and cv.archived_at is null
     and exists (
       select 1 from user_roles
        where user_id = auth.uid() and archived_at is null and role = 'doctor'
     );
$$;
comment on function public.current_doctor_resident_ids() is
  'What a doctor login may SEE: current_clinic_resident_ids() plus every resident on a live visit where its own doctor was the doctor, at any clinic. Clinic-only hid a doctor''s own patients after a move; doctor-only would hide every visit with no doctor recorded (0172).';
revoke all on function public.current_doctor_resident_ids() from public, anon;
grant execute on function public.current_doctor_resident_ids() to authenticated, service_role;

create or replace function public.clinic_login_owns_visit(p_visit_id uuid)
  returns boolean
  language sql
  stable
as $$
  select p_visit_id is null
      or exists (
        select 1 from clinic_visits cv
         where cv.id = p_visit_id
           and cv.clinic_id = any ((select current_user_clinic_ids())::uuid[])
           and cv.archived_at is null
      );
$$;

create or replace function public.clinic_login_may_edit_doctor(p_doctor uuid)
  returns boolean
  language sql
  stable
as $$
  select current_user_role() = 'doctor'
     and not exists (
       select 1 from doctor_clinics c
        where c.doctor_id = p_doctor and c.clinic_id <> all ((select current_user_clinic_ids())::uuid[])
     )
     and not exists (
       select 1 from doctors d
        where d.id = p_doctor and d.user_id is not null and d.user_id <> auth.uid()
     );
$$;

create or replace function public.doctor_can_write_attachment(p_owner_type attachment_owner_type, p_owner_id uuid)
  returns boolean
  language sql
  stable
as $$
  select case p_owner_type::text
    when 'blood_test' then coalesce(
      (select clinic_login_owns_visit(bt.clinic_visit_id) from blood_tests bt where bt.id = p_owner_id), false)
    when 'procedure' then coalesce(
      (select clinic_login_owns_visit(pr.clinic_visit_id) from procedures pr where pr.id = p_owner_id), false)
    else true
  end;
$$;

create or replace function public.doctor_clinics_set_key()
  returns trigger
  language plpgsql
as $$
begin
  select doctor_name_key(d.name) into new.name_key from doctors d where d.id = new.doctor_id;
  return new;
end;
$$;

create or replace function public.doctors_sync_link_keys()
  returns trigger
  language plpgsql
as $$
begin
  update doctor_clinics set name_key = doctor_name_key(new.name) where doctor_id = new.id;
  return null;
end;
$$;

create or replace function public.doctors_propagate_name()
  returns trigger
  language plpgsql
as $$
declare
  v_bypass text := coalesce(current_setting('app.deceased_lock_bypass', true), '');
begin
  perform set_config('app.deceased_lock_bypass', 'on', true);
  update clinic_visits set doctor_name = new.name where doctor_id = new.id;
  perform set_config('app.deceased_lock_bypass', v_bypass, true);
  return null;
end;
$$;

-- A doctor typed by name on a visit is found among that clinic's doctors, or listed there. 0125 listed it by
-- inserting vet_doctors (vet_id, name) and letting an insert trigger make the link; with vet_id gone the link
-- is made here, in the same sub-block, so a clash on the clinic's name key rolls both back.
create or replace function public.clinic_visits_link_doctor()
  returns trigger
  language plpgsql
as $$
declare
  v_name text := nullif(regexp_replace(new.doctor_name, '^\s+|\s+$', '', 'g'), '');
  v_id uuid;
  v_list_name text;
begin
  if new.doctor_id is not null
     and (tg_op = 'INSERT' or new.doctor_id is distinct from old.doctor_id) then
    -- Chosen by id. The composite foreign key checks the clinic.
    select name into v_list_name from doctors where id = new.doctor_id;
    new.doctor_name := v_list_name;
    return new;
  end if;

  if v_name is null then
    new.doctor_id := null;
    new.doctor_name := null;
    return new;
  end if;

  if new.clinic_id is null then
    new.doctor_id := null;
    new.doctor_name := v_name;
    return new;
  end if;

  if new.doctor_id is not null then
    select d.id, d.name into v_id, v_list_name
      from doctors d
      join doctor_clinics c on c.doctor_id = d.id
     where d.id = new.doctor_id
       and c.clinic_id = new.clinic_id
       and c.name_key = doctor_name_key(v_name);
    if found then
      new.doctor_name := v_list_name;
      return new;
    end if;
  end if;

  select d.id, d.name into v_id, v_list_name
    from doctors d
    join doctor_clinics c on c.doctor_id = d.id
   where c.clinic_id = new.clinic_id and c.name_key = doctor_name_key(v_name);
  if not found then
    begin
      insert into doctors (name) values (v_name)
        returning id, name into v_id, v_list_name;
      insert into doctor_clinics (clinic_id, doctor_id) values (new.clinic_id, v_id);
    exception when unique_violation then
      -- Another transaction listed the same name here a moment ago.
      select d.id, d.name into v_id, v_list_name
        from doctors d
        join doctor_clinics c on c.doctor_id = d.id
       where c.clinic_id = new.clinic_id and c.name_key = doctor_name_key(v_name);
    end;
  end if;

  new.doctor_id := v_id;
  new.doctor_name := v_list_name;
  return new;
end;
$$;

create or replace function public.clinic_visits_linked_rx_not_future()
  returns trigger
  language plpgsql
  security definer
  set search_path = 'public'
as $$
declare
  v_count integer;
begin
  if new.appointment_date is not distinct from old.appointment_date
    or shelter_date(new.appointment_date) <= shelter_today()
  then
    return new;
  end if;

  select count(*) into v_count from prescriptions where clinic_visit_id = new.id;
  if v_count > 0 then
    raise exception 'prescriptions_visit_not_in_future: this clinic visit has % linked prescription(s), so it cannot be moved to %, after today (%).',
      v_count, shelter_date(new.appointment_date), shelter_today()
      using errcode = 'check_violation',
            hint = 'Unlink the prescriptions from this visit first, or keep the visit on the day it happened.';
  end if;
  return new;
end;
$$;

create or replace function public.prescriptions_visit_not_in_future()
  returns trigger
  language plpgsql
  security definer
  set search_path = 'public'
as $$
declare
  v_day date;
begin
  if new.clinic_visit_id is null then return new; end if;
  if tg_op = 'UPDATE' and new.clinic_visit_id is not distinct from old.clinic_visit_id then
    return new;
  end if;

  select shelter_date(appointment_date) into v_day
  from clinic_visits
  where id = new.clinic_visit_id;

  if v_day > shelter_today() then
    raise exception 'prescriptions_visit_not_in_future: the linked clinic visit is on %, which has not happened yet (today is %).',
      v_day, shelter_today()
      using errcode = 'check_violation',
            hint = 'Link the prescription to a visit on or before today, or leave it unlinked.';
  end if;
  return new;
end;
$$;

create or replace function public.merge_doctors(p_from uuid, p_into uuid)
  returns doctors
  language plpgsql
as $$
declare
  v_from doctors;
  v_into doctors;
  v_bypass text := coalesce(current_setting('app.deceased_lock_bypass', true), '');
begin
  if current_user_role() is null
     or current_user_role() not in ('admin', 'management', 'staff', 'doctor') then
    raise exception 'Not allowed to merge doctors.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_from from doctors where id = p_from;
  select * into v_into from doctors where id = p_into;
  if v_from.id is null or v_into.id is null then
    raise exception 'Doctor not found.' using errcode = 'no_data_found';
  end if;
  if v_from.id = v_into.id then
    return v_into;
  end if;
  if v_from.user_id is not null and v_into.user_id is not null then
    raise exception 'Both doctors have a login; they cannot be merged.' using errcode = 'check_violation';
  end if;
  if (v_from.user_id is not null or v_into.user_id is not null)
     and current_user_role() <> 'admin' then
    raise exception 'Only an admin can merge a doctor who has a login.' using errcode = 'insufficient_privilege';
  end if;

  -- Two rows for one person usually share a name, and p_into's link at a clinic p_from also works at would
  -- then clash with p_from's own on (clinic_id, name_key). p_from's links go in a placeholder key first; they
  -- are deleted with p_from below.
  update doctor_clinics set name_key = 'merging ' || p_from where doctor_id = p_from;

  insert into doctor_clinics (clinic_id, doctor_id, active)
    select c.clinic_id, p_into, c.active from doctor_clinics c where c.doctor_id = p_from
    on conflict (clinic_id, doctor_id) do nothing;

  perform set_config('app.deceased_lock_bypass', 'on', true);
  update clinic_visits set doctor_id = p_into where doctor_id = p_from;
  perform set_config('app.deceased_lock_bypass', v_bypass, true);

  if v_from.user_id is not null then
    update doctors set user_id = null where id = p_from;
    update doctors set user_id = v_from.user_id where id = p_into;
  end if;

  delete from doctors where id = p_from;
  -- 0147: a delete the policy filters out is not an error, so without this a caller who may book a visit but not
  -- remove a doctor (visit.book lets them add one) would leave a half-merge. Raising rolls the whole merge back.
  if not found then
    raise exception 'Not allowed to merge doctors.' using errcode = 'insufficient_privilege';
  end if;
  select * into v_into from doctors where id = p_into;
  return v_into;
end;
$$;

-- The parameter was p_vet_id; a parameter cannot be renamed in place, so the function is made again.
drop function if exists public.schedule_bulk_appointments(uuid[], uuid, timestamptz, text, text, appointment_status, text);
create function public.schedule_bulk_appointments(
  p_resident_ids uuid[],
  p_clinic_id uuid,
  p_appointment_date timestamptz,
  p_reason text default null,
  p_notes text default null,
  p_status appointment_status default 'scheduled',
  p_doctor_name text default null
)
  returns setof clinic_visits
  language plpgsql
as $$
declare
  v_bulk_id uuid;
begin
  insert into bulk_appointments (clinic_id, appointment_date, reason, created_by)
  values (p_clinic_id, p_appointment_date, p_reason, auth.uid())
  returning id into v_bulk_id;

  return query
    insert into clinic_visits (
      resident_id, clinic_id, appointment_date, reason, notes, status,
      bulk_appointment_id, created_by, doctor_name
    )
    select
      resident_id, p_clinic_id, p_appointment_date, p_reason, p_notes, p_status,
      v_bulk_id, auth.uid(), p_doctor_name
    from unnest(p_resident_ids) as resident_id
    returning *;
end;
$$;
revoke all on function public.schedule_bulk_appointments(uuid[], uuid, timestamptz, text, text, appointment_status, text) from public, anon;
grant execute on function public.schedule_bulk_appointments(uuid[], uuid, timestamptz, text, text, appointment_status, text) to authenticated, service_role;

create or replace function public.handle_deceased_placement()
  returns trigger
  language plpgsql
  security definer
  set search_path = 'public'
as $$
declare
  v_appointments jsonb;
  v_prescriptions jsonb;
  v_ready boolean;
begin
  if new.placement_type = 'Deceased' then
    select coalesce(jsonb_agg(id), '[]'::jsonb)
    into v_appointments
    from clinic_visits
    where resident_id = new.resident_id
      and archived_at is null
      and status = 'scheduled'
      and appointment_date > new.start_date;

    select coalesce(jsonb_agg(jsonb_build_object('id', id, 'end_date', end_date)), '[]'::jsonb)
    into v_prescriptions
    from prescriptions
    where resident_id = new.resident_id
      and archived_at is null
      and (end_date is null or end_date > shelter_date(new.start_date));

    select ready_for_adoption into v_ready
    from residents
    where id = new.resident_id;

    -- 0172: the key was the old table's name; undo_deceased_placement() reads either.
    new.deceased_cascade := jsonb_build_object(
      'clinic_visits', v_appointments,
      'prescriptions', v_prescriptions,
      'ready_for_adoption', coalesce(v_ready, false)
    );

    update clinic_visits cv
    set status = 'cancelled'
    from jsonb_array_elements_text(v_appointments) as s(id)
    where cv.id = s.id::uuid;

    update prescriptions p
    set end_date = greatest(shelter_date(new.start_date), p.start_date)
    from jsonb_array_elements(v_prescriptions) as s(item)
    where p.id = (s.item ->> 'id')::uuid;

    update residents
    set ready_for_adoption = false
    where id = new.resident_id;

    -- PDF generation (Section 8.5) and the Drive folder archive move
    -- (Section 5.1) are triggered from the application layer after this
    -- insert commits, not from this trigger — they call external services
    -- (Drive API, PDF renderer) that don't belong in a DB transaction.
    -- record_deceased_archive() (0026) stores what they produce.
  end if;

  return new;
end;
$$;

create or replace function public.undo_deceased_placement(p_resident_id uuid, p_reason text)
  returns uuid
  language plpgsql
  security definer
  set search_path = 'public'
as $$
declare
  v_death placement_history%rowtype;
  v_prior placement_history%rowtype;
  v_cascade jsonb;
  v_id uuid;
begin
  if current_user_role() is distinct from 'admin' then
    raise exception 'Only an admin can withdraw a recorded death.';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'Say why the death was recorded in error.';
  end if;

  select * into v_death
  from placement_history
  where resident_id = p_resident_id
    and placement_type = 'Deceased'
    and end_date is null
  limit 1;
  if not found then
    raise exception 'This resident is not recorded as deceased.';
  end if;

  -- The placement the death closed: where they were, and with whom.
  select * into v_prior
  from placement_history
  where resident_id = p_resident_id
    and start_date < v_death.start_date
  order by start_date desc
  limit 1;
  if not found then
    raise exception 'There is no earlier placement to return this resident to.';
  end if;

  -- close_prior_placement() ends the Deceased row as part of this insert,
  -- and its UPDATE runs while the resident still counts as deceased, so
  -- the lock has to stand aside for it. Off again straight after: from
  -- then on the resident is alive and the ordinary rules apply.
  perform set_config('app.deceased_lock_bypass', 'on', true);

  insert into placement_history (
    resident_id, placement_type, start_date, zone_id, enclosure_id,
    previous_enclosure_id, carer_id, notes, created_by
  ) values (
    p_resident_id, 'DeceasedInError', now(), v_prior.zone_id, v_prior.enclosure_id,
    -- "Deceased → Kennel 3" in the housing history; but a resident sent
    -- back into hospital keeps the kennel they'd return to, which is what
    -- the hub reads previous_enclosure_id as while they're hospitalised.
    case
      when v_prior.placement_type = 'SendToHospital' then v_prior.previous_enclosure_id
      else v_death.enclosure_id
    end,
    v_prior.carer_id, btrim(p_reason), auth.uid()
  )
  returning id into v_id;

  perform set_config('app.deceased_lock_bypass', 'off', true);

  -- Put back what the cascade did, and only that. Deaths recorded before
  -- this migration have no snapshot; their cascade stays as it is.
  v_cascade := coalesce(v_death.deceased_cascade, '{}'::jsonb);

  -- A death recorded before 0172 stored the visits under 'vet_appointments'.
  update clinic_visits cv
  set status = 'scheduled'
  from jsonb_array_elements_text(coalesce(v_cascade -> 'clinic_visits', v_cascade -> 'vet_appointments', '[]'::jsonb)) as s(id)
  where cv.id = s.id::uuid
    and cv.status = 'cancelled';

  update prescriptions p
  set end_date = (s.item ->> 'end_date')::date
  from jsonb_array_elements(coalesce(v_cascade -> 'prescriptions', '[]'::jsonb)) as s(item)
  where p.id = (s.item ->> 'id')::uuid;

  if coalesce((v_cascade ->> 'ready_for_adoption')::boolean, false) then
    update residents set ready_for_adoption = true where id = p_resident_id;
  end if;

  return v_id;
end;
$$;

CREATE OR REPLACE FUNCTION public.reassign_recurring_job(p_job_id uuid, p_occurs_on date, p_user_ids uuid[], p_note text DEFAULT NULL::text)
 RETURNS recurring_job_occurrences
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_job recurring_jobs;
  v_row recurring_job_occurrences;
  v_ids uuid[];
  v_ok integer;
begin
  if current_user_role() is null or current_user_role() not in ('admin', 'management') then
    raise exception 'Only management can reassign a job.';
  end if;
  select * into v_job from recurring_jobs where id = p_job_id;
  if not found then
    raise exception 'That recurring job no longer exists.';
  end if;
  select coalesce(array_agg(distinct u), '{}') into v_ids
    from unnest(coalesce(p_user_ids, '{}')) as u where u is not null;

  -- A date that is done or skipped is history: who covered it stays.
  if exists (select 1 from recurring_job_occurrences
              where job_id = p_job_id and occurs_on = p_occurs_on and outcome is not null) then
    raise exception 'That date has already been marked done or skipped.';
  end if;

  -- No one: hand the date back to the usual assignees.
  if cardinality(v_ids) = 0 then
    delete from recurring_job_occurrence_assignees where job_id = p_job_id and occurs_on = p_occurs_on;
    delete from recurring_job_occurrences
     where job_id = p_job_id and occurs_on = p_occurs_on;
    return null;
  end if;

  if not recurrence_occurs_on(p_occurs_on, v_job.repeat, v_job.every, v_job.weekdays, v_job.month_day,
                              v_job.week_of_month, v_job.starts_on, v_job.ends_on) then
    raise exception 'This job does not fall on %.', to_char(p_occurs_on, 'FMDD Mon YYYY');
  end if;
  select count(*) into v_ok
    from user_roles r
   where r.user_id = any (v_ids)
     and r.archived_at is null
     and r.role in ('admin', 'management', 'staff', 'doctor', 'volunteer');
  if v_ok <> cardinality(v_ids) then
    raise exception 'A job can only be reassigned to someone who can still sign in.';
  end if;

  insert into recurring_job_occurrences (job_id, occurs_on, reassigned_by, reassigned_at, reassign_note)
  values (p_job_id, p_occurs_on, auth.uid(), now(), nullif(btrim(p_note), ''))
  on conflict (job_id, occurs_on) do update
    set reassigned_by = excluded.reassigned_by, reassigned_at = excluded.reassigned_at,
        reassign_note = excluded.reassign_note
  returning * into v_row;

  delete from recurring_job_occurrence_assignees
   where job_id = p_job_id and occurs_on = p_occurs_on and user_id <> all (v_ids);
  insert into recurring_job_occurrence_assignees (job_id, occurs_on, user_id)
  select p_job_id, p_occurs_on, u from unnest(v_ids) as u
  on conflict do nothing;

  return v_row;
end;
$function$;

CREATE OR REPLACE FUNCTION public.record_recurring_job(p_job_id uuid, p_occurs_on date, p_outcome text, p_note text DEFAULT NULL::text)
 RETURNS recurring_job_occurrences
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_role app_role := current_user_role();
  v_job recurring_jobs;
  v_row recurring_job_occurrences;
  v_note text := nullif(btrim(p_note), '');
begin
  if v_role is null
     or (v_role not in ('admin', 'management', 'staff', 'doctor') and not has_permission('recurring.do_own')) then
    raise exception 'Not authorized to record a recurring job.';
  end if;
  if p_outcome is not null and p_outcome not in ('done', 'skipped') then
    raise exception 'A job can be marked done or skipped.';
  end if;
  select * into v_job from recurring_jobs where id = p_job_id;
  if not found then
    raise exception 'That recurring job no longer exists.';
  end if;

  -- The date's effective assignees: its cover team if it has one, else the
  -- job's usual ones. Management may record any job.
  if v_role not in ('admin', 'management') then
    if exists (select 1 from recurring_job_occurrence_assignees
                where job_id = p_job_id and occurs_on = p_occurs_on) then
      if not exists (select 1 from recurring_job_occurrence_assignees
                      where job_id = p_job_id and occurs_on = p_occurs_on and user_id = auth.uid()) then
        raise exception 'This date of the job has been handed to someone else.';
      end if;
    elsif not exists (select 1 from recurring_job_assignees
                       where job_id = p_job_id and user_id = auth.uid()) then
      raise exception 'Only the people this job is assigned to, or management, can record it.';
    end if;
  end if;

  -- Clearing: undo a mistaken done / skipped. A row left saying nothing goes.
  if p_outcome is null then
    delete from recurring_job_occurrences
     where job_id = p_job_id and occurs_on = p_occurs_on and reassigned_at is null;
    update recurring_job_occurrences
       set outcome = null, done_by = null, done_at = null, note = null
     where job_id = p_job_id and occurs_on = p_occurs_on
    returning * into v_row;
    return v_row;
  end if;

  if not recurrence_occurs_on(p_occurs_on, v_job.repeat, v_job.every, v_job.weekdays, v_job.month_day,
                              v_job.week_of_month, v_job.starts_on, v_job.ends_on) then
    raise exception 'This job does not fall on %.', to_char(p_occurs_on, 'FMDD Mon YYYY');
  end if;
  if p_outcome = 'done' and p_occurs_on > shelter_today() then
    raise exception 'A job cannot be marked done before its day. It can be skipped ahead.';
  end if;

  insert into recurring_job_occurrences (job_id, occurs_on, outcome, done_by, done_at, note)
  values (p_job_id, p_occurs_on, p_outcome, auth.uid(), now(), v_note)
  on conflict (job_id, occurs_on) do update
    set outcome = excluded.outcome, done_by = excluded.done_by,
        done_at = excluded.done_at, note = excluded.note
  returning * into v_row;
  return v_row;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_resident_microchip(p_resident_id uuid, p_number text, p_implanted_on date DEFAULT NULL::date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_role app_role := current_user_role();
begin
  if not (select has_permission('resident.microchip')) then
    raise exception 'Not authorized to set a microchip.'
      using errcode = 'insufficient_privilege';
  end if;

  if v_role = 'doctor'
     and p_resident_id not in (select current_clinic_resident_ids()) then
    raise exception 'Not authorized to set a microchip for this resident.'
      using errcode = 'insufficient_privilege';
  end if;

  if not exists (select 1 from residents where id = p_resident_id) then
    raise exception 'Resident not found.' using errcode = 'no_data_found';
  end if;

  if resident_is_deceased(p_resident_id) then
    raise exception 'This resident is deceased — their record is read-only.'
      using errcode = 'restrict_violation';
  end if;

  update residents
     set microchip_number = p_number,
         microchip_implanted_on = p_implanted_on
   where id = p_resident_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.record_attachment(p_owner_type attachment_owner_type, p_owner_id uuid, p_drive_file_id text, p_file_name text DEFAULT NULL::text, p_sub_folder text DEFAULT NULL::text, p_date_taken date DEFAULT NULL::date, p_adoption_update_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(attachment attachments, is_profile boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_attachment attachments;
  v_is_profile boolean := false;
  v_legacy boolean := current_user_role() is not null
                      and current_user_role() in ('admin', 'management', 'staff', 'doctor');
  v_by_cell boolean := false;
begin
  -- A configured role gets in by its cell, for a resident's photo only (0140). Blood-test and
  -- procedure files stay with the four roles that had them.
  if not v_legacy then
    v_by_cell := p_owner_type = 'resident'
                 and coalesce((select has_permission('photos.resident_add')), false)
                 and coalesce((select sees_all_clinical()), false);
  end if;

  if not (v_legacy or v_by_cell) then
    raise exception 'Not authorized to add attachments.';
  end if;

  -- A5: a resident photo outside the Medical folder is published (0101), so it is filed only by a
  -- login that may publish. An adopter's photo has a folder of its own choosing, so the same.
  -- Everyone, not only the login that arrived by its cell: a doctor's own login used by hand could
  -- otherwise file under any folder.
  if p_owner_type = 'resident'
     and not (select can_publish_resident_photos())
     and (p_adoption_update_id is not null
          or lower(btrim(coalesce(p_sub_folder, ''))) <> 'medical') then
    raise exception 'This login can add photos to the Medical folder only.';
  end if;

  if current_user_role() = 'doctor'
     and p_owner_type in ('resident', 'blood_test', 'procedure')
     and not coalesce(
       attachment_resident_id(p_owner_type, p_owner_id) in (select current_clinic_resident_ids()),
       false
     ) then
    raise exception 'Not authorized to add attachments.';
  end if;

  -- 0110: a file on another clinic's blood test or procedure is not the
  -- doctor's to add. Definer, so the policies above do not reach here.
  if current_user_role() = 'doctor' and not doctor_can_write_attachment(p_owner_type, p_owner_id) then
    raise exception 'Not authorized to add attachments.';
  end if;

  if p_adoption_update_id is not null and not exists (
    select 1 from adoption_updates u
     where u.id = p_adoption_update_id
       and p_owner_type = 'resident'
       and u.resident_id = p_owner_id
  ) then
    raise exception 'That adoption update is not about this resident.';
  end if;

  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name, date_taken, uploaded_by, adoption_update_id)
  values (p_owner_type, p_owner_id, p_sub_folder, p_drive_file_id, p_file_name, p_date_taken, auth.uid(), p_adoption_update_id)
  returning * into v_attachment;

  if p_owner_type = 'resident' then
    update residents
    set profile_photo_drive_file_id = p_drive_file_id
    where id = p_owner_id
      and profile_photo_drive_file_id is null;

    if found then
      v_is_profile := true;
    end if;
  end if;

  return query select v_attachment, v_is_profile;
end;
$function$;

-- The category was 'vet' (0071); the cashflow screen reads 'clinic' from 0172.
CREATE OR REPLACE FUNCTION public.cashflow_forecast(p_from date, p_to date)
 RETURNS TABLE(category text, month date, amount numeric, basis text, missing_prices bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with months as (
    -- One row per calendar month the window touches, each carrying the
    -- window's slice of that month. A 30-day window starting mid-month
    -- gives two rows, each covering only the days actually asked for, so
    -- the columns add up to the window total rather than to two whole
    -- months.
    select
      m::date as month,                                   -- tz: see Dashboard follow-ups (e)
      greatest(p_from, m::date) as win_from,
      least(p_to, (m + interval '1 month - 1 day')::date) as win_to
    from generate_series(
      date_trunc('month', p_from::timestamp),
      date_trunc('month', p_to::timestamp),
      interval '1 month'
    ) as m
  ),

  -- FOOD — diet_forecast (0051) already returns baht per diet type,
  -- because diet_types.cost_per_unit has been there since that migration.
  --
  -- That column is `not null default 0` and the Management → Diets form
  -- says "Leave 0 until you have a price", so for food a zero price *is*
  -- the unpriced state. A diet residents are actually eating with a cost
  -- of 0 therefore counts as a missing price rather than as free food.
  food as (
    select
      mo.month,
      coalesce(sum(f.cost), 0) as amount,
      count(*) filter (
        where f.diet_type_id is not null
          and coalesce(f.quantity, 0) > 0
          and coalesce(f.cost, 0) = 0
      ) as missing
    from months mo
    left join lateral diet_forecast(mo.win_from, mo.win_to) f on true
    group by mo.month
  ),

  -- MEDICATION — medication_forecast (0044) returns quantity in dose_unit;
  -- 0071's medication.cost_per_unit is priced per dose_unit precisely so it
  -- multiplies straight through without this needing to know pack sizes.
  medication_costs as (
    select
      mo.month,
      coalesce(sum(mf.quantity * m.cost_per_unit), 0) as amount,
      count(*) filter (
        where mf.medication_id is not null
          and coalesce(mf.quantity, 0) > 0
          and m.cost_per_unit is null
      ) as missing
    from months mo
    left join lateral medication_forecast(mo.win_from, mo.win_to) mf on true
    left join medication m on m.id = mf.medication_id
    group by mo.month
  ),

  -- IMMUNIZATION — the doses falling due in the window, from the
  -- immunization_next_due view (0007), times 0071's per-dose cost.
  --
  -- The view gives the next due date per (resident, type) from the last
  -- dose administered and interval_months. Two consequences worth knowing
  -- rather than working around: a resident who has never had a given
  -- vaccine has no row and so is not forecast, and a window longer than an
  -- interval still counts each pairing once, because the dose after next
  -- depends on when the next one is actually given. Both understate rather
  -- than overstate, which is the safe direction for an outgoing.
  --
  -- Residents who have left are excluded the way medication_forecast does
  -- it (Deceased, Adopted) rather than the way diet_forecast does it (also
  -- Fostered): a fostered animal is still the shelter's animal and its
  -- vaccinations are still the shelter's bill, whereas it eats the foster
  -- carer's food.
  immunization as (
    select
      mo.month,
      coalesce(sum(it.cost), 0) as amount,
      count(*) filter (
        where nd.immunization_type_id is not null and it.cost is null
      ) as missing
    from months mo
    left join immunization_next_due nd
      on nd.next_due_date between mo.win_from and mo.win_to
     and exists (
       select 1 from resident_current_state s
       where s.resident_id = nd.resident_id
         and s.current_status not in ('Deceased', 'Adopted')
     )
    left join immunization_types it on it.id = nd.immunization_type_id
    group by mo.month
  ),

  -- CLINIC — clinic visits already booked, at the flat typical-visit estimate held
  -- in site_content (0071), except where the invoice has already arrived
  -- and clinic_visits.cost holds the real figure.
  --
  -- `visits` and `invoiced` are carried out of here only to decide `basis`:
  -- a month where every booked visit is already invoiced reports `actual`,
  -- anything else `estimated`. Mixed months read `estimated` on purpose —
  -- the weaker of the two is the honest label for a total.
  clinic_estimate as (
    select clinic_visit_estimate from site_content where id limit 1
  ),
  clinic as (
    select
      mo.month,
      -- The `filter` is load-bearing. months is LEFT JOINed to
      -- clinic_visits so a month with nothing booked still produces a
      -- row, and in that row va.* is all null — at which point
      -- coalesce(va.cost, estimate) happily returns the estimate and the
      -- month is charged for a visit that does not exist. Counting only
      -- rows that matched an appointment is what makes an empty month
      -- cost zero. (Found 2026-09-23: every month past the two booked
      -- visits was reading ฿800.)
      coalesce(
        sum(coalesce(va.cost, e.clinic_visit_estimate)) filter (where va.id is not null),
        0
      ) as amount,
      count(*) filter (
        where va.id is not null and va.cost is null and e.clinic_visit_estimate is null
      ) as missing,
      count(*) filter (where va.id is not null) as visits,
      count(*) filter (where va.id is not null and va.cost is not null) as invoiced
    from months mo
    cross join clinic_estimate e
    left join clinic_visits va
      on va.status = 'scheduled'
     -- 0124: an archived visit is a deleted one, so it costs nothing.
     and va.archived_at is null
     -- tz: see Dashboard follow-ups (e)
     and va.appointment_date::date between mo.win_from and mo.win_to
    group by mo.month
  ),

  -- MAINTENANCE — the only figure that was already money. Open jobs with a
  -- due date in the window, at estimated_cost; actual_cost is what a
  -- finished job turned out to cost and is history, not forecast. A job
  -- with no due date is not forecast at all, because it has no month to
  -- sit in.
  --
  -- "Open" is everything but 'Completed' — Blocked included, because a
  -- blocked job is still money the shelter expects to spend. Note the
  -- status is 'Completed', not 'Done': 0033 renamed both that value and
  -- 'To Do' after 0001 created them (see src/lib/maintenance/status.ts).
  maint as (
    select
      mo.month,
      coalesce(sum(j.estimated_cost), 0) as amount,
      count(*) filter (where j.id is not null and j.estimated_cost is null) as missing
    from months mo
    left join maintenance j
      on j.status <> 'Completed'
     and j.due_date between mo.win_from and mo.win_to
    group by mo.month
  )

  select 'food'::text, month, amount, 'priced'::text, missing from food
  union all
  select 'medication', month, amount, 'priced', missing from medication_costs
  union all
  select 'immunization', month, amount, 'priced', missing from immunization
  union all
  select
    'clinic',
    month,
    amount,
    case when visits > 0 and invoiced = visits then 'actual' else 'estimated' end,
    missing
  from clinic
  union all
  select 'maintenance', month, amount, 'estimated', missing from maint
  order by 2, 1;
$function$;

-- doctors.vet_id: every value is already a doctor_clinics link (0125 backfilled them and the trigger kept them);
-- this makes sure before the column goes. After section 5, so the link's insert trigger runs its new body.
do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'doctors' and column_name = 'vet_id') then
    insert into public.doctor_clinics (clinic_id, doctor_id)
      select vet_id, id from public.doctors where vet_id is not null
      on conflict (clinic_id, doctor_id) do nothing;
    drop trigger if exists doctors_link_home_clinic on public.doctors;
    drop trigger if exists vet_doctors_link_home_clinic on public.doctors;
    -- The one policy that read the column: a clinic login could add a doctor "at" one of its clinics. A doctor
    -- row has no clinic now; its clinics are links, and the link's own insert policy checks the clinic. So the
    -- login may add a doctor it may then edit (no other clinic's links, no other login: true for a new row).
    alter policy doctor_insert_doctors on public.doctors
      with check (((select public.is_clinic_login()) and public.clinic_login_may_edit_doctor(id)));
    alter table public.doctors drop column vet_id;
  end if;
end $$;
drop function if exists public.vet_doctors_link_home_clinic();


-- 5b. A policy's deparse keeps the old function name as a column alias ("... AS current_vet_resident_ids"). It
-- is only a label, but it still says vet, so every policy that carries one is rewritten with the label renamed.
do $$
declare r record; v_q text; v_c text;
begin
  for r in
    select tablename, policyname, qual, with_check from pg_policies
     where schemaname = 'public'
       and (qual ~ 'current_vet_resident_ids|current_user_vet_ids' or with_check ~ 'current_vet_resident_ids|current_user_vet_ids')
  loop
    v_q := replace(replace(r.qual, 'current_vet_resident_ids', 'current_clinic_resident_ids'), 'current_user_vet_ids', 'current_user_clinic_ids');
    v_c := replace(replace(r.with_check, 'current_vet_resident_ids', 'current_clinic_resident_ids'), 'current_user_vet_ids', 'current_user_clinic_ids');
    if v_q is not null then
      execute format('alter policy %I on public.%I using (%s)', r.policyname, r.tablename, v_q);
    end if;
    if v_c is not null then
      execute format('alter policy %I on public.%I with check (%s)', r.policyname, r.tablename, v_c);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------------------------------------
-- 6. A doctor login's READS move to the wider scope; its writes stay where they were.
-- Every SELECT policy that asked current_clinic_resident_ids() asks current_doctor_resident_ids() instead, its
-- text otherwise untouched (pg_policies' own deparse, as 0167 did). The write policies (insert, update, delete)
-- keep the clinic scope, so a doctor sees a patient seen at a clinic they have left but cannot change their record.
do $$
declare r record;
begin
  for r in
    select tablename, policyname, qual from pg_policies
     where schemaname = 'public' and cmd = 'SELECT' and qual like '%current_clinic_resident_ids%'
  loop
    execute format('alter policy %I on public.%I using (%s)', r.policyname, r.tablename,
                   replace(r.qual, 'current_clinic_resident_ids', 'current_doctor_resident_ids'));
  end loop;
end $$;

-- Five read-only views carry the same test in their WHERE (0081's pattern): a doctor login sees a row only for a
-- resident in scope. They are reads, so they move to the read scope too, or /residents/<id> would show a resident
-- whose state, placement and vaccinations come back empty. Rebuilt from their own definition with only the
-- function swapped; owner-run views with no options, so the rebuild changes nothing else.
do $$
declare r record;
begin
  for r in
    select c.relname, pg_get_viewdef(c.oid) as def
      from pg_class c
     where c.relnamespace = 'public'::regnamespace and c.relkind = 'v'
       and c.relname in ('resident_current_state', 'current_placement', 'immunization_compliance',
                         'immunization_duplicate_check', 'translation_queue')
       and pg_get_viewdef(c.oid) like '%current_clinic_resident_ids%'
  loop
    execute format('create or replace view public.%I as %s', r.relname,
                   replace(replace(r.def, 'current_clinic_resident_ids', 'current_doctor_resident_ids'),
                           'current_vet_resident_ids', 'current_doctor_resident_ids'));
  end loop;
end $$;
revoke insert, update, delete, truncate, references, trigger on public.resident_current_state from authenticated, anon;
revoke insert, update, delete, truncate, references, trigger on public.current_placement from authenticated, anon;
revoke insert, update, delete, truncate, references, trigger on public.immunization_compliance from authenticated, anon;
revoke insert, update, delete, truncate, references, trigger on public.immunization_duplicate_check from authenticated, anon;
revoke insert, update, delete, truncate, references, trigger on public.translation_queue from authenticated, anon;

-- weight and immunization_records had one FOR ALL policy each, reads and writes together. It stays (clinic scope,
-- so writes do not move) and a SELECT policy beside it adds the wider reads; policies of one command are OR'd.
drop policy if exists doctor_read_weight on public.weight;
create policy doctor_read_weight on public.weight
  for select to authenticated
  using (((select public.is_clinic_login()) and (resident_id in (select public.current_doctor_resident_ids()))));

drop policy if exists doctor_read_immunization_records on public.immunization_records;
create policy doctor_read_immunization_records on public.immunization_records
  for select to authenticated
  using (((select public.is_clinic_login()) and (resident_id in (select public.current_doctor_resident_ids()))));

-- ---------------------------------------------------------------------------------------------------------
-- 7. The view, and the rows that name a table by its text.
do $$
begin
  if to_regclass('public.vet_contacts') is not null and to_regclass('public.doctor_contacts') is null then
    alter view public.vet_contacts rename to doctor_contacts;
  end if;
end $$;
comment on view public.doctor_contacts is
  'The address book as a doctor login reads it: name and type only (0126, renamed 0172).';

-- record_label_sources() and the translation tables key on tg_table_name, which is now the new name.
insert into public.translatable_labels (table_name, column_name, th_column, label_group, optional)
  select 'clinics', column_name, th_column, label_group, optional
    from public.translatable_labels where table_name = 'vets'
  on conflict do nothing;
update public.label_sources set table_name = 'clinics' where table_name = 'vets';
delete from public.translatable_labels where table_name = 'vets';

do $$
declare r record;
begin
  for r in select * from (values
      ('vets', 'clinics'), ('vet_doctors', 'doctors'),
      ('vet_doctor_clinics', 'doctor_clinics'), ('vet_appointments', 'clinic_visits')) t(old, new)
  loop
    update public.translations set table_name = r.new where table_name = r.old;
    update public.translatable_fields set table_name = r.new where table_name = r.old;
  end loop;
end $$;

-- ---------------------------------------------------------------------------------------------------------
-- 8. Compatibility, for one release: the old names, read-only, as the caller (security_invoker), so each row is
-- still behind its table's own policies. Drop these in the release after next (backlog).
create or replace view public.vets with (security_invoker = true) as
  select id, name, null::text as clinic_name, contact_info, created_at, notes, name_th
    from public.clinics;
create or replace view public.vet_doctors with (security_invoker = true) as
  select id, null::uuid as vet_id, name, active, created_by, created_at, user_id
    from public.doctors;
create or replace view public.vet_doctor_clinics with (security_invoker = true) as
  select clinic_id as vet_id, doctor_id, active, name_key, created_by, created_at
    from public.doctor_clinics;
create or replace view public.vet_appointments with (security_invoker = true) as
  select id, resident_id, clinic_id as vet_id, appointment_date, reason, notes, status, created_by, created_at,
         bulk_appointment_id, cost, doctor_name, doctor_id, archived_at, archived_by, archive_reason
    from public.clinic_visits;

revoke all on public.vets from authenticated, anon;
revoke all on public.vet_doctors from authenticated, anon;
revoke all on public.vet_doctor_clinics from authenticated, anon;
revoke all on public.vet_appointments from authenticated, anon;
grant select on public.vets to authenticated, service_role;
grant select on public.vet_doctors to authenticated, service_role;
grant select on public.vet_doctor_clinics to authenticated, service_role;
grant select on public.vet_appointments to authenticated, service_role;

comment on view public.vets is 'Read-only stand-in for the table renamed clinics in 0172. Drop after one release.';
comment on view public.vet_doctors is 'Read-only stand-in for the table renamed doctors in 0172. Drop after one release.';
comment on view public.vet_doctor_clinics is 'Read-only stand-in for the table renamed doctor_clinics in 0172. Drop after one release.';
comment on view public.vet_appointments is 'Read-only stand-in for the table renamed clinic_visits in 0172. Drop after one release.';

-- Renamed functions keep their grants, but say so where the checker (and a reader) looks.
revoke all on function public.current_user_clinic_ids() from public, anon;
revoke all on function public.current_clinic_resident_ids() from public, anon;
revoke all on function public.clinic_login_owns_visit(uuid) from public, anon;
revoke all on function public.clinic_login_may_edit_doctor(uuid) from public, anon;
revoke all on function public.doctor_can_write_attachment(attachment_owner_type, uuid) from public, anon;
revoke all on function public.merge_doctors(uuid, uuid) from public, anon;
grant execute on function public.current_user_clinic_ids() to authenticated, service_role;
grant execute on function public.current_clinic_resident_ids() to authenticated, service_role;
grant execute on function public.clinic_login_owns_visit(uuid) to authenticated, service_role;
grant execute on function public.clinic_login_may_edit_doctor(uuid) to authenticated, service_role;
grant execute on function public.doctor_can_write_attachment(attachment_owner_type, uuid) to authenticated, service_role;
grant execute on function public.merge_doctors(uuid, uuid) to authenticated, service_role;
