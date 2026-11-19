-- consumer: none yet. The product-admin screen (src/app/admin/product-admin/) is the future reader; it is batch 3 of #padui and is not built against these columns yet.
-- docs/decisions/2026-11-19-product-admin-state-schema.md holds the meaning of every value and what the screen should show.
--
-- #padui SCHEMA HALF. Three things, one file:
--   1. product_admin_shelters() now says where each shelter has got to in setup (booleans and two status words, no secret of any kind).
--   2. product_admin_login_exists(p_email), product_admin_people() and two by-email wrappers, so the screen can ask for an email address and never an account id.
--   3. seed_shelter_defaults() also seeds site_content (a shelter with no row makes the Stocktaking switches save as nothing: #1734), and every
--      shelter that has no row gets one now.
--
-- OWNERS. The four functions that read auth.users (login_exists, people and the two by-email wrappers) are owned by POSTGRES, not rls_definer:
-- rls_definer holds no grant on auth.users, and giving it one would widen a role the whole tenancy lint leans on. Precedent: login_display_name (0370).
-- product_admin_shelters stays rls_definer's (0412), re-applied here because dropping a function loses its owner.
-- Re-runnable. TO UNDO: drop the four new functions; recreate product_admin_shelters() from 0411 (and re-own it as 0412); restore seed_shelter_defaults from 0416.

-- ---------------------------------------------------------------------------
-- 1. The read, widened. The return type changes, so the function must be dropped first.
-- ---------------------------------------------------------------------------
drop function if exists public.product_admin_shelters();

create function public.product_admin_shelters()
returns table (
  id uuid, key text, name text, created_at timestamptz, hosts text[],
  has_host boolean, has_admin_role boolean, has_admin_login boolean, has_receipts boolean, has_defaults boolean, has_site_content boolean,
  drive_status text, calendar_status text
)
language sql
stable
security definer
set search_path = ''
as $$
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
  where public.is_product_admin()
  order by s.created_at, s.key;
$$;

revoke all on function public.product_admin_shelters() from public, anon;
grant execute on function public.product_admin_shelters() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Login lookup by email. Answers one question about one exact address.
-- ---------------------------------------------------------------------------
-- Not a search: equality on lower(email), no wildcard, no near match, a bare boolean, never an id, a row or a count. Callable only by a product
-- administrator at aal2; anyone else gets an exception whose text does not depend on the address, so it cannot be used to probe.
create function public.product_admin_login_exists(p_email text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  p_email := lower(btrim(coalesce(p_email, '')));
  if p_email !~ '^[^@\s%_*]+@[^@\s%_*]+\.[^@\s%_*]+$' then raise exception 'not an email address' using errcode = '22023'; end if;
  return exists (select 1 from auth.users u where lower(u.email) = p_email);
end;
$$;

-- The people already placed: product administrators and each shelter's linked Admin logins, by email. Takes no argument, so it cannot search.
create function public.product_admin_people()
returns table (kind text, shelter_id uuid, user_id uuid, email text)
language sql
stable
security definer
set search_path = ''
as $$
  select 'product_admin'::text, null::uuid, pa.user_id, u.email::text
    from public.product_admins pa join auth.users u on u.id = pa.user_id
   where public.is_product_admin()
  union all
  select 'shelter_admin'::text, r.shelter_id, ur.user_id, u.email::text
    from public.roles r join public.user_roles ur on ur.role_id = r.id join auth.users u on u.id = ur.user_id
   where r.is_admin and public.is_product_admin();
$$;

-- By-email forms of the two writes that took an account id, so the screen never needs the id.
create function public.product_admin_link_shelter_admin_by_email(p_shelter uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_user uuid;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  select u.id into v_user from auth.users u where lower(u.email) = lower(btrim(coalesce(p_email, '')));
  if v_user is null then raise exception 'no login with that address' using errcode = '22023'; end if;
  perform public.product_admin_link_shelter_admin(p_shelter, v_user);
end;
$$;

create function public.product_admin_add_by_email(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_user uuid;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  select u.id into v_user from auth.users u where lower(u.email) = lower(btrim(coalesce(p_email, '')));
  if v_user is null then raise exception 'no login with that address' using errcode = '22023'; end if;
  insert into public.product_admins (user_id) values (v_user) on conflict do nothing;
end;
$$;

revoke all on function public.product_admin_login_exists(text), public.product_admin_people(),
  public.product_admin_link_shelter_admin_by_email(uuid, text), public.product_admin_add_by_email(text) from public, anon;
grant execute on function public.product_admin_login_exists(text), public.product_admin_people(),
  public.product_admin_link_shelter_admin_by_email(uuid, text), public.product_admin_add_by_email(text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. site_content: seeded for a new shelter, and backfilled for the ones that have none.
-- ---------------------------------------------------------------------------
-- site_content's key is shelter_id (unique index site_content_one_per_shelter, 0395, nulls not distinct); id is a boolean always true and is not the key.
-- Every other column is nullable or defaulted, so a row of defaults is valid.
insert into public.site_content (shelter_id)
select s.id from public.shelters s where not exists (select 1 from public.site_content c where c.shelter_id = s.id)
on conflict (shelter_id) do nothing;

create or replace function public.seed_shelter_defaults(p_shelter uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  if not exists (select 1 from public.shelters where id = p_shelter) then raise exception 'no such shelter' using errcode = '22023'; end if;

  insert into public.site_pages (slug, title, body, shelter_id) values
    ('our-story', 'Our story', '', p_shelter),
    ('how-to-adopt', 'How adoption works', '', p_shelter),
    ('foster', 'Foster with us', '', p_shelter),
    ('volunteer', 'Volunteer with us', '', p_shelter),
    ('donate', 'Donate', '', p_shelter),
    ('international-adoption', 'International adoption', '', p_shelter),
    ('shelter-friends-join', 'Become a Shelter Friend', '', p_shelter),
    ('about', 'About & visiting us', '', p_shelter)
  on conflict (shelter_id, slug) do nothing;

  insert into public.public_stat_switches (key, shelter_id) values
    ('in_care', p_shelter), ('adopted_this_year', p_shelter), ('in_foster', p_shelter), ('in_treatment', p_shelter)
  on conflict (shelter_id, key) do nothing;

  insert into public.bill_kinds (key, label, sort, shelter_id) values
    ('vet_appointment', 'Vet appointment', 10, p_shelter), ('food', 'Food', 20, p_shelter), ('medicine', 'Medicine', 30, p_shelter),
    ('maintenance', 'Maintenance', 40, p_shelter), ('materials', 'Materials and equipment', 50, p_shelter),
    ('cleaning_products', 'Cleaning products', 60, p_shelter), ('utilities', 'Utilities', 70, p_shelter), ('other', 'Other', 900, p_shelter)
  on conflict (shelter_id, key) do nothing;
  insert into public.bill_kinds (key, label, sort, parent_id, shelter_id)
  select v.key, v.label, v.sort, par.id, p_shelter
    from (values ('utility_water', 'Water', 10), ('utility_electricity', 'Electricity', 20), ('utility_internet', 'Internet', 30),
                 ('utility_phone', 'Phone', 40), ('utility_gas', 'Gas', 50), ('utility_waste', 'Waste', 60)) as v(key, label, sort)
    join public.bill_kinds par on par.shelter_id = p_shelter and par.key = 'utilities'
  on conflict (shelter_id, key) do nothing;

  insert into public.frequency (label, doses_per_day, interval_count, interval_unit, shelter_id) values
    ('Once daily', 1, null, null, p_shelter), ('Twice daily', 2, null, null, p_shelter), ('Three times daily', 3, null, null, p_shelter),
    ('Every 8 hours', 3, null, null, p_shelter), ('Every 12 hours', 2, null, null, p_shelter), ('As needed', null, null, null, p_shelter),
    ('Every other day', null, 2, 'day', p_shelter), ('Weekly', null, 1, 'week', p_shelter), ('Every 2 weeks', null, 2, 'week', p_shelter),
    ('Monthly', null, 1, 'month', p_shelter)
  on conflict (shelter_id, label) do nothing;

  -- 0417: one row of defaults, so the Stocktaking switches and the Website editor have something to update.
  insert into public.site_content (shelter_id) values (p_shelter) on conflict (shelter_id) do nothing;
end;
$$;

revoke all on function public.seed_shelter_defaults(uuid) from public, anon;
grant execute on function public.seed_shelter_defaults(uuid) to authenticated, service_role;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    alter function public.product_admin_shelters() owner to rls_definer;
    alter function public.seed_shelter_defaults(uuid) owner to rls_definer;
    -- login_exists, people and the two by-email wrappers stay owned by postgres: they read auth.users, which rls_definer cannot.
  end if;
end $$;
