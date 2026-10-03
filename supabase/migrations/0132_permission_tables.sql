-- consumer: none
--
-- F1 of docs/roles-and-permissions.md §12 and §15 (`permissions-schema`): the
-- permission tables, today's cells seeded, has_permission() and
-- my_permissions(). ADDITIVE AND READ BY NOTHING. No existing policy,
-- function, view or app file changes, and no table converts to
-- has_permission() here (that is `perm-convert-*`, after the parity check).
--
-- Configured roles, not enum values (docs/decisions/2026-10-03-configured-roles-not-enum-values.md):
-- no value is added to app_role, and none ever will be for the 2IC,
-- Maintenance or Medical. app_role stays; roles.legacy_role is the bridge of §12
-- and goes with the enum, in `perm-drop-enum`.
--
-- WHAT IS HERE
--   roles                 admin, management, staff, vet, volunteer, public_viewer
--   permission_activities the catalogue: 55 activities (§4)
--   role_permissions      today's cells for the four roles that have any: 122
--   user_roles.role_id    filled from the enum and kept in step by a trigger
--   has_permission(activity, level)   the one function every policy will ask
--   my_permissions()                  the caller's role, scopes and cells as jsonb
--
-- WHAT IS DELIBERATELY NOT HERE (and why: docs/decisions/2026-10-03-permission-tables.md)
--   - Lanna's three configured roles (2IC, Maintenance, Medical). Each arrives
--     with its own slice (§12), after F2, and the table that would seed them
--     still carries six cells the Director has not answered.
--   - The scope "who and where" (§5). Nothing can honour it until the volunteer
--     slice builds its view, so the column that would hold it is not here; that
--     slice adds it together with the view.
--   - Any enforcement of permission_activities.requires. It is data for the
--     Settings matrix and the catalogue check, and it is empty.
--
-- WHAT THE DATABASE HOLDS OF §6, AND WHAT IT DOES NOT
--   1 Admin has everything, always   HELD. Admin has no rows (trigger), and
--       has_permission() answers yes for it before looking at any cell. No
--       edit can take a power from Admin.
--   2 There is always an Admin       HELD, new: a deferred constraint trigger on
--       user_roles refuses a transaction that leaves no active admin.
--       Until now only the app's refusal to change, archive or delete your own
--       login stood in for it.
--   3 Security is Admin's, with 2-step   HELD for the matrix: roles and
--       role_permissions take writes from an admin at aal2 only, the pattern of
--       user_roles (0100). The service role bypasses it, as everywhere.
--   4 Public viewer and signed-out are fixed   HELD: kind 'fixed' is a check
--       constraint on the two reserved keys and no others, and a trigger stops
--       them being deleted, archived, renamed or given cells. A signed-out
--       visitor has no row anywhere, so every answer is no.
--   5, 6, 9   NOT held here. Everyone-with-a-login rights and a deceased
--       resident's read-only record are rules the existing code and policies
--       already hold; a cell cannot reach them because they are not activities.
--       Rule 9 (prerequisites) waits with `requires`.
--   7 The audit log records regardless   HELD for the matrix: roles and
--       role_permissions carry the audit_log trigger. audit_log itself is
--       already append-only for everyone (0121).
--   8 A new activity starts at None   HELD by construction: no row is None.
--
-- NO ROW MEANS NONE. A missing cell, an unknown activity, an archived role and
-- a person with no role all answer no; so does a level other than 'read' or
-- 'edit'. Only Admin is yes without a cell, and that includes an activity the
-- catalogue does not know yet (§6 rule 8).
--
-- Seeded rows are written before the audit triggers exist, so the seed does
-- not appear in Recent changes. The first edit to a cell will.
--
-- To revert: drop the audit and guard triggers, then drop function
-- has_permission, my_permissions and the trigger functions, then user_roles.role_id,
-- then role_permissions, permission_activities and roles. Nothing reads any of it.
--
-- Written to be safely re-runnable.

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

create table if not exists roles (
  id                uuid primary key default gen_random_uuid(),
  key               text not null unique check (key ~ '^[a-z][a-z0-9_]*$'),
  name              text not null check (btrim(name) <> ''),
  name_th           text,
  kind              text not null check (kind in ('fixed', 'default', 'custom')),
  opens_app         boolean not null default true,
  home_path         text check (home_path is null or home_path like '/%'),
  scope_residents   text not null default 'all'  check (scope_residents in ('all', 'own_clinic')),
  scope_clinical    text not null default 'any'  check (scope_clinical  in ('any', 'own_clinic')),
  scope_contacts    text not null default 'full' check (scope_contacts  in ('full', 'name_phone', 'name_type')),
  scope_photos      text not null default 'all'  check (scope_photos    in ('all', 'medical_only')),
  sees_login_emails boolean not null default true,
  legacy_role       app_role,
  created_at        timestamptz not null default now(),
  archived_at       timestamptz,
  -- 'fixed' means exactly the two reserved keys (§6 rule 4, and Admin).
  constraint roles_fixed_iff_reserved check ((kind = 'fixed') = (key in ('admin', 'public_viewer'))),
  -- While the enum exists every role a login can hold must name the enum value
  -- the old policies see it as; only a custom role may go without, and
  -- user_roles refuses to hold it until perm-drop-enum removes the need.
  constraint roles_template_names_legacy check (kind = 'custom' or legacy_role is not null)
);

-- One built-in role per enum value, so the enum -> role_id mapping is unambiguous.
create unique index if not exists roles_one_per_legacy_role
  on roles (legacy_role) where kind in ('fixed', 'default');

comment on table roles is
  'A role a login can hold (docs/roles-and-permissions.md §9). admin and public_viewer are fixed; management, staff, vet and volunteer are the template defaults; configured roles are kind custom. Read by nothing until the policies convert to has_permission().';
comment on column roles.legacy_role is
  'The app_role value the old role-named policies see this role as (§12 bridge). Dropped with the enum.';
comment on column roles.home_path is
  'Where sign-in lands; null means the app''s current default for the role.';
comment on column roles.scope_photos is
  'medical_only is honoured by app code today (PHOTO_CATEGORIES), not by the database: record_attachment() does not look at the folder.';

create table if not exists permission_activities (
  key      text primary key check (key ~ '^[a-z][a-z_]*\.[a-z_]+$'),
  kind     text not null check (kind in ('level', 'yesno')),
  area     text not null,
  sort     integer not null unique,
  requires jsonb not null default '[]' check (jsonb_typeof(requires) = 'array')
);

comment on table permission_activities is
  'The catalogue (§4), seeded here and kept equal to src/lib/permissions/catalogue.ts by a check that stream adds. kind level = Edit/Read/None, yesno = Yes/No.';
comment on column permission_activities.requires is
  'Prerequisites as [{activity, level}]. Data for the Settings matrix and the catalogue check; nothing in the database enforces it. Empty until the catalogue file states them.';

create table if not exists role_permissions (
  id       uuid primary key default gen_random_uuid(),
  role_id  uuid not null references roles (id) on delete cascade,
  activity text not null references permission_activities (key),
  level    smallint not null check (level in (1, 2)),
  unique (role_id, activity)
);

comment on table role_permissions is
  'One cell: this role may do this activity at this level (1 read, 2 edit or yes). No row means None. Admin and public_viewer have no rows.';

alter table user_roles add column if not exists role_id uuid references roles (id);
create index if not exists user_roles_role_id_idx on user_roles (role_id);

comment on column user_roles.role_id is
  'The role as a row (0132). Kept in step with user_roles.role by trigger until perm-drop-enum.';

-- ---------------------------------------------------------------------------
-- 2. The built-in roles
-- ---------------------------------------------------------------------------
-- Scopes are what today's policies and views do (0108, 0110, 0126), so each
-- value here has something that honours it, except scope_photos (see above).

insert into roles (key, name, kind, opens_app, legacy_role,
                   scope_residents, scope_clinical, scope_contacts, scope_photos, sees_login_emails)
values
  ('admin',         'Admin',         'fixed',   true,  'admin',         'all',        'any',        'full',       'all',          true),
  ('management',    'Management',    'default', true,  'management',    'all',        'any',        'full',       'all',          true),
  ('staff',         'Staff',         'default', true,  'staff',         'all',        'any',        'full',       'all',          true),
  ('vet',           'Vet',           'default', true,  'vet',           'own_clinic', 'own_clinic', 'name_type',  'medical_only', false),
  ('volunteer',     'Volunteer',     'default', true,  'volunteer',     'all',        'any',        'name_phone', 'all',          false),
  ('public_viewer', 'Public viewer', 'fixed',   false, 'public_viewer', 'all',        'any',        'full',       'all',          true)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 3. The catalogue: 55 activities, from §4 in table order
-- ---------------------------------------------------------------------------

insert into permission_activities (key, kind, area, sort) values
  ('resident.record', 'level', 'residents', 1),
  ('resident.register', 'yesno', 'residents', 2),
  ('resident.microchip', 'yesno', 'residents', 3),
  ('resident.adoption_news', 'level', 'residents', 4),
  ('placement.move', 'yesno', 'housing', 5),
  ('placement.hospital', 'yesno', 'housing', 6),
  ('placement.rehome', 'yesno', 'housing', 7),
  ('placement.death', 'yesno', 'housing', 8),
  ('placement.death_withdraw', 'yesno', 'housing', 9),
  ('visit.book', 'yesno', 'medical', 10),
  ('medical.visits', 'level', 'medical', 11),
  ('medical.procedures', 'level', 'medical', 12),
  ('medical.blood_tests', 'level', 'medical', 13),
  ('medical.prescriptions', 'level', 'medical', 14),
  ('medical.immunizations', 'level', 'medical', 15),
  ('medical.weight', 'level', 'medical', 16),
  ('medical.diet', 'level', 'medical', 17),
  ('medical.archive', 'yesno', 'medical', 18),
  ('photos.resident_add', 'yesno', 'photos', 19),
  ('photos.resident_manage', 'yesno', 'photos', 20),
  ('photos.resident_publish', 'yesno', 'photos', 21),
  ('facility.enclosures', 'level', 'enclosures', 22),
  ('facility.map', 'yesno', 'enclosures', 23),
  ('maintenance.jobs', 'level', 'maintenance', 24),
  ('maintenance.progress', 'yesno', 'maintenance', 25),
  ('maintenance.photos', 'yesno', 'maintenance', 26),
  ('projects.folders', 'level', 'projects', 27),
  ('projects.photos', 'yesno', 'projects', 28),
  ('projects.publish', 'yesno', 'projects', 29),
  ('clinics.list', 'level', 'contacts', 30),
  ('clinics.doctors', 'yesno', 'contacts', 31),
  ('contacts.directory', 'level', 'contacts', 32),
  ('contacts.add', 'yesno', 'contacts', 33),
  ('friends.manage', 'yesno', 'contacts', 34),
  ('stock.count', 'yesno', 'stock', 35),
  ('stock.delivery', 'yesno', 'stock', 36),
  ('stock.purchasing', 'yesno', 'stock', 37),
  ('stock.usage', 'yesno', 'stock', 38),
  ('stock.medications', 'level', 'stock', 39),
  ('stock.diets', 'level', 'stock', 40),
  ('stock.correct', 'yesno', 'stock', 41),
  ('reports.dashboard', 'yesno', 'management', 42),
  ('reports.cashflow', 'level', 'management', 43),
  ('recurring.manage', 'yesno', 'management', 44),
  ('recurring.do_any', 'yesno', 'management', 45),
  ('recurring.do_own', 'yesno', 'management', 46),
  ('translations.manage', 'yesno', 'management', 47),
  ('assistant.ask', 'yesno', 'assistant', 48),
  ('assistant.record', 'yesno', 'assistant', 49),
  ('website.content', 'level', 'settings', 50),
  ('reference.types', 'level', 'settings', 51),
  ('reference.add_while_recording', 'yesno', 'settings', 52),
  ('audit.view', 'yesno', 'settings', 53),
  ('audit.undo', 'yesno', 'settings', 54),
  ('system.status', 'yesno', 'settings', 55)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

-- ---------------------------------------------------------------------------
-- 4. Today's cells (docs/roles-and-permissions.md §4): 122 of them
-- ---------------------------------------------------------------------------
-- Admin and public_viewer have none. Never overwritten on a re-run, so that once
-- the matrix is editable a shelter's change survives it.

insert into role_permissions (role_id, activity, level)
select r.id, v.activity, v.level
from (values
  ('management', 'resident.record', 2),
  ('staff', 'resident.record', 2),
  ('vet', 'resident.record', 1),
  ('volunteer', 'resident.record', 1),
  ('management', 'resident.register', 2),
  ('staff', 'resident.register', 2),
  ('staff', 'resident.microchip', 2),
  ('vet', 'resident.microchip', 2),
  ('management', 'resident.adoption_news', 2),
  ('staff', 'resident.adoption_news', 2),
  ('vet', 'resident.adoption_news', 1),
  ('volunteer', 'resident.adoption_news', 1),
  ('management', 'placement.move', 2),
  ('staff', 'placement.move', 2),
  ('volunteer', 'placement.move', 2),
  ('management', 'placement.hospital', 2),
  ('staff', 'placement.hospital', 2),
  ('management', 'placement.rehome', 2),
  ('staff', 'placement.rehome', 2),
  ('management', 'placement.death', 2),
  ('staff', 'placement.death', 2),
  ('management', 'visit.book', 2),
  ('staff', 'visit.book', 2),
  ('vet', 'visit.book', 2),
  ('management', 'medical.visits', 2),
  ('staff', 'medical.visits', 2),
  ('vet', 'medical.visits', 2),
  ('volunteer', 'medical.visits', 1),
  ('management', 'medical.procedures', 2),
  ('staff', 'medical.procedures', 2),
  ('vet', 'medical.procedures', 2),
  ('volunteer', 'medical.procedures', 1),
  ('management', 'medical.blood_tests', 2),
  ('staff', 'medical.blood_tests', 2),
  ('vet', 'medical.blood_tests', 2),
  ('volunteer', 'medical.blood_tests', 1),
  ('management', 'medical.prescriptions', 2),
  ('staff', 'medical.prescriptions', 2),
  ('vet', 'medical.prescriptions', 2),
  ('volunteer', 'medical.prescriptions', 1),
  ('management', 'medical.immunizations', 2),
  ('staff', 'medical.immunizations', 2),
  ('vet', 'medical.immunizations', 2),
  ('volunteer', 'medical.immunizations', 1),
  ('management', 'medical.weight', 2),
  ('staff', 'medical.weight', 2),
  ('vet', 'medical.weight', 2),
  ('volunteer', 'medical.weight', 1),
  ('management', 'medical.diet', 2),
  ('staff', 'medical.diet', 2),
  ('vet', 'medical.diet', 2),
  ('volunteer', 'medical.diet', 1),
  ('management', 'medical.archive', 2),
  ('staff', 'medical.archive', 2),
  ('management', 'photos.resident_add', 2),
  ('staff', 'photos.resident_add', 2),
  ('vet', 'photos.resident_add', 2),
  ('volunteer', 'photos.resident_add', 2),
  ('management', 'photos.resident_manage', 2),
  ('staff', 'photos.resident_manage', 2),
  ('volunteer', 'photos.resident_manage', 2),
  ('management', 'photos.resident_publish', 2),
  ('staff', 'photos.resident_publish', 2),
  ('volunteer', 'photos.resident_publish', 2),
  ('management', 'facility.enclosures', 1),
  ('staff', 'facility.enclosures', 1),
  ('volunteer', 'facility.enclosures', 1),
  ('management', 'facility.map', 2),
  ('staff', 'facility.map', 2),
  ('volunteer', 'facility.map', 2),
  ('management', 'maintenance.jobs', 2),
  ('staff', 'maintenance.jobs', 2),
  ('volunteer', 'maintenance.jobs', 1),
  ('management', 'maintenance.progress', 2),
  ('staff', 'maintenance.progress', 2),
  ('management', 'maintenance.photos', 2),
  ('staff', 'maintenance.photos', 2),
  ('volunteer', 'maintenance.photos', 2),
  ('management', 'projects.folders', 2),
  ('staff', 'projects.folders', 2),
  ('volunteer', 'projects.folders', 1),
  ('management', 'projects.photos', 2),
  ('staff', 'projects.photos', 2),
  ('volunteer', 'projects.photos', 2),
  ('management', 'projects.publish', 2),
  ('staff', 'projects.publish', 2),
  ('management', 'clinics.list', 2),
  ('staff', 'clinics.list', 1),
  ('volunteer', 'clinics.list', 1),
  ('management', 'clinics.doctors', 2),
  ('management', 'contacts.directory', 2),
  ('staff', 'contacts.directory', 1),
  ('volunteer', 'contacts.directory', 1),
  ('management', 'contacts.add', 2),
  ('staff', 'contacts.add', 2),
  ('management', 'friends.manage', 2),
  ('management', 'stock.count', 2),
  ('staff', 'stock.count', 2),
  ('volunteer', 'stock.count', 2),
  ('management', 'stock.delivery', 2),
  ('staff', 'stock.delivery', 2),
  ('management', 'stock.purchasing', 2),
  ('management', 'stock.usage', 2),
  ('management', 'stock.medications', 2),
  ('management', 'stock.diets', 2),
  ('management', 'stock.correct', 2),
  ('management', 'reports.dashboard', 2),
  ('management', 'reports.cashflow', 2),
  ('management', 'recurring.manage', 2),
  ('management', 'recurring.do_any', 2),
  ('management', 'recurring.do_own', 2),
  ('staff', 'recurring.do_own', 2),
  ('volunteer', 'recurring.do_own', 2),
  ('management', 'translations.manage', 2),
  ('management', 'assistant.ask', 2),
  ('staff', 'assistant.ask', 2),
  ('volunteer', 'assistant.ask', 2),
  ('management', 'assistant.record', 2),
  ('staff', 'assistant.record', 2),
  ('management', 'reference.add_while_recording', 2),
  ('staff', 'reference.add_while_recording', 2),
  ('vet', 'reference.add_while_recording', 2)
) as v(role_key, activity, level)
join roles r on r.key = v.role_key
on conflict (role_id, activity) do nothing;

-- ---------------------------------------------------------------------------
-- 5. Guards: what a constraint can hold
-- ---------------------------------------------------------------------------

-- The reserved roles cannot be removed, archived, renamed, re-kinded or
-- re-bridged. (Their cells are refused below.)
create or replace function roles_guard_fixed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.kind = 'fixed' then
      raise exception 'The % role is fixed and cannot be deleted.', old.key using errcode = 'check_violation';
    end if;
    return old;
  end if;
  if old.kind = 'fixed' and (
       new.key is distinct from old.key
    or new.kind is distinct from old.kind
    or new.legacy_role is distinct from old.legacy_role
    or new.archived_at is not null
  ) then
    raise exception 'The % role is fixed: it cannot be renamed, re-kinded or archived.', old.key
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function roles_guard_fixed() from public, anon, authenticated;

drop trigger if exists roles_guard_fixed on roles;
create trigger roles_guard_fixed
  before update or delete on roles
  for each row execute function roles_guard_fixed();

-- Admin and public_viewer have no cells (§6 rules 1 and 4), and a Yes/No
-- activity has one level only.
create or replace function role_permissions_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role_kind text;
  v_activity_kind text;
begin
  select kind into v_role_kind from public.roles where id = new.role_id;
  if v_role_kind = 'fixed' then
    raise exception 'Fixed roles have no cells: Admin is a rule, not data, and the public viewer is not a column.'
      using errcode = 'check_violation';
  end if;
  select kind into v_activity_kind from public.permission_activities where key = new.activity;
  if v_activity_kind = 'yesno' and new.level <> 2 then
    raise exception '% is a Yes/No activity; its only level is 2.', new.activity
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function role_permissions_guard() from public, anon, authenticated;

drop trigger if exists role_permissions_guard on role_permissions;
create trigger role_permissions_guard
  before insert or update on role_permissions
  for each row execute function role_permissions_guard();

-- An activity cannot turn into Yes/No under cells that say Read.
create or replace function permission_activities_guard_kind()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind = 'yesno' and exists (
    select 1 from public.role_permissions where activity = new.key and level <> 2
  ) then
    raise exception '% has Read cells and cannot become a Yes/No activity.', new.key
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function permission_activities_guard_kind() from public, anon, authenticated;

drop trigger if exists permission_activities_guard_kind on permission_activities;
create trigger permission_activities_guard_kind
  before update of kind on permission_activities
  for each row execute function permission_activities_guard_kind();

-- ---------------------------------------------------------------------------
-- 6. user_roles.role_id: back-fill, and kept in step with the enum
-- ---------------------------------------------------------------------------
-- role_id is the authority when it is given or changed (a configured role
-- names the enum value it borrows); otherwise the enum column drives it, which
-- is every write the app makes today.

create or replace function user_roles_sync_role_id()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_legacy public.app_role;
begin
  if new.role_id is not null
     and (tg_op = 'INSERT' or new.role_id is distinct from old.role_id) then
    select legacy_role into v_legacy from public.roles where id = new.role_id;
    if v_legacy is null then
      raise exception 'That role has no legacy_role, and user_roles.role is still required (until perm-drop-enum).'
        using errcode = 'check_violation';
    end if;
    new.role := v_legacy;
  elsif new.role_id is null or new.role is distinct from old.role then
    new.role_id := (
      select id from public.roles where legacy_role = new.role and kind in ('fixed', 'default')
    );
  end if;
  if new.role_id is null then
    raise exception 'No role row exists for %.', new.role using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function user_roles_sync_role_id() from public, anon, authenticated;

drop trigger if exists user_roles_sync_role_id on user_roles;
create trigger user_roles_sync_role_id
  before insert or update on user_roles
  for each row execute function user_roles_sync_role_id();

-- Back-fill (the trigger above fills any row written from here on).
update user_roles ur
   set role_id = r.id
  from roles r
 where ur.role_id is null
   and r.legacy_role = ur.role
   and r.kind in ('fixed', 'default');

-- §6 rule 2: a transaction may not leave a shelter with no active admin. A
-- deferred constraint trigger, so a swap of two admins in one transaction is
-- fine and only the committed result is judged. It objects only when the change
-- took away the last active admin, so a database that never had one (a fresh
-- project before bootstrap-admin) is not blocked from unrelated writes.
create or replace function user_roles_keep_an_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := (select id from public.roles where key = 'admin');
begin
  if old.role_id = v_admin and old.archived_at is null
     and not exists (
       select 1 from public.user_roles
        where role_id = v_admin and archived_at is null
     ) then
    raise exception 'This would leave the shelter with no active admin. Make someone else an admin first.'
      using errcode = 'check_violation';
  end if;
  return null;
end;
$$;

revoke execute on function user_roles_keep_an_admin() from public, anon, authenticated;

drop trigger if exists user_roles_keep_an_admin on user_roles;
create constraint trigger user_roles_keep_an_admin
  after update or delete on user_roles
  deferrable initially deferred
  for each row execute function user_roles_keep_an_admin();

-- ---------------------------------------------------------------------------
-- 7. Who may touch the tables through the Data API
-- ---------------------------------------------------------------------------
-- The matrix is an admin's, at aal2 for any write (§6 rule 3, 0100's pattern).
-- permission_activities is the product's: an admin may read it, and only a
-- migration or the service role writes it. Everyone else reads their own cells
-- through my_permissions(), which is security definer.

alter table roles enable row level security;
alter table permission_activities enable row level security;
alter table role_permissions enable row level security;

drop policy if exists roles_admin_all on roles;
create policy roles_admin_all on roles
  for all
  using ((select current_user_role()) = 'admin')
  with check ((select current_user_role()) = 'admin');

drop policy if exists role_permissions_admin_all on role_permissions;
create policy role_permissions_admin_all on role_permissions
  for all
  using ((select current_user_role()) = 'admin')
  with check ((select current_user_role()) = 'admin');

drop policy if exists permission_activities_admin_read on permission_activities;
create policy permission_activities_admin_read on permission_activities
  for select
  using ((select current_user_role()) = 'admin');

drop policy if exists roles_insert_requires_aal2 on roles;
create policy roles_insert_requires_aal2 on roles
  as restrictive for insert
  with check ((select auth.jwt() ->> 'aal') = 'aal2');
drop policy if exists roles_update_requires_aal2 on roles;
create policy roles_update_requires_aal2 on roles
  as restrictive for update
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');
drop policy if exists roles_delete_requires_aal2 on roles;
create policy roles_delete_requires_aal2 on roles
  as restrictive for delete
  using ((select auth.jwt() ->> 'aal') = 'aal2');

drop policy if exists role_permissions_insert_requires_aal2 on role_permissions;
create policy role_permissions_insert_requires_aal2 on role_permissions
  as restrictive for insert
  with check ((select auth.jwt() ->> 'aal') = 'aal2');
drop policy if exists role_permissions_update_requires_aal2 on role_permissions;
create policy role_permissions_update_requires_aal2 on role_permissions
  as restrictive for update
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');
drop policy if exists role_permissions_delete_requires_aal2 on role_permissions;
create policy role_permissions_delete_requires_aal2 on role_permissions
  as restrictive for delete
  using ((select auth.jwt() ->> 'aal') = 'aal2');

revoke all on roles, role_permissions, permission_activities from anon;
grant select, insert, update, delete on roles, role_permissions to authenticated, service_role;
grant select on permission_activities to authenticated;
grant select, insert, update, delete on permission_activities to service_role;

-- ---------------------------------------------------------------------------
-- 8. has_permission() and my_permissions()
-- ---------------------------------------------------------------------------
-- has_permission(activity, level): level is 'read' or 'edit' ('edit' is also
-- "yes" for a Yes/No activity). Policies call it as (select has_permission(...))
-- so Postgres plans it once per statement. It reads only the caller's own
-- login (auth.uid()), so it cannot be used to ask about anyone else.

create or replace function has_permission(p_activity text, p_level text default 'edit')
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id and r.archived_at is null
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
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
$$;

comment on function has_permission(text, text) is
  'Does the calling login''s role hold this activity at this level (read | edit)? No row means no; Admin is yes before any cell is read. Live lookup, never a token claim (docs/roles-and-permissions.md §10, L9).';

-- my_permissions(): the caller's role, scopes and cells, for loadPermissions()
-- in the app. Null for a person with no live role. Admin's cells are every
-- activity at level 2, so the app needs no special case.
create or replace function my_permissions()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'role', jsonb_build_object(
      'key', r.key, 'name', r.name, 'name_th', r.name_th, 'kind', r.kind,
      'opens_app', r.opens_app, 'home_path', r.home_path
    ),
    'is_admin', r.key = 'admin',
    'scopes', jsonb_build_object(
      'residents', r.scope_residents,
      'clinical', r.scope_clinical,
      'contacts', r.scope_contacts,
      'photos', r.scope_photos,
      'sees_login_emails', r.sees_login_emails
    ),
    'permissions', case
      when r.key = 'admin'
        then (select coalesce(jsonb_object_agg(a.key, 2), '{}'::jsonb) from public.permission_activities a)
      else (select coalesce(jsonb_object_agg(rp.activity, rp.level), '{}'::jsonb)
              from public.role_permissions rp where rp.role_id = r.id)
    end
  )
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id and r.archived_at is null
  where ur.user_id = (select auth.uid())
    and ur.archived_at is null;
$$;

comment on function my_permissions() is
  'The calling login''s role, scopes and cells as jsonb, or null when it has no live role. permissions maps activity key to level (1 read, 2 edit or yes).';

revoke all on function has_permission(text, text) from public, anon;
revoke all on function my_permissions() from public, anon;
grant execute on function has_permission(text, text) to authenticated, service_role;
grant execute on function my_permissions() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 9. Audit: who changed which cell (§9). After the seed, so the seed is not logged.
-- ---------------------------------------------------------------------------

drop trigger if exists audit_roles on roles;
create trigger audit_roles
  after insert or update or delete on roles
  for each row execute function record_audit();

drop trigger if exists audit_role_permissions on role_permissions;
create trigger audit_role_permissions
  after insert or update or delete on role_permissions
  for each row execute function record_audit();

notify pgrst, 'reload schema';
