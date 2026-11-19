-- consumer: src/app/platform/actions.ts
-- #padpr, found while driving the console (same cause as 0419 and 0420). The restrictive shelter_scope_* policies read the x-shelter-id request
-- header and apply to every role, security definer owners included. A product administrator's request names no shelter, or another one, so three
-- more console presses were refused, each reported to the person as something else:
--   Remove an address   -> "That address is not mapped to any shelter."  (the row exists; the policy hid it)
--   Give an Admin role  -> "Your second step has expired."               (a 42501 from the roles insert, mapped to the step-up message)
--   Link an Admin login -> the same shape, from user_roles
-- Each function now scopes ITS OWN transaction to the shelter it works on, after the existing product-administrator and aal2 checks, and puts
-- the header back. Unmap is given a host and not a shelter, so it tries each shelter in turn and stops at the one that held it. Nothing about who
-- may call these changes. Bodies are 0414's and 0415's apart from the scope lines. Re-runnable.
-- TO UNDO: re-apply the 0414 and 0415 bodies.

create or replace function public.product_admin_unmap_host(p_host text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_host text; v_hdr text; v_ids uuid[]; v_id uuid; v_gone boolean := false;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  v_host := public.normalise_request_host(p_host);
  v_hdr := current_setting('request.headers', true);
  select array_agg(s0.id order by s0.created_at, s0.key) into v_ids from public.shelters s0;
  foreach v_id in array coalesce(v_ids, '{}'::uuid[]) loop
    perform set_config('request.headers', json_build_object('x-shelter-id', v_id::text)::text, true);
    -- shelter_id is not null: the platform front-door rows (null) are never removable from here.
    delete from public.shelter_hosts where host = v_host and shelter_id = v_id;
    if found then v_gone := true; exit; end if;
  end loop;
  perform set_config('request.headers', coalesce(v_hdr, ''), true);
  if not v_gone then raise exception 'no shelter host by that name' using errcode = '22023'; end if;
end;
$$;

create or replace function public.product_admin_create_shelter_admin_role(p_shelter uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid; v_hdr text;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  if not exists (select 1 from public.shelters where id = p_shelter) then raise exception 'no such shelter' using errcode = '22023'; end if;
  v_hdr := current_setting('request.headers', true);
  perform set_config('request.headers', json_build_object('x-shelter-id', p_shelter::text)::text, true);
  if exists (select 1 from public.roles where shelter_id = p_shelter and is_admin) then raise exception 'shelter already has an Admin role' using errcode = '23505'; end if;
  insert into public.roles (shelter_id, key, name, kind, is_admin)
  values (p_shelter, 'admin', 'Admin', 'fixed', true)
  returning id into v_id;
  perform set_config('request.headers', coalesce(v_hdr, ''), true);
  return v_id;
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
  if exists (select 1 from public.user_roles where user_id = p_user and is_main) then raise exception 'login already has a main role' using errcode = '23505'; end if;
  -- auth.users is not readable by the definer owner, so an unknown login is caught by the foreign key instead.
  begin
    insert into public.user_roles (user_id, role_id, shelter_id, is_main, granted_by)
    values (p_user, v_role, p_shelter, true, (select auth.uid()));
  exception when foreign_key_violation then raise exception 'no such login' using errcode = '22023';
  end;
  perform set_config('request.headers', coalesce(v_hdr, ''), true);
end;
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    alter function public.product_admin_unmap_host(text) owner to rls_definer;
    alter function public.product_admin_create_shelter_admin_role(uuid) owner to rls_definer;
    alter function public.product_admin_link_shelter_admin(uuid, uuid) owner to rls_definer;
  end if;
end $$;
