-- consumer: src/app/platform/actions.ts, src/app/platform/ShelterAccess.tsx
--
-- #shsec. A BACKUP to a shelter's own Admin, from the product console: list a shelter's logins and the roles it already has, add a login to
-- one of those roles, change a login's role to another existing one, and take a login out (archive). DECIDED 2026-11-23 by Lutan: that and
-- nothing wider. There is NO function here that creates a role, edits a role or touches a card: giving a login an existing role grants exactly
-- the cards that role already holds, so no new way to grant exists. role_cards, card_grants and roles are never written; roles is only read.
-- Admin is outside the card system (roles.is_admin, 0275/0277) and these functions neither give it cards nor extend that bypass.
--
-- Gate, in every body (same as 0414/0415): is_product_admin() and aal2. A definer body never meets a restrictive policy, so the check is inside.
-- AUDIT: user_roles already has the record_audit() trigger (0195); it records auth.uid() as the actor and the row's shelter_id. These functions
-- run under the caller's own JWT, so every change is audited as the product administrator and the shelter. No second audit trail.
-- REMOVE = ARCHIVE (user_roles.archived_at, as the shelter's own archiveUser, 0063): reversible, the login and the person's records are kept.
-- NO LOCK-OUT: a change that would leave the shelter with no live login holding its Admin role is refused (23514).
-- Owner postgres, not rls_definer: these read auth.users (same as 0417/0425). Re-runnable.
-- TO UNDO: drop function public.product_admin_shelter_access(uuid), public.product_admin_shelter_roles(uuid),
--   public.product_admin_access_add(uuid, text, text), public.product_admin_access_set_role(uuid, uuid, text), public.product_admin_access_remove(uuid, uuid).

create or replace function public.product_admin_shelter_roles(p_shelter uuid)
returns table (id uuid, key text, name text, is_admin boolean)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  return query select r.id, r.key, r.name, r.is_admin from public.roles r where r.shelter_id = p_shelter order by r.is_admin desc, r.name;
end;
$$;

create or replace function public.product_admin_shelter_access(p_shelter uuid)
returns table (user_id uuid, email text, role_id uuid, role_key text, role_name text, is_admin boolean, is_main boolean, archived_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  return query
    select ur.user_id, u.email::text, r.id, r.key, r.name, r.is_admin, ur.is_main, ur.archived_at
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    left join auth.users u on u.id = ur.user_id
    where ur.shelter_id = p_shelter
    order by (ur.archived_at is not null), u.email, ur.is_main desc;
end;
$$;

-- Would taking this login's live Admin row away leave the shelter with nobody holding Admin?
create or replace function public.product_admin_access_would_lock_out(p_shelter uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
                  where ur.shelter_id = p_shelter and ur.user_id = p_user and r.is_admin and ur.archived_at is null)
     and not exists (select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
                  where ur.shelter_id = p_shelter and ur.user_id <> p_user and r.is_admin and ur.archived_at is null);
$$;

create or replace function public.product_admin_access_add(p_shelter uuid, p_email text, p_role_key text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_user uuid; v_role uuid; v_other uuid;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  p_email := lower(btrim(coalesce(p_email, '')));
  if p_email !~ '^[^@\s%_*]+@[^@\s%_*]+\.[^@\s%_*]+$' then raise exception 'not an email address' using errcode = '22023'; end if;
  select id into v_role from public.roles where shelter_id = p_shelter and key = p_role_key;
  if v_role is null then raise exception 'no such role in this shelter' using errcode = '22023'; end if;
  select id into v_user from auth.users where lower(email) = p_email;
  if v_user is null then raise exception 'no such login' using errcode = '22023'; end if;
  -- A login holds one main role in one shelter (user_roles_one_main): never moved from another shelter by this door.
  select shelter_id into v_other from public.user_roles where user_id = v_user and is_main and shelter_id is distinct from p_shelter limit 1;
  if v_other is not null then raise exception 'login belongs to another shelter' using errcode = '23505'; end if;
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

create or replace function public.product_admin_access_set_role(p_shelter uuid, p_user uuid, p_role_key text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_role uuid;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  select id into v_role from public.roles where shelter_id = p_shelter and key = p_role_key;
  if v_role is null then raise exception 'no such role in this shelter' using errcode = '22023'; end if;
  if not exists (select 1 from public.user_roles where user_id = p_user and shelter_id = p_shelter and is_main) then raise exception 'login has no role in this shelter' using errcode = '22023'; end if;
  if public.product_admin_access_would_lock_out(p_shelter, p_user) and not exists (select 1 from public.roles where id = v_role and is_admin) then
    raise exception 'would leave the shelter with no Admin' using errcode = '23514';
  end if;
  update public.user_roles set role_id = v_role, granted_by = (select auth.uid()) where user_id = p_user and shelter_id = p_shelter and is_main;
end;
$$;

create or replace function public.product_admin_access_remove(p_shelter uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  if not exists (select 1 from public.user_roles where user_id = p_user and shelter_id = p_shelter) then raise exception 'login has no role in this shelter' using errcode = '22023'; end if;
  if public.product_admin_access_would_lock_out(p_shelter, p_user) then raise exception 'would leave the shelter with no Admin' using errcode = '23514'; end if;
  update public.user_roles set archived_at = coalesce(archived_at, now()) where user_id = p_user and shelter_id = p_shelter;
end;
$$;

revoke all on function public.product_admin_shelter_roles(uuid), public.product_admin_shelter_access(uuid),
  public.product_admin_access_would_lock_out(uuid, uuid), public.product_admin_access_add(uuid, text, text),
  public.product_admin_access_set_role(uuid, uuid, text), public.product_admin_access_remove(uuid, uuid) from public, anon;
grant execute on function public.product_admin_shelter_roles(uuid), public.product_admin_shelter_access(uuid),
  public.product_admin_access_add(uuid, text, text), public.product_admin_access_set_role(uuid, uuid, text),
  public.product_admin_access_remove(uuid, uuid) to authenticated, service_role;
-- the lock-out helper is called only from the functions above (owner), so no role needs it.
