-- #shsed (0416): a throwaway shelter gets its default rows, the receipt function works and guards, and a second seed call changes nothing. Rolls back.
-- Run: node scripts/run-harness.mjs supabase/harness/seed_new_shelter.sql   (passes by raising 'HARNESS OK ...')
begin;
do $$
declare u uuid; sid uuid; r text; n int; c1 text; c2 text; failed boolean;
begin
  select id into u from auth.users order by created_at limit 1;
  insert into public.product_admins (user_id) values (u) on conflict do nothing;
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'aal', 'aal2')::text, true);
  sid := public.product_admin_create_shelter('zz-shsed', 'ZZ shsed throwaway');
  reset role;

  select count(*) into n from public.site_pages where shelter_id = sid;
  if n <> 8 then raise exception 'site_pages % <> 8', n; end if;
  select count(*) into n from public.public_stat_switches where shelter_id = sid and show_on_website;
  if n <> 4 then raise exception 'public_stat_switches % <> 4', n; end if;
  select count(*) into n from public.bill_kinds where shelter_id = sid;
  if n <> 14 then raise exception 'bill_kinds % <> 14', n; end if;
  select count(*) into n from public.bill_kinds c join public.bill_kinds p on p.id = c.parent_id and p.shelter_id = sid where c.shelter_id = sid;
  if n <> 6 then raise exception 'bill_kinds children % <> 6', n; end if;
  select count(*) into n from public.frequency where shelter_id = sid;
  if n <> 10 then raise exception 'frequency % <> 10', n; end if;
  select count(*) into n from public.group_origins where shelter_id = sid;
  if n <> 0 then raise exception 'group_origins % <> 0 (deliberately unseeded)', n; end if;
  select count(*) into n from public.role_cards where shelter_id = sid;
  if n <> 0 then raise exception 'cards were seeded: %', n; end if;

  -- idempotent: a second call adds nothing
  select (select count(*) from public.site_pages where shelter_id = sid) + (select count(*) from public.bill_kinds where shelter_id = sid) + (select count(*) from public.frequency where shelter_id = sid) into n;
  set local role authenticated;
  perform public.seed_shelter_defaults(sid);
  reset role;
  if n <> (select (select count(*) from public.site_pages where shelter_id = sid) + (select count(*) from public.bill_kinds where shelter_id = sid) + (select count(*) from public.frequency where shelter_id = sid)) then raise exception 'second seed changed rows'; end if;

  -- receipts
  set local role authenticated;
  perform public.product_admin_set_shelter_receipts(sid, 'zzs', '{"TH":{"name":"ZZ"}}'::jsonb);
  reset role;
  select receipt_series into c1 from public.shelters where id = sid;
  if c1 <> 'ZZS' then raise exception 'series %', c1; end if;
  select count(*) into n from public.receipt_counters where shelter_id = sid and series = 'ZZS' and next_value = 1;
  if n <> 1 then raise exception 'receipt counter missing'; end if;
  failed := false;
  begin
    set local role authenticated;
    perform public.product_admin_set_shelter_receipts(sid, 'OTHER', '{"TH":{"name":"ZZ"}}'::jsonb);
  exception when others then failed := true; end;
  reset role;
  if not failed then raise exception 'series change was allowed'; end if;

  -- a non-product-admin is refused
  delete from public.product_admins where user_id = u;
  failed := false;
  begin
    set local role authenticated;
    perform public.seed_shelter_defaults(sid);
  exception when others then failed := true; end;
  reset role;
  if not failed then raise exception 'seed allowed for non product admin'; end if;

  raise exception 'HARNESS OK: site_pages 8, public_stat_switches 4, bill_kinds 14 (6 children), frequency 10, group_origins 0, cards 0, idempotent, receipts ZZS counter 1, series change refused, non product admin refused';
end $$;
rollback;
