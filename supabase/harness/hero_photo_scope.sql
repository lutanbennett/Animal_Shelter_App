-- #h3ro9 (0432): a definer setter writes the request's shelter only. Rolls back.
-- Run: node scripts/run-harness.mjs supabase/harness/hero_photo_scope.sql   (passes by raising 'HARNESS OK hero scope')
begin;
do $$
declare u uuid; a uuid; b uuid; c uuid; rid uuid; did uuid; ok boolean;
begin
  select id into u from auth.users where email is not null order by created_at limit 1;
  insert into public.product_admins (user_id) values (u) on conflict do nothing;
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'aal', 'aal2')::text, true);
  a := public.product_admin_create_shelter('zz-hero-a', 'ZZ hero A');
  b := public.product_admin_create_shelter('zz-hero-b', 'ZZ hero B');
  c := public.product_admin_create_shelter('zz-hero-c', 'ZZ hero C (no site_content row)');
  reset role;
  delete from public.site_content where shelter_id in (a, b, c);
  insert into public.site_content (id, shelter_id, hero_drive_file_id) values (true, a, 'zz-hero-a');
  insert into public.site_content (id, shelter_id, hero_drive_file_id) values (true, b, 'zz-hero-b');

  delete from public.user_roles where user_id = u;
  insert into public.roles (shelter_id, key, name, kind) values (a, 'zz_hero_r', 'ZZ hero', 'custom') returning id into rid;
  insert into public.role_permissions (role_id, activity, level, shelter_id) values (rid, 'website.gallery', 2, a), (rid, 'website.approve', 2, a);
  insert into public.user_roles (user_id, role_id, shelter_id) values (u, rid, a);

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'aal', 'aal1')::text, true);
  perform set_config('request.headers', json_build_object('x-shelter-id', a)::text, true);
  perform public.set_hero_photo('zz-hero-a2');
  reset role;
  if (select hero_drive_file_id from public.site_content where shelter_id = a) <> 'zz-hero-a2' then raise exception 'set did not write'; end if;
  if (select hero_drive_file_id from public.site_content where shelter_id = b) <> 'zz-hero-b' then raise exception 'set touched the other shelter'; end if;

  set local role authenticated;
  perform public.set_hero_photo(null);
  reset role;
  if (select hero_drive_file_id from public.site_content where shelter_id = a) is not null then raise exception 'clear did not clear'; end if;
  if (select hero_drive_file_id from public.site_content where shelter_id = b) <> 'zz-hero-b' then raise exception 'clear touched the other shelter'; end if;

  -- no header: matches nothing
  set local role authenticated;
  perform set_config('request.headers', '{}', true);
  perform public.set_hero_photo('zz-nohdr');
  reset role;
  if exists (select 1 from public.site_content where shelter_id in (a, b) and hero_drive_file_id = 'zz-nohdr') then raise exception 'no header wrote a row'; end if;

  -- approve_website_draft: a draft on B cannot be approved from A; a draft on A changes A only
  insert into public.website_drafts (target, row_key, patch, proposed_by, shelter_id)
    values ('site_content', 'x', '{"hero_drive_file_id":"zz-drafted"}', u, b) returning id into did;
  set local role authenticated;
  perform set_config('request.headers', json_build_object('x-shelter-id', a)::text, true);
  ok := public.approve_website_draft(did);
  reset role;
  if ok then raise exception 'approved another shelter draft'; end if;
  if (select hero_drive_file_id from public.site_content where shelter_id = b) <> 'zz-hero-b' then raise exception 'B changed by a draft from A'; end if;
  delete from public.website_drafts where id = did;
  insert into public.website_drafts (target, row_key, patch, proposed_by, shelter_id)
    values ('site_content', 'x', '{"hero_drive_file_id":"zz-drafted"}', u, a) returning id into did;
  set local role authenticated;
  ok := public.approve_website_draft(did);
  reset role;
  if not ok then raise exception 'own draft not approved'; end if;
  if (select hero_drive_file_id from public.site_content where shelter_id = a) <> 'zz-drafted' then raise exception 'approve did not write A'; end if;
  if (select hero_drive_file_id from public.site_content where shelter_id = b) <> 'zz-hero-b' then raise exception 'approve touched B'; end if;

  -- a shelter with no row changes nothing
  set local role authenticated;
  perform set_config('request.headers', json_build_object('x-shelter-id', c)::text, true);
  perform public.set_hero_photo('zz-c');
  reset role;
  if (select count(*) from public.site_content where hero_drive_file_id = 'zz-c') <> 0 then raise exception 'row-less shelter wrote someone'; end if;
  raise exception 'HARNESS OK hero scope';
end $$;
rollback;
