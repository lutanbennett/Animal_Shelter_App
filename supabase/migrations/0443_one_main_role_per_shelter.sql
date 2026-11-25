-- consumer: src/app/admin/security/actions.ts, src/app/platform/access-actions.ts, src/app/platform/actions.ts
--
-- #acwho, SCHEMA HALF (docs/decisions/2026-11-25-one-main-role-per-shelter.md). DECIDED by Lutan 2026-11-25: one login per person PER SHELTER,
-- carrying as many roles as that shelter needs, and the same person may hold one in each of several shelters. So `user_roles_one_main`
-- (0196, which predates tenancy) comes to mean "one main role PER SHELTER".
--
-- EXISTING ROWS: the old index allowed one is_main row per user_id, so no user_id has two main rows, so no (user_id, shelter_id) pair has two.
-- The new uniqueness therefore accepts every existing row unchanged (proved in supabase/harness/0443_one_main_per_shelter.sql).
--
-- 1. The index becomes (user_id, shelter_id) where is_main. user_roles.shelter_id is not null (0397), so no row escapes it.
-- 2. user_roles_extra_role_rules (0196): (a) "needs a live main role to sit on" asked about ANY shelter's main role; it now asks about the row's own
--    shelter. (b) Admin was refused as an additional role by role KEY ('admin'); since 0277 Admin is roles.is_admin and a shelter may name a role
--    'admin' without it being Admin, or call its Admin something else. It now asks the flag. 'public_viewer' stays by key, as before: it is a
--    fixed role with no flag, and not an access rule this change touches.
-- 3. product_admin_access_add: the 23505 "login belongs to another shelter" refusal is REMOVED; a row is added in the named shelter. Everything else
--    (product administrator, aal2, lock-out guard, the re-role branch) is as 0438.
-- 4. product_admin_link_shelter_admin: "login already has a main role" now asks about THIS shelter's main role, not any.
--
-- Re-runnable. TO UNDO: recreate user_roles_one_main on (user_id) where is_main (only valid while nobody holds a main role in two shelters),
-- restore the 0196 guard and the 0438 / 0421 bodies.

drop index if exists public.user_roles_one_main;
create unique index if not exists user_roles_one_main on public.user_roles (user_id, shelter_id) where is_main;

create or replace function public.user_roles_extra_role_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key text;
  v_admin boolean;
begin
  if tg_op = 'UPDATE' and old.is_main and not new.is_main then
    raise exception 'A login''s main role cannot be turned into an additional one: change the main role instead.'
      using errcode = 'check_violation';
  end if;
  if new.is_main then
    return new;
  end if;

  select key, is_admin into v_key, v_admin from public.roles where id = new.role_id;
  if coalesce(v_admin, false) or v_key = 'public_viewer' then
    raise exception 'Admin and the public viewer cannot be given as an additional role: they are a login''s main role or nothing.'
      using errcode = 'check_violation';
  end if;

  if tg_op = 'INSERT' and new.archived_at is null
     and not exists (select 1 from public.user_roles m
                      where m.user_id = new.user_id and m.shelter_id = new.shelter_id and m.is_main and m.archived_at is null) then
    raise exception 'An additional role needs a live main role in the same shelter to sit on.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function public.user_roles_extra_role_rules() from public, anon, authenticated;

create or replace function public.product_admin_access_add(p_shelter uuid, p_email text, p_role_key text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_user uuid; v_role uuid;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  p_email := lower(btrim(coalesce(p_email, '')));
  if p_email !~ '^[^@\s%_*]+@[^@\s%_*]+\.[^@\s%_*]+$' then raise exception 'not an email address' using errcode = '22023'; end if;
  select id into v_role from public.roles where shelter_id = p_shelter and key = p_role_key;
  if v_role is null then raise exception 'no such role in this shelter' using errcode = '22023'; end if;
  select id into v_user from auth.users where lower(email) = p_email;
  if v_user is null then raise exception 'no such login' using errcode = '22023'; end if;
  -- 0443: a login may hold a main role in each of several shelters (user_roles_one_main is per shelter), so a main role elsewhere is no refusal.
  if public.product_admin_access_would_lock_out(p_shelter, v_user) then
    -- Re-roling the only Admin away: refused here as in set_role.
    if not exists (select 1 from public.roles where id = v_role and is_admin) then raise exception 'would leave the shelter with no Admin' using errcode = '23514'; end if;
  end if;
  if exists (select 1 from public.user_roles where user_id = v_user and shelter_id = p_shelter and is_main) then
    update public.user_roles set role_id = v_role, archived_at = null, granted_by = (select auth.uid())
     where user_id = v_user and shelter_id = p_shelter and is_main;
  else
    insert into public.user_roles (user_id, role_id, shelter_id, is_main, granted_by) values (v_user, v_role, p_shelter, true, (select auth.uid()));
  end if;
  return v_user;
end;
$$;

create or replace function public.product_admin_link_shelter_admin(p_shelter uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_role uuid; v_hdr text;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  v_hdr := current_setting('request.headers', true);
  perform set_config('request.headers', json_build_object('x-shelter-id', p_shelter::text)::text, true);
  select id into v_role from public.roles where shelter_id = p_shelter and is_admin;
  if v_role is null then raise exception 'shelter has no Admin role' using errcode = '22023'; end if;
  if exists (select 1 from public.user_roles where user_id = p_user and role_id = v_role) then raise exception 'login already linked to this Admin role' using errcode = '23505'; end if;
  -- 0443: this shelter's main role, not any shelter's.
  if exists (select 1 from public.user_roles where user_id = p_user and shelter_id = p_shelter and is_main) then raise exception 'login already has a main role in this shelter' using errcode = '23505'; end if;
  -- auth.users is not readable by the definer owner, so an unknown login is caught by the foreign key instead.
  begin
    insert into public.user_roles (user_id, role_id, shelter_id, is_main, granted_by)
    values (p_user, v_role, p_shelter, true, (select auth.uid()));
  exception when foreign_key_violation then raise exception 'no such login' using errcode = '22023';
  end;
  perform set_config('request.headers', coalesce(v_hdr, ''), true);
end;
$$;
