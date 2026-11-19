-- consumer: src/app/platform/page.tsx, src/app/platform/actions.ts
-- #shnms. Nothing in the app wrote shelters.display_name / short_name (0400), so a new shelter's own names could only be put in by SQL.
-- This adds the write the platform console calls (product_admin_set_shelter_names, the same shape and gate as 0419's receipts write: product
-- administrator plus aal2, scoped to the one shelter for that transaction only) and returns the two names from product_admin_shelters() so
-- the screen can show what is set. Everything else in product_admin_shelters() is 0420's, unchanged. Re-runnable.
-- TO UNDO: drop function product_admin_set_shelter_names(uuid, text, text); re-apply 0420's product_admin_shelters().
drop function if exists public.product_admin_shelters();
create or replace function public.product_admin_shelters()
returns table (
  id uuid, key text, name text, created_at timestamptz, hosts text[],
  has_host boolean, has_admin_role boolean, has_admin_login boolean, has_receipts boolean, has_defaults boolean, has_site_content boolean,
  drive_status text, calendar_status text, display_name text, short_name text
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
           s.display_name, s.short_name
      from public.shelters s
      where s.id = v_id;
  end loop;
  perform set_config('request.headers', coalesce(v_hdr, ''), true);
end;
$$;

create or replace function public.product_admin_set_shelter_names(p_shelter uuid, p_display_name text, p_short_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_hdr text;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  p_display_name := btrim(coalesce(p_display_name, ''));
  p_short_name := btrim(coalesce(p_short_name, ''));
  if p_display_name = '' or p_short_name = '' or length(p_display_name) > 120 or length(p_short_name) > 60 then
    raise exception 'both names are required (full name up to 120 characters, short name up to 60)' using errcode = '22023';
  end if;
  if not exists (select 1 from public.shelters where id = p_shelter) then raise exception 'no such shelter' using errcode = '22023'; end if;
  v_hdr := current_setting('request.headers', true);
  perform set_config('request.headers', json_build_object('x-shelter-id', p_shelter::text)::text, true);
  update public.shelters set display_name = p_display_name, short_name = p_short_name where id = p_shelter;
  perform set_config('request.headers', coalesce(v_hdr, ''), true);
end;
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    alter function public.product_admin_shelters() owner to rls_definer;
    alter function public.product_admin_set_shelter_names(uuid, text, text) owner to rls_definer;
  end if;
end $$;

-- Re-creating product_admin_shelters() above reset its grants; state them again, and the new function's, as 0416/0417 did.
revoke all on function public.product_admin_shelters(), public.product_admin_set_shelter_names(uuid, text, text) from public, anon;
grant execute on function public.product_admin_shelters(), public.product_admin_set_shelter_names(uuid, text, text) to authenticated, service_role;
