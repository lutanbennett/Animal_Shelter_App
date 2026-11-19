-- consumer: src/app/platform/page.tsx
-- #padpr, found while driving the console. product_admin_shelters() read every shelter's setup state under the REQUEST's shelter header, and the
-- restrictive shelter_scope_* policies hide another shelter's rows even from a security definer function. So the checklist reported only the request's
-- own shelter truthfully: a shelter with a web address, Admin role, receipt series and starting content read as having none of them, and one with Drive
-- credentials read "not connected". On the platform host, whose requests name no shelter, that is every shelter. Measured on dev 2026-11-19: pcf-proof
-- had 2 hosts and 8 pages and the screen said "none" and "row is missing".
-- The fix: build each shelter's row with this call scoped (this transaction only) to that shelter, then put the header back. Same columns, same
-- values, same product-administrator gate (it returns nothing for anyone else). Still takes no argument, so it cannot search. Re-runnable.
-- TO UNDO: re-apply 0417's product_admin_shelters().
create or replace function public.product_admin_shelters()
returns table (
  id uuid, key text, name text, created_at timestamptz, hosts text[],
  has_host boolean, has_admin_role boolean, has_admin_login boolean, has_receipts boolean, has_defaults boolean, has_site_content boolean,
  drive_status text, calendar_status text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare v_hdr text; v_ids uuid[]; v_id uuid;
begin
  if not public.is_product_admin() then return; end if;
  v_hdr := current_setting('request.headers', true);
  select array_agg(s0.id order by s0.created_at, s0.key) into v_ids from public.shelters s0;
  foreach v_id in array coalesce(v_ids, '{}'::uuid[]) loop
    perform set_config('request.headers', json_build_object('x-shelter-id', v_id::text)::text, true);
    return query
    select s.id, s.key, s.name, s.created_at,
           coalesce((select array_agg(h.host order by h.host) from public.shelter_hosts h where h.shelter_id = s.id), '{}'),
           exists (select 1 from public.shelter_hosts h where h.shelter_id = s.id),
           exists (select 1 from public.roles r where r.shelter_id = s.id and r.is_admin),
           exists (select 1 from public.roles r join public.user_roles ur on ur.role_id = r.id where r.shelter_id = s.id and r.is_admin),
           (s.receipt_series is not null and s.receipt_issuers is not null
              and exists (select 1 from public.receipt_counters rc where rc.shelter_id = s.id and rc.series = s.receipt_series)),
           (exists (select 1 from public.site_pages x where x.shelter_id = s.id)
              and exists (select 1 from public.public_stat_switches x where x.shelter_id = s.id)
              and exists (select 1 from public.bill_kinds x where x.shelter_id = s.id)
              and exists (select 1 from public.frequency x where x.shelter_id = s.id)),
           exists (select 1 from public.site_content c where c.shelter_id = s.id),
           coalesce((select case when d.oauth_client_id is null or d.oauth_client_secret_enc is null or d.refresh_token_enc is null then 'incomplete'
                                 when d.token_status = 'dead' then 'dead' else 'connected' end
                       from public.shelter_drive_credentials d where d.shelter_id = s.id), 'not_started'),
           coalesce((select case when c.calendar_id is null or c.oauth_client_id is null or c.oauth_client_secret_enc is null or c.refresh_token_enc is null then 'incomplete'
                                 when c.token_status = 'dead' then 'dead' else 'connected' end
                       from public.shelter_calendar_credentials c where c.shelter_id = s.id), 'not_started')
      from public.shelters s
      where s.id = v_id;
  end loop;
  perform set_config('request.headers', coalesce(v_hdr, ''), true);
end;
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    alter function public.product_admin_shelters() owner to rls_definer;
  end if;
end $$;
