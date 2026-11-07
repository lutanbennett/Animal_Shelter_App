-- Harness for 0330_reel_resident_tags.sql. Rolled back; success is the final message. Needs two disposable dev logins:
--   node scripts/dev-signin.mjs --cards reel_view --port <p>    and    node scripts/dev-signin.mjs --cards reel_add --port <p>
-- Run: node scripts/run-harness.mjs supabase/harness/0330_reel_resident_tags_harness.sql
begin;
do $$
declare
  v_view uuid; v_add uuid; v_reel uuid; v_res uuid; n int; nm int; direct int;
begin
  select ur.user_id into v_view from user_roles ur
   where (select array_agg(card order by card) from role_cards where role_id = ur.role_id) = array['reel_view'] limit 1;
  select ur.user_id into v_add from user_roles ur
   where (select array_agg(card order by card) from role_cards where role_id = ur.role_id) = array['reel_add'] limit 1;
  if v_view is null or v_add is null then raise exception 'SETUP: run dev-signin for --cards reel_view and --cards reel_add first'; end if;

  insert into reels (drive_file_id) values ('harness-0330') returning id into v_reel;
  select id into v_res from residents limit 1;
  insert into reel_residents (reel_id, resident_id) values (v_reel, v_res);

  -- 1. exactly reel_view: the tag is counted, never named, and the old embed is still cut (nothing widened)
  perform set_config('request.jwt.claims', json_build_object('sub', v_view, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*), count(name) into n, nm from reel_resident_tags(array[v_reel]);
  if n <> 1 then raise exception 'FAIL 1: reel_view should count 1 tag, got %', n; end if;
  if nm <> 0 or exists (select 1 from reel_resident_tags(array[v_reel]) where named or resident_id is not null) then
    raise exception 'FAIL 1: reel_view was given a name or id';
  end if;
  select count(*) into direct from residents where id = v_res;
  if direct <> 0 then raise exception 'FAIL 1: reel_view can read residents directly (%)', direct; end if;
  reset role;

  -- 2. reel_add (holds the who-and-where card): named, same as resident_who_and_where gives it
  perform set_config('request.jwt.claims', json_build_object('sub', v_add, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*), count(name) into n, nm from reel_resident_tags(array[v_reel]);
  if n <> 1 or nm <> 1 then raise exception 'FAIL 2: reel_add should see 1 named, got % / %', n, nm; end if;
  reset role;

  -- 3. a login with no card at all gets no rows
  perform set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from reel_resident_tags(array[v_reel]);
  if n <> 0 then raise exception 'FAIL 3: a card-less login saw % rows', n; end if;
  reset role;

  -- 4. anon cannot call it
  set local role anon;
  begin
    perform * from reel_resident_tags(array[v_reel]);
    raise exception 'FAIL 4: anon could call it';
  exception when insufficient_privilege then null;
  end;
  reset role;

  raise exception 'HARNESS 0330: all assertions passed (rolled back)';
end $$;
rollback;
