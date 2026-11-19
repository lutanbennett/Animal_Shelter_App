-- consumer: none yet. The app half of #shmgt (a later stream, buttons on /admin/product-admin) will call these three functions; nothing reads them today.
--
-- #shmgt WRITE HALF, SCHEMA ONLY. Three security definer functions a PADMIN calls to create a shelter and map or unmap a host. PADMIN is the recorded
-- exception outsideTheCardSystem.productAdmin (0411); this EXTENDS it and adds no new rule: the gate is is_product_admin(), asked first.
--
-- THE aal2 CHECK IS INSIDE EACH FUNCTION BODY, NOT A RESTRICTIVE POLICY. 0411's policies guard ordinary table writes by `authenticated`. These functions
-- are owned by rls_definer, which holds definer_all on shelters and shelter_hosts, and the restrictive policies would only ever apply to the role
-- `authenticated`, so a policy-shaped gate would never fire here. Each function therefore raises (42501) unless the session JWT says aal2.
--
-- Nothing here reads a role. The key is validated by the table's own check; the host is normalised with normalise_request_host() (0382), so the screen
-- and the Worker agree on what a host is. Hosts already mapped (including the null "front door" rows) are never reassigned: unmap, then map.
-- Re-runnable. TO UNDO: drop function public.product_admin_create_shelter(text, text); drop function public.product_admin_map_host(uuid, text);
-- drop function public.product_admin_unmap_host(text).

create or replace function public.product_admin_create_shelter(p_key text, p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  p_key := lower(btrim(coalesce(p_key, '')));
  p_name := btrim(coalesce(p_name, ''));
  if p_key !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'invalid shelter key' using errcode = '22023'; end if;
  if p_name = '' then raise exception 'shelter name required' using errcode = '22023'; end if;
  if exists (select 1 from public.shelters where key = p_key) then raise exception 'shelter key already exists' using errcode = '23505'; end if;
  insert into public.shelters (key, name) values (p_key, p_name) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.product_admin_map_host(p_shelter uuid, p_host text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_host text;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  if not exists (select 1 from public.shelters where id = p_shelter) then raise exception 'no such shelter' using errcode = '22023'; end if;
  v_host := public.normalise_request_host(p_host);
  if v_host is null or v_host ~ '[[:space:]:]' then raise exception 'invalid host' using errcode = '22023'; end if;
  if exists (select 1 from public.shelter_hosts where host = v_host) then raise exception 'host already mapped' using errcode = '23505'; end if;
  insert into public.shelter_hosts (host, shelter_id) values (v_host, p_shelter);
end;
$$;

create or replace function public.product_admin_unmap_host(p_host text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_host text;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  v_host := public.normalise_request_host(p_host);
  -- shelter_id is not null: the platform front-door rows (null) are never removable from here.
  delete from public.shelter_hosts where host = v_host and shelter_id is not null;
  if not found then raise exception 'no shelter host by that name' using errcode = '22023'; end if;
end;
$$;

revoke all on function public.product_admin_create_shelter(text, text), public.product_admin_map_host(uuid, text), public.product_admin_unmap_host(text) from public, anon;
grant execute on function public.product_admin_create_shelter(text, text), public.product_admin_map_host(uuid, text), public.product_admin_unmap_host(text) to authenticated, service_role;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    alter function public.product_admin_create_shelter(text, text) owner to rls_definer;
    alter function public.product_admin_map_host(uuid, text) owner to rls_definer;
    alter function public.product_admin_unmap_host(text) owner to rls_definer;
  end if;
end $$;
