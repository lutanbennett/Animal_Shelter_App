-- Rollback harness for 0338_suppliers_card.sql. Dev only. Everything is rolled back; success is the HARNESS-OK message,
-- raised on purpose so nothing commits.
--   node scripts/run-harness.mjs supabase/harness/0338_suppliers_card_harness.sql
begin;

create function pg_temp.try_as(u uuid, stmt text) returns int language plpgsql as $f$
declare n int;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated', 'aal', 'aal2')::text, true);
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
  u_edit uuid := gen_random_uuid();  -- suppliers.directory at Edit ONLY (the suppliers card)
  u_read uuid := gen_random_uuid();  -- suppliers.directory at Read ONLY
  u_stock uuid := gen_random_uuid(); -- stock.delivery ONLY: names a supplier on a delivery, writes nothing
  u_old uuid := gen_random_uuid();   -- contacts.directory + contacts.add: the old writers, who must NOT write a supplier now
  r_edit uuid; r_read uuid; r_stock uuid; r_old uuid;
  v_s uuid; v_vc uuid; v_vf uuid; v_fr uuid; v_pub int;
  n int; n2 int;
begin
  insert into auth.users (id, email) values (u_edit, 'h-edit@example.invalid'), (u_read, 'h-read@example.invalid'),
    (u_stock, 'h-stock@example.invalid'), (u_old, 'h-old@example.invalid');
  insert into roles (key, name, kind) values ('h_sup_edit', 'h', 'custom') returning id into r_edit;
  insert into roles (key, name, kind) values ('h_sup_read', 'h', 'custom') returning id into r_read;
  insert into roles (key, name, kind) values ('h_sup_stock', 'h', 'custom') returning id into r_stock;
  insert into roles (key, name, kind) values ('h_sup_old', 'h', 'custom') returning id into r_old;
  insert into role_permissions (role_id, activity, level) values
    (r_edit, 'suppliers.directory', 2), (r_read, 'suppliers.directory', 1), (r_stock, 'stock.delivery', 2),
    (r_old, 'contacts.directory', 2), (r_old, 'contacts.add', 2);
  insert into user_roles (user_id, role_id) values (u_edit, r_edit), (u_read, r_read), (u_stock, r_stock), (u_old, r_old);

  -- the card and the activity exist, and the card grants exactly the one thing
  if not exists (select 1 from permission_activities where key = 'suppliers.directory' and kind = 'level') then
    raise exception 'FAIL 1: the activity is not in permission_activities';
  end if;
  if (select count(*) from card_grants where card = 'suppliers') <> 1
     or not exists (select 1 from card_grants where card = 'suppliers' and activity = 'suppliers.directory' and level = 2) then
    raise exception 'FAIL 2: the suppliers card does not grant exactly suppliers.directory at edit';
  end if;
  if not exists (select 1 from card_features where card = 'suppliers') then raise exception 'FAIL 3: the card is not filed under a feature'; end if;

  -- the edit login: add and change, but no delete (there is no delete policy)
  n := pg_temp.try_as(u_edit, $q$insert into suppliers (name) values ('Harness Feed Shop')$q$);
  if n <> 1 then raise exception 'FAIL 4: the edit login could not add a supplier (%)', n; end if;
  select id into v_s from suppliers where name = 'Harness Feed Shop';
  n := pg_temp.try_as(u_edit, format($q$update suppliers set notes = 'changed' where id = %L$q$, v_s));
  if n <> 1 then raise exception 'FAIL 5: the edit login could not change a supplier (%)', n; end if;
  n := pg_temp.try_as(u_edit, format($q$update suppliers set archived_at = now() where id = %L$q$, v_s));
  if n <> 1 then raise exception 'FAIL 6: the edit login could not archive a supplier (%)', n; end if;
  n := pg_temp.try_as(u_edit, format($q$delete from suppliers where id = %L$q$, v_s));
  if n <> 0 then raise exception 'FAIL 7: a delete took effect or errored where it should touch nothing (%)', n; end if;

  -- the read login: reads, writes nothing
  n := pg_temp.try_as(u_read, format($q$select 1 from suppliers where id = %L$q$, v_s));
  if n <> 1 then raise exception 'FAIL 8: the read login could not read a supplier (%)', n; end if;
  n := pg_temp.try_as(u_read, $q$insert into suppliers (name) values ('Nope')$q$);
  if n <> -1 then raise exception 'FAIL 9: the read login could insert (%)', n; end if;
  n := pg_temp.try_as(u_read, format($q$update suppliers set notes = 'x' where id = %L$q$, v_s));
  if n <> 0 and n <> -1 then raise exception 'FAIL 10: the read login changed a supplier (%)', n; end if;

  -- a stock.delivery login still reads the name (a delivery names a supplier) and still writes nothing
  n := pg_temp.try_as(u_stock, format($q$select 1 from suppliers where id = %L$q$, v_s));
  if n <> 1 then raise exception 'FAIL 11: the stock login could not read a supplier name (%)', n; end if;
  n := pg_temp.try_as(u_stock, $q$insert into suppliers (name) values ('Nope')$q$);
  if n <> -1 then raise exception 'FAIL 12: the stock login could insert (%)', n; end if;

  -- the old writers (Contacts) may no longer read or write a supplier
  n := pg_temp.try_as(u_old, format($q$select 1 from suppliers where id = %L$q$, v_s));
  if n <> 0 then raise exception 'FAIL 13: a Contacts-only login still reads suppliers (%)', n; end if;
  n := pg_temp.try_as(u_old, $q$insert into suppliers (name) values ('Nope')$q$);
  if n <> -1 then raise exception 'FAIL 14: a Contacts-only login could still insert a supplier (%)', n; end if;

  -- the catch-up back-fill: a Vendor contact filed after 0335 (no supplier twin), and a delivery naming it
  insert into contacts (name, type) values ('Harness Late Vendor', 'Vendor') returning id into v_vc;
  insert into suppliers (name, source_contact_id)
    select c.name, c.id from contacts c where c.type = 'Vendor' and c.id = v_vc
    on conflict (source_contact_id) do nothing;
  get diagnostics n = row_count;
  insert into suppliers (name, source_contact_id)
    select c.name, c.id from contacts c where c.type = 'Vendor' and c.id = v_vc
    on conflict (source_contact_id) do nothing;
  get diagnostics n2 = row_count;
  if n <> 1 or n2 <> 0 then raise exception 'FAIL 15: the back-fill is not safe to run twice (% then %)', n, n2; end if;

  -- a Shelter Friend on that Vendor contact moves to the supplier twin, and stays on the website
  insert into shelter_friends (contact_id, published, show_phone) values (v_vc, true, true) returning id into v_fr;
  select count(*) into v_pub from public_shelter_friends where id = v_fr;
  if v_pub <> 1 then raise exception 'FAIL 16: the Friend on a Vendor contact is not public before the re-point'; end if;
  update shelter_friends f set supplier_id = s.id, contact_id = null
    from contacts c join suppliers s on s.source_contact_id = c.id
   where f.contact_id = c.id and c.type = 'Vendor' and f.supplier_id is null;
  if not exists (select 1 from shelter_friends where id = v_fr and contact_id is null and supplier_id is not null) then
    raise exception 'FAIL 17: the Friend was not re-pointed at the supplier';
  end if;
  select count(*) into v_pub from public_shelter_friends where id = v_fr;
  if v_pub <> 1 then raise exception 'FAIL 18: the re-pointed Friend dropped off the website'; end if;

  raise exception 'HARNESS-OK 0338 | card, policies, catch-up and the Friend re-point behave';
end
$h$;

rollback;
