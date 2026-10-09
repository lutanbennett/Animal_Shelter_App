-- consumer: none
--
-- The last two findings of the 2026-10-09 security assessment (docs/security/security-assessment-2026-10-09-dynamic.md;
-- docs/decisions/2026-10-09-clinic-login-allow-lists.md). Both were a deny-list with a fallthrough: written as
-- "everything except the residents case", so they let a clinic login through to whatever nobody thought of.
-- Both decided by Lutan on 2026-10-09. Nothing in the app reads anything new: a doctor screen never showed any of it.
--
--   1. attachments,    the four doctor_*_attachments policies (0110, carried by 0167, renamed by 0172) let a clinic login
--      translations    through for any owner_type NOT in ('resident', 'blood_test', 'procedure'), and
--                      doctor_can_write_attachment() ended `else true`. So a doctor's JWT read, renamed and deleted every
--                      project and maintenance photo record and inserted new ones (144 + 2 rows on dev). They become
--                      allow-lists naming the three clinical owner types; anything else, including an owner type added to
--                      the enum later, fails closed. doctor_read_translations (`table_name <> 'residents'`) is the same
--                      shape and leaked the Thai text of maintenance jobs, recurring jobs, project folders, Shelter
--                      Friends and site pages; it now reads residents' text only, in the doctor's read scope.
--   2. app_users       private.app_users (0146) blanked emails for a clinic login but not names, roles or archived_at, so
--                      an outside clinic saw every login and who is Admin. For a clinic login it now holds that login
--                      itself and the logins of the doctors at its current clinics. The volunteer case (the recurring-jobs
--                      pickers read it) is unchanged: the narrowing asks is_clinic_login(), which only a role scoped to its
--                      own clinic answers true. The role enum column stays; dropping it is perm-drop-enum's.
--
-- Written to be safely re-runnable. To undo: restore the five policies and doctor_can_write_attachment() from 0172, and
-- private.app_users from 0172 (0146's body with 'doctor' for 'vet').

-- ---------------------------------------------------------------------------
-- 1a. The write check: name the three clinical owner types, fail closed on the rest
-- ---------------------------------------------------------------------------
-- 'resident' asks the write scope itself rather than leaving it to the caller: the policies and record_attachment() both
-- ask it already, but a function called "can write" that answers true for any resident is the next fallthrough.
create or replace function public.doctor_can_write_attachment(p_owner_type attachment_owner_type, p_owner_id uuid)
  returns boolean
  language sql
  stable
as $$
  select case p_owner_type::text
    when 'resident' then coalesce(p_owner_id in (select current_clinic_resident_ids()), false)
    when 'blood_test' then coalesce(
      (select clinic_login_owns_visit(bt.clinic_visit_id) from blood_tests bt where bt.id = p_owner_id), false)
    when 'procedure' then coalesce(
      (select clinic_login_owns_visit(pr.clinic_visit_id) from procedures pr where pr.id = p_owner_id), false)
    else false
  end;
$$;

comment on function public.doctor_can_write_attachment(attachment_owner_type, uuid) is
  'Whether the calling clinic login may write a file on this owner: a resident in its write scope, or a blood test or procedure on a visit at one of its current clinics. Any other owner type is false (0174): an allow-list, not "everything except", so a new owner type fails closed.';

-- ---------------------------------------------------------------------------
-- 1b. The four attachment policies: an allow-list of owner types, then the resident scope
-- ---------------------------------------------------------------------------
drop policy if exists doctor_read_attachments on attachments;
create policy doctor_read_attachments on attachments
  for select
  using (
    (select is_clinic_login())
    and owner_type in ('resident', 'blood_test', 'procedure')
    and attachment_resident_id(owner_type, owner_id) in (select current_doctor_resident_ids())
  );

drop policy if exists doctor_write_attachments on attachments;
create policy doctor_write_attachments on attachments
  for insert
  with check (
    (select is_clinic_login())
    and owner_type in ('resident', 'blood_test', 'procedure')
    and attachment_resident_id(owner_type, owner_id) in (select current_clinic_resident_ids())
    and doctor_can_write_attachment(owner_type, owner_id)
  );

drop policy if exists doctor_update_attachments on attachments;
create policy doctor_update_attachments on attachments
  for update
  using (
    (select is_clinic_login())
    and owner_type in ('resident', 'blood_test', 'procedure')
    and attachment_resident_id(owner_type, owner_id) in (select current_clinic_resident_ids())
    and doctor_can_write_attachment(owner_type, owner_id)
  )
  with check (
    (select is_clinic_login())
    and owner_type in ('resident', 'blood_test', 'procedure')
    and attachment_resident_id(owner_type, owner_id) in (select current_clinic_resident_ids())
    and doctor_can_write_attachment(owner_type, owner_id)
  );

drop policy if exists doctor_delete_attachments on attachments;
create policy doctor_delete_attachments on attachments
  for delete
  using (
    (select is_clinic_login())
    and owner_type in ('resident', 'blood_test', 'procedure')
    and attachment_resident_id(owner_type, owner_id) in (select current_clinic_resident_ids())
    and doctor_can_write_attachment(owner_type, owner_id)
  );

-- ---------------------------------------------------------------------------
-- 1c. Translations: a resident's text, for a resident the doctor may read; nothing else
-- ---------------------------------------------------------------------------
drop policy if exists doctor_read_translations on translations;
create policy doctor_read_translations on translations
  for select
  using (
    (select is_clinic_login())
    and table_name = 'residents'
    and row_id in (select current_doctor_resident_ids())
  );

-- ---------------------------------------------------------------------------
-- 2. app_users: a clinic login sees itself and its current clinics' doctors
-- ---------------------------------------------------------------------------
-- Same columns, same order, same email rule as 0172, so create or replace holds and public.app_users (`select *`,
-- expanded at 0146) needs no re-create. The view runs as its owner, so doctors and doctor_clinics are read past their
-- policies here; current_user_clinic_ids() is the caller's own, so that reaches only the caller's clinics.
create or replace view private.app_users as
select
  u.id,
  case when current_user_role() in ('doctor', 'volunteer') then null else u.email end::varchar(255) as email,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', '')
  ) as display_name,
  r.role,
  r.archived_at,
  coalesce(rl.key, r.role::text) as role_key
from auth.users u
join public.user_roles r on r.user_id = u.id
left join public.roles rl on rl.id = r.role_id
where current_user_role() is not null
  and (
    not coalesce((select public.is_clinic_login()), false)
    or u.id = auth.uid()
    or u.id in (
      select d.user_id
        from public.doctors d
        join public.doctor_clinics dc on dc.doctor_id = d.id
       where dc.active
         and d.user_id is not null
         and dc.clinic_id = any ((select public.current_user_clinic_ids())::uuid[])
    )
  );

comment on view private.app_users is
  'Every login that holds a role, with its name and role, read through public.app_users. Email is blank for a doctor or volunteer (0126). A clinic login (is_clinic_login()) sees only itself and the doctors at its current clinics (0174); everyone else sees every login. Edit this, not public.app_users.';

notify pgrst, 'reload schema';
