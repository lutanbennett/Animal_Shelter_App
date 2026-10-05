-- consumer: src/lib/auth/app-users.ts, src/lib/recurring-jobs/eligibility.ts, src/lib/recurring-jobs/eligibility-load.ts, src/lib/my-tasks/recurring.ts, src/app/management/recurring-jobs/page.tsx, src/app/management/recurring-jobs/actions.ts, scripts/check-recurring-job-eligibility.mjs
-- 0146: app_users exposes the role KEY (backlog, "A configured role's rota
-- eligibility: the picker and /my ask the enum role, not the role's key").
--
-- app_users.role is the legacy enum, and every configured role (2IC, Head of
-- Medical, Head of Maintenance) borrows `volunteer` as its legacy_role, so it
-- read `volunteer` for all three. canDoJob / loadEligibility asked role_can()
-- about that value, and a volunteer may not open /stocktake: the weekly
-- stocktake could not be given to the 2IC and lost its link on her My tasks.
-- Management only worked because her enum value and her key are the same
-- string (decisions/2026-10-05-management-role.md).
--
-- role_key is roles.key for the login's role, taken through user_roles.role_id
-- (0132); it falls back to the enum's text for a row whose role_id is not
-- filled yet, which for the built-in roles is the same string.
--
-- ADDITIVE: `role` stays (the legacy layer reads it), and the new column is
-- appended last so create or replace holds. public.app_users is `select *`,
-- which Postgres expands when the view is created, so it is re-created to pick
-- the column up, with security_barrier kept (0086). Email hiding for vets and
-- volunteers (0126) is unchanged.
--
-- Written to be safely re-runnable.

create or replace view private.app_users as
select
  u.id,
  case when current_user_role() in ('vet', 'volunteer') then null else u.email end::varchar(255) as email,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', '')
  ) as display_name,
  r.role,
  r.archived_at,
  coalesce(rl.key, r.role::text) as role_key
from auth.users u
join user_roles r on r.user_id = u.id
left join roles rl on rl.id = r.role_id
where current_user_role() is not null;

create or replace view public.app_users with (security_barrier = true) as
select * from private.app_users where private.has_app_access();

comment on view public.app_users is
  'private.app_users for a session with a staff role; empty for anyone else (0086). role is the legacy enum; role_key is the role''s own key (0146). Edit private.app_users, not this.';

grant select on public.app_users to authenticated, service_role;

notify pgrst, 'reload schema';
