-- Proves 0415: non-PADMIN refused, aal1 refused, aal2 creates Admin role (no cards) and links a login, second Admin refused, Admin role holds no cards yet is_admin. Rolls back.
begin;
do $$
declare u uuid; v uuid; sid uuid; rid uuid; r text := ''; n int; adm boolean;
begin
  select id into u from auth.users order by created_at limit 1;
  select id into v from auth.users where not exists (select 1 from public.user_roles x where x.user_id = auth.users.id) limit 1;
  if v is null then insert into auth.users (id, email) values (gen_random_uuid(), 'zz-harness@example.invalid') returning id into v; end if;
  insert into public.product_admins (user_id) values (u) on conflict do nothing;
  insert into public.shelters (key, name) values ('zz-adm', 'ZZ') returning id into sid;
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'aal', 'aal2')::text, true);
  begin perform public.product_admin_create_shelter_admin_role(sid); r := r || 'nonpadmin:ALLOWED '; exception when sqlstate '42501' then r := r || 'nonpadmin:refused '; end;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'aal', 'aal1')::text, true);
  begin perform public.product_admin_create_shelter_admin_role(sid); r := r || 'aal1:ALLOWED '; exception when sqlstate '42501' then r := r || 'aal1:refused '; end;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'aal', 'aal2')::text, true);
  rid := public.product_admin_create_shelter_admin_role(sid);
  begin perform public.product_admin_create_shelter_admin_role(sid); r := r || 'second:ALLOWED '; exception when sqlstate '23505' then r := r || 'second:refused '; end;
  perform public.product_admin_link_shelter_admin(sid, v);
  begin perform public.product_admin_link_shelter_admin(sid, v); r := r || 'duplink:ALLOWED '; exception when sqlstate '23505' then r := r || 'duplink:refused '; end;
  begin perform public.product_admin_link_shelter_admin(sid, gen_random_uuid()); r := r || 'unknownuser:ALLOWED '; exception when sqlstate '22023' then r := r || 'unknownuser:refused '; end;
  reset role;
  select count(*) into n from public.role_cards where role_id = rid;
  select is_admin into adm from public.roles where id = rid;
  -- full access is the flag, read by has_permission(): prove it as the linked login
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', v, 'aal', 'aal2')::text, true);
  perform set_config('request.headers', json_build_object('x-shelter-id', sid)::text, true);
  r := r || 'cards=' || n || ' is_admin=' || adm || ' has_permission=' || coalesce(public.has_permission('resident.record', 'edit')::text, 'null');
  raise exception 'HARNESS: %', r;
end $$;
rollback;
