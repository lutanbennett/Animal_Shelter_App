-- #pcmsx schema half (0441, 0442): the product pages' content, readable by the public, writable only by a product administrator at aal2. Rolls back.
-- Run: node scripts/run-harness.mjs supabase/harness/platform_content.sql   (passes by raising 'HARNESS OK platform_content ...')
-- Every anon step sets request.jwt.claims with role=anon (CLAUDE.md, "a harness that claims to prove shelter scoping"); without it the caller
-- is trusted and every policy stands aside, which proves nothing about anon.
begin;
do $$
declare u uuid; v uuid; sid text; n int; n2 int; failed boolean; seen text; shown int;
begin
  select id into u from auth.users where email is not null order by created_at limit 1;
  select id into v from auth.users where email is not null and id <> u order by created_at limit 1;
  select id::text into sid from public.shelters order by created_at limit 1;
  select count(*) into shown from public.platform_content;
  if shown < 300 then raise exception 'seed missing: % rows', shown; end if;
  if exists (select 1 from public.platform_content where th = '' and key not like '%.mock.%') then raise exception 'a seeded row has no Thai'; end if;

  -- anon: reads the platform content through the view, with a shelter header and without one, never the table itself
  set local role anon;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('request.headers', '{}', true);
  select count(*) into n from public.public_platform_content;
  if n <> shown then raise exception 'anon without header read % of %', n, shown; end if;
  perform set_config('request.headers', json_build_object('x-shelter-id', sid)::text, true);
  select count(*) into n2 from public.public_platform_content;
  if n2 <> shown then raise exception 'anon with a shelter header read % of %', n2, shown; end if;
  begin perform 1 from public.platform_content limit 1; failed := false; exception when insufficient_privilege then failed := true; end;
  if not failed then raise exception 'anon read the base table'; end if;
  -- and it still sees ONLY its own shelter's site_content (the contrast: platform rows are not shelter rows)
  select count(*) into n from public.public_site_content;
  if n > 1 then raise exception 'anon with a shelter header read % shelters of site_content', n; end if;
  begin perform public.product_admin_set_platform_content('[{"page":"home","key":"x","en":"a"}]'::jsonb); failed := false;
  exception when insufficient_privilege then failed := true; end;
  if not failed then raise exception 'anon wrote platform content'; end if;
  reset role;

  -- an ordinary login at aal2 who is not a product admin cannot write or delete
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v, 'aal', 'aal2', 'role', 'authenticated')::text, true);
  begin perform public.product_admin_set_platform_content('[{"page":"home","key":"x","en":"a"}]'::jsonb); failed := false;
  exception when insufficient_privilege then failed := true; end;
  if not failed then raise exception 'a non-product-admin wrote'; end if;
  begin perform public.product_admin_delete_platform_content('home', 'heading'); failed := false;
  exception when insufficient_privilege then failed := true; end;
  if not failed then raise exception 'a non-product-admin deleted'; end if;
  begin insert into public.platform_content (page, key) values ('home', 'direct'); failed := false;
  exception when insufficient_privilege then failed := true; end;
  if not failed then raise exception 'a login wrote the table directly'; end if;
  reset role;

  -- a product admin at aal1 is refused; at aal2 the write lands, Thai and photo included, and a later write without a photo keeps it
  insert into public.product_admins (user_id) values (v) on conflict do nothing;
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v, 'aal', 'aal1', 'role', 'authenticated')::text, true);
  begin perform public.product_admin_set_platform_content('[{"page":"home","key":"x","en":"a"}]'::jsonb); failed := false;
  exception when insufficient_privilege then failed := true; end;
  if not failed then raise exception 'a product admin at aal1 wrote'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v, 'aal', 'aal2', 'role', 'authenticated')::text, true);
  perform public.product_admin_set_platform_content('[{"page":"cooper","key":"photo","en":"Cooper","th":"คูเปอร์","drive_file_id":"abc123"}]'::jsonb);
  perform public.product_admin_set_platform_content('[{"page":"cooper","key":"photo","en":"Cooper 2","th":"คูเปอร์ 2"}]'::jsonb);
  begin perform public.product_admin_set_platform_content('[{"page":"Bad Page","key":"x"}]'::jsonb); failed := false;
  exception when check_violation then failed := true; end;
  if not failed then raise exception 'a malformed page slug was accepted'; end if;
  reset role;
  select drive_file_id into seen from public.platform_content where page = 'cooper' and key = 'photo';
  if seen is distinct from 'abc123' then raise exception 'photo id not kept: %', seen; end if;

  -- the new page is public at once, with no migration, and its photo counts as a public file
  set local role anon;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  select th into seen from public.public_platform_content where page = 'cooper' and key = 'photo';
  if seen is distinct from 'คูเปอร์ 2' then raise exception 'new page not readable by anon: %', seen; end if;
  if not public.is_public_drive_file('abc123') then raise exception 'product photo not a public file'; end if;
  reset role;
  raise exception 'HARNESS OK platform_content: % seeded rows, anon reads all via the view and none via the table, non-admin and aal1 refused, aal2 writes, new page needs no migration', shown;
end $$;
rollback;
