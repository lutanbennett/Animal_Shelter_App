-- Proves 0387 against real rows. Run: node scripts/run-harness.mjs supabase/harness/0387_roles_unique_keys_harness.sql
-- Ends by raising; success is the message 'HARNESS OK'. Keeps nothing.
begin;
do $$
declare a uuid; b uuid; ok boolean;
begin
  insert into shelters(key,name) values ('h-a','A') returning id into a;
  insert into shelters(key,name) values ('h-b','B') returning id into b;

  -- today: the one existing null-shelter Admin is there, a second null-shelter Admin is refused
  if (select count(*) from roles where is_admin and shelter_id is null) <> 1 then raise exception 'expected exactly one null-shelter Admin'; end if;
  ok := false;
  begin insert into roles(key,name,kind,is_admin) values ('h_admin2','x','custom',true);
  exception when unique_violation then ok := true; end;
  if not ok then raise exception 'second null-shelter Admin was allowed'; end if;

  -- duplicate key, both shelters null, refused (nulls not distinct)
  ok := false;
  begin insert into roles(key,name,kind) values ('volunteer','x','custom');
  exception when unique_violation then ok := true; end;
  if not ok then raise exception 'null-shelter duplicate key was allowed'; end if;

  -- two Admins in two shelters allowed; same shelter refused
  insert into roles(key,name,kind,is_admin,shelter_id) values ('admin','Admin','fixed',true,a);
  insert into roles(key,name,kind,is_admin,shelter_id) values ('admin','Admin','fixed',true,b);
  ok := false;
  begin insert into roles(key,name,kind,is_admin,shelter_id) values ('h_admin3','x','custom',true,a);
  exception when unique_violation then ok := true; end;
  if not ok then raise exception 'second Admin in one shelter was allowed'; end if;

  -- volunteer in two shelters allowed; twice in one refused
  insert into roles(key,name,kind,shelter_id) values ('volunteer','V','custom',a);
  insert into roles(key,name,kind,shelter_id) values ('volunteer','V','custom',b);
  ok := false;
  begin insert into roles(key,name,kind,shelter_id) values ('volunteer','V','custom',a);
  exception when unique_violation then ok := true; end;
  if not ok then raise exception 'duplicate key in one shelter was allowed'; end if;

  raise exception 'HARNESS OK';
end $$;
rollback;
