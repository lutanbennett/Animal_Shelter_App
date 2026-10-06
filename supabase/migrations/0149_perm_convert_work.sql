-- consumer: none
--
-- R5's fifth of six conversions (docs/roles-and-permissions.md §12, §15; decisions/
-- 2026-10-06-perm-convert-work.md): the three work-assignment tables stop asking WHO the caller is.
-- Same shape as 0135 / 0144 / 0145 / 0147 / 0148: one policy per command, `(select has_permission(…))`
-- so Postgres plans it once per statement, no management or staff named. No app code reads anything
-- new, so nothing is ordered against a deploy.
--
--   maintenance            read   maintenance.jobs Read             (0141's policy, kept)
--                          insert, update   maintenance.jobs Edit  (0141's policies, kept)
--                          delete maintenance.jobs Edit, on a login whose floor is not the volunteer's (below)
--   maintenance_assignees  read   maintenance.jobs Read           (0141, kept)
--                          insert, update, delete   maintenance.jobs Edit   (0141, kept)
--   project_folders        read   projects.folders Read
--                          insert, update, delete   projects.folders Edit
--
-- Five of the ten policies are new (maintenance delete and the four on project_folders replace the two
-- role-named ALL policies per table). 0141 had already written every maintenance and
-- maintenance_assignees policy but delete-on-maintenance, additively, beside management_rw_* and
-- staff_rw_*; converting is therefore mostly DROPPING the role-named pair, plus the one policy that
-- 0141 deliberately left out.
--
-- DELETE ON maintenance. Delete has no activity of its own (a known open question, filed as
-- role-gaps-sweep) and this migration does not invent one. 0141 withheld deletion from the Head of
-- Maintenance on purpose ("removing one for good stays Admin's, management's and staff's"), and she
-- holds maintenance.jobs Edit, so the plain `maintenance.jobs` Edit test would hand it to her and to
-- the 2IC. Dropping management_rw_maintenance and staff_rw_maintenance without a replacement would
-- take delete from the people who have it. So delete asks maintenance.jobs Edit AND a login that is
-- not on the volunteer floor (has_shelter_floor()): it is the floor test, not an activity, and it names no role by name.
-- It changes nobody's answer today (admin has admin_all_maintenance; management and staff are not on
-- the volunteer floor; the Head of Maintenance and 2IC are). When delete gets an activity, this
-- policy takes it and the floor test goes.
--
-- project_folders asks projects.folders (the manage-projects job: "Manage projects", folders Edit).
-- Projects are website content, not maintenance work, and the cell is the one the page and the
-- action guards already ask. The volunteer's projects.folders Read was dropped with
-- volunteer_read_project_folders (0134) and the volunteer's cell with it, so no role gains a read.
-- projects.publish is NOT consulted by the write policy: it is a column on the same table, and
-- management and staff hold both cells. A role holding folders Edit without publish could set
-- is_public by a hand-built request; no role does, and the page's own guard is unchanged.
-- project_folders_before_write reads the parent folder as the caller, so insert still needs a read
-- on it: the same cell, so a role that can write can read.
--
-- admin_all_* (R6) are left alone, as 0135 and 0147 left theirs. maintenance.progress is not read by
-- any policy (a role that holds progress without jobs could not move a job on), as before: no role
-- does, and splitting the update by column belongs to the redesign, not here.
--
-- Written to be safely re-runnable. To undo: drop the new policies below and re-create
-- management_rw_* / staff_rw_* on the three tables from 0001 and 0034, and maintenance_delete_perm.

-- ---------------------------------------------------------------------------
-- 1. Drop the role-named policies on the three tables, and our own new ones on a re-run.
-- ---------------------------------------------------------------------------
do $drop$
declare
  p record;
begin
  for p in
    select tablename, policyname from pg_policies
     where schemaname = 'public'
       and tablename in ('maintenance', 'maintenance_assignees', 'project_folders')
       and (policyname like 'management\_%' or policyname like 'staff\_%'
            or policyname in ('maintenance_delete_perm')
            or (tablename = 'project_folders' and policyname like '%\_perm'))
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end
$drop$;

-- ---------------------------------------------------------------------------
-- 2. maintenance: delete is the one policy 0141 left out
-- ---------------------------------------------------------------------------
-- The floor test lives in a function so no policy names a role (check-volunteer-narrowing asserts that none
-- names the volunteer). It is true for a live login whose floor (user_roles.role) is anything above the
-- volunteer's: admin, management, staff, vet, and any configured role built on the staff floor.
create or replace function has_shelter_floor() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles ur
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and ur.role <> 'volunteer'::public.app_role
  );
$$;
comment on function has_shelter_floor() is
  'Is the caller''s floor above the volunteer''s? A stopgap for deleting a maintenance job until delete has an activity of its own (role-gaps-sweep); 0149.';
revoke all on function has_shelter_floor() from public, anon;
grant execute on function has_shelter_floor() to authenticated, service_role;

create policy maintenance_delete_perm on maintenance for delete to authenticated
  using ((select has_permission('maintenance.jobs')) and (select has_shelter_floor()));

-- ---------------------------------------------------------------------------
-- 3. project_folders
-- ---------------------------------------------------------------------------
create policy project_folders_select_perm on project_folders for select to authenticated
  using ((select has_permission('projects.folders', 'read')));
create policy project_folders_insert_perm on project_folders for insert to authenticated
  with check ((select has_permission('projects.folders')));
create policy project_folders_update_perm on project_folders for update to authenticated
  using ((select has_permission('projects.folders')))
  with check ((select has_permission('projects.folders')));
create policy project_folders_delete_perm on project_folders for delete to authenticated
  using ((select has_permission('projects.folders')));
