-- consumer: none
--
-- remove-staff-role: Staff stops being a role anyone can hold. (docs/decisions/2026-10-09-staff-role-removed.md)
--
-- Lutan, 2026-10-09: "we should remove staff from the roles as it confuses things". Lanna's roles are Admin,
-- Management, 2IC, Head of Maintenance, Head of Medical, Doctor and Volunteer. This reverses "Staff stays in the
-- product for other shelters" (docs/decisions/2026-10-03-lanna-roles-lutans-answers.md).
--
-- What this file does:
--   1. THE LOCK-OUT GUARD. An archived role's logins fail closed: has_permission(), role_can() and every
--      is_*_login() join roles on archived_at is null, so a login still holding Staff when this runs would lose
--      everything. So the file STOPS, naming them, while any live login holds Staff. Move each one to another
--      role on Settings -> Security first (dev: done 2026-10-09; production: Lutan, 2026-10-09, "Only one which
--      is archived", so nobody live). An archived login holding Staff does not stop it; it is already shut out.
--   2. The roles row is ARCHIVED, not deleted: its history in audit_log and its cells in role_permissions stay
--      readable, and user_roles rows that point at it (archived logins) keep a valid foreign key.
--   3. A live login can no longer be given an archived role. Without this, writing user_roles.role = 'staff'
--      (the enum the app still writes) would map straight back onto the archived row and create a login that
--      can do nothing. Refusing it says so instead.
--
-- What it does NOT do: drop 'staff' from app_role. Postgres cannot remove an enum value, and it is named in
-- about 43 earlier files. The value stays and stops being given.
--
-- Re-runnable: the guard re-checks, the archive only touches a live row, the function is create-or-replace and
-- the trigger is dropped first.

-- ---------------------------------------------------------------------------------------------------------
-- 1. Nobody live may still hold Staff.
do $$
declare v_list text;
begin
  select string_agg(coalesce(u.email, ur.user_id::text), ', ' order by u.email)
    into v_list
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    left join auth.users u on u.id = ur.user_id
   where r.key = 'staff'
     and ur.archived_at is null;
  if v_list is not null then
    raise exception 'Staff cannot be retired while these logins hold it: %. Move each to another role on Settings -> Security first, or they cannot sign in.', v_list
      using errcode = 'check_violation';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------------------
-- 2. Archive the role.
update roles
   set archived_at = now()
 where key = 'staff'
   and archived_at is null;

-- ---------------------------------------------------------------------------------------------------------
-- 3. A live login only ever holds a live role.
--
-- Named so it sorts after user_roles_sync_role_id (0132): triggers on one table fire in name order, and that
-- one is what fills role_id from the enum, so by the time this runs role_id is set.
create or replace function user_roles_take_live_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  if new.archived_at is not null then
    return new;
  end if;
  select name into v_name from public.roles where id = new.role_id and archived_at is not null;
  if v_name is not null then
    raise exception 'The % role is retired: choose another role for this login.', v_name
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function user_roles_take_live_role() from public, anon, authenticated;

drop trigger if exists user_roles_take_live_role on user_roles;
create trigger user_roles_take_live_role
  before insert or update on user_roles
  for each row execute function user_roles_take_live_role();
