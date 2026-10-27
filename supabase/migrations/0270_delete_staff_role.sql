-- consumer: none
--
-- delete-staff-role: the archived Staff role, its cards, cells and archived-login link are deleted.
-- (docs/decisions/2026-10-27-staff-role-deleted.md)
--
-- Lutan, 2026-10-26: "Staff is NOT a role", "it should be removed completely from the system", and, on deleting
-- the archived row: "That's fine as the staff login was never used anyway". 0173 archived the row; this removes it.
--
-- Read from production, 2026-10-27 02:18 UTC (check-production archived-role-references): staff (archived),
-- 0 live logins, 1 archived login, 13 cards, 31 cells. Lutan approved deleting that one archived login's link.
--
--   1. GUARD: stops, naming them, if any LIVE login holds Staff (it would be locked out; 0173 already forbids it).
--   2. Deletes the archived user_roles row(s) pointing at Staff. user_roles.role_id has no ON DELETE CASCADE.
--   3. Deletes the roles row; role_cards, role_permissions, role_home_tiles and role_groups cascade.
--
-- NOT done: dropping 'staff' from app_role (Postgres cannot remove an enum value; ~43 earlier files name it).
-- audit_log stores the actor and no role, so no record of who-did-what becomes unreadable.
-- Re-runnable: every statement is keyed on the row existing.

do $$
declare v_list text;
begin
  select string_agg(coalesce(u.email, ur.user_id::text), ', ')
    into v_list
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    left join auth.users u on u.id = ur.user_id
   where r.key = 'staff' and ur.archived_at is null;
  if v_list is not null then
    raise exception 'Staff cannot be deleted while these live logins hold it: %.', v_list
      using errcode = 'check_violation';
  end if;
end $$;

delete from user_roles
 where archived_at is not null
   and role_id = (select id from roles where key = 'staff' and archived_at is not null);

delete from roles where key = 'staff' and archived_at is not null;
