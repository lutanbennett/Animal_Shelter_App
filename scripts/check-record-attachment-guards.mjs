// Rollback harness for 0306_record_attachment_picture_and_bill_owners.sql against DEV only, on the LIVE function.
// One transaction, then a deliberate raise carrying the evidence, so nothing commits.
//   node scripts/check-record-attachment-guards.mjs     (from the repo root; dev only)
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;
create temp table who (who text primary key, uid uuid);
insert into who values ('pics', gen_random_uuid()), ('util', gen_random_uuid()), ('gen', gen_random_uuid()), ('none', gen_random_uuid());
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'harness-0306-' || who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now() from who;
insert into roles (key, name, kind) values ('h0306_pics', 'h', 'custom'), ('h0306_util', 'h', 'custom'), ('h0306_gen', 'h', 'custom'), ('h0306_none', 'h', 'custom');
insert into role_permissions (role_id, activity, level)
  select r.id, a, 2 from roles r, (values ('photos.resident_add'), ('photos.resident_manage'), ('photos.resident_publish'), ('resident.record')) v(a) where r.key = 'h0306_pics';
insert into role_permissions (role_id, activity, level) select id, 'bills.utilities', 2 from roles where key = 'h0306_util';
insert into role_permissions (role_id, activity, level) select id, 'bills.general', 2 from roles where key = 'h0306_gen';
insert into role_permissions (role_id, activity, level) select id, 'maintenance.photos', 2 from roles where key = 'h0306_none';
insert into user_roles (user_id, role_id)
  select w.uid, r.id from who w join roles r on r.key = 'h0306_' || w.who;
grant select on who to authenticated;

do $$
declare
  v_a uuid; v_b uuid; v_c uuid; v_d uuid;
  v_profile boolean; v_prof text; v_kind text;
  v_report text := '';
begin
  if (select count(*) from pg_proc where proname = 'record_attachment') <> 1 then raise exception 'A0 record_attachment has more than one overload'; end if;
  insert into residents (name) values ('harness-0306 video first') returning id into v_a;
  insert into residents (name) values ('harness-0306 photo first') returning id into v_b;
  insert into residents (name) values ('harness-0306 forgot kind') returning id into v_c;
  insert into residents (name) values ('harness-0306 video then photo') returning id into v_d;

  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'pics'), 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- B1 a first file that is a video (kind passed) gets no profile picture and is stored as video
  select r.is_profile into v_profile from record_attachment(p_owner_type => 'resident', p_owner_id => v_a, p_drive_file_id => 'h0306-vid', p_file_name => 'clip.mp4', p_sub_folder => 'Shelter', p_media_kind => 'video') r;
  select profile_photo_drive_file_id into v_prof from residents where id = v_a;
  select media_kind into v_kind from attachments where drive_file_id = 'h0306-vid';
  if v_profile or v_prof is not null or v_kind <> 'video' then reset role; raise exception 'B1 video became profile (% %) kind %', v_profile, v_prof, v_kind; end if;
  v_report := v_report || ' | B1 first file a video: no profile picture, stored as video';

  -- B2 a first file that is a photo still becomes the profile picture
  select r.is_profile into v_profile from record_attachment(p_owner_type => 'resident', p_owner_id => v_b, p_drive_file_id => 'h0306-pic', p_file_name => 'dog.jpg', p_sub_folder => 'Shelter') r;
  select profile_photo_drive_file_id into v_prof from residents where id = v_b;
  if not v_profile or v_prof is distinct from 'h0306-pic' then reset role; raise exception 'B2 photo did not become profile'; end if;
  v_report := v_report || ' | B2 first file a photo: still the profile picture';

  -- B3 a caller that forgets p_media_kind but sends a video file name is still refused the profile picture
  select r.is_profile into v_profile from record_attachment(p_owner_type => 'resident', p_owner_id => v_c, p_drive_file_id => 'h0306-forgot', p_file_name => 'CLIP.MOV', p_sub_folder => 'Shelter') r;
  select profile_photo_drive_file_id into v_prof from residents where id = v_c;
  if v_profile or v_prof is not null then reset role; raise exception 'B3 video name became profile'; end if;
  v_report := v_report || ' | B3 kind forgotten, .MOV name: no profile picture';

  -- B4 a video first, then a photo: the photo takes the empty slot
  perform record_attachment(p_owner_type => 'resident', p_owner_id => v_d, p_drive_file_id => 'h0306-d-vid', p_file_name => 'a.webm', p_sub_folder => 'Shelter', p_media_kind => 'video');
  select r.is_profile into v_profile from record_attachment(p_owner_type => 'resident', p_owner_id => v_d, p_drive_file_id => 'h0306-d-pic', p_file_name => 'a.png', p_sub_folder => 'Shelter') r;
  if not v_profile then reset role; raise exception 'B4 photo after video not profile'; end if;
  v_report := v_report || ' | B4 photo after a video takes the profile slot';

  -- B5 an invalid kind is refused
  begin
    perform record_attachment(p_owner_type => 'resident', p_owner_id => v_a, p_drive_file_id => 'h0306-bad', p_sub_folder => 'Shelter', p_media_kind => 'audio');
    reset role; raise exception 'B5 audio accepted';
  exception when sqlstate 'P0001' then if sqlerrm not like 'Not a valid media kind%' then raise; end if;
  end;
  reset role;
  v_report := v_report || ' | B5 unknown kind refused';

  -- C bill owner types: accepted with the card's activity, refused without it
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'util'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform record_attachment(p_owner_type => 'utility_bill', p_owner_id => gen_random_uuid(), p_drive_file_id => 'h0306-u1', p_file_name => 'b.jpg');
  begin
    perform record_attachment(p_owner_type => 'general_bill', p_owner_id => gen_random_uuid(), p_drive_file_id => 'h0306-g0', p_file_name => 'b.jpg');
    reset role; raise exception 'C2 utilities login added a general bill';
  exception when sqlstate 'P0001' then if sqlerrm not like 'Not authorized%' then raise; end if;
  end;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'gen'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform record_attachment(p_owner_type => 'general_bill', p_owner_id => gen_random_uuid(), p_drive_file_id => 'h0306-g1', p_file_name => 'b.jpg');
  begin
    perform record_attachment(p_owner_type => 'utility_bill', p_owner_id => gen_random_uuid(), p_drive_file_id => 'h0306-u0', p_file_name => 'b.jpg');
    reset role; raise exception 'C4 general login added a utility bill';
  exception when sqlstate 'P0001' then if sqlerrm not like 'Not authorized%' then raise; end if;
  end;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'none'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  foreach v_prof in array array['utility_bill', 'general_bill'] loop
    begin
      perform record_attachment(p_owner_type => v_prof::attachment_owner_type, p_owner_id => gen_random_uuid(), p_drive_file_id => 'h0306-n', p_file_name => 'b.jpg');
      reset role; raise exception 'C5 login with neither card added a %', v_prof;
    exception when sqlstate 'P0001' then if sqlerrm not like 'Not authorized%' then raise; end if;
    end;
  end loop;
  reset role;
  v_report := v_report || ' | C utility_bill accepted only with bills.utilities, general_bill only with bills.general, neither card refused both';


  -- D (0313) the other two routes to the profile picture. Rows are filed as the owner, then the login acts on them.
  insert into residents (name) values ('harness-0313 set') returning id into v_a;
  insert into residents (name) values ('harness-0313 delete') returning id into v_b;
  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name, media_kind, uploaded_at) values
    ('resident', v_a, 'Shelter', 'h0313-vid', 'clip.mp4', 'video', now() - interval '1 hour'),
    ('resident', v_a, 'Shelter', 'h0313-vid-unmarked', 'CLIP.MOV', 'photo', now() - interval '1 hour'),
    ('resident', v_a, 'Shelter', 'h0313-pic', 'dog.jpg', 'photo', now()),
    ('resident', v_b, 'Shelter', 'h0313-b-cur', 'cur.jpg', 'photo', now() - interval '3 hours'),
    ('resident', v_b, 'Shelter', 'h0313-b-vid', 'clip.mp4', 'video', now() - interval '2 hours'),
    ('resident', v_b, 'Shelter', 'h0313-b-pic', 'later.jpg', 'photo', now() - interval '1 hour');
  update residents set profile_photo_drive_file_id = 'h0313-b-cur' where id = v_b;
  perform set_config('request.jwt.claims', json_build_object('sub', (select uid from who where who = 'pics'), 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin perform set_resident_profile_photo(v_a, 'h0313-vid'); reset role; raise exception 'D1 video set as profile';
  exception when sqlstate 'P0001' then if sqlerrm not like 'Only a photo%' then raise; end if; end;
  begin perform set_resident_profile_photo(v_a, 'h0313-vid-unmarked'); reset role; raise exception 'D2 video-named file set as profile';
  exception when sqlstate 'P0001' then if sqlerrm not like 'Only a photo%' then raise; end if; end;
  perform set_resident_profile_photo(v_a, 'h0313-pic');
  select profile_photo_drive_file_id into v_prof from residents where id = v_a;
  if v_prof is distinct from 'h0313-pic' then reset role; raise exception 'D3 photo not accepted as profile (%)', v_prof; end if;
  perform delete_resident_photo((select id from attachments where drive_file_id = 'h0313-b-cur'));
  select profile_photo_drive_file_id into v_prof from residents where id = v_b;
  if v_prof is distinct from 'h0313-b-pic' then reset role; raise exception 'D4 deleting the profile photo promoted % (want the later photo, skipping the video)', v_prof; end if;
  perform delete_resident_photo((select id from attachments where drive_file_id = 'h0313-b-pic'));
  select profile_photo_drive_file_id into v_prof from residents where id = v_b;
  if v_prof is not null then reset role; raise exception 'D5 only a video left yet % was promoted', v_prof; end if;
  reset role;
  v_report := v_report || ' | D set_resident_profile_photo refuses a video (by kind and by name) and accepts a photo; delete fallback skips a video, promotes the next photo, and leaves none when only a video remains';

  raise exception 'HARNESS-OK 0306+0313 (live)%', v_report;
end $$;
`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
console.log(`status ${res.status}`);
console.log(msg);
// exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
