-- consumer: none (the console control that calls it is the next PR, the #hstau app half)
--
-- #hstau STEP 3, SCHEMA HALF. 0445 added shelter_hosts.attach_to_worker and PR #1904 made every deploy re-assert flagged hosts,
-- but nothing could set the flag: shelter_hosts is revoked from authenticated (0382). This is the one write, product admin + aal2.
-- Reasoning: docs/decisions/2026-11-27-console-host-attach-schema.md.
--
-- Host handling copies its siblings product_admin_map_host / unmap_host (0414): normalise_request_host(), then RAISE when no row
-- matched, so a mistyped host can never report success having updated nothing. Front-door rows (shelter_id null) are allowed on
-- purpose: 0445 says they are attached to the Worker too.
-- NO shelter-header set_config: shelter_hosts carries only the definer_all policy for rls_definer (0382), no per-shelter policy,
-- so the function owned by rls_definer (as 0414's are) needs none. Re-runnable.
-- TO UNDO: drop function public.product_admin_set_host_attach(text, boolean);

create or replace function public.product_admin_set_host_attach(p_host text, p_attach boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_host text;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  if p_attach is null then raise exception 'attach must be true or false' using errcode = '22023'; end if;
  v_host := public.normalise_request_host(p_host);
  update public.shelter_hosts set attach_to_worker = p_attach where host = v_host;
  if not found then raise exception 'no shelter host by that name' using errcode = '22023'; end if;
end;
$$;

revoke all on function public.product_admin_set_host_attach(text, boolean) from public, anon;
grant execute on function public.product_admin_set_host_attach(text, boolean) to authenticated, service_role;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    alter function public.product_admin_set_host_attach(text, boolean) owner to rls_definer;
  end if;
end $$;
