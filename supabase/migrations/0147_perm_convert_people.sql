-- consumer: none
--
-- R5's fourth conversion (docs/roles-and-permissions.md §12, §15; decisions/
-- 2026-10-06-perm-convert-people.md): the people-and-clinics tables stop asking WHO the caller is and
-- start asking WHAT the caller may do. Same shape as 0135 / 0144 / 0145. No app code reads anything
-- new, so nothing is ordered against a deploy.
--
--   contacts            contacts.directory (read / edit), insert: contacts.add, and sees_all_contacts()
--   shelter_friends     friends.manage; the read also stays open to whoever reads contacts (see below)
--   vets                read clinics.list or visit.book; write clinics.list (Edit)
--   vet_doctors         read clinics.list, clinics.doctors or visit.book; write clinics.doctors
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
--   C7  (staff half) staff could write vet_doctors and vet_doctor_clinics; the cell is Management's.
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
  using ((select has_permission('clinics.list', 'read')) or (select has_permission('visit.book')));
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
create policy vet_doctors_insert_perm on vet_doctors for insert to authenticated
  with check ((select has_permission('clinics.doctors')));
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
    (select has_permission('clinics.doctors'))
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
