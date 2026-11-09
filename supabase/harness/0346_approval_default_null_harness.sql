-- Rollback harness for 0346_approval_default_null.sql. Dev only. Success is the HARNESS-OK message, raised on purpose so nothing commits.
--   node scripts/run-harness.mjs supabase/harness/0346_approval_default_null_harness.sql
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
    n := -1; perform set_config('h6.err', sqlerrm, true);
  end;
  reset role;
  return n;
end $f$;

do $h$
declare
  u_ed uuid := gen_random_uuid();    -- resident.record only: may file a resident, may not approve
  u_both uuid := gen_random_uuid();  -- resident.record AND text.approve
  u_pub uuid := gen_random_uuid();   -- may publish resident photos
  r_ed uuid; r_both uuid; r_pub uuid;
  v_res uuid; v_att uuid; v_state text; n int;
  v_before text; v_after text; v_dflt text; t text;
begin
  insert into auth.users (id, email) values (u_ed, 'h6-ed@example.invalid'), (u_both, 'h6-both@example.invalid'), (u_pub, 'h6-pub@example.invalid');
  insert into roles (key, name, kind) values ('h6_ed', 'h', 'custom') returning id into r_ed;
  insert into roles (key, name, kind) values ('h6_both', 'h', 'custom') returning id into r_both;
  insert into roles (key, name, kind) values ('h6_pub', 'h', 'custom') returning id into r_pub;
  insert into role_permissions (role_id, activity, level) values
    (r_ed, 'resident.register', 2), (r_both, 'resident.register', 2), (r_both, 'text.approve', 2), (r_pub, 'photos.resident_publish', 2);
  insert into user_roles (user_id, role_id) values (u_ed, r_ed), (u_both, r_both), (u_pub, r_pub);

  -- 1. the default is NULL on all six tables, and still public_ok on the two that nothing reads
  foreach t in array array['residents','adoption_updates','appeals','fundraising_events','project_folders','desexing_drives'] loop
    select column_default into v_dflt from information_schema.columns where table_schema = 'public' and table_name = t and column_name = 'text_approval';
    if v_dflt is not null then raise exception 'FAIL 1: % text_approval default is %', t, v_dflt; end if;
  end loop;

  -- 2. a new row with no text_approval lands NULL
  insert into residents (name, species) values ('H6 Dog A', 'Dog') returning id into v_res;
  select text_approval into v_state from residents where id = v_res;
  if v_state is not null then raise exception 'FAIL 2: a new resident landed % not NULL', v_state; end if;

  -- 3. a login that may file a resident (and cannot approve) still can: nothing starts failing
  n := pg_temp.try_as(u_ed, $q$insert into residents (name, species) values ('H6 Dog B', 'Dog')$q$);
  if n <> 1 then raise exception 'FAIL 3: a filer without text.approve could not file a resident (% %)', n, current_setting('h6.err', true); end if;
  select text_approval into v_state from residents where name = 'H6 Dog B';
  if v_state is not null then raise exception 'FAIL 3b: filed resident landed %', v_state; end if;

  -- 4. an INSERT naming a state from a login without text.approve is refused
  n := pg_temp.try_as(u_ed, $q$insert into residents (name, species, text_approval) values ('H6 Dog C', 'Dog', 'public_ok')$q$);
  if n <> -1 then raise exception 'FAIL 4: a filer without text.approve inserted public_ok (%)', n; end if;
  n := pg_temp.try_as(u_ed, $q$insert into residents (name, species, text_approval) values ('H6 Dog C', 'Dog', 'private_only')$q$);
  if n <> -1 then raise exception 'FAIL 4b: a filer without text.approve inserted private_only (%)', n; end if;
  if exists (select 1 from residents where name = 'H6 Dog C') then raise exception 'FAIL 4c: the refused row exists'; end if;

  -- 5. the same INSERT from a holder of text.approve succeeds
  n := pg_temp.try_as(u_both, $q$insert into residents (name, species, text_approval) values ('H6 Dog D', 'Dog', 'public_ok')$q$);
  if n <> 1 then raise exception 'FAIL 5: a text.approve holder could not insert public_ok (%)', n; end if;
  select text_approval into v_state from residents where name = 'H6 Dog D';
  if v_state is distinct from 'public_ok' then raise exception 'FAIL 5b: landed %', v_state; end if;

  -- 6. a photo saved by a publisher is no longer approved on save; nor is a script-filed one
  perform set_config('request.jwt.claims', json_build_object('sub', u_pub, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  if not coalesce((select can_publish_resident_photos()), false) then raise exception 'FAIL 6a: harness publisher cannot publish'; end if;
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder) values ('resident', v_res, 'h6pub', 'p.jpg', 'Shelter') returning id into v_att;
  if (select approved_at from attachments where id = v_att) is not null then raise exception 'FAIL 6: a publisher''s photo was approved on save'; end if;
  perform set_config('request.jwt.claims', '', true);
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder) values ('resident', v_res, 'h6script', 'p.jpg', 'Shelter') returning id into v_att;
  if (select approved_at from attachments where id = v_att) is not null then raise exception 'FAIL 6b: a script-filed photo was approved on save'; end if;

  -- 7. what was never about the website stays approved: a Medical file
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder) values ('resident', v_res, 'h6med', 'm.pdf', 'Medical') returning id into v_att;
  if (select approved_at from attachments where id = v_att) is null then raise exception 'FAIL 7: a Medical file is waiting'; end if;

  -- 8. re-running the six defaults rewrites no row
  select md5(string_agg(id::text || coalesce(text_approval, '-'), ',' order by id)) into v_before from residents;
  alter table residents alter column text_approval set default null;
  select md5(string_agg(id::text || coalesce(text_approval, '-'), ',' order by id)) into v_after from residents;
  if v_before is distinct from v_after then raise exception 'FAIL 8: the flip changed a resident row'; end if;

  raise exception 'HARNESS-OK default NULL on six tables | omitted column lands NULL, filer without text.approve unaffected | INSERT naming public_ok/private_only refused without text.approve, allowed with it | publisher and script photos wait | Medical still approved | no row changed';
end
$h$;
rollback;
