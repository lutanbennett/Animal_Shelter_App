-- consumer: none
--
-- R5's fourth conversion (docs/roles-and-permissions.md §12, §15; decisions/
-- 2026-10-06-perm-convert-people.md): the people-and-clinics tables stop asking WHO the caller is and
-- start asking WHAT the caller may do. Same shape as 0135 / 0144 / 0145. No app code reads anything
-- new, so nothing is ordered against a deploy.
--
--   contacts            contacts.directory (read / edit), insert: contacts.add, and sees_all_contacts()
--   shelter_friends     friends.manage; the read also stays open to whoever reads contacts (see below)
--   vets                read clinics.list, clinics.doctors or visit.book; write clinics.list (Edit)
--   vet_doctors         read clinics.list, clinics.doctors or visit.book; write clinics.doctors
--                       (insert also visit.book: the booking trigger adds a typed doctor)
--   vet_doctor_clinics  as vet_doctors, and a doctor with a login is still off limits to non-admins
--   bulk_appointments   visit.book (the clinic bookings; Yes/No, so one cell answers all four commands)
--
-- THE SHAPE (copied from 0135): one policy per command, `(select has_permission(…))` so Postgres
-- plans it once per statement, no role named.
--
-- sees_all_contacts() is the one scope question that is not a cell, for the reason 0144's
-- sees_all_residents() exists. 0126 narrowed contacts for vets and volunteers by taking their policies
-- OFF the table and giving each a view (vet_contacts, volunteer_contacts). A cell-only policy would
-- hand the whole table, phone, address and notes, to anything that holds Read on contacts.directory and
-- borrows the volunteer floor, OR-ed beside the view. So the function asks two things:
-- roles.scope_contacts = 'full', and the role does not borrow the volunteer floor (legacy_role is not
-- 'volunteer'). The 2IC and both Heads are scope name_type on the volunteer floor; the Director's draft
-- gives the 2IC Edit on contacts.directory and contacts.add, and until she has a price-free view of her
-- own she reaches the table through nothing, as today. This mirrors the volunteer_contacts gate and goes
-- away with the legacy_role bridge. It is NOT asked on the other five tables: they hold no address-book
-- data a scope narrows.
--
-- shelter_friends READ is wider than the cell, on purpose. The contacts pages (src/app/contacts/page.tsx,
-- contacts/[id]/page.tsx) read a contact's Shelter Friend profile for the badge, the chip and the card
-- for "every signed-in role" that reads contacts; staff do (contacts.directory Read) and do not hold
-- friends.manage (N3). Asking friends.manage alone would remove the badge and the card from staff, a visible
-- change this stream was not asked to make. So read = friends.manage OR (contacts.directory Read AND
-- sees_all_contacts()). N3 stays open; closing it is an app change first.
--
-- WHAT IS DROPPED, WHAT STAYS
--   Dropped: management_* / staff_* on the six tables, found in pg_policies, not assumed.
--   Left alone: admin_all_* (R6) and every vet_* policy (Vet is last; the clinics rename is parked), and
--   so the vet's clinic-scoped writes on vet_doctors / vet_doctor_clinics / bulk_appointments are as they were.
--
-- CLOSINGS (a hand-built request only; no button changes):
--   C6  staff could update and delete any contact; they hold contacts.directory Read, so they now cannot.
--   C7  (staff half, update / delete / merge) staff could write vet_doctors and vet_doctor_clinics; the cell
--       is Management's. INSERT stays open to staff through visit.book (see above), so C7 stays known for it.
--
-- Written to be safely re-runnable. To undo: drop the *_perm policies and sees_all_contacts(), then
-- re-create the management_* / staff_* policies from 0001, 0102 and 0076.

-- ---------------------------------------------------------------------------
-- 1. The scope question contacts needs.
-- ---------------------------------------------------------------------------
create or replace function sees_all_contacts()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id and r.archived_at is null
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and r.scope_contacts = 'full'
       and r.legacy_role is not null
       and r.legacy_role <> 'volunteer'
  );
$$;

comment on function sees_all_contacts() is
  'Does the caller''s live role read the whole address book (roles.scope_contacts = full) and not only name and phone through volunteer_contacts or name and type through vet_contacts (0126)? False for no role, an archived person or role, a vet and anything on the volunteer floor. Asked as (select sees_all_contacts()) beside has_permission() in the converted contacts policies.';

revoke all on function sees_all_contacts() from public, anon;
grant execute on function sees_all_contacts() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Drop the role-named policies on the six tables, and our own on a re-run.
-- ---------------------------------------------------------------------------
do $drop$
declare
  p record;
begin
  for p in
    select tablename, policyname from pg_policies
     where schemaname = 'public'
       and tablename in ('contacts', 'shelter_friends', 'vets', 'vet_doctors', 'vet_doctor_clinics', 'bulk_appointments')
       and (policyname like 'management\_%' or policyname like 'staff\_%' or policyname like '%\_perm')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end
$drop$;

-- ---------------------------------------------------------------------------
-- 2b. merge_vet_doctors(), 0125's body with one check added (see the comment inside).
-- ---------------------------------------------------------------------------
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
  -- 0147: a delete the policy filters out is not an error, so without this a caller who may book a visit but not
  -- remove a doctor (visit.book now lets them add one) would leave a half-merge: links copied, visits repointed,
  -- p_from still listed. Raising rolls the whole merge back.
  if not found then
    raise exception 'Not allowed to merge doctors.' using errcode = 'insufficient_privilege';
  end if;
  select * into v_into from vet_doctors where id = p_into;
  return v_into;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. contacts
-- ---------------------------------------------------------------------------
create policy contacts_select_perm on contacts for select to authenticated
  using ((select has_permission('contacts.directory', 'read')) and (select sees_all_contacts()));
create policy contacts_insert_perm on contacts for insert to authenticated
  with check ((select has_permission('contacts.add')) and (select sees_all_contacts()));
create policy contacts_update_perm on contacts for update to authenticated
  using ((select has_permission('contacts.directory')) and (select sees_all_contacts()))
  with check ((select has_permission('contacts.directory')) and (select sees_all_contacts()));
create policy contacts_delete_perm on contacts for delete to authenticated
  using ((select has_permission('contacts.directory')) and (select sees_all_contacts()));

-- ---------------------------------------------------------------------------
-- 4. shelter_friends
-- ---------------------------------------------------------------------------
create policy shelter_friends_select_perm on shelter_friends for select to authenticated
  using (
    (select has_permission('friends.manage'))
    or ((select has_permission('contacts.directory', 'read')) and (select sees_all_contacts()))
  );
create policy shelter_friends_insert_perm on shelter_friends for insert to authenticated
  with check ((select has_permission('friends.manage')));
create policy shelter_friends_update_perm on shelter_friends for update to authenticated
  using ((select has_permission('friends.manage')))
  with check ((select has_permission('friends.manage')));
create policy shelter_friends_delete_perm on shelter_friends for delete to authenticated
  using ((select has_permission('friends.manage')));

-- ---------------------------------------------------------------------------
-- 5. vets (the clinics)
-- ---------------------------------------------------------------------------
create policy vets_select_perm on vets for select to authenticated
  using (
    (select has_permission('clinics.list', 'read'))
    or (select has_permission('clinics.doctors'))
    or (select has_permission('visit.book'))
  );
create policy vets_insert_perm on vets for insert to authenticated
  with check ((select has_permission('clinics.list')));
create policy vets_update_perm on vets for update to authenticated
  using ((select has_permission('clinics.list')))
  with check ((select has_permission('clinics.list')));
create policy vets_delete_perm on vets for delete to authenticated
  using ((select has_permission('clinics.list')));

-- ---------------------------------------------------------------------------
-- 6. vet_doctors
-- ---------------------------------------------------------------------------
create policy vet_doctors_select_perm on vet_doctors for select to authenticated
  using (
    (select has_permission('clinics.list', 'read'))
    or (select has_permission('clinics.doctors'))
    or (select has_permission('visit.book'))
  );
-- INSERT also answers visit.book: vet_appointments_link_doctor() (security invoker) finds or ADDS the
-- clinic's doctor when a booking or an edit carries a typed name, so whoever may book a visit must be
-- able to add the doctor it names, as staff could. Update, delete and merge stay clinics.doctors.
create policy vet_doctors_insert_perm on vet_doctors for insert to authenticated
  with check ((select has_permission('clinics.doctors')) or (select has_permission('visit.book')));
create policy vet_doctors_update_perm on vet_doctors for update to authenticated
  using ((select has_permission('clinics.doctors')))
  with check ((select has_permission('clinics.doctors')));
create policy vet_doctors_delete_perm on vet_doctors for delete to authenticated
  using ((select has_permission('clinics.doctors')));

-- ---------------------------------------------------------------------------
-- 7. vet_doctor_clinics (a doctor with a login is still off limits to non-admins, as 0102 had it)
-- ---------------------------------------------------------------------------
create policy vet_doctor_clinics_select_perm on vet_doctor_clinics for select to authenticated
  using (
    (select has_permission('clinics.list', 'read'))
    or (select has_permission('clinics.doctors'))
    or (select has_permission('visit.book'))
  );
create policy vet_doctor_clinics_insert_perm on vet_doctor_clinics for insert to authenticated
  with check (
    ((select has_permission('clinics.doctors')) or (select has_permission('visit.book')))
    and not exists (select 1 from vet_doctors d where d.id = vet_doctor_clinics.doctor_id and d.user_id is not null)
  );
create policy vet_doctor_clinics_update_perm on vet_doctor_clinics for update to authenticated
  using (
    (select has_permission('clinics.doctors'))
    and not exists (select 1 from vet_doctors d where d.id = vet_doctor_clinics.doctor_id and d.user_id is not null)
  )
  with check (
    (select has_permission('clinics.doctors'))
    and not exists (select 1 from vet_doctors d where d.id = vet_doctor_clinics.doctor_id and d.user_id is not null)
  );
create policy vet_doctor_clinics_delete_perm on vet_doctor_clinics for delete to authenticated
  using (
    (select has_permission('clinics.doctors'))
    and not exists (select 1 from vet_doctors d where d.id = vet_doctor_clinics.doctor_id and d.user_id is not null)
  );

-- ---------------------------------------------------------------------------
-- 8. bulk_appointments (the clinic bookings; Yes/No, so Edit includes delete)
-- ---------------------------------------------------------------------------
create policy bulk_appointments_select_perm on bulk_appointments for select to authenticated
  using ((select has_permission('visit.book')));
create policy bulk_appointments_insert_perm on bulk_appointments for insert to authenticated
  with check ((select has_permission('visit.book')));
create policy bulk_appointments_update_perm on bulk_appointments for update to authenticated
  using ((select has_permission('visit.book')))
  with check ((select has_permission('visit.book')));
create policy bulk_appointments_delete_perm on bulk_appointments for delete to authenticated
  using ((select has_permission('visit.book')));

notify pgrst, 'reload schema';
