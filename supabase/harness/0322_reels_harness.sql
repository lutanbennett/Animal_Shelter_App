-- Harness for 0322_reels.sql. Everything is rolled back; an assertion failure surfaces as an error.
-- Run: node scripts/run-harness.mjs supabase/harness/0322_reels_harness.sql
begin;
do $$
declare
  v_reel uuid;
  v_reel2 uuid;
  v_res uuid;
  v_n int;
  v_msg text;
begin
  insert into reels (drive_file_id, description) values ('harness-file-1', 'hello #tag') returning id into v_reel;
  insert into reels (drive_file_id) values ('harness-file-2') returning id into v_reel2;

  -- 1. a share records against a reel
  insert into social_shares (owner_type, owner_id, platform) values ('reel', v_reel, 'facebook');
  select count(*) into v_n from social_shares where owner_type = 'reel' and owner_id = v_reel;
  if v_n <> 1 then raise exception 'FAIL 1: share not recorded (%)', v_n; end if;

  -- 2. the guard refuses a share whose owner is not a reel
  begin
    insert into social_shares (owner_type, owner_id, platform) values ('reel', gen_random_uuid(), 'facebook');
    raise exception 'FAIL 2: guard let a non-reel owner through';
  exception when others then
    get stacked diagnostics v_msg = message_text;
    if v_msg not like 'A reel share must point at a reel' then raise exception 'FAIL 2: wrong error: %', v_msg; end if;
  end;

  -- 3. deleting the reel removes its shares (and leaves the other reel's alone)
  insert into social_shares (owner_type, owner_id, platform) values ('reel', v_reel2, 'other');
  delete from reels where id = v_reel;
  select count(*) into v_n from social_shares where owner_type = 'reel' and owner_id = v_reel;
  if v_n <> 0 then raise exception 'FAIL 3: shares survived the reel (%)', v_n; end if;
  select count(*) into v_n from social_shares where owner_type = 'reel' and owner_id = v_reel2;
  if v_n <> 1 then raise exception 'FAIL 3: other reel lost its share'; end if;

  -- 4. reel_residents refuses a duplicate pair
  select id into v_res from residents limit 1;
  if v_res is null then raise exception 'FAIL 4: no resident on this database to test with'; end if;
  insert into reel_residents (reel_id, resident_id) values (v_reel2, v_res);
  begin
    insert into reel_residents (reel_id, resident_id) values (v_reel2, v_res);
    raise exception 'FAIL 4: duplicate pair accepted';
  exception when unique_violation then null;
  end;

  -- 5. the existing owner types still behave: a meme share needs a meme
  begin
    insert into social_shares (owner_type, owner_id, platform) values ('meme', gen_random_uuid(), 'facebook');
    raise exception 'FAIL 5: meme guard lost';
  exception when others then
    get stacked diagnostics v_msg = message_text;
    if v_msg not like 'A meme share must point at a meme' then raise exception 'FAIL 5: wrong error: %', v_msg; end if;
  end;

  -- 6. a reel upload needs no resident; a resident upload still does
  insert into video_uploads (owner_kind) values ('reel');
  begin
    insert into video_uploads (owner_kind) values ('resident');
    raise exception 'FAIL 6: resident upload without a resident accepted';
  exception when check_violation then null;
  end;

  raise exception 'HARNESS PASSED (rolled back)';
end $$;
rollback;
