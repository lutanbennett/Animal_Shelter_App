-- Maintenance jobs are assigned to a login, not a contact (2026-09-21).
--
-- 0001 gave `maintenance.assigned_to` a foreign key to `contacts`, and the
-- assign work earlier today wired that up. The user's correction: the
-- person who actions a job is always someone with a login — staff, a
-- volunteer, management — never a carer or a supplier, and the contacts
-- table is for the people outside the app. So:
--
--   1. `maintenance.assigned_user_id` → auth.users, replacing `assigned_to`
--      (dropped; nothing had been assigned through it yet).
--   2. `app_users`, a view over auth.users + user_roles so the app can
--      offer a picker and show a name without the service role: id,
--      email, the Google display name where there is one, and role.
--      Readable by every signed-in role — colleagues' names and work
--      emails are not a secret inside the shelter — and by nobody else.
--
-- Written to be safely re-runnable.

alter table maintenance drop column if exists assigned_to;

alter table maintenance
  add column if not exists assigned_user_id uuid references auth.users (id) on delete set null;

create index if not exists maintenance_assigned_user_id_idx on maintenance (assigned_user_id);

comment on column maintenance.assigned_user_id is
  'The login (staff, volunteer, management, admin) responsible for the job. Null = unassigned. Cleared if the account is deleted.';

-- security_invoker off (the default for a view) so the auth schema is read
-- as the view's owner; the WHERE keeps it to callers who hold a role.
create or replace view app_users as
select
  u.id,
  u.email,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', '')
  ) as display_name,
  r.role
from auth.users u
join user_roles r on r.user_id = u.id
where current_user_role() is not null;

comment on view app_users is
  'Logins with a role, for pickers and display (maintenance assignee). Visible to any signed-in role; anon sees nothing.';

revoke all on app_users from anon;
grant select on app_users to authenticated;

notify pgrst, 'reload schema';
