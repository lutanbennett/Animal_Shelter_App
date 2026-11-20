-- #pacon schema half (0428): account holder, primary host, archive door, enquiry carry. Rolls back.
-- Run: node scripts/run-harness.mjs supabase/harness/shelter_state.sql   (passes by raising 'HARNESS OK ...')
begin;
do $$
declare u uuid; sid uuid; eid uuid; j json; r record; failed boolean; n int;
begin
  select id into u from auth.users where email is not null order by created_at limit 1;
  insert into public.product_admins (user_id) values (u) on conflict do nothing;
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'aal', 'aal2')::text, true);
  sid := public.product_admin_create_shelter('zz-pacon', 'ZZ pacon throwaway');
  reset role;
  insert into public.shelter_hosts (host, shelter_id) values ('zz-pacon-a.example', sid), ('zz-pacon-b.example', sid);
  select count(*) into n from public.shelter_hosts where shelter_id = sid and is_primary;
  if n <> 1 then raise exception 'first host not the only primary: %', n; end if;
  if not (select is_primary from public.shelter_hosts where host = 'zz-pacon-a.example') then raise exception 'first host is not primary'; end if;
  begin
    update public.shelter_hosts set is_primary = true where host = 'zz-pacon-b.example';
    raise exception 'two primaries allowed';
  exception when unique_violation then null; end;

  set local role authenticated;
  perform public.product_admin_set_primary_host(sid, 'ZZ-pacon-b.example');
  select * into r from public.product_admin_shelters() where key = 'zz-pacon';
  reset role;
  if r.primary_host <> 'zz-pacon-b.example' then raise exception 'primary not moved: %', r.primary_host; end if;
  if r.archived_at is not null or r.public_site <> 'locked' then raise exception 'new shelter state wrong: %', r; end if;

  -- the door
  j := resolve_shelter_site('zz-pacon-a.example');
  if (j->>'id') <> sid::text or (j->>'archived')::boolean then raise exception 'open shelter door wrong: %', j; end if;
  set local role authenticated;
  perform public.product_admin_set_shelter_archived(sid, true);
  reset role;
  j := resolve_shelter_site('zz-pacon-a.example');
  if (j->>'id') is not null or (j->>'site') is not null or not (j->>'archived')::boolean then raise exception 'archived door still open: %', j; end if;
  if (select public_site from public.shelters where id = sid) <> 'locked' then raise exception 'archive changed public_site'; end if;
  if not exists (select 1 from public.shelter_hosts where shelter_id = sid and is_primary) then raise exception 'archive touched hosts'; end if;
  set local role authenticated;
  select * into r from public.product_admin_shelters() where key = 'zz-pacon';
  reset role;
  if r.archived_at is null then raise exception 'archived shelter not listed as archived'; end if;
  set local role authenticated;
  perform public.product_admin_set_shelter_archived(sid, false);
  reset role;
  if (resolve_shelter_site('zz-pacon-a.example')->>'id') <> sid::text then raise exception 'unarchive did not reopen'; end if;
  -- a host that is not registered at all
  if resolve_shelter_site('nowhere.example') is not null then raise exception 'unknown host returned a row'; end if;

  -- aal1 and non-PADMIN refused
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'aal', 'aal1')::text, true);
  failed := false;
  begin perform public.product_admin_set_shelter_archived(sid, true); exception when others then failed := true; end;
  reset role;
  if not failed then raise exception 'aal1 archived a shelter'; end if;

  -- enquiry carry
  insert into public.shelter_enquiries (shelter_name, contact_name, email, phone, location) values ('ZZ', 'Pat Holder', 'zz-pacon@example.invalid', '+66 1', 'Phuket') returning id into eid;
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'aal', 'aal2')::text, true);
  perform public.product_admin_set_shelter_account_holder(sid, 'Typed Name', null, null, null);
  perform public.product_admin_carry_enquiry(sid, eid);
  perform public.product_admin_carry_enquiry(sid, eid);
  select * into r from public.product_admin_shelters() where key = 'zz-pacon';
  reset role;
  if r.account_holder_name <> 'Typed Name' then raise exception 'carry overwrote a typed name: %', r.account_holder_name; end if;
  if r.account_holder_email <> 'zz-pacon@example.invalid' or r.account_holder_phone <> '+66 1' or r.account_holder_location <> 'Phuket' or r.enquiry_id <> eid then raise exception 'carry incomplete: %', r; end if;
  if (select status from public.shelter_enquiries where id = eid) <> 'created' then raise exception 'enquiry not marked created'; end if;
  raise exception 'HARNESS OK pacon schema';
end $$;
rollback;
