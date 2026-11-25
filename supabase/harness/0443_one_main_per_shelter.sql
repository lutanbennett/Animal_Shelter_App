-- Harness for 0443 (#acwho schema half): one main role PER SHELTER. begin ... rollback; success is the exception message at the end.
-- Run: node scripts/run-harness.mjs supabase/harness/0443_one_main_per_shelter.sql   (passes by raising 'HARNESS OK 0443')
begin;
do $$
declare sa uuid := gen_random_uuid(); sb uuid := gen_random_uuid();
        ra uuid := gen_random_uuid(); ra2 uuid := gen_random_uuid(); rb uuid := gen_random_uuid(); rbadmin uuid := gen_random_uuid();
        u uuid := gen_random_uuid(); u3 uuid := gen_random_uuid(); rbboss uuid := gen_random_uuid(); u2 uuid := gen_random_uuid(); pa uuid := gen_random_uuid();
        n int; k text; adm boolean; failed boolean; v uuid; legacy int;
begin
  -- existing rows: no login holds two main rows today, so the new index accepts everything already there
  select count(*) into legacy from (select user_id from public.user_roles where is_main group by user_id having count(*) > 1) x;
  if legacy <> 0 then raise exception 'FAIL existing rows: % logins hold two main roles', legacy; end if;
  if (select is_nullable from information_schema.columns where table_name = 'user_roles' and column_name = 'shelter_id' and table_schema = 'public') <> 'NO' then
    raise exception 'FAIL user_roles.shelter_id is nullable, so the per-shelter index would not bind';
  end if;
  if not exists (select 1 from pg_indexes where indexname = 'user_roles_one_main' and indexdef like '%(user_id, shelter_id)%') then
    raise exception 'FAIL index is not per shelter';
  end if;

  insert into shelters(id,key,name) values (sa,'h443-a','H443 Alpha'),(sb,'h443-b','H443 Beta');
  insert into shelter_hosts(host,shelter_id,is_primary) values ('h443-a.example.test',sa,true),('h443-b.example.test',sb,true);
  insert into auth.users(id,email,aud,role) values (u,'h443-u@example.invalid','authenticated','authenticated'),(u2,'h443-u2@example.invalid','authenticated','authenticated'),
    (u3,'h443-u3@example.invalid','authenticated','authenticated'),
    (pa,'h443-pa@example.invalid','authenticated','authenticated');
  -- A's role is its Admin (named 'zz_a_boss', NOT 'admin'); B's Admin role is named 'admin' on purpose... B's plain role holds a card
  insert into roles(id,key,name,kind,shelter_id,is_admin) values (ra,'zz_a_boss','A boss','custom',sa,true),(ra2,'zz_a_plain','A plain','custom',sa,false),
    (rb,'zz_b_plain','B plain','custom',sb,false),(rbboss,'zz_b_boss','B boss','custom',sb,true),
    (rbadmin,'admin','B role keyed admin, no flag','fixed',sb,false);
  insert into role_permissions(role_id, activity, level, shelter_id) values (rb, 'website.gallery', 2, sb);

  -- (1) the same login holds a MAIN role in each of two shelters
  insert into user_roles(user_id,role_id,shelter_id,is_main) values (u,ra,sa,true),(u,rb,sb,true);
  -- (2) a SECOND main role in the SAME shelter is still refused
  failed := false;
  begin insert into user_roles(user_id,role_id,shelter_id,is_main) values (u,ra2,sa,true);
  exception when unique_violation then failed := true; end;
  if not failed then raise exception 'FAIL a second main role in the same shelter was accepted'; end if;

  -- (3) the guard: an additional role needs a main role in ITS OWN shelter
  failed := false;
  insert into user_roles(user_id,role_id,shelter_id,is_main) values (u2,ra,sa,true);
  begin insert into user_roles(user_id,role_id,shelter_id,is_main) values (u2,rb,sb,false);
  exception when check_violation then failed := true; end;
  if not failed then raise exception 'FAIL an additional role in B was accepted for a login with a main role only in A'; end if;
  -- (3b) Admin is refused as an additional role by FLAG, whatever the role is named
  failed := false;
  begin insert into user_roles(user_id,role_id,shelter_id,is_main) values (u,ra,sa,false);
  exception when check_violation or unique_violation then failed := true; end;
  if not failed then raise exception 'FAIL Admin accepted as an additional role'; end if;
  -- (3c) a role merely NAMED admin, but not Admin, is no longer refused as additional (login u has a main role in B)
  insert into user_roles(user_id,role_id,shelter_id,is_main) values (u,rbadmin,sb,false);
  delete from user_roles where user_id = u and role_id = rbadmin;

  insert into user_roles(user_id,role_id,shelter_id,is_main) values (u3,ra,sa,true),(u3,rbboss,sb,true);

  -- (4) my_shelters() lists both, from the login's own session
  set local role authenticated;
  perform set_config('request.headers', json_build_object('x-shelter-id', sa::text)::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', u::text, 'role','authenticated')::text, true);
  select count(*) into n from my_shelters();
  if n <> 2 then raise exception 'FAIL my_shelters returned % rows', n; end if;

  -- (5) each shelter's reads see only its own row, and the same for the permissions the login holds there
  select count(*) into n from user_roles where user_id = u;
  if n <> 1 then raise exception 'FAIL on A the login sees % of its own rows', n; end if;
  select (my_permissions() -> 'role' ->> 'key'), (my_permissions() ->> 'is_admin')::boolean into k, adm from (select 1) z;
  if k <> 'zz_a_boss' or adm is not true then raise exception 'FAIL A permissions: % %', k, adm; end if;
  select role_key into k from public.app_users where id = u;
  if k is distinct from 'zz_a_boss' then raise exception 'FAIL app_users on A: %', k; end if;

  perform set_config('request.headers', json_build_object('x-shelter-id', sb::text)::text, true);
  select count(*) into n from user_roles where user_id = u;
  if n <> 0 then raise exception 'FAIL on B a non-Admin reads % user_roles rows directly (policy is Admin-only)', n; end if;
  select (my_permissions() -> 'role' ->> 'key'), (my_permissions() ->> 'is_admin')::boolean into k, adm from (select 1) z;
  if k <> 'zz_b_plain' or adm is not false then raise exception 'FAIL B permissions: % % (Admin at A must not leak to B)', k, adm; end if;
  if not has_permission('website.gallery', 'edit') then raise exception 'FAIL B card not held'; end if;
  -- (public.app_users also needs the logins card, which B's plain role lacks, so B's app_users answer is proved with the Admin login below)
  perform set_config('request.headers', json_build_object('x-shelter-id', sa::text)::text, true);
  if has_permission('website.gallery', 'edit') is not true then
    null; -- A's Admin bypass answers true for everything; that is Admin, not a leak from B
  end if;
  -- (5b) ONE LOGIN ADMIN AT BOTH SHELTERS (the reason for the change): each shelter sees only its own row and its own role
  perform set_config('request.jwt.claims', json_build_object('sub', u3::text, 'role','authenticated')::text, true);
  perform set_config('request.headers', json_build_object('x-shelter-id', sa::text)::text, true);
  select count(*) into n from user_roles where user_id = u3;
  select (my_permissions() -> 'role' ->> 'key') into k;
  if n <> 1 or k <> 'zz_a_boss' then raise exception 'FAIL Admin-both on A: % %', n, k; end if;
  perform set_config('request.headers', json_build_object('x-shelter-id', sb::text)::text, true);
  select count(*) into n from user_roles where user_id = u3;
  select (my_permissions() -> 'role' ->> 'key') into k;
  if n <> 1 or k <> 'zz_b_boss' then raise exception 'FAIL Admin-both on B: % %', n, k; end if;
  select role_key into k from public.app_users where id = u3;
  if k is distinct from 'zz_b_boss' then raise exception 'FAIL app_users Admin-both on B: %', k; end if;
  reset role;

  -- (6) anon sees nothing of either shelter (claims set, as CLAUDE.md requires of a harness that speaks of anon)
  set local role anon;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('request.headers', json_build_object('x-shelter-id', sa::text)::text, true);
  begin select count(*) into n from user_roles; if n <> 0 then raise exception 'FAIL anon reads % user_roles rows', n; end if;
  exception when insufficient_privilege then null; end; -- anon holds no grant on user_roles at all: even stronger
  reset role;

  -- (7) the product-admin door adds a login that already has a main role in ANOTHER shelter
  insert into product_admins(user_id) values (pa) on conflict do nothing;
  insert into user_roles(user_id,role_id,shelter_id,is_main) values (pa,ra,sa,true);
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', pa::text, 'aal', 'aal2', 'role','authenticated')::text, true);
  perform set_config('request.headers', '{}', true);
  v := public.product_admin_access_add(sb, 'h443-u2@example.invalid', 'zz_b_plain');
  if v <> u2 then raise exception 'FAIL add returned %', v; end if;
  reset role;
  if (select count(*) from user_roles where user_id = u2 and is_main) <> 2 then raise exception 'FAIL u2 does not hold a main role in each shelter'; end if;
  -- ...and a second add in the SAME shelter re-roles rather than adding a second main row
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', pa::text, 'aal', 'aal2', 'role','authenticated')::text, true);
  perform public.product_admin_access_add(sb, 'h443-u2@example.invalid', 'admin');
  reset role;
  if (select count(*) from user_roles where user_id = u2 and shelter_id = sb and is_main) <> 1 then raise exception 'FAIL re-role made a second main row in B'; end if;

  raise exception 'HARNESS OK 0443';
end $$;
rollback;
