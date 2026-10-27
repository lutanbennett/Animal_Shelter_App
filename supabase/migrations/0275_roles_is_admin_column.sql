-- consumer: src/app/admin/security/role-options.ts, src/app/admin/who-does-what/actions.ts
-- The Security page and Delete role select roles.is_admin, a column no earlier
-- migration created. Add it, flag the Admin role, and allow at most one Admin.
-- Re-runnable. Does not change has_permission()/is_admin()/my_permissions(),
-- which still decide Admin by key = 'admin' (separate follow-up item).

alter table roles add column if not exists is_admin boolean not null default false;

do $$
declare n int;
begin
  update roles set is_admin = true where key = 'admin' and is_admin is distinct from true;
  get diagnostics n = row_count;
  raise notice '0275: % role row(s) flipped to is_admin = true', n;
end $$;

create unique index if not exists roles_one_admin_idx on roles (is_admin) where is_admin;
