-- #shlog schema half (0429): a shelter's own logo, readable by the public for that shelter only. Rolls back.
-- Run: node scripts/run-harness.mjs supabase/harness/shelter_logo.sql   (passes by raising 'HARNESS OK shlog schema')
begin;
do $$
declare u uuid; a uuid; b uuid; rid uuid; seen text; failed boolean; n int;
begin
  select id into u from auth.users where email is not null order by created_at limit 1;
  insert into public.product_admins (user_id) values (u) on conflict do nothing;
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'aal', 'aal2')::text, true);
  a := public.product_admin_create_shelter('zz-shlog-a', 'ZZ shlog A');
  b := public.product_admin_create_shelter('zz-shlog-b', 'ZZ shlog B');
  reset role;
  delete from public.site_content where shelter_id in (a, b);
  insert into public.site_content (id, shelter_id, logo_drive_file_id) values (true, a, 'zz-logo-a');
  insert into public.site_content (id, shelter_id, logo_drive_file_id) values (true, b, null);

  -- the public reads ITS shelter's logo and nothing of the other's
  set local role anon;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('request.headers', json_build_object('x-shelter-id', a)::text, true);
  select logo_drive_file_id into seen from public.public_site_content;
  if seen is distinct from 'zz-logo-a' then raise exception 'shelter A public view did not return its logo: %', seen; end if;
  if not public.is_public_drive_file('zz-logo-a') then raise exception 'A logo not public on A site'; end if;
  perform set_config('request.headers', json_build_object('x-shelter-id', b)::text, true);
  select count(*) into n from public.public_site_content where logo_drive_file_id is not null;
  if n <> 0 then raise exception 'shelter B site sees a logo it does not have'; end if;
  if public.is_public_drive_file('zz-logo-a') then raise exception 'A logo served on B site'; end if;
  perform set_config('request.headers', '{}', true);
  select count(*) into n from public.public_site_content;
  if n <> 0 then raise exception 'no header still returns rows: %', n; end if;
  reset role;

  -- the write: a login holding website.gallery on A may set it, one holding nothing may not
  delete from public.user_roles where user_id = u; -- rolled back with everything else
  insert into public.roles (shelter_id, key, name, kind) values (a, 'zz_shlog_gal', 'ZZ gallery', 'custom') returning id into rid;
  insert into public.role_permissions (role_id, activity, level, shelter_id) values (rid, 'website.gallery', 2, a);
  insert into public.user_roles (user_id, role_id, shelter_id) values (u, rid, a);
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'aal', 'aal1')::text, true);
  perform set_config('request.headers', json_build_object('x-shelter-id', a)::text, true);
  perform public.set_shelter_logo('zz-logo-a2');
  reset role;
  if (select logo_drive_file_id from public.site_content where shelter_id = a) <> 'zz-logo-a2' then raise exception 'set did not write'; end if;
  if (select logo_drive_file_id from public.site_content where shelter_id = b) is not null then raise exception 'set touched the other shelter'; end if;
  set local role authenticated;
  perform public.set_shelter_logo('   ');
  reset role;
  if (select logo_drive_file_id from public.site_content where shelter_id = a) is not null then raise exception 'blank did not clear'; end if;

  delete from public.user_roles where role_id = rid;
  set local role authenticated;
  failed := false;
  begin perform public.set_shelter_logo('zz-nope'); exception when others then failed := true; end;
  reset role;
  if not failed then raise exception 'a login with no card set a logo'; end if;
  set local role anon;
  failed := false;
  begin perform public.set_shelter_logo('zz-nope'); exception when others then failed := true; end;
  reset role;
  if not failed then raise exception 'anon set a logo'; end if;
  raise exception 'HARNESS OK shlog schema';
end $$;
rollback;
