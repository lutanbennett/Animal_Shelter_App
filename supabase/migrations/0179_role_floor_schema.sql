-- consumer: src/app/maintenance/[id]/page.tsx, src/app/maintenance/[id]/MaintenanceJobView.tsx, src/lib/permissions/catalogue.ts
--
-- role-floor-schema (docs/decisions/2026-10-11-role-floor-schema.md): two fixes to boxes the grid offered and the
-- database refused, found by scripts/check-who-does-what.mjs.
--
-- 1. THE VOLUNTEER FLOOR. sees_all_residents() (0144) and sees_all_contacts() (0147) refused any role whose
--    legacy_role was 'volunteer', because the volunteer, the 2IC and both Heads read a resident through
--    resident_who_and_where and a contact through volunteer_contacts. The refusal was right; the data was wrong:
--    those roles said scope_residents = 'all', so the grid offered Edit where the answer is None
--    (docs/roles-and-permissions.md lines 411, 475, 1386; the Director's answer on contacts, 0155).
--    So: roles.scope_residents gains 'who_and_where', the floor roles are set to it, the two functions ask
--    the role's own scope column and no longer the borrowed enum, and the boxes that only the old data made
--    look possible are set to None. Nobody could do any of those things before, so nobody loses anything.
-- 2. DELETING A MAINTENANCE JOB gets its own activity, maintenance.delete (yes/no). Admin, Management and the
--    2IC may; the Head of Maintenance may not (Lutan, 2026-10-11). The policy stops asking has_shelter_floor().
--    The Head of Maintenance's cell was maintenance.jobs Edit, which read as "may delete" but never was: the
--    floor refused it. Now the box says so.
--
-- Re-runnable. To undo: restore the two functions from 0144 and 0147, the policy from 0149, put back
-- scope_residents = 'all' on the floor roles, drop the activity, narrow the check.

-- ---------------------------------------------------------------------------
-- 1. The scope value, the floor roles, the two functions
-- ---------------------------------------------------------------------------
alter table roles drop constraint if exists roles_scope_residents_check;
alter table roles add constraint roles_scope_residents_check
  check (scope_residents in ('all', 'own_clinic', 'who_and_where'));

-- Every role on the volunteer floor, by what it borrows rather than by name: a custom role added on that floor
-- reads who-and-where too, so it must not be left saying 'all'.
update roles set scope_residents = 'who_and_where'
 where legacy_role = 'volunteer' and scope_residents = 'all';

create or replace function sees_all_residents()
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
       and r.scope_residents = 'all'
  );
$$;

comment on function sees_all_residents() is
  'Does the caller''s live role reach every resident''s whole record (roles.scope_residents = all)? False for no role, an archived person or role, a vet (own_clinic) and a role that reads who-and-where only (resident_who_and_where, 0134). Asked as (select sees_all_residents()) beside has_permission() in the converted resident policies. 0179: reads the role''s own scope, no longer the borrowed legacy_role.';

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
  );
$$;

comment on function sees_all_contacts() is
  'Does the caller''s live role read the whole address book (roles.scope_contacts = full) and not only name and phone through volunteer_contacts or name and type through vet_contacts (0126)? False for no role, an archived person or role, and any role with a narrower scope. Asked as (select sees_all_contacts()) beside has_permission() in the converted contacts policies. 0179: reads the role''s own scope, no longer the borrowed legacy_role.';

-- The boxes the old data made look possible. Write boxes on a resident are None for the 2IC and both Heads
-- (docs/roles-and-permissions.md line 1386); the 2IC reads name and phone and does not change a contact (0155).
delete from role_permissions rp using roles r
 where rp.role_id = r.id and r.key = 'second_in_command'
   and rp.activity in ('resident.adoption_news', 'placement.move', 'placement.hospital', 'placement.rehome',
                       'placement.death', 'contacts.directory', 'contacts.add');
delete from role_permissions rp using roles r
 where rp.role_id = r.id and r.key in ('head_of_maintenance', 'head_of_medical') and rp.activity = 'placement.move';
-- Her resident.record box is Read (who and where), not Edit.
update role_permissions rp set level = 1 from roles r
 where rp.role_id = r.id and r.key = 'second_in_command' and rp.activity = 'resident.record' and rp.level > 1;

-- ---------------------------------------------------------------------------
-- 2. Deleting a maintenance job
-- ---------------------------------------------------------------------------
insert into permission_activities (key, kind, area, sort)
values ('maintenance.delete', 'yesno', 'maintenance', 61)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

insert into role_permissions (role_id, activity, level)
select r.id, 'maintenance.delete', 2
  from roles r
 where r.key in ('management', 'second_in_command')
on conflict (role_id, activity) do nothing;

drop policy if exists maintenance_delete_perm on maintenance;
create policy maintenance_delete_perm on maintenance for delete to authenticated
  using ((select has_permission('maintenance.delete')));

comment on function has_shelter_floor() is
  'Is the caller''s floor above the volunteer''s? No policy asks it since 0179 (deleting a maintenance job has its own activity); left for perm-drop-enum.';
