-- Each clinic gets a list of its doctors, and a vet account records which
-- clinic it belongs to (backlog, "Doctors belong to a vet: investigate a
-- managed list rather than free text", 2026-09-27; schema half). Lutan
-- chose both on 2026-09-27 after the investigation (docs/decisions.md,
-- same date). They are two separate changes that happen to share a PR:
--
--   1. vet_doctors: one row per doctor per clinic, plus a nullable
--      vet_appointments.doctor_id beside the free-text doctor_name (0074).
--   2. user_roles.vet_id: which clinic a vet account belongs to, and
--      current_user_vet_id() for policies to use. Backlog items 4 (a vet
--      sees only their clinic's residents) and 8 (scope the clinic picker)
--      wait on this. They would need it even without the roster.
--
-- ## The list fills itself as visits are recorded
--
-- Nobody is expected to type in twenty names before the list is useful. A
-- trigger on vet_appointments links every typed doctor_name to that
-- clinic's list and adds the name if it is not there yet. The same rule
-- applies to every writer: the visit forms, schedule_bulk_appointments,
-- the SQL editor and imports. The feature half only has to provide the
-- page where the list is seen and corrected.
--
-- Names are matched ignoring case and runs of whitespace (vet_doctor_key),
-- so "dr ploy" and "Dr  Ploy" both link to an existing "Dr Ploy". That
-- tidying was left out of 0074 on purpose as "guessing at what a name is,
-- which is the lookup's job"; this is the lookup. Titles and punctuation
-- are not guessed at. "Somchai" and "Dr Somchai" stay two doctors until
-- someone merges them (merge_vet_doctors), and a merge is a one-off
-- correction.
--
-- ## doctor_name keeps the list's spelling
--
-- A visit linked to a doctor has doctor_name set to the list's spelling
-- of that name, and renaming a doctor updates every visit linked to them.
-- So the pages and PDF that already show doctor_name (the vet hub, the
-- resident page, the archive record) stay correct without knowing
-- doctor_id exists. A visit with no clinic (vet_id null) keeps its
-- free-text name, as before. The column is still where a name with
-- nothing to link to lives.
--
-- Renaming and merging write to visits of deceased residents too, which
-- the 0026 lock refuses. Those two operations turn the bypass on for their
-- own UPDATE only, then restore the previous setting. That UPDATE changes
-- only doctor_id and doctor_name, and only on rows the caller can already
-- update under RLS. It corrects a label on the record; nothing clinical
-- on it changes.
--
-- ## Clinic of a vet account
--
-- The clinic is stored on the account (user_roles), not on a doctor,
-- because a clinic login may be a nurse or the front desk. Linking an
-- account to a particular doctor waits until item 4 decides whether the
-- scope is the clinic or the doctor. Only a vet account can have a clinic
-- (check constraint), and changing an account's role away from vet clears
-- it (trigger), so the existing role-change actions in
-- src/app/admin/security/actions.ts do not start failing.
--
-- On dev, 2026-09-27: 75 visits, one with a doctor ("Dr Ploy" at Mae Wang,
-- a 0074 verification row). The backfill below links it. The AppSheet
-- import never carried doctors.
--
-- Re-runnable: every statement is guarded, `or replace`, or drops first.

-- ---------------------------------------------------------------------------
-- 1. The roster
-- ---------------------------------------------------------------------------

-- How two spellings are judged to be the same doctor. Immutable so it can
-- back the unique index.
create or replace function vet_doctor_key(p_name text)
returns text
language sql
immutable
as $$
  select lower(btrim(regexp_replace(p_name, '\s+', ' ', 'g')));
$$;

create table if not exists vet_doctors (
  id uuid primary key default gen_random_uuid(),
  vet_id uuid not null references vets (id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_by uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  -- The target of vet_appointments' composite foreign key, which is what
  -- keeps a visit's doctor in the visit's own clinic.
  unique (vet_id, id)
);

comment on table vet_doctors is
  'The doctors at each clinic (vets row). Filled as visits are recorded; corrected on the clinic''s page.';
comment on column vet_doctors.active is
  'False hides the doctor from suggestions. Their visits keep the link.';

create unique index if not exists vet_doctors_vet_key_idx
  on vet_doctors (vet_id, vet_doctor_key(name));

-- Same trim rule as vet_appointments.doctor_name (0074): surrounding
-- whitespace of any kind goes, and a name must be left.
create or replace function vet_doctors_tidy_name()
returns trigger
language plpgsql
as $$
begin
  new.name := nullif(regexp_replace(new.name, '^\s+|\s+$', '', 'g'), '');
  return new;
end;
$$;

drop trigger if exists vet_doctors_tidy_name on vet_doctors;
create trigger vet_doctors_tidy_name
  before insert or update of name on vet_doctors
  for each row execute function vet_doctors_tidy_name();

alter table vet_doctors drop constraint if exists vet_doctors_name_tidy;
alter table vet_doctors add constraint vet_doctors_name_tidy
  check (name <> '' and name !~ '^\s|\s$');

-- Who may do what mirrors vets and vet_appointments. Every role that books
-- visits (admin, management, staff, vet) reads and writes the list, since
-- booking a visit can add a name. Volunteers read vet_appointments, so
-- they read this too.
alter table vet_doctors enable row level security;

drop policy if exists admin_all_vet_doctors on vet_doctors;
create policy admin_all_vet_doctors on vet_doctors
  for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');

drop policy if exists management_rw_vet_doctors on vet_doctors;
create policy management_rw_vet_doctors on vet_doctors
  for all using (current_user_role() = 'management') with check (current_user_role() = 'management');

drop policy if exists staff_rw_vet_doctors on vet_doctors;
create policy staff_rw_vet_doctors on vet_doctors
  for all using (current_user_role() = 'staff') with check (current_user_role() = 'staff');

drop policy if exists vet_rw_vet_doctors on vet_doctors;
create policy vet_rw_vet_doctors on vet_doctors
  for all using (current_user_role() = 'vet') with check (current_user_role() = 'vet');

drop policy if exists volunteer_read_vet_doctors on vet_doctors;
create policy volunteer_read_vet_doctors on vet_doctors
  for select using (current_user_role() = 'volunteer');

revoke all on vet_doctors from public, anon, authenticated;
grant select, insert, update, delete on vet_doctors to authenticated;
grant all on vet_doctors to service_role;

-- ---------------------------------------------------------------------------
-- 2. A visit's doctor
-- ---------------------------------------------------------------------------

alter table vet_appointments add column if not exists doctor_id uuid;

comment on column vet_appointments.doctor_id is
  'The doctor, from the clinic''s list (vet_doctors). Set from doctor_name by trigger; null when no clinic or no doctor.';

-- (vet_id, doctor_id) rather than doctor_id alone: a visit's doctor must
-- belong to the visit's clinic. MATCH SIMPLE, so a null in either column
-- is not checked. No action on delete: a doctor who has visits cannot be
-- deleted (only merged or made inactive), and deleting a clinic with
-- visits was already refused by vet_appointments.vet_id.
alter table vet_appointments drop constraint if exists vet_appointments_doctor_fk;
alter table vet_appointments add constraint vet_appointments_doctor_fk
  foreign key (vet_id, doctor_id) references vet_doctors (vet_id, id);

create index if not exists vet_appointments_doctor_id_idx
  on vet_appointments (doctor_id) where doctor_id is not null;

-- Links a visit to its clinic's doctor. Named to fire before 0074's
-- vet_appointments_tidy_doctor_name (triggers run in name order), so it
-- trims the name itself rather than relying on that one. That one then has
-- nothing left to do.
--
--   doctor_id set or changed explicitly  -> doctor_name follows the list
--   no name                              -> no doctor
--   no clinic                            -> free text, no link
--   otherwise                            -> keep the current link if it
--                                           names the same doctor in the
--                                           same clinic, else find or add
--                                           the name in the clinic's list
create or replace function vet_appointments_link_doctor()
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
    select name into v_list_name from vet_doctors where id = new.doctor_id;
    new.doctor_name := v_list_name;
    return new;
  end if;

  if v_name is null then
    new.doctor_id := null;
    new.doctor_name := null;
    return new;
  end if;

  if new.vet_id is null then
    new.doctor_id := null;
    new.doctor_name := v_name;
    return new;
  end if;

  if new.doctor_id is not null then
    select id, name into v_id, v_list_name from vet_doctors
     where id = new.doctor_id
       and vet_id = new.vet_id
       and vet_doctor_key(name) = vet_doctor_key(v_name);
    if found then
      new.doctor_name := v_list_name;
      return new;
    end if;
  end if;

  select id, name into v_id, v_list_name from vet_doctors
   where vet_id = new.vet_id and vet_doctor_key(name) = vet_doctor_key(v_name);
  if not found then
    insert into vet_doctors (vet_id, name) values (new.vet_id, v_name)
      on conflict do nothing
      returning id, name into v_id, v_list_name;
    if v_id is null then
      -- Another transaction added the same name a moment ago.
      select id, name into v_id, v_list_name from vet_doctors
       where vet_id = new.vet_id and vet_doctor_key(name) = vet_doctor_key(v_name);
    end if;
  end if;

  new.doctor_id := v_id;
  new.doctor_name := v_list_name;
  return new;
end;
$$;

drop trigger if exists vet_appointments_link_doctor on vet_appointments;
create trigger vet_appointments_link_doctor
  before insert or update of doctor_name, doctor_id, vet_id on vet_appointments
  for each row execute function vet_appointments_link_doctor();

-- A rename on the list is written onto every visit linked to that doctor.
-- The bypass is set and restored around this one UPDATE, and the UPDATE
-- touches only doctor_name (see the header).
create or replace function vet_doctors_propagate_name()
returns trigger
language plpgsql
as $$
declare
  v_bypass text := coalesce(current_setting('app.deceased_lock_bypass', true), '');
begin
  perform set_config('app.deceased_lock_bypass', 'on', true);
  update vet_appointments set doctor_name = new.name where doctor_id = new.id;
  perform set_config('app.deceased_lock_bypass', v_bypass, true);
  return null;
end;
$$;

drop trigger if exists vet_doctors_propagate_name on vet_doctors;
create trigger vet_doctors_propagate_name
  after update of name on vet_doctors
  for each row when (old.name is distinct from new.name)
  execute function vet_doctors_propagate_name();

-- Folds one doctor into another at the same clinic: their visits move to
-- p_into, which gives them p_into's spelling, and p_from is deleted.
-- This is how a typo or "Somchai" / "Dr Somchai" gets fixed. Security
-- invoker: RLS on both tables decides who may do it. The role check is
-- written `is null or not in`, because current_user_role() is null for
-- anon or an archived user (0082).
create or replace function merge_vet_doctors(p_from uuid, p_into uuid)
returns vet_doctors
language plpgsql
security invoker
as $$
declare
  v_from vet_doctors;
  v_into vet_doctors;
  v_bypass text := coalesce(current_setting('app.deceased_lock_bypass', true), '');
begin
  if current_user_role() is null
     or current_user_role() not in ('admin', 'management', 'staff', 'vet') then
    raise exception 'Not allowed to merge doctors.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_from from vet_doctors where id = p_from;
  select * into v_into from vet_doctors where id = p_into;
  if v_from.id is null or v_into.id is null then
    raise exception 'Doctor not found.' using errcode = 'no_data_found';
  end if;
  if v_from.id = v_into.id then
    return v_into;
  end if;
  if v_from.vet_id <> v_into.vet_id then
    raise exception 'Both doctors must be at the same clinic.' using errcode = 'check_violation';
  end if;

  perform set_config('app.deceased_lock_bypass', 'on', true);
  update vet_appointments set doctor_id = v_into.id where doctor_id = v_from.id;
  perform set_config('app.deceased_lock_bypass', v_bypass, true);

  delete from vet_doctors where id = v_from.id;
  return v_into;
end;
$$;

revoke all on function vet_doctor_key(text) from public, anon;
grant execute on function vet_doctor_key(text) to authenticated, service_role;
revoke all on function vet_doctors_tidy_name() from public, anon;
revoke all on function vet_appointments_link_doctor() from public, anon;
revoke all on function vet_doctors_propagate_name() from public, anon;
revoke all on function merge_vet_doctors(uuid, uuid) from public, anon;
grant execute on function merge_vet_doctors(uuid, uuid) to authenticated, service_role;

-- Backfill: link the names already typed. The trigger does the work, so
-- the rule is the same as for new visits. Deceased residents' visits are
-- included, under the same scoped bypass.
select set_config('app.deceased_lock_bypass', 'on', true);
update vet_appointments set doctor_name = doctor_name
 where doctor_name is not null and vet_id is not null and doctor_id is null;
select set_config('app.deceased_lock_bypass', '', true);

-- ---------------------------------------------------------------------------
-- 3. Booking with a doctor in one call
-- ---------------------------------------------------------------------------

-- decisions.md, 2026-09-24: the booking form sets the doctor in a second
-- write after this RPC. The two are not one transaction, and the note said
-- to fold the parameter in "the next time a schema PR touches vet visits".
-- This is that PR. p_doctor_name is last and defaults to null, so today's
-- calls (vet-visits/new, the assistant) resolve unchanged. The 6-arg
-- version is dropped because the two would be ambiguous. The link
-- trigger turns the name into a doctor on the clinic's list.
drop function if exists schedule_bulk_appointments(uuid[], uuid, timestamptz, text, text, appointment_status);
drop function if exists schedule_bulk_appointments(uuid[], uuid, timestamptz, text, text, appointment_status, text);

create function schedule_bulk_appointments(
  p_resident_ids uuid[],
  p_vet_id uuid,
  p_appointment_date timestamptz,
  p_reason text default null,
  p_notes text default null,
  p_status appointment_status default 'scheduled',
  p_doctor_name text default null
)
returns setof vet_appointments
language plpgsql
security invoker
as $$
declare
  v_bulk_id uuid;
begin
  insert into bulk_appointments (vet_id, appointment_date, reason, created_by)
  values (p_vet_id, p_appointment_date, p_reason, auth.uid())
  returning id into v_bulk_id;

  return query
    insert into vet_appointments (
      resident_id, vet_id, appointment_date, reason, notes, status,
      bulk_appointment_id, created_by, doctor_name
    )
    select
      resident_id, p_vet_id, p_appointment_date, p_reason, p_notes, p_status,
      v_bulk_id, auth.uid(), p_doctor_name
    from unnest(p_resident_ids) as resident_id
    returning *;
end;
$$;

revoke all on function schedule_bulk_appointments(uuid[], uuid, timestamptz, text, text, appointment_status, text) from public, anon;
grant execute on function schedule_bulk_appointments(uuid[], uuid, timestamptz, text, text, appointment_status, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. Which clinic a vet account belongs to
-- ---------------------------------------------------------------------------

alter table user_roles add column if not exists vet_id uuid references vets (id) on delete set null;

comment on column user_roles.vet_id is
  'The clinic a vet account belongs to. Only for role vet; cleared when the role changes.';

alter table user_roles drop constraint if exists user_roles_vet_id_only_for_vets;
alter table user_roles add constraint user_roles_vet_id_only_for_vets
  check (vet_id is null or role = 'vet');

create or replace function user_roles_clear_vet_id()
returns trigger
language plpgsql
as $$
begin
  if new.role <> 'vet' then
    new.vet_id := null;
  end if;
  return new;
end;
$$;

drop trigger if exists user_roles_clear_vet_id on user_roles;
create trigger user_roles_clear_vet_id
  before insert or update of role, vet_id on user_roles
  for each row execute function user_roles_clear_vet_id();

revoke all on function user_roles_clear_vet_id() from public, anon;

-- Like current_user_role(): security definer, because only an admin can
-- read user_roles. Null for anyone without a live vet account with a
-- clinic.
create or replace function current_user_vet_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select vet_id from user_roles
   where user_id = auth.uid() and archived_at is null and role = 'vet';
$$;

revoke all on function current_user_vet_id() from public, anon;
grant execute on function current_user_vet_id() to authenticated, service_role;

notify pgrst, 'reload schema';
