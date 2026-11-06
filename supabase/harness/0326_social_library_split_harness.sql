-- Harness for 0326_social_library_split.sql. Everything is rolled back; a failed assertion surfaces as an error.
-- Run: node scripts/run-harness.mjs supabase/harness/0326_social_library_split_harness.sql
begin;
do $$
declare
  u_add uuid := gen_random_uuid();  -- social.library at Edit ONLY (the add card)
  u_mgr uuid := gen_random_uuid();  -- social.library Edit + social.library_manage (the existing card)
  u_rd  uuid := gen_random_uuid();  -- social.library Read ONLY
  r_add uuid; r_mgr uuid; r_rd uuid;
  m1 uuid; m2 uuid; s1 uuid; n int; v_arch boolean;
begin
  insert into auth.users (id, email) values (u_add, 'h-add@example.invalid'), (u_mgr, 'h-mgr@example.invalid'), (u_rd, 'h-rd@example.invalid');
  insert into roles (key, name, kind) values ('h_add', 'h', 'custom') returning id into r_add;
  insert into roles (key, name, kind) values ('h_mgr', 'h', 'custom') returning id into r_mgr;
  insert into roles (key, name, kind) values ('h_rd', 'h', 'custom') returning id into r_rd;
  insert into role_permissions (role_id, activity, level) values
    (r_add, 'social.library', 2), (r_mgr, 'social.library', 2), (r_mgr, 'social.library_manage', 2), (r_rd, 'social.library', 1);
  insert into user_roles (user_id, role_id) values (u_add, r_add), (u_mgr, r_mgr), (u_rd, r_rd);

  insert into memes (drive_file_id, title) values ('h-m-2', 'seed') returning id into m2;

  perform set_config('request.jwt.claims', json_build_object('sub', u_add, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- add card: can insert and update
  insert into memes (drive_file_id, title) values ('h-m-1', 'one') returning id into m1;
  update memes set title = 'changed' where id = m1;
  select count(*) into n from memes where id = m1 and title = 'changed';  if n <> 1 then raise exception 'FAIL 1: add card could not insert and change'; end if;
  -- can record a post
  insert into social_shares (owner_type, owner_id, platform) values ('meme', m1, 'facebook') returning id into s1;
  -- is refused the delete of a meme (RLS hides the row, so zero rows go)
  delete from memes where id = m1;
  select count(*) into n from memes where id = m1;  if n <> 1 then raise exception 'FAIL 2: add card deleted a meme'; end if;
  -- is refused archiving
  begin
    update memes set archived = true where id = m1;
    raise exception 'FAIL 3: add card archived a meme';
  exception when insufficient_privilege then null; end;
  -- is refused removing the post record
  delete from social_shares where id = s1;
  select count(*) into n from social_shares where id = s1;  if n <> 1 then raise exception 'FAIL 4: add card removed a share'; end if;

  -- read card: refused every write
  perform set_config('request.jwt.claims', json_build_object('sub', u_rd, 'role', 'authenticated')::text, true);
  begin
    insert into memes (drive_file_id, title) values ('h-m-3', 'no');
    raise exception 'FAIL 5: read card inserted a meme';
  exception when insufficient_privilege then null; end;
  update memes set title = 'x' where id = m1;
  select count(*) into n from memes where id = m1 and title = 'changed';  if n <> 1 then raise exception 'FAIL 6: read card changed a meme'; end if;

  -- manage card: can archive, restore, remove a share, delete
  perform set_config('request.jwt.claims', json_build_object('sub', u_mgr, 'role', 'authenticated')::text, true);
  update memes set archived = true where id = m1;
  select archived into v_arch from memes where id = m1;  if v_arch is not true then raise exception 'FAIL 7: manage card could not archive'; end if;
  update memes set archived = false where id = m1;
  delete from social_shares where id = s1;
  select count(*) into n from social_shares where id = s1;  if n <> 0 then raise exception 'FAIL 8: manage card could not remove a share'; end if;
  delete from memes where id = m2;
  select count(*) into n from memes where id = m2;  if n <> 0 then raise exception 'FAIL 9: manage card could not delete a meme'; end if;

  raise notice 'ok: 0326 harness passed';
end
$$;
rollback;
