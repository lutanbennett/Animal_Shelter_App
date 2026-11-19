-- consumer: none (nothing in src/ reads these functions; the product-admin screen is the future caller of product_admin_set_shelter_receipts)
--
-- #shsed. product_admin_create_shelter (0414) made exactly one row, in shelters. This gives a new shelter its neutral default content and a
-- way to set its receipt series and issuers. docs/decisions/2026-11-19-seed-a-new-shelter.md has the reasoning and what is deliberately NOT seeded.
--
--   seed_shelter_defaults(p_shelter)  site_pages (8 slugs, Lanna titles, EMPTY bodies), public_stat_switches (4, on), bill_kinds (14), frequency (10).
--                                     Idempotent (on conflict), so it is also how an existing shelter is brought up to date.
--                                     product_admin_create_shelter now calls it. Gate: is_product_admin() + aal2, like 0414.
--   product_admin_set_shelter_receipts(p_shelter, p_series, p_issuers)
--                                     sets shelters.receipt_series / receipt_issuers (which no login can write) and creates the receipt_counters row.
--
-- NOT seeded: group_origins and donation_channels (Lanna history and Lanna DonorBox link, not defaults), site_content, cards (never: a role is
-- exactly its cards, and Admin sits outside). Re-runnable. TO UNDO: drop function public.product_admin_set_shelter_receipts(uuid, text, jsonb);
-- restore product_admin_create_shelter from 0414; then drop function public.seed_shelter_defaults(uuid).

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
end;
$$;

create or replace function public.product_admin_set_shelter_receipts(p_shelter uuid, p_series text, p_issuers jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_old text;
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  select receipt_series into v_old from public.shelters where id = p_shelter;
  if not found then raise exception 'no such shelter' using errcode = '22023'; end if;
  p_series := upper(btrim(coalesce(p_series, '')));
  if p_series !~ '^[A-Z]+$' then raise exception 'receipt series must be capital letters' using errcode = '22023'; end if;
  if jsonb_typeof(p_issuers) is distinct from 'object' or p_issuers = '{}'::jsonb then raise exception 'receipt issuers must be an object keyed by country' using errcode = '22023'; end if;
  -- A series already issued under must not change: receipts carry its letters. Issuers may be corrected.
  if v_old is not null and v_old <> p_series then raise exception 'this shelter already has receipt series %', v_old using errcode = '23505'; end if;
  if v_old is null and exists (select 1 from public.shelters where receipt_series = p_series) then raise exception 'receipt series already used by another shelter' using errcode = '23505'; end if;
  update public.shelters set receipt_series = p_series, receipt_issuers = p_issuers where id = p_shelter;
  insert into public.receipt_counters (series, next_value, shelter_id) values (p_series, 1, p_shelter) on conflict (series) do nothing;
end;
$$;

-- The creation path now seeds. Same body as 0414 plus the call.
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
  perform public.seed_shelter_defaults(v_id);
  return v_id;
end;
$$;

revoke all on function public.seed_shelter_defaults(uuid), public.product_admin_set_shelter_receipts(uuid, text, jsonb), public.product_admin_create_shelter(text, text) from public, anon;
grant execute on function public.seed_shelter_defaults(uuid), public.product_admin_set_shelter_receipts(uuid, text, jsonb), public.product_admin_create_shelter(text, text) to authenticated, service_role;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'rls_definer') then
    alter function public.seed_shelter_defaults(uuid) owner to rls_definer;
    alter function public.product_admin_set_shelter_receipts(uuid, text, jsonb) owner to rls_definer;
    alter function public.product_admin_create_shelter(text, text) owner to rls_definer;
  end if;
end $$;
