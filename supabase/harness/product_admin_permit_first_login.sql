-- #flogn (0425): the gate for creating a shelter's first login. Runs as the `authenticated` role with a JWT, NOT as the service role. Rolls back.
-- Run: node scripts/run-harness.mjs supabase/harness/product_admin_permit_first_login.sql   (passes by raising 'HARNESS OK ...')
begin;
do $$
declare u uuid; v uuid; vem text; sid uuid; n int; failed boolean; code text; em text;
begin
  select id, email into u, em from auth.users where email is not null order by created_at limit 1;
  select id into v from auth.users x where x.id <> u and not exists (select 1 from public.product_admins p where p.user_id = x.id) order by created_at limit 1;
  insert into public.product_admins (user_id) values (u) on conflict do nothing;
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'aal', 'aal2')::text, true);
  sid := public.product_admin_create_shelter('zz-flogn', 'ZZ flogn throwaway');
  -- 1. no Admin role yet: refused
  begin perform public.product_admin_permit_first_login(sid, 'first@example.invalid'); failed := false; exception when others then failed := true; get stacked diagnostics code = returned_sqlstate; end;
  if not failed or code <> '22023' then raise exception 'permitted with no Admin role (failed %, code %)', failed, code; end if;
  perform public.product_admin_create_shelter_admin_role(sid);
  -- 2. bad address and an existing login: refused
  begin perform public.product_admin_permit_first_login(sid, 'not-an-email'); failed := false; exception when others then failed := true; end;
  if not failed then raise exception 'bad address permitted'; end if;
  begin perform public.product_admin_permit_first_login(sid, upper(em)); failed := false; exception when others then failed := true; get stacked diagnostics code = returned_sqlstate; end;
  if not failed or code <> '23505' then raise exception 'existing login permitted (failed %, code %)', failed, code; end if;
  -- 3. the good case, recorded
  perform public.product_admin_permit_first_login(sid, 'First@Example.invalid');
  select count(*) into n from public.product_admin_login_grants where for_shelter = sid and email = 'first@example.invalid' and actor = u;
  if n <> 1 then raise exception 'grant not recorded, rows %', n; end if;
  -- 4. append-only
  begin delete from public.product_admin_login_grants where for_shelter = sid; failed := false; exception when others then failed := true; end;
  if not failed then raise exception 'grant row deleted'; end if;
  -- 5. aal1 refused; non-PADMIN refused
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'aal', 'aal1')::text, true);
  begin perform public.product_admin_permit_first_login(sid, 'second@example.invalid'); failed := false; exception when others then failed := true; get stacked diagnostics code = returned_sqlstate; end;
  if not failed or code <> '42501' then raise exception 'aal1 permitted'; end if;
  if v is not null then
    perform set_config('request.jwt.claims', json_build_object('sub', v, 'aal', 'aal2')::text, true);
    begin perform public.product_admin_permit_first_login(sid, 'third@example.invalid'); failed := false; exception when others then failed := true; get stacked diagnostics code = returned_sqlstate; end;
    if not failed or code <> '42501' then raise exception 'non-PADMIN permitted'; end if;
  end if;
  -- 6. once a login is linked the door shuts (needs a login with no main role)
  reset role;
  select id into v from auth.users x where x.id <> u and not exists (select 1 from public.user_roles ur where ur.user_id = x.id and ur.is_main) order by created_at limit 1;
  if v is not null then
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', u, 'aal', 'aal2')::text, true);
    perform public.product_admin_link_shelter_admin(sid, v);
    begin perform public.product_admin_permit_first_login(sid, 'fourth@example.invalid'); failed := false; exception when others then failed := true; get stacked diagnostics code = returned_sqlstate; end;
    if not failed or code <> '23505' then raise exception 'second login permitted (code %)', code; end if;
  end if;
  reset role;
  raise exception 'HARNESS OK permit_first_login (linked step ran: %)', v is not null;
end $$;
rollback;
