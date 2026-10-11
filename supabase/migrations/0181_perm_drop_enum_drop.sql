-- consumer: src/app/admin/security/actions.ts, src/app/admin/security/page.tsx, src/app/admin/security/role-options.ts, src/lib/auth/app-users.ts, src/lib/status/alerts.ts, src/app/my/page.tsx, src/lib/residents/who-and-where.ts
--
-- perm-drop-enum, step 2 of 2 (docs/decisions/2026-10-11-perm-drop-enum.md): the drop. 0180 moved every reader of the
-- role enum onto the role's own row; this removes what they used to read.
--
--   user_roles.role      the enum a login borrowed. user_roles.role_id (now NOT NULL) is the whole of the login's role.
--   roles.legacy_role    the enum a role borrowed, and its index and constraint.
--   current_user_role()  the function that read it.
--   user_roles_sync_role_id()   the trigger that kept role and role_id in step; nothing left to keep in step.
--   app_users.role       the same enum, shown. role_key stays and is the role.
--   type app_role        no column or function uses it any more.
--
-- A DROPPED COLUMN CANNOT BE PUT BACK BY REDEPLOYING. Apply 0180 first, then the app code, then this; to undo, write a
-- new migration that adds the columns again and back-fills them from roles (the key list in 0132 is the mapping).
-- Apply only once the new app is live: the previous release still selects app_users.role, calls current_user_role() and
-- writes user_roles.role, and fails the moment this lands.
--
-- Re-runnable.

-- The trigger that wrote one of the two columns from the other.
drop trigger if exists user_roles_sync_role_id on public.user_roles;
drop function if exists public.user_roles_sync_role_id();

-- Views that carry the enum column, then their dependants.
drop view if exists public.recurring_job_staffing;
drop view if exists public.app_users;
drop view if exists private.app_users;

alter table public.user_roles alter column role_id set not null;
alter table public.user_roles drop column if exists role;

drop index if exists public.roles_one_per_legacy_role;
alter table public.roles drop constraint if exists roles_template_names_legacy;
alter table public.roles drop column if exists legacy_role;

drop function if exists public.current_user_role();

create view private.app_users as
select
  u.id,
  case when (select public.is_clinic_login()) or public.on_volunteer_floor() then null else u.email end::varchar(255) as email,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', '')
  ) as display_name,
  r.archived_at,
  rl.key as role_key
from auth.users u
join public.user_roles r on r.user_id = u.id
join public.roles rl on rl.id = r.role_id
where exists (select 1 from public.user_roles me where me.user_id = (select auth.uid()) and me.archived_at is null)
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

create view public.app_users with (security_barrier = true) as
select * from private.app_users where private.has_app_access();

comment on view public.app_users is
  'private.app_users for a session with a staff role; empty for anyone else (0086). role_key is the role''s own key (0146); the enum column went in 0181. Edit private.app_users, not this.';

revoke all on public.app_users from public, anon, authenticated;
grant select on public.app_users to authenticated, service_role;

create view public.recurring_job_staffing with (security_invoker = true) as
select
  j.id as job_id,
  (count(u.id) filter (where u.archived_at is null and u.role_key <> 'public_viewer'))::integer as live_assignees,
  (count(u.id) filter (where u.archived_at is not null))::integer as archived_assignees
from public.recurring_jobs j
left join public.recurring_job_assignees a on a.job_id = j.id
left join public.app_users u on u.id = a.user_id
group by j.id;

revoke all on public.recurring_job_staffing from public, anon, authenticated;
grant select on public.recurring_job_staffing to authenticated, service_role;

drop type if exists public.app_role;
