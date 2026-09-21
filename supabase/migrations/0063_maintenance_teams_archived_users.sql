-- Maintenance jobs go to a team; logins can be archived (2026-09-21).
--
-- First round of staff feedback on the maintenance board:
--
--   1. "Assigned to could be a team — fixing a fence might need three
--      people." `maintenance.assigned_user_id` (0055) holds one login, so
--      it becomes a join table, `maintenance_assignees`, one row per
--      (job, login). The existing single assignee is copied across and
--      the column dropped; nothing else read it.
--
--   2. "How do we archive off people who no longer work or volunteer here,
--      so their jobs can be reassigned and they stop appearing in the
--      dropdown?" Deleting the login would do the second half but loses
--      who did what. Instead `user_roles.archived_at`: set, the person
--      keeps their row and their name on past jobs, but
--      current_user_role() returns null for them — which is exactly what
--      every RLS policy, page guard and the Google sign-in callback treat
--      as "no access" — and the assignee picker leaves them out. Clearing
--      it restores them. `app_users` carries the timestamp so the app can
--      say "(archived)" next to a name and offer the reassignment.
--
-- Written to be safely re-runnable.

-- ---------------------------------------------------------------------
-- 1. Archived logins
-- ---------------------------------------------------------------------

alter table user_roles
  add column if not exists archived_at timestamptz;

comment on column user_roles.archived_at is
  'Set when the person has left: they keep their role row (and their name on past work) but current_user_role() returns null, so they can''t get in. Clear it to restore access.';

-- The one function every policy and guard goes through. An archived login
-- reads as having no role at all.
create or replace function current_user_role()
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from user_roles where user_id = auth.uid() and archived_at is null;
$$;

-- security_invoker off (the default) so the auth schema is read as the
-- view's owner; the WHERE keeps it to callers who hold a live role.
create or replace view app_users as
select
  u.id,
  u.email,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', '')
  ) as display_name,
  r.role,
  r.archived_at
from auth.users u
join user_roles r on r.user_id = u.id
where current_user_role() is not null;

comment on view app_users is
  'Logins with a role, for pickers and display (maintenance assignees). archived_at set = has left; still listed so past work keeps its names. Visible to any signed-in role; anon sees nothing.';

revoke all on app_users from anon;
grant select on app_users to authenticated;

-- ---------------------------------------------------------------------
-- 2. A team per job
-- ---------------------------------------------------------------------

create table if not exists maintenance_assignees (
  maintenance_id uuid not null references maintenance (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (maintenance_id, user_id)
);

create index if not exists maintenance_assignees_user_id_idx on maintenance_assignees (user_id);

comment on table maintenance_assignees is
  'The logins responsible for a maintenance job — one row each, so a job can go to a team. No rows = unassigned. A row goes with its job or its login when either is deleted.';

-- Carry the single assignee over, then retire the column. Guarded so a
-- re-run after the drop is a no-op.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'maintenance' and column_name = 'assigned_user_id'
  ) then
    insert into maintenance_assignees (maintenance_id, user_id)
    select id, assigned_user_id from maintenance where assigned_user_id is not null
    on conflict do nothing;
    alter table maintenance drop column assigned_user_id;
  end if;
end $$;

-- Same access as the jobs themselves (0001, 0039): admin / staff /
-- management write, volunteers read (they see who a job is with but can't
-- change it), vets — who can't read maintenance — nothing.
alter table maintenance_assignees enable row level security;

drop policy if exists admin_all_maintenance_assignees on maintenance_assignees;
create policy admin_all_maintenance_assignees on maintenance_assignees
  for all using (current_user_role() = 'admin');

drop policy if exists staff_rw_maintenance_assignees on maintenance_assignees;
create policy staff_rw_maintenance_assignees on maintenance_assignees
  for all using (current_user_role() = 'staff');

drop policy if exists management_rw_maintenance_assignees on maintenance_assignees;
create policy management_rw_maintenance_assignees on maintenance_assignees
  for all using (current_user_role() = 'management');

drop policy if exists volunteer_read_maintenance_assignees on maintenance_assignees;
create policy volunteer_read_maintenance_assignees on maintenance_assignees
  for select using (current_user_role() = 'volunteer');


notify pgrst, 'reload schema';
