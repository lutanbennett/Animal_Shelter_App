-- Proves 0414's gate: non-PADMIN refused, PADMIN at aal1 refused, PADMIN at aal2 works. Rolls back.
begin;
do $$
declare u uuid; sid uuid; r text := '';
begin
  select id into u from auth.users limit 1;
  insert into public.product_admins (user_id) values (u) on conflict do nothing;
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'aal', 'aal2')::text, true);
  begin perform public.product_admin_create_shelter('zz-test', 'Z'); r := r || 'nonpadmin:ALLOWED '; exception when sqlstate '42501' then r := r || 'nonpadmin:refused '; end;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'aal', 'aal1')::text, true);
  begin perform public.product_admin_create_shelter('zz-test', 'Z'); r := r || 'aal1:ALLOWED '; exception when sqlstate '42501' then r := r || 'aal1:refused '; end;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'aal', 'aal2')::text, true);
  sid := public.product_admin_create_shelter(' ZZ-Test ', 'Z');
  perform public.product_admin_map_host(sid, 'ZZ-Test.Example.org:443');
  begin perform public.product_admin_map_host(sid, 'zz-test.example.org'); r := r || 'dup:ALLOWED '; exception when sqlstate '23505' then r := r || 'dup:refused '; end;
  perform public.product_admin_unmap_host('zz-test.example.org');
  raise exception 'HARNESS: % create+map+unmap ok', r;
end $$;
rollback;
