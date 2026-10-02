-- A doctor can work at more than one clinic, and a vet login can see more than
-- one (backlog, "A doctor can work at more than one clinic", Lutan 2026-10-01;
-- schema half). Scope and decisions are Lutan's, recorded in the item and in
-- docs/decisions/2026-10-02-doctor-multi-clinic-schema.md.
--
-- ## The model
--
--   vet_doctors          the PERSON. One row per doctor, however many clinics.
--                        Gains user_id: nullable, unique, the login that is
--                        this doctor (one login is one doctor; a doctor has
--                        at most one login). Most doctors never get one.
--   vet_doctor_clinics   the LINK: (vet_id, doctor_id) is the primary key, plus
--                        `active` (false = no longer works there; the row
--                        stays because past visits reference it) and name_key
--                        (the doctor's vet_doctor_key, so "one spelling per
--                        clinic" is a plain unique index).
--
-- ## The guarantee that moved
--
-- vet_appointments had a composite foreign key (vet_id, doctor_id) ->
-- vet_doctors (vet_id, id): a visit's doctor works at the visit's clinic. A
-- link table does not break that, it is simply the better target. The same
-- composite key now points at vet_doctor_clinics (vet_id, doctor_id), so the
-- database still refuses a visit whose doctor has no link row to the visit's
-- clinic, for every writer and without a trigger to forget. MATCH SIMPLE as
-- before, so a visit with no clinic or no doctor is not checked. No action on
-- delete: a link a visit uses cannot be deleted, which is why "removed from a
-- clinic" is active = false and a doctor keeps their past visits there.
--
-- ## A vet login's clinics: one source of truth
--
-- user_vet_clinics is NOT created. A vet login's clinics are the clinics of
-- the doctor it is linked to (vet_doctors.user_id), counting only links that
-- are active. current_user_vet_ids() returns that set.
--
-- Transition: user_roles.vet_id (0102) is still what Settings -> Security
-- writes, and some live vet logins rely on it. Until the feature half moves
-- Settings onto the doctor link and retires the column, current_user_vet_ids()
-- also includes user_roles.vet_id, so no existing vet loses or gains a clinic
-- when this lands and the page keeps working. It is a union of two sources
-- only until then; nothing new writes the second.
--
-- current_user_vet_id() (singular) is KEPT, unchanged, but nothing in SQL
-- calls it any more: current_vet_resident_ids and vet_owns_visit (0108/0124)
-- and the five 0110 policies were the only callers (checked against the dev
-- catalogue: functions, policies and views) and all now use
-- current_user_vet_ids(). The TypeScript side still reads user_roles.vet_id
-- directly (src/lib/vets/scope.ts); that is the feature half.
--
-- ## Escalation, and what stops it
--
-- Because a vet's clinics now come from a roster row, whoever can edit the
-- roster could widen a vet's reach. So:
--   * user_id may be set or cleared only by an admin at aal2 (the 0100 rule for
--     user_roles), enforced by trigger, so staff and vets cannot link
--     themselves to another clinic's doctor.
--   * links of a doctor who has a login are written only by an admin.
--   * a vet writes only links for their own clinics, and only for a doctor
--     whose links are all within their own clinics.
--
-- ## Compatibility with the code that exists today
--
-- vet_doctors.vet_id stays, now nullable and meaning "the clinic this doctor
-- was first listed at", so the current clinic pages keep working untouched:
-- inserting a doctor with a vet_id creates its link by trigger. It is
-- deprecated; the feature half reads the link table and drops it. Existing
-- duplicate rows (the same person at two clinics) are NOT merged here and are
-- not guessed by name; merge_vet_doctors is generalised below so the "same
-- person as..." merge the feature half builds has a function to call.
--
-- Re-runnable: every statement is guarded, `or replace`, or drops first.

-- ---------------------------------------------------------------------------
-- 1. The person, and the link
-- ---------------------------------------------------------------------------

alter table vet_doctors add column if not exists user_id uuid references auth.users (id) on delete set null;
alter table vet_doctors alter column vet_id drop not null;

comment on column vet_doctors.user_id is
  'The login that is this doctor (0125). Unique both ways: one login, one doctor. Null for most doctors. Set only by an admin at aal2.';
comment on column vet_doctors.vet_id is
  'Deprecated (0125): the clinic this doctor was first listed at. The clinics a doctor works at are vet_doctor_clinics.';
comment on table vet_doctors is
  'A doctor, as a person (0125). Which clinics they work at is vet_doctor_clinics. Filled as visits are recorded; corrected on the clinic''s page.';

create unique index if not exists vet_doctors_user_id_key on vet_doctors (user_id) where user_id is not null;

-- A clinic deleted must not take a doctor who also works elsewhere with it.
-- (Its links are removed by their own cascade, and refused if visits use them.)
alter table vet_doctors drop constraint if exists vet_doctors_vet_id_fkey;
alter table vet_doctors add constraint vet_doctors_vet_id_fkey
  foreign key (vet_id) references vets (id) on delete set null;

create table if not exists vet_doctor_clinics (
  vet_id uuid not null references vets (id) on delete cascade,
  doctor_id uuid not null references vet_doctors (id) on delete cascade,
  active boolean not null default true,
  -- vet_doctor_key(doctor name), kept by trigger; never written by callers.
  name_key text not null,
  created_by uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (vet_id, doctor_id)
);

comment on table vet_doctor_clinics is
  'Which clinics a doctor works at (0125). The target of vet_appointments'' composite key, which keeps a visit''s doctor at the visit''s clinic.';
comment on column vet_doctor_clinics.active is
  'False: no longer works at this clinic. The row stays because past visits there reference it.';

-- The name-key uniqueness, per clinic: one spelling of a name per clinic.
create unique index if not exists vet_doctor_clinics_vet_key_idx
  on vet_doctor_clinics (vet_id, name_key);
create index if not exists vet_doctor_clinics_doctor_idx
  on vet_doctor_clinics (doctor_id);

create or replace function vet_doctor_clinics_set_key()
returns trigger
language plpgsql
as $$
begin
  select vet_doctor_key(d.name) into new.name_key from vet_doctors d where d.id = new.doctor_id;
  return new;
end;
$$;

drop trigger if exists vet_doctor_clinics_set_key on vet_doctor_clinics;
create trigger vet_doctor_clinics_set_key
  before insert or update of doctor_id on vet_doctor_clinics
  for each row execute function vet_doctor_clinics_set_key();

-- Renaming a doctor re-keys their links; a clash with another doctor at the
-- same clinic is the same unique violation a clash on insert is.
create or replace function vet_doctors_sync_link_keys()
returns trigger
language plpgsql
as $$
begin
  update vet_doctor_clinics set name_key = vet_doctor_key(new.name) where doctor_id = new.id;
  return null;
end;
$$;

-- Named to fire before vet_doctors_propagate_name (triggers run in name order),
-- so by the time that rewrites the visits the links already carry the new key.
drop trigger if exists vet_doctors_a_sync_link_keys on vet_doctors;
create trigger vet_doctors_a_sync_link_keys
  after update of name on vet_doctors
  for each row when (old.name is distinct from new.name)
  execute function vet_doctors_sync_link_keys();

-- A doctor inserted with a vet_id (the clinic page, the visit trigger) works
-- at that clinic. This is what keeps today's code correct unchanged.
create or replace function vet_doctors_link_home_clinic()
returns trigger
language plpgsql
as $$
begin
  if new.vet_id is not null then
    insert into vet_doctor_clinics (vet_id, doctor_id) values (new.vet_id, new.id)
      on conflict (vet_id, doctor_id) do nothing;
  end if;
  return null;
end;
$$;

drop trigger if exists vet_doctors_link_home_clinic on vet_doctors;
create trigger vet_doctors_link_home_clinic
  after insert on vet_doctors
  for each row execute function vet_doctors_link_home_clinic();

-- Existing rows: each doctor works at the clinic they are listed at. Nothing
-- is merged or guessed; two rows for one person stay two rows.
insert into vet_doctor_clinics (vet_id, doctor_id, active, name_key)
select d.vet_id, d.id, d.active, vet_doctor_key(d.name)
  from vet_doctors d
 where d.vet_id is not null
on conflict (vet_id, doctor_id) do nothing;

-- One spelling per clinic now lives on the link; the old index on the person
-- row would stop a doctor who works elsewhere being listed here.
drop index if exists vet_doctors_vet_key_idx;

-- ---------------------------------------------------------------------------
-- 2. Who may set a doctor's login
-- ---------------------------------------------------------------------------

-- auth.uid() is null for the service role and the SQL editor, which are not
-- the Data API's callers and are left alone (as user_roles' aal2 policies do).
create or replace function vet_doctors_guard_login()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' and new.user_id is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.user_id is not distinct from old.user_id then
    return new;
  end if;
  if auth.uid() is not null
     and (current_user_role() is distinct from 'admin'
          or (select auth.jwt() ->> 'aal') is distinct from 'aal2') then
    raise exception 'Only an admin signed in with two-step verification can link a doctor to a login.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

drop trigger if exists vet_doctors_guard_login on vet_doctors;
create trigger vet_doctors_guard_login
  before insert or update of user_id on vet_doctors
  for each row execute function vet_doctors_guard_login();

-- ---------------------------------------------------------------------------
-- 3. A visit's doctor works at the visit's clinic (the moved guarantee)
-- ---------------------------------------------------------------------------

alter table vet_appointments drop constraint if exists vet_appointments_doctor_fk;
alter table vet_doctors drop constraint if exists vet_doctors_vet_id_id_key;
alter table vet_appointments add constraint vet_appointments_doctor_fk
  foreign key (vet_id, doctor_id) references vet_doctor_clinics (vet_id, doctor_id);

-- As 0102, reading the clinic's list through the link table. A name typed at a
-- clinic finds that clinic's doctor, or adds one there.
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
    select d.id, d.name into v_id, v_list_name
      from vet_doctors d
      join vet_doctor_clinics c on c.doctor_id = d.id
     where d.id = new.doctor_id
       and c.vet_id = new.vet_id
       and c.name_key = vet_doctor_key(v_name);
    if found then
      new.doctor_name := v_list_name;
      return new;
    end if;
  end if;

  select d.id, d.name into v_id, v_list_name
    from vet_doctors d
    join vet_doctor_clinics c on c.doctor_id = d.id
   where c.vet_id = new.vet_id and c.name_key = vet_doctor_key(v_name);
  if not found then
    begin
      -- The new doctor's link to this clinic is made by its insert trigger.
      insert into vet_doctors (vet_id, name) values (new.vet_id, v_name)
        returning id, name into v_id, v_list_name;
    exception when unique_violation then
      -- Another transaction listed the same name here a moment ago.
      select d.id, d.name into v_id, v_list_name
        from vet_doctors d
        join vet_doctor_clinics c on c.doctor_id = d.id
       where c.vet_id = new.vet_id and c.name_key = vet_doctor_key(v_name);
    end;
  end if;

  new.doctor_id := v_id;
  new.doctor_name := v_list_name;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Merging: the same person listed twice
-- ---------------------------------------------------------------------------

-- 0102's merge, for the person model: p_into takes every clinic p_from works
-- at, p_from's visits, and p_from's login if p_into has none; p_from is
-- deleted. The clinics need not match, which is the "same person as..." merge
-- (the one place two rows for one doctor are joined, by a person deciding,
-- not by name). A doctor with a login is merged by an admin only, and two
-- logins are never merged. Security invoker: RLS decides who may write what.
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
  if v_from.user_id is not null and v_into.user_id is not null then
    raise exception 'Both doctors have a login; they cannot be merged.' using errcode = 'check_violation';
  end if;
  if (v_from.user_id is not null or v_into.user_id is not null)
     and current_user_role() <> 'admin' then
    raise exception 'Only an admin can merge a doctor who has a login.' using errcode = 'insufficient_privilege';
  end if;

  -- Two rows for one person usually share a name, and p_into's link at a
  -- clinic p_from also works at would then clash with p_from's own on
  -- (vet_id, name_key). p_from's links go in a placeholder key first; they are
  -- deleted with p_from below.
  update vet_doctor_clinics set name_key = 'merging ' || p_from where doctor_id = p_from;

  insert into vet_doctor_clinics (vet_id, doctor_id, active)
    select c.vet_id, p_into, c.active from vet_doctor_clinics c where c.doctor_id = p_from
    on conflict (vet_id, doctor_id) do nothing;

  perform set_config('app.deceased_lock_bypass', 'on', true);
  update vet_appointments set doctor_id = p_into where doctor_id = p_from;
  perform set_config('app.deceased_lock_bypass', v_bypass, true);

  if v_from.user_id is not null then
    update vet_doctors set user_id = null where id = p_from;
    update vet_doctors set user_id = v_from.user_id where id = p_into;
  end if;

  delete from vet_doctors where id = p_from;
  select * into v_into from vet_doctors where id = p_into;
  return v_into;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. A vet login's clinics
-- ---------------------------------------------------------------------------

-- Security definer for the reason current_user_role() is: only an admin can
-- read user_roles. Empty for anyone who is not a live vet account.
create or replace function current_user_vet_ids()
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(distinct s.vet_id), '{}'::uuid[])
    from (
      select c.vet_id
        from vet_doctors d
        join vet_doctor_clinics c on c.doctor_id = d.id
       where d.user_id = auth.uid() and c.active
      union
      select ur.vet_id
        from user_roles ur
       where ur.user_id = auth.uid() and ur.vet_id is not null
    ) s
   where exists (
     select 1 from user_roles
      where user_id = auth.uid() and archived_at is null and role = 'vet'
   );
$$;

comment on function current_user_vet_ids() is
  'The clinics the calling vet login works at: its linked doctor''s active clinics, plus user_roles.vet_id until the feature half retires it (0125). Empty for anyone who is not a live vet account.';

revoke all on function current_user_vet_ids() from public, anon;
grant execute on function current_user_vet_ids() to authenticated, service_role;

-- 0124's version (archived visits give a vet no sight), over the set.
create or replace function current_vet_resident_ids()
returns setof uuid
language sql
stable
security definer
set search_path to 'public'
as $$
  select va.resident_id
    from vet_appointments va
   where va.vet_id = any ((select current_user_vet_ids())::uuid[])
     and va.archived_at is null
  union
  select p.resident_id
    from prescriptions p
    join vet_appointments va on va.id = p.vet_appointment_id
   where va.vet_id = any ((select current_user_vet_ids())::uuid[])
     and va.archived_at is null
     and p.archived_at is null
  union
  select pr.resident_id
    from procedures pr
    join vet_appointments va on va.id = pr.vet_appointment_id
   where va.vet_id = any ((select current_user_vet_ids())::uuid[])
     and va.archived_at is null
  union
  select bt.resident_id
    from blood_tests bt
    join vet_appointments va on va.id = bt.vet_appointment_id
   where va.vet_id = any ((select current_user_vet_ids())::uuid[])
     and va.archived_at is null;
$$;

create or replace function public.vet_owns_visit(p_visit_id uuid)
returns boolean
language sql
stable
as $function$
  select p_visit_id is null
      or exists (
        select 1 from vet_appointments va
         where va.id = p_visit_id
           and va.vet_id = any ((select current_user_vet_ids())::uuid[])
           and va.archived_at is null
      );
$function$;

-- 0110's policies, over the set. A visit may be booked at, moved to or
-- removed from any of the vet's clinics, and no other.
drop policy if exists vet_insert_vet_appointments on vet_appointments;
create policy vet_insert_vet_appointments on vet_appointments
  for insert with check (
    current_user_role() = 'vet'
    and vet_id = any ((select current_user_vet_ids())::uuid[])
    and resident_id in (select current_vet_resident_ids())
  );

drop policy if exists vet_update_vet_appointments on vet_appointments;
create policy vet_update_vet_appointments on vet_appointments
  for update
  using (
    current_user_role() = 'vet'
    and vet_id = any ((select current_user_vet_ids())::uuid[])
    and resident_id in (select current_vet_resident_ids())
  )
  with check (
    current_user_role() = 'vet'
    and vet_id = any ((select current_user_vet_ids())::uuid[])
    and resident_id in (select current_vet_resident_ids())
  );

drop policy if exists vet_delete_vet_appointments on vet_appointments;
create policy vet_delete_vet_appointments on vet_appointments
  for delete using (
    current_user_role() = 'vet'
    and vet_id = any ((select current_user_vet_ids())::uuid[])
    and resident_id in (select current_vet_resident_ids())
  );

drop policy if exists vet_write_bulk_appointments on bulk_appointments;
create policy vet_write_bulk_appointments on bulk_appointments
  for all
  using (current_user_role() = 'vet' and vet_id = any ((select current_user_vet_ids())::uuid[]))
  with check (current_user_role() = 'vet' and vet_id = any ((select current_user_vet_ids())::uuid[]));

-- ---------------------------------------------------------------------------
-- 6. The roster's own policies
-- ---------------------------------------------------------------------------

-- True when every clinic the doctor works at is one of the calling vet's, and
-- the doctor has no login but the caller's own. Invoker: the roster is
-- readable by every role that reaches here.
create or replace function vet_may_edit_doctor(p_doctor uuid)
returns boolean
language sql
stable
as $$
  select current_user_role() = 'vet'
     and not exists (
       select 1 from vet_doctor_clinics c
        where c.doctor_id = p_doctor and c.vet_id <> all ((select current_user_vet_ids())::uuid[])
     )
     and not exists (
       select 1 from vet_doctors d
        where d.id = p_doctor and d.user_id is not null and d.user_id <> auth.uid()
     );
$$;

revoke all on function vet_may_edit_doctor(uuid) from public, anon;
grant execute on function vet_may_edit_doctor(uuid) to authenticated, service_role;

-- vet_doctors: a vet lists a new doctor at one of their clinics, and edits a
-- doctor only while every clinic that doctor works at is theirs.
drop policy if exists vet_write_vet_doctors on vet_doctors;
drop policy if exists vet_insert_vet_doctors on vet_doctors;
drop policy if exists vet_update_vet_doctors on vet_doctors;
drop policy if exists vet_delete_vet_doctors on vet_doctors;

create policy vet_insert_vet_doctors on vet_doctors
  for insert with check (
    current_user_role() = 'vet'
    and vet_id = any ((select current_user_vet_ids())::uuid[])
  );

create policy vet_update_vet_doctors on vet_doctors
  for update
  using (
    vet_may_edit_doctor(id)
    and exists (
      select 1 from vet_doctor_clinics c
       where c.doctor_id = vet_doctors.id and c.vet_id = any ((select current_user_vet_ids())::uuid[])
    )
  )
  with check (vet_may_edit_doctor(id));

create policy vet_delete_vet_doctors on vet_doctors
  for delete using (
    vet_may_edit_doctor(id)
    and exists (
      select 1 from vet_doctor_clinics c
       where c.doctor_id = vet_doctors.id and c.vet_id = any ((select current_user_vet_ids())::uuid[])
    )
  );

-- vet_doctor_clinics: same roles as vet_doctors. Management and staff may not
-- touch the links of a doctor who has a login (that would widen a vet's
-- reach); an admin may.
alter table vet_doctor_clinics enable row level security;

drop policy if exists admin_all_vet_doctor_clinics on vet_doctor_clinics;
create policy admin_all_vet_doctor_clinics on vet_doctor_clinics
  for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');

drop policy if exists management_rw_vet_doctor_clinics on vet_doctor_clinics;
create policy management_rw_vet_doctor_clinics on vet_doctor_clinics
  for all
  using (
    current_user_role() = 'management'
    and not exists (select 1 from vet_doctors d where d.id = doctor_id and d.user_id is not null)
  )
  with check (
    current_user_role() = 'management'
    and not exists (select 1 from vet_doctors d where d.id = doctor_id and d.user_id is not null)
  );

drop policy if exists staff_rw_vet_doctor_clinics on vet_doctor_clinics;
create policy staff_rw_vet_doctor_clinics on vet_doctor_clinics
  for all
  using (
    current_user_role() = 'staff'
    and not exists (select 1 from vet_doctors d where d.id = doctor_id and d.user_id is not null)
  )
  with check (
    current_user_role() = 'staff'
    and not exists (select 1 from vet_doctors d where d.id = doctor_id and d.user_id is not null)
  );

drop policy if exists vet_read_vet_doctor_clinics on vet_doctor_clinics;
create policy vet_read_vet_doctor_clinics on vet_doctor_clinics
  for select using (current_user_role() = 'vet');

drop policy if exists vet_insert_vet_doctor_clinics on vet_doctor_clinics;
create policy vet_insert_vet_doctor_clinics on vet_doctor_clinics
  for insert with check (
    current_user_role() = 'vet'
    and vet_id = any ((select current_user_vet_ids())::uuid[])
    and vet_may_edit_doctor(doctor_id)
  );

drop policy if exists vet_update_vet_doctor_clinics on vet_doctor_clinics;
create policy vet_update_vet_doctor_clinics on vet_doctor_clinics
  for update
  using (
    current_user_role() = 'vet'
    and vet_id = any ((select current_user_vet_ids())::uuid[])
    and vet_may_edit_doctor(doctor_id)
  )
  with check (
    current_user_role() = 'vet'
    and vet_id = any ((select current_user_vet_ids())::uuid[])
    and vet_may_edit_doctor(doctor_id)
  );

drop policy if exists vet_delete_vet_doctor_clinics on vet_doctor_clinics;
create policy vet_delete_vet_doctor_clinics on vet_doctor_clinics
  for delete using (
    current_user_role() = 'vet'
    and vet_id = any ((select current_user_vet_ids())::uuid[])
    and vet_may_edit_doctor(doctor_id)
  );

drop policy if exists volunteer_read_vet_doctor_clinics on vet_doctor_clinics;
create policy volunteer_read_vet_doctor_clinics on vet_doctor_clinics
  for select using (current_user_role() = 'volunteer');

revoke all on vet_doctor_clinics from public, anon, authenticated;
grant select, insert, update, delete on vet_doctor_clinics to authenticated;
grant all on vet_doctor_clinics to service_role;

-- ---------------------------------------------------------------------------
-- 7. Grants for the functions above
-- ---------------------------------------------------------------------------

revoke all on function vet_doctor_clinics_set_key() from public, anon;
revoke all on function vet_doctors_sync_link_keys() from public, anon;
revoke all on function vet_doctors_link_home_clinic() from public, anon;
revoke all on function vet_doctors_guard_login() from public, anon;
revoke all on function vet_appointments_link_doctor() from public, anon;
revoke all on function merge_vet_doctors(uuid, uuid) from public, anon;
grant execute on function merge_vet_doctors(uuid, uuid) to authenticated, service_role;
revoke all on function current_vet_resident_ids() from public, anon;
grant execute on function current_vet_resident_ids() to authenticated, service_role;
revoke all on function vet_owns_visit(uuid) from public, anon;
grant execute on function vet_owns_visit(uuid) to authenticated, service_role;

notify pgrst, 'reload schema';
