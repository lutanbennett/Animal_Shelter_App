-- consumer: none
--
-- Multi-tenancy programme part 2, group (C2): the last two unique keys that make a second shelter impossible (#s50n8, under #ykefa).
-- Nothing reads shelter_id yet, so running code is unchanged.
--
-- (i) roles.key was unique across the whole database: shelter B could not have a role keyed 'volunteer' if shelter A had one. It becomes
--     unique per shelter. NULLS NOT DISTINCT, as 0383/0384: while every shelter_id is null (now, until part 5) a plain (shelter_id, key)
--     key would treat each null as different and silently allow duplicates, weakening today's guarantee. This keeps it exactly.
-- (ii) roles_one_admin_idx allowed ONE ADMIN ROLE IN THE WHOLE DATABASE, so a second shelter's Admin role could not be inserted. It
--     becomes ONE ADMIN ROLE PER SHELTER. This is a deliberate change to the key guarding the Admin bypass. It does not change who Admin
--     is or what Admin may do (has_permission()/is_admin() read roles.is_admin since 0277 and are untouched); it changes how many Admin
--     roles the database will hold. Admin invariant, unchanged: "Admin always has access to everything. No matter what cards exist or
--     don't exist." While shelter_id is null the index still permits exactly one Admin.
--
-- Each block acts only if today's definition is still there. Re-runnable. To undo: restore unique (key) and
-- create unique index roles_one_admin_idx on roles (is_admin) where is_admin (only valid while at most one Admin role exists).

do $$
declare c text;
begin
  select conname into c from pg_constraint
   where conrelid = 'public.roles'::regclass and contype = 'u' and pg_get_constraintdef(oid) = 'UNIQUE (key)';
  if c is not null then
    execute format('alter table public.roles drop constraint %I', c);
    alter table public.roles add constraint roles_shelter_key_key unique nulls not distinct (shelter_id, key);
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'roles_one_admin_idx'
              and indexdef not ilike '%shelter_id%') then
    drop index public.roles_one_admin_idx;
    create unique index roles_one_admin_idx on public.roles (shelter_id) nulls not distinct where is_admin;
  end if;
end $$;
