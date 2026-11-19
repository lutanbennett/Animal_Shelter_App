-- consumer: scripts/dev-signin.mjs
-- user_roles_keep_an_admin (0132) found the Admin role with `select id from roles where key = 'admin'`. Roles have been per shelter since
-- 0401/0402 and 0277 moved Admin onto the roles.is_admin flag, so once TWO shelters each hold an Admin role that subquery returns two rows and
-- EVERY delete or update on user_roles (any role, any shelter) fails with "more than one row returned by a subquery used as an expression"
-- (found 2026-11-19 by `dev-signin --shelter`: it could neither re-sign-in nor --remove a login). The guard's own intent is unchanged:
-- do not take away a shelter's last active Admin. It now asks about THE ROW'S OWN role: is it an Admin role (is_admin), and does that role
-- (one per shelter, 0387) still have another live login? No role is read by name.
create or replace function public.user_roles_keep_an_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.archived_at is null
     and exists (select 1 from public.roles r where r.id = old.role_id and r.is_admin)
     and not exists (
       select 1 from public.user_roles
        where role_id = old.role_id and archived_at is null
     ) then
    raise exception 'This would leave the shelter with no active admin. Make someone else an admin first.'
      using errcode = 'check_violation';
  end if;
  return null;
end;
$$;

revoke execute on function public.user_roles_keep_an_admin() from public, anon, authenticated;
