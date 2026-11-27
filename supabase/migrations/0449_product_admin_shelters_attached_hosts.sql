-- consumer: src/app/platform/page.tsx, src/app/platform/ProductAdminPanel.tsx
--
-- #hstau read-back. 0445 added shelter_hosts.attach_to_worker and 0446/0447 the button that sets it, but product_admin_shelters() never
-- returned it, so the console could not show which addresses are marked (docs/decisions/2026-11-27-host-attach-console.md, lines 32-36).
-- This is 0428's product_admin_shelters() UNCHANGED (same gate, same owner, same grants, same per-shelter header loop, which is what lets a
-- definer read shelter_hosts at all: 0447's finding) plus ONE output column at the end:
--   attached_hosts text[] = the shelter's addresses with attach_to_worker true, sorted; '{}' when none.
-- The return type changes, so drop + create (re-runnable). TO UNDO: re-apply 0428's product_admin_shelters() and its owner/grant lines.

drop function if exists public.product_admin_shelters();
create function public.product_admin_shelters()
returns table (
  id uuid, key text, name text, created_at timestamptz, hosts text[],
  has_host boolean, has_admin_role boolean, has_admin_login boolean, has_receipts boolean, has_defaults boolean, has_site_content boolean,
  drive_status text, calendar_status text, display_name text, short_name text,
  primary_host text, account_holder_name text, account_holder_email text, account_holder_phone text, account_holder_location text,
  enquiry_id uuid, archived_at timestamptz, public_site text, attached_hosts text[]
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
                       from public.shelter_calendar_credentials c where c.shelter_id = s.id), 'not_started'),
           s.display_name, s.short_name,
           (select h.host from public.shelter_hosts h where h.shelter_id = s.id and h.is_primary),
           s.account_holder_name, s.account_holder_email, s.account_holder_phone, s.account_holder_location,
           s.enquiry_id, s.archived_at, s.public_site,
           coalesce((select array_agg(h.host order by h.host) from public.shelter_hosts h where h.shelter_id = s.id and h.attach_to_worker), '{}')
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

revoke all on function public.product_admin_shelters() from public, anon;
grant execute on function public.product_admin_shelters() to authenticated, service_role;
