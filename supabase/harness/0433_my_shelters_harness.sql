-- Harness for 0433: begin ... rollback; success is the exception message at the end.
begin;
do $$
declare sa uuid := gen_random_uuid(); sb uuid := gen_random_uuid(); sc uuid := gen_random_uuid();
        ra uuid := gen_random_uuid(); rb uuid := gen_random_uuid();
        u2 uuid := gen_random_uuid(); u1 uuid := gen_random_uuid(); u0 uuid := gen_random_uuid();
        n int; names text;
begin
  insert into shelters(id,key,name) values (sa,'h433-a','H433 Alpha'),(sb,'h433-b','H433 Beta'),(sc,'h433-c','H433 Closed');
  update shelters set archived_at = now() where id = sc;
  insert into shelter_hosts(host,shelter_id) values ('h433-a.example.test',sa),('h433-a2.example.test',sa),('h433-b.example.test',sb),('h433-c.example.test',sc);
  insert into auth.users(id,email,aud,role) values (u2,'h433-2@example.invalid','authenticated','authenticated'),(u1,'h433-1@example.invalid','authenticated','authenticated'),(u0,'h433-0@example.invalid','authenticated','authenticated');
  insert into roles(id,key,name,kind,shelter_id) values (ra,'h433a','H433 role A','custom',sa),(rb,'h433b','H433 role B','custom',sb);
  insert into user_roles(user_id,role_id,shelter_id,is_main) values (u2,ra,sa,true),(u2,rb,sb,false),(u1,ra,sa,true);

  set local role authenticated;
  -- signed in on shelter A (request header), holding roles at A and B
  perform set_config('request.headers', json_build_object('x-shelter-id', sa::text)::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', u2::text, 'role','authenticated')::text, true);
  select count(*), string_agg(host, ',' order by host) into n, names from my_shelters();
  if n <> 2 or names <> 'h433-a.example.test,h433-b.example.test' then raise exception 'FAIL two shelters: % % [primaries: %]', n, names, '-'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', u1::text, 'role','authenticated')::text, true);
  select count(*) into n from my_shelters();
  if n <> 1 then raise exception 'FAIL one shelter: %', n; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', u0::text, 'role','authenticated')::text, true);
  select count(*) into n from my_shelters();
  if n <> 0 then raise exception 'FAIL none: %', n; end if;
  perform set_config('request.jwt.claims', '', true);
  select count(*) into n from my_shelters();
  if n <> 0 then raise exception 'FAIL no login: %', n; end if;
  reset role;
  raise exception 'HARNESS PASS: two=2 (A and B seen while on A), one=1, none=0, no login=0, archived and non-primary hosts left out';
end $$;
rollback;
