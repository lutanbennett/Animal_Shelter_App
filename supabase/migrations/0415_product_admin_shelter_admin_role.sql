-- consumer: none yet. The app half of #shadm (a later stream, buttons on /admin/product-admin) will call these two functions; nothing reads them today.
--
-- #shadm SCHEMA HALF. Two security definer functions a PADMIN calls so a newly created shelter (0414) can be signed in to: one makes the shelter's
-- ADMIN ROLE, one connects an existing login (auth.users.id) to it. EXTENDS the recorded exception outsideTheCardSystem.productAdmin (0411); no new rule.
--
-- ADMIN GETS NO CARDS. Admin sits outside the card system and is decided by roles.is_admin (0275/0277), so the role is created with is_admin = true
-- and NO role_cards row. Nothing here reads or writes a card.
--
-- The aal2 check is INSIDE each body (same reason as 0414: a restrictive policy never fires against a definer body).
-- One Admin per shelter is roles_one_admin_idx (0387); this raises a clear error first rather than letting the index speak.
-- The login is linked as its MAIN role: user_roles_extra_role_rules (0196) forbids Admin as an additional role, and user_roles_one_main allows one
-- main role per login, so a login that already has a main role anywhere is refused rather than moved.
-- Re-runnable. TO UNDO: drop function public.product_admin_create_shelter_admin_role(uuid); drop function public.product_admin_link_shelter_admin(uuid, uuid).

create or replace function public.product_admin_create_shelter_admin_role(p_shelter uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  if not exists (select 1 from public.shelters where id = p_shelter) then raise exception 'no such shelter' using errcode = '22023'; end if;
  if exists (select 1 from public.roles where shelter_id = p_shelter and is_admin) then raise exception 'shelter already has an Admin role' using errcode = '23505'; end if;
  insert into public.roles (shelter_id, key, name, kind, opens_app, is_admin)
  values (p_shelter, 'admin', 'Admin', 'fixed', true, true)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.product_admin_link_shelter_admin(p_shelter uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_role uuid;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  if not exists (select 1 from auth.users where id = p_user) then raise exception 'no such login' using errcode = '22023'; end if;
  select id into v_role from public.roles where shelter_id = p_shelter and is_admin;
  if v_role is null then raise exception 'shelter has no Admin role' using errcode = '22023'; end if;
  if exists (select 1 from public.user_roles where user_id = p_user and role_id = v_role) then raise exception 'login already linked to this Admin role' using errcode = '23505'; end if;
  if exists (select 1 from public.user_roles where user_id = p_user and is_main) then raise exception 'login already has a main role' using errcode = '23505'; end if;
  insert into public.user_roles (user_id, role_id, shelter_id, is_main, granted_by)
  values (p_user, v_role, p_shelter, true, (select auth.uid()));
end;
$$;

revoke all on function public.product_admin_create_shelter_admin_role(uuid), public.product_admin_link_shelter_admin(uuid, uuid) from public, anon;
grant execute on function public.product_admin_create_shelter_admin_role(uuid), public.product_admin_link_shelter_admin(uuid, uuid) to authenticated, service_role;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    alter function public.product_admin_create_shelter_admin_role(uuid) owner to rls_definer;
    alter function public.product_admin_link_shelter_admin(uuid, uuid) owner to rls_definer;
  end if;
end $$;
