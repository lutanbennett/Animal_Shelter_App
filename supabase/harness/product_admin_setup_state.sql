-- #padui schema half (0417): setup state per shelter, the email lookup's gates, the by-email writes, and the site_content seed. Rolls back.
-- Run: node scripts/run-harness.mjs supabase/harness/product_admin_setup_state.sql   (passes by raising 'HARNESS OK ...')
begin;
do $$
declare u uuid; v uuid; vem text; sid uuid; n int; r record; failed boolean; msg text; em text; ex boolean;
begin
  select id, email into u, em from auth.users where email is not null order by created_at limit 1;
  select id, email into v, vem from auth.users x where x.id <> u and x.email is not null and not exists (select 1 from public.user_roles ur where ur.user_id = x.id and ur.is_main) order by created_at limit 1;
  if v is null then raise exception 'HARNESS SKIP: every other login already has a main role'; end if;
  insert into public.product_admins (user_id) values (u) on conflict do nothing;

  -- a shelter and a non-PADMIN login
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'aal', 'aal2')::text, true);
  sid := public.product_admin_create_shelter('zz-padui', 'ZZ padui throwaway');
  reset role;

  -- 1. state of a brand-new shelter: seeded, nothing else
  set local role authenticated;
  select * into r from public.product_admin_shelters() where key = 'zz-padui';
  reset role;
  if r.has_host or r.has_admin_role or r.has_admin_login or r.has_receipts then raise exception 'new shelter shows a later step done: %', r; end if;
  if not (r.has_defaults and r.has_site_content) then raise exception 'new shelter is not seeded: %', r; end if;
  if r.drive_status <> 'not_started' or r.calendar_status <> 'not_started' then raise exception 'drive/calendar not not_started: %', r; end if;
  select count(*) into n from public.site_content where shelter_id = sid;
  if n <> 1 then raise exception 'site_content rows % <> 1', n; end if;

  -- 2. each step flips its own flag
  set local role authenticated;
  perform public.product_admin_create_shelter_admin_role(sid);
  perform public.product_admin_set_shelter_receipts(sid, 'zzp', '{"TH":{"name":"ZZ"}}'::jsonb);
  reset role;
  insert into public.shelter_hosts (shelter_id, host) values (sid, 'zz-padui.example.invalid');
  set local role authenticated;
  select * into r from public.product_admin_shelters() where key = 'zz-padui';
  reset role;
  if not (r.has_host and r.has_admin_role and r.has_receipts) or r.has_admin_login then raise exception 'flags after role/host/receipts wrong: %', r; end if;
  insert into public.shelter_drive_credentials (shelter_id, oauth_client_id) values (sid, 'x');
  insert into public.shelter_calendar_credentials (shelter_id, calendar_id, oauth_client_id, oauth_client_secret_enc, refresh_token_enc, token_status)
    values (sid, 'zz-cal', 'x', 'x', 'x', 'dead');
  set local role authenticated;
  select * into r from public.product_admin_shelters() where key = 'zz-padui';
  reset role;
  if r.drive_status <> 'incomplete' or r.calendar_status <> 'dead' then raise exception 'drive/calendar status wrong: %', r; end if;

  -- 3. the lookup: exact address true, unknown false, patterns refused, case-insensitive
  set local role authenticated;
  if not public.product_admin_login_exists(em) then raise exception 'known address not found'; end if;
  if not public.product_admin_login_exists(upper(em)) then raise exception 'lookup is case-sensitive'; end if;
  if public.product_admin_login_exists('nobody-' || gen_random_uuid() || '@example.invalid') then raise exception 'unknown address found'; end if;
  failed := false;
  begin perform public.product_admin_login_exists('%@%.%'); exception when others then failed := true; end;
  if not failed then raise exception 'wildcard accepted'; end if;
  failed := false;
  begin perform public.product_admin_login_exists('a_b@x.y'); exception when others then failed := true; end;
  if not failed then raise exception 'underscore accepted'; end if;
  -- by-email link and add
  perform public.product_admin_link_shelter_admin_by_email(sid, vem);
  failed := false;
  begin perform public.product_admin_link_shelter_admin_by_email(sid, 'nobody@example.invalid'); exception when others then failed := true; end;
  if not failed then raise exception 'unknown login linked'; end if;
  select * into r from public.product_admin_shelters() where key = 'zz-padui';
  if not r.has_admin_login then raise exception 'has_admin_login false after link'; end if;
  select count(*) into n from public.product_admin_people() where kind = 'shelter_admin' and shelter_id = sid and user_id = v;
  if n <> 1 then raise exception 'linked admin not in people: %', n; end if;
  reset role;

  -- 4. aal1 PADMIN and non-PADMIN are refused by the lookup, with the same text whatever the address
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'aal', 'aal1')::text, true);
  failed := false; msg := null;
  begin perform public.product_admin_login_exists(em); exception when others then failed := true; msg := sqlerrm; end;
  if not failed then raise exception 'aal1 lookup allowed'; end if;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'aal', 'aal2')::text, true);
  set local role authenticated;
  failed := false;
  begin perform public.product_admin_login_exists(em); exception when others then failed := true; msg := sqlerrm; end;
  if not failed or msg <> 'product admin only' then raise exception 'non-PADMIN lookup not refused identically: %', msg; end if;
  failed := false; msg := null;
  begin perform public.product_admin_login_exists('nobody@example.invalid'); exception when others then failed := true; msg := sqlerrm; end;
  if not failed or msg <> 'product admin only' then raise exception 'non-PADMIN answer depends on address: %', msg; end if;
  select count(*) into n from public.product_admin_shelters(); if n <> 0 then raise exception 'non-PADMIN reads shelters'; end if;
  select count(*) into n from public.product_admin_people(); if n <> 0 then raise exception 'non-PADMIN reads people'; end if;
  reset role;

  -- 5. a second seed changes nothing; deleting the row and reseeding restores it
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'aal', 'aal2')::text, true);
  delete from public.site_content where shelter_id = sid;
  set local role authenticated;
  perform public.seed_shelter_defaults(sid);
  perform public.seed_shelter_defaults(sid);
  reset role;
  select count(*) into n from public.site_content where shelter_id = sid;
  if n <> 1 then raise exception 'reseed site_content % <> 1', n; end if;

  -- 6. after the backfill no shelter lacks a row
  select count(*) into n from public.shelters s where not exists (select 1 from public.site_content c where c.shelter_id = s.id);
  if n <> 0 then raise exception '% shelters still lack site_content', n; end if;

  raise exception 'HARNESS OK padui schema';
end $$;
rollback;
