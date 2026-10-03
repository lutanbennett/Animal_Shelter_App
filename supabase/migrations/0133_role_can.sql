-- consumer: src/lib/recurring-jobs/eligibility.ts
--
-- role_can(role_key, activity, level): may THIS ROLE do this activity? One
-- boolean about one cell. ADDITIVE AND READ BY NOTHING YET.
--
-- Why it exists (docs/decisions/2026-10-03-permissions-catalogue.md): has_permission()
-- and can() answer about the caller's own role. Recurring-job eligibility asks
-- about an ASSIGNEE's role ("may a volunteer count stock?") while a manager builds
-- a rota, and role_permissions is admin-read-only (0132), so the app cannot
-- answer it and eligibility.ts still carries STOCK_COUNT_ROLES / STOCK_DELIVERY_ROLES.
--
-- THE BOUNDARY (docs/decisions/2026-10-03-role-can.md)
-- This is a security definer function that reads something 0132 made admin-only,
-- so the caller check is INSIDE it (definer bypasses RLS by design). It answers:
--   - a caller who may set up rotas: has_permission('recurring.manage', 'edit'),
--     the one function every policy asks, so Admin is covered by its own rule and
--     a shelter that edits the matrix moves this door with it;
--   - any caller, about their OWN role only (reveals nothing has_permission()
--     does not already);
--   - the service role (it reads the tables directly anyway).
-- Anyone else is REFUSED with insufficient_privilege, not answered "no": a
-- volunteer must not enumerate what other roles can do, and a refusal is loud if
-- the app ever calls it as the wrong person where a quiet "no" would read as
-- "nobody can". There is deliberately NO "list this role's cells" variant.
--
-- SAME ANSWERS AS has_permission() for the target role: a missing cell, an
-- unknown activity, an archived role (and an unknown role key) all answer no, as
-- do a null argument and a level other than 'read' | 'edit'. Admin has no rows
-- and is yes before any cell is read, an activity the catalogue does not know
-- included (§6 rules 1 and 8): the same predicate (roles.key = 'admin'), held
-- equal by scripts/check-role-can.mjs, which compares the two functions on every
-- role x activity x level.
--
-- To revert: drop function role_can(text, text, text). Nothing reads it.
--
-- Written to be safely re-runnable.

create or replace function role_can(p_role_key text, p_activity text, p_level text default 'edit')
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_own text;
begin
  select r.key into v_own
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id and r.archived_at is null
   where ur.user_id = (select auth.uid())
     and ur.archived_at is null;

  -- coalesce: a null role key makes the own-role test null, and `not null` is not true
  if not coalesce(
       (select auth.role()) = 'service_role'
    or public.has_permission('recurring.manage', 'edit')
    or v_own = p_role_key,
    false
  ) then
    raise exception 'role_can: not permitted to ask about the % role', coalesce(p_role_key, '(null)')
      using errcode = 'insufficient_privilege';
  end if;

  return exists (
    select 1
      from public.roles r
     where r.key = p_role_key
       and r.archived_at is null
       and p_activity is not null
       and p_level in ('read', 'edit')
       and (
         r.key = 'admin'
         or exists (
           select 1
             from public.role_permissions rp
            where rp.role_id = r.id
              and rp.activity = p_activity
              and rp.level >= case p_level when 'read' then 1 else 2 end
         )
       )
  );
end;
$$;

comment on function role_can(text, text, text) is
  'May the role with this key do this activity at this level (read | edit)? Same answers as has_permission() for that role: no row, unknown activity, archived or unknown role, null, mistyped level all no; Admin yes before any cell. Refuses (insufficient_privilege) a caller who may not set up rotas (recurring.manage) unless they ask about their own role; the service role is allowed. One boolean about one cell, never a list.';

revoke all on function role_can(text, text, text) from public, anon;
grant execute on function role_can(text, text, text) to authenticated, service_role;

notify pgrst, 'reload schema';
