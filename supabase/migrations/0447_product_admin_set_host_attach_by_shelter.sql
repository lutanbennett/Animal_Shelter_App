-- consumer: none (the console control that calls it is the next PR, the #hstau app half)
--
-- REPLACES 0446's two-argument function, measured broken on dev the day it was applied (same PR). Reasoning:
-- docs/decisions/2026-11-27-console-host-attach-schema.md.
-- Takes the SHELTER as well as the host (deviating from the brief's (p_host, p_attach)): shelter_hosts carries RESTRICTIVE per-shelter
-- policies for anon,authenticated (shelter_scope_select/update: is_trusted_caller() OR shelter_id = current_shelter_id()), and rls_definer
-- is a MEMBER of authenticated, so they bind this function too. Measured on dev 2026-11-27: without the header the update matched no row.
-- So it sets x-shelter-id to p_shelter around the update, as 0436/0428 do, and the caller (the console lists hosts per shelter) passes it.
-- Host handling copies product_admin_map_host / unmap_host (0414): normalise_request_host(), then RAISE when no row matched, so a mistyped
-- host or a host of another shelter can never report success having updated nothing. Consequence: front-door rows (shelter_id null) cannot
-- be flagged from here, exactly as unmap_host cannot remove them. Re-runnable.
-- TO UNDO: drop function public.product_admin_set_host_attach(uuid, text, boolean);

drop function if exists public.product_admin_set_host_attach(text, boolean);

create or replace function public.product_admin_set_host_attach(p_shelter uuid, p_host text, p_attach boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_host text; v_hdr text; v_found boolean;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  if p_attach is null then raise exception 'attach must be true or false' using errcode = '22023'; end if;
  v_host := public.normalise_request_host(p_host);
  if not exists (select 1 from public.shelters where id = p_shelter) then raise exception 'no such shelter' using errcode = '22023'; end if;
  v_hdr := current_setting('request.headers', true);
  perform set_config('request.headers', json_build_object('x-shelter-id', p_shelter::text)::text, true);
  update public.shelter_hosts set attach_to_worker = p_attach where host = v_host and shelter_id = p_shelter;
  v_found := found;
  perform set_config('request.headers', coalesce(v_hdr, ''), true);
  if not v_found then raise exception 'no shelter host by that name' using errcode = '22023'; end if;
end;
$$;

revoke all on function public.product_admin_set_host_attach(uuid, text, boolean) from public, anon;
grant execute on function public.product_admin_set_host_attach(uuid, text, boolean) to authenticated, service_role;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    alter function public.product_admin_set_host_attach(uuid, text, boolean) owner to rls_definer;
  end if;
end $$;
