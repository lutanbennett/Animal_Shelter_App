-- Rollback harness for 0335 / 0336 / 0337 (suppliers). Dev only.
--   node scripts/run-harness.mjs supabase/harness/0335_suppliers_harness.sql
-- Success is the HARNESS-OK message, raised on purpose so nothing commits.
begin;

create function pg_temp.as_user(u uuid) returns void language plpgsql as $f$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated', 'aal', 'aal2')::text, true);
end $f$;

-- runs one statement as a login, returns the row count it touched or -1 when it was refused
create function pg_temp.try_as(u uuid, stmt text) returns int language plpgsql as $f$
declare n int;
begin
  perform pg_temp.as_user(u);
  set local role authenticated;
  begin
    execute stmt;
    get diagnostics n = row_count;
  exception when others then
    n := -1;
  end;
  reset role;
  return n;
end $f$;

do $h$
declare
  v_admin uuid; v_none uuid; v_reader uuid; v_ro uuid; v_role uuid; u uuid;
  v_contact uuid; v_s uuid; v_s2 uuid; v_fc uuid; v_fs uuid; v_d uuid;
  n int; n_before int; n_after int; v_pub int;
begin
  -- logins: an admin, a login holding NONE of the supplier-read activities, and a non-admin holding one of them
  for u in select distinct ur.user_id from user_roles ur where ur.archived_at is null loop
    perform pg_temp.as_user(u);
    if v_admin is null and coalesce((select is_admin()), false) then v_admin := u; end if;
    if not coalesce((select is_admin()), false) then
      if v_none is null
         and not coalesce((select has_permission('stock.delivery')), false)
         and not coalesce((select has_permission('stock.purchasing')), false)
         and not coalesce((select has_permission('bills.general')), false)
         and not coalesce((select has_permission('bills.utilities')), false)
         and not coalesce((select has_permission('maintenance.bills')), false)
         and not coalesce((select has_permission('friends.manage')), false)
         and not coalesce((select has_permission('friends.view')), false)
         and not coalesce((select has_permission('contacts.directory', 'read')), false) then v_none := u; end if;
      if v_none is not null and v_reader is null and u <> v_none
         and not coalesce((select has_permission('stock.delivery')), false)
         and not coalesce((select has_permission('contacts.add')), false)
         and not coalesce((select has_permission('contacts.directory')), false)
         and not coalesce((select has_permission('friends.manage')), false) then v_reader := u; end if;
    end if;
  end loop;
  if v_admin is null then raise exception 'FAIL 0a no admin login on dev'; end if;
  if v_none is null then raise exception 'FAIL 0b no login on dev lacking every supplier-read activity'; end if;
  if v_reader is null then raise exception 'FAIL 0c needs a second login with no supplier cell to give a read-only role to'; end if;
  -- a disposable role holding ONLY stock.delivery, given to that login for this transaction
  insert into roles (key, name, kind) values ('harness_ro', 'Harness read only', 'custom') returning id into v_role;
  insert into role_permissions (role_id, activity, level) values (v_role, 'stock.delivery', 2);
  insert into user_roles (user_id, role_id, is_main) values (v_reader, v_role, false);
  v_ro := v_reader;

  -- A. back-fill is safe to run twice
  insert into contacts (name, type) values ('Harness Vendor', 'Vendor') returning id into v_contact;
  insert into suppliers (name, source_contact_id) select c.name, c.id from contacts c where c.type = 'Vendor' on conflict (source_contact_id) do nothing;
  select count(*) into n_before from suppliers;
  insert into suppliers (name, source_contact_id) select c.name, c.id from contacts c where c.type = 'Vendor' on conflict (source_contact_id) do nothing;
  select count(*) into n_after from suppliers;
  if n_before <> n_after then raise exception 'FAIL A1 a second back-fill added % rows', n_after - n_before; end if;
  select id into v_s from suppliers where source_contact_id = v_contact;
  if v_s is null then raise exception 'FAIL A2 the Vendor contact was not copied'; end if;

  -- B. the permission: an admin writes, a card holder reads, nobody without a cell reads or writes
  n := pg_temp.try_as(v_admin, 'insert into suppliers (name) values (''Harness admin supplier'')');
  if n <> 1 then raise exception 'FAIL B1 admin could not insert (%)', n; end if;
  n := pg_temp.try_as(v_reader, 'select 1 from suppliers where id = ''' || v_s || '''');
  if n < 1 then raise exception 'FAIL B2 a stock.delivery holder cannot read a supplier (%)', n; end if;
  n := pg_temp.try_as(v_none, 'select 1 from suppliers');
  if n <> 0 then raise exception 'FAIL B3 a login with no supplier cell read % rows', n; end if;
  n := pg_temp.try_as(v_none, 'insert into suppliers (name) values (''x'')');
  if n <> -1 then raise exception 'FAIL B4 a login with no cell inserted a supplier (%)', n; end if;
  n := pg_temp.try_as(v_ro, 'insert into suppliers (name) values (''x'')');
  if n <> -1 then raise exception 'FAIL B5 a read-only holder inserted a supplier (%)', n; end if;
  n := pg_temp.try_as(v_ro, 'update suppliers set name = ''renamed'' where id = ''' || v_s || '''');
  if n <> 0 then raise exception 'FAIL B6 a read-only holder updated % supplier rows', n; end if;
  n := pg_temp.try_as(v_ro, 'delete from suppliers where id = ''' || v_s || '''');
  if n <> 0 then raise exception 'FAIL B7 a read-only holder deleted % supplier rows', n; end if;
  set local role anon;
  begin
    perform 1 from suppliers;
    reset role;
    raise exception 'FAIL B8 anon read suppliers';
  exception when insufficient_privilege then
    reset role;
  end;

  -- C. a Shelter Friend from a contact still works, from a supplier now works, and the check holds
  insert into contacts (name, type, phone) values ('Harness Friend Contact', 'Partner', '111') returning id into v_fc;
  insert into suppliers (name, phone) values ('Harness Friend Supplier', '222') returning id into v_s2;
  select count(*) into v_pub from public_shelter_friends;
  insert into shelter_friends (contact_id, published, show_phone) values (v_fc, true, true);
  insert into shelter_friends (supplier_id, published, show_phone) values (v_s2, true, true) returning id into v_fs;
  begin
    insert into shelter_friends (contact_id, supplier_id) values (v_fc, v_s2);
    raise exception 'FAIL C1 both subjects accepted';
  exception when check_violation or unique_violation then null;
  end;
  begin
    insert into shelter_friends (published) values (false);
    raise exception 'FAIL C2 no subject accepted';
  exception when check_violation then null;
  end;
  begin
    insert into shelter_friends (supplier_id) values (v_s2);
    raise exception 'FAIL C3 a second Friend for one supplier';
  exception when unique_violation then null;
  end;
  set local role anon;
  if (select count(*) from public_shelter_friends) <> v_pub + 2 then
    raise exception 'FAIL C4 website sees % Friends not %', (select count(*) from public_shelter_friends), v_pub + 2;
  end if;
  if (select phone from public_shelter_friends where name = 'Harness Friend Supplier') is distinct from '222' then
    raise exception 'FAIL C5 supplier Friend phone missing';
  end if;
  if (select phone from public_shelter_friends where name = 'Harness Friend Contact') is distinct from '111' then
    raise exception 'FAIL C6 contact Friend phone changed';
  end if;
  reset role;
  update suppliers set archived_at = now() where id = v_s2;
  set local role anon;
  if exists (select 1 from public_shelter_friends where name = 'Harness Friend Supplier') then
    raise exception 'FAIL C7 an archived supplier is still on the website';
  end if;
  reset role;

  -- D. the history re-key: an old-style write (contact only) gets its supplier_id; the old column still works
  insert into stock_deliveries (supplier_contact_id) values (v_contact) returning id into v_d;
  if (select supplier_id from stock_deliveries where id = v_d) is distinct from v_s then raise exception 'FAIL D1 the delivery did not get supplier_id'; end if;
  if (select supplier_contact_id from stock_deliveries where id = v_d) is distinct from v_contact then raise exception 'FAIL D2 the old column changed'; end if;

  raise exception 'HARNESS-OK back-fill repeats cleanly | admin writes, stock.delivery holder reads only, no-cell login reads and writes nothing, anon refused | Friend from contact and from supplier, both/neither/duplicate refused, website sees both and drops an archived supplier | old-style delivery write gets supplier_id and keeps supplier_contact_id';
end;
$h$;
rollback;
