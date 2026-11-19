-- #lkaud (0422): the lookup records each distinct question once, refused callers record nothing, the record cannot be altered. Rolls back.
-- Run: node scripts/run-harness.mjs supabase/harness/product_admin_lookup_audit.sql   (passes by raising 'HARNESS OK ...')
begin;
do $$
declare u uuid; em text; n int; failed boolean; ex boolean;
begin
  select id, email into u, em from auth.users where email is not null order by created_at limit 1;
  insert into public.product_admins (user_id) values (u) on conflict do nothing;
  delete from public.product_admin_lookups where false;
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'aal', 'aal2')::text, true);
  ex := public.product_admin_login_exists(em);
  ex := public.product_admin_login_exists(upper(em));          -- same question, same window: no second row
  perform public.product_admin_login_exists('nobody-x@example.invalid');
  select count(*) into n from public.product_admin_lookups where actor = u;
  if n <> 2 then raise exception 'expected 2 rows (one per distinct question), got %', n; end if;
  if not exists (select 1 from public.product_admin_lookups where actor = u and email_checked = lower(em) and public.product_admin_lookups.found) then raise exception 'hit not recorded'; end if;
  if not exists (select 1 from public.product_admin_lookups where actor = u and email_checked = 'nobody-x@example.invalid' and not public.product_admin_lookups.found) then raise exception 'miss not recorded'; end if;
  failed := false; begin insert into public.product_admin_lookups (actor, email_checked, found) values (u, 'a@b.c', true); exception when others then failed := true; end;
  if not failed then raise exception 'a login wrote the record directly'; end if;
  failed := false; begin update public.product_admin_lookups set found = not public.product_admin_lookups.found; exception when others then failed := true; end;
  if not failed then raise exception 'record was updatable'; end if;
  -- aal1 and a non-PADMIN record nothing
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'aal', 'aal1')::text, true);
  begin perform public.product_admin_login_exists('aal1@example.invalid'); exception when others then null; end;
  perform set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'aal', 'aal2')::text, true);
  begin perform public.product_admin_login_exists('other@example.invalid'); exception when others then null; end;
  reset role;
  select count(*) into n from public.product_admin_lookups where email_checked in ('aal1@example.invalid', 'other@example.invalid');
  if n <> 0 then raise exception 'a refused caller left a record'; end if;
  raise exception 'HARNESS OK lookup audit';
end $$;
rollback;
