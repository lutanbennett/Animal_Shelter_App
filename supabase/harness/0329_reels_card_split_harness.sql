-- Harness for 0329_reels_card_split.sql. Everything is rolled back; a failed assertion surfaces as an error.
-- Run: node scripts/run-harness.mjs supabase/harness/0329_reels_card_split_harness.sql
begin;
do $$
declare
  u_add uuid := gen_random_uuid();  -- social.reels at Edit ONLY (the reel_add card)
  u_mgr uuid := gen_random_uuid();  -- social.reels Edit + social.reels_manage (reel_library)
  u_rd  uuid := gen_random_uuid();  -- social.reels Read ONLY (reel_view)
  u_meme uuid := gen_random_uuid(); -- social.library Edit + manage: a meme card must NOT reach reels now
  r_add uuid; r_mgr uuid; r_rd uuid; r_meme uuid;
  m1 uuid; m2 uuid; s1 uuid; n int; v_arch boolean;
begin
  insert into auth.users (id, email) values (u_add, 'h-add@example.invalid'), (u_mgr, 'h-mgr@example.invalid'), (u_rd, 'h-rd@example.invalid'), (u_meme, 'h-meme@example.invalid');
  insert into roles (key, name, kind) values ('h_add', 'h', 'custom') returning id into r_add;
  insert into roles (key, name, kind) values ('h_mgr', 'h', 'custom') returning id into r_mgr;
  insert into roles (key, name, kind) values ('h_rd', 'h', 'custom') returning id into r_rd;
  insert into roles (key, name, kind) values ('h_meme', 'h', 'custom') returning id into r_meme;
  insert into role_permissions (role_id, activity, level) values
    (r_add, 'social.reels', 2), (r_mgr, 'social.reels', 2), (r_mgr, 'social.reels_manage', 2), (r_rd, 'social.reels', 1),
    (r_meme, 'social.library', 2), (r_meme, 'social.library_manage', 2);
  insert into user_roles (user_id, role_id) values (u_add, r_add), (u_mgr, r_mgr), (u_rd, r_rd), (u_meme, r_meme);

  insert into reels (drive_file_id, description, date_taken) values ('h-r-2', 'seed', current_date) returning id into m2;

  perform set_config('request.jwt.claims', json_build_object('sub', u_add, 'role', 'authenticated')::text, true);
  set local role authenticated;

  insert into reels (drive_file_id, description, date_taken) values ('h-r-1', 'one', current_date) returning id into m1;
  update reels set description = 'changed' where id = m1;
  select count(*) into n from reels where id = m1 and description = 'changed';  if n <> 1 then raise exception 'FAIL 1: add card could not insert and change'; end if;
  insert into social_shares (owner_type, owner_id, platform) values ('reel', m1, 'facebook') returning id into s1;
  delete from reels where id = m1;
  select count(*) into n from reels where id = m1;  if n <> 1 then raise exception 'FAIL 2: add card deleted a reel'; end if;
  begin
    update reels set archived = true where id = m1;
    raise exception 'FAIL 3: add card archived a reel';
  exception when insufficient_privilege then null; end;
  delete from social_shares where id = s1;
  select count(*) into n from social_shares where id = s1;  if n <> 1 then raise exception 'FAIL 4: add card removed a share'; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', u_rd, 'role', 'authenticated')::text, true);
  select count(*) into n from reels where id = m1;  if n <> 1 then raise exception 'FAIL 5a: read card cannot see a reel'; end if;
  begin
    insert into reels (drive_file_id, description, date_taken) values ('h-r-3', 'no', current_date);
    raise exception 'FAIL 5: read card inserted a reel';
  exception when insufficient_privilege then null; end;
  update reels set description = 'x' where id = m1;
  select count(*) into n from reels where id = m1 and description = 'changed';  if n <> 1 then raise exception 'FAIL 6: read card changed a reel'; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', u_mgr, 'role', 'authenticated')::text, true);
  update reels set archived = true where id = m1;
  select archived into v_arch from reels where id = m1;  if v_arch is not true then raise exception 'FAIL 7: manage card could not archive'; end if;
  update reels set archived = false where id = m1;
  delete from social_shares where id = s1;
  select count(*) into n from social_shares where id = s1;  if n <> 0 then raise exception 'FAIL 8: manage card could not remove a share'; end if;
  delete from reels where id = m2;
  select count(*) into n from reels where id = m2;  if n <> 0 then raise exception 'FAIL 9: manage card could not delete a reel'; end if;

  -- a meme card (social.library) reaches no reel any more
  perform set_config('request.jwt.claims', json_build_object('sub', u_meme, 'role', 'authenticated')::text, true);
  select count(*) into n from reels;  if n <> 0 then raise exception 'FAIL 10: a social.library login can still see reels'; end if;

  raise notice 'ok: 0329 harness passed';
end
$$;
rollback;
