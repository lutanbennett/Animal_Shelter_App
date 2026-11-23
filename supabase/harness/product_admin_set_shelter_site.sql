-- Harness for 0436: begin..rollback. Proves refusal without claims, refusal at aal1, bad value rejected, happy path sets and reads back.
begin;
do $$
declare v_shelter uuid; v_user uuid; v_site text; v_refused boolean;
begin
  insert into auth.users (id, email) values (gen_random_uuid(), 'harness-0436@example.invalid') returning id into v_user;
  insert into public.product_admins (user_id) values (v_user);
  insert into public.shelters (key, name) values ('h0436', 'Harness 0436') returning id into v_shelter;
  select public_site into v_site from public.shelters where id = v_shelter;
  if v_site <> 'locked' then raise exception 'FAIL born % not locked', v_site; end if;

  v_refused := false;
  begin perform public.product_admin_set_shelter_site(v_shelter, 'open'); exception when others then v_refused := true; end;
  if not v_refused then raise exception 'FAIL no-claims call was not refused'; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  v_refused := false;
  begin perform public.product_admin_set_shelter_site(v_shelter, 'open'); exception when others then v_refused := true; end;
  if not v_refused then raise exception 'FAIL aal1 call was not refused'; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  v_refused := false;
  begin perform public.product_admin_set_shelter_site(v_shelter, 'bogus'); exception when others then v_refused := true; end;
  if not v_refused then raise exception 'FAIL bogus value accepted'; end if;

  perform public.product_admin_set_shelter_site(v_shelter, 'open');
  select public_site into v_site from public.shelters where id = v_shelter;
  if v_site <> 'open' then raise exception 'FAIL open did not stick: %', v_site; end if;
  perform public.product_admin_set_shelter_site(v_shelter, 'locked');
  select public_site into v_site from public.shelters where id = v_shelter;
  if v_site <> 'locked' then raise exception 'FAIL relock: %', v_site; end if;

  raise exception 'HARNESS OK: born locked; refused without claims and at aal1; bogus rejected; open and locked round-trip';
end $$;
rollback;
