-- Harness for 0438 (#shsec). Run: node scripts/run-harness.mjs supabase/harness/0438_product_admin_shelter_access.sql
-- begin ... rollback: nothing is kept. It ends by raising its result. It proves the three writers refuse a non-product-administrator, refuse
-- below aal2, refuse a role that is not the shelter's, and refuse to leave a shelter with no live Admin login (23514).
-- It sets request.jwt.claims with a real product administrator's sub and aal2; the refusal cases set other claims. It proves nothing about anon scoping.
begin;
do $$
declare
  v_pa uuid; v_user uuid; v_shelter uuid; v_admin uuid; v_other uuid; v_out text := '';
  v_code text;
begin
  select user_id into v_pa from public.product_admins limit 1;
  select u.id into v_user from auth.users u where not exists (select 1 from public.user_roles r where r.user_id = u.id) limit 1;
  if v_pa is null or v_user is null then raise exception 'HARNESS SETUP: need a product admin and a login with no role'; end if;
  insert into public.shelters (key, name) values ('shsec-harness', 'shsec harness') returning id into v_shelter;
  insert into public.roles (shelter_id, key, name, kind, is_admin) values (v_shelter, 'admin', 'Admin', 'fixed', true) returning id into v_admin;
  insert into public.roles (shelter_id, key, name, kind) values (v_shelter, 'helper', 'Helper', 'custom') returning id into v_other;

  -- Not a product administrator: refused (42501).
  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  begin perform public.product_admin_access_add(v_shelter, 'x@example.invalid', 'helper'); v_out := v_out || 'FAIL non-PA allowed; ';
  exception when others then get stacked diagnostics v_code = returned_sqlstate; v_out := v_out || 'non-PA ' || v_code || '; '; end;
  -- Product administrator but aal1: refused (42501).
  perform set_config('request.jwt.claims', json_build_object('sub', v_pa, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  begin perform public.product_admin_shelter_access(v_shelter); v_out := v_out || 'FAIL aal1 allowed; ';
  exception when others then get stacked diagnostics v_code = returned_sqlstate; v_out := v_out || 'aal1 ' || v_code || '; '; end;

  perform set_config('request.jwt.claims', json_build_object('sub', v_pa, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  -- A role that is not this shelter's: refused (22023).
  begin perform public.product_admin_access_add(v_shelter, (select email from auth.users where id = v_user), 'no_such_role'); v_out := v_out || 'FAIL bad role allowed; ';
  exception when others then get stacked diagnostics v_code = returned_sqlstate; v_out := v_out || 'bad role ' || v_code || '; '; end;
  -- Make the login the shelter's only Admin, then try to demote and to remove it: both refused (23514).
  perform public.product_admin_access_add(v_shelter, (select email from auth.users where id = v_user), 'admin');
  begin perform public.product_admin_access_set_role(v_shelter, v_user, 'helper'); v_out := v_out || 'FAIL demote allowed; ';
  exception when others then get stacked diagnostics v_code = returned_sqlstate; v_out := v_out || 'sole-admin demote ' || v_code || '; '; end;
  begin perform public.product_admin_access_remove(v_shelter, v_user); v_out := v_out || 'FAIL remove allowed; ';
  exception when others then get stacked diagnostics v_code = returned_sqlstate; v_out := v_out || 'sole-admin remove ' || v_code || '; '; end;
  -- The audit row names the product administrator and the shelter.
  if not exists (select 1 from public.audit_log where table_name = 'user_roles' and actor = v_pa and shelter_id = v_shelter) then v_out := v_out || 'FAIL no audit row; ';
  else v_out := v_out || 'audit names PA and shelter; '; end if;
  raise exception 'HARNESS RESULT: %', v_out;
end $$;
rollback;
