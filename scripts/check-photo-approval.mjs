// Rollback harness for 0217_photo_approval.sql against DEV only. One transaction, a deliberate
// `raise exception` carrying the evidence, so nothing commits.
//
//   node scripts/check-photo-approval.mjs     (from the repo root; dev only)
//
// Proves the two sides of 0217: a photo that is WAITING reaches no signed-out reader (every public view, the photo
// proxy, an appeal), and a photo that was already public, or is filed by someone who may publish, still does.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;

create function pg_temp.as_anon(p text) returns boolean language plpgsql as $f$
declare v boolean;
begin
  set local role anon;
  v := is_public_drive_file(p);
  reset role;
  return v;
end $f$;

create function pg_temp.anon_view_has(p text) returns boolean language plpgsql as $f$
declare v boolean;
begin
  set local role anon;
  select exists (select 1 from public_resident_photos where drive_file_id = p)
      or exists (select 1 from public_resident_cards where profile_photo_drive_file_id = p)
      or exists (select 1 from public_resident_profiles where profile_photo_drive_file_id = p)
      or exists (select 1 from public_recent_adoptions where profile_photo_drive_file_id = p)
      or exists (select 1 from public_adoption_updates where drive_file_id = p)
      or exists (select 1 from public_appeal_photos where drive_file_id = p)
      or exists (select 1 from public_appeals where cover_drive_file_id = p) into v;
  reset role;
  return v;
end $f$;

do $h$
declare
  r uuid; v_user uuid; v_app uuid;
  a_old uuid; a_wait uuid; a_med uuid;
  v_waiting int;
begin
  -- 0. The back-fill: nothing that existed before this harness is waiting.
  select count(*) into v_waiting from attachments where approved_at is null;
  if v_waiting <> 0 then raise exception 'FAIL 0 % existing attachment(s) are waiting after the back-fill', v_waiting; end if;
  if not exists (select 1 from permission_activities where key = 'photos.shelter_add' and kind = 'yesno') then
    raise exception 'FAIL 0b the activity photos.shelter_add is missing';
  end if;

  insert into residents (name, species, is_public_visible, resident_code) values ('Harness 0217', 'Dog', true, 'R-H217A') returning id into r;
  insert into appeals (resident_id, title, target_amount, status, published) values (r, 'Harness 0217', 1000, 'live', true) returning id into v_app;

  -- A. filed by a script / the owner (no signed-in user) = approved on save, public at once
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder) values ('resident', r, 'h0217old', 'a.jpg', 'Shelter') returning id into a_old;
  if (select approved_at from attachments where id = a_old) is null then raise exception 'FAIL A1 script-filed photo is waiting'; end if;
  if not pg_temp.as_anon('h0217old') or not pg_temp.anon_view_has('h0217old') then raise exception 'FAIL A2 an approved photo is not public'; end if;

  -- B. filed by a signed-in login that may NOT publish = waiting
  select ur.user_id into v_user from user_roles ur
    where ur.archived_at is null
      and not exists (select 1 from user_roles x join roles ro on ro.id = x.role_id
                       where x.user_id = ur.user_id and x.archived_at is null and ro.key in ('admin', 'management'))
    limit 1;
  if v_user is null then raise exception 'FAIL B0 no non-publisher login on dev to test with'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  if coalesce((select can_publish_resident_photos()), false) then raise exception 'FAIL B0b the chosen login can publish'; end if;

  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder, uploaded_by) values ('resident', r, 'h0217wait', 'b.jpg', 'Shelter', v_user) returning id into a_wait;
  if (select approved_at from attachments where id = a_wait) is not null then raise exception 'FAIL B1 a non-publisher photo was approved on save'; end if;
  -- the caller cannot pre-approve it by supplying the value
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder, approved_at) values ('resident', r, 'h0217sneak', 'c.jpg', 'Shelter', now());
  if (select approved_at from attachments where drive_file_id = 'h0217sneak') is not null then raise exception 'FAIL B2 a caller-supplied approved_at was kept'; end if;

  -- C. waiting = invisible to anon on every public view and through the proxy, even as the profile photo
  update residents set profile_photo_drive_file_id = 'h0217wait' where id = r;
  if pg_temp.as_anon('h0217wait') then raise exception 'FAIL C1 proxy serves a waiting photo'; end if;
  if pg_temp.anon_view_has('h0217wait') then raise exception 'FAIL C2 a public view shows a waiting photo'; end if;
  update residents set profile_photo_drive_file_id = null where id = r;

  -- D. a waiting photo cannot be put on an appeal
  begin
    insert into appeal_photos (appeal_id, attachment_id) values (v_app, a_wait);
    raise exception 'FAIL D1 a waiting photo was attached to an appeal';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;

  -- E. a non-publisher cannot approve, nor un-approve
  begin
    update attachments set approved_at = now() where id = a_wait;
    raise exception 'FAIL E1 a non-publisher approved a photo';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;
  begin
    update attachments set approved_at = null where id = a_old;
    raise exception 'FAIL E2 a non-publisher withdrew an approval';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;

  -- F. Medical filed by a non-publisher is approved on save (it is never on a resident view), still not public
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder, uploaded_by) values ('resident', r, 'h0217med', 'd.jpg', 'Medical', v_user) returning id into a_med;
  if (select approved_at from attachments where id = a_med) is null then raise exception 'FAIL F1 a Medical photo is waiting'; end if;
  if pg_temp.as_anon('h0217med') or pg_temp.anon_view_has('h0217med') then raise exception 'FAIL F2 a Medical photo is public'; end if;

  -- G. approval by a script (no user) makes the waiting photo public, by view and proxy, and attachable to an appeal
  perform set_config('request.jwt.claims', '', true);
  update attachments set approved_at = now() where id = a_wait;
  if (select approved_at from attachments where id = a_wait) is null then raise exception 'FAIL G1 approval did not stick'; end if;
  if not pg_temp.as_anon('h0217wait') or not pg_temp.anon_view_has('h0217wait') then raise exception 'FAIL G2 an approved photo is not public'; end if;
  insert into appeal_photos (appeal_id, attachment_id) values (v_app, a_wait);

  -- H. withdrawing the approval takes it off every view again at once, appeal included
  update attachments set approved_at = null where id = a_wait;
  if pg_temp.as_anon('h0217wait') or pg_temp.anon_view_has('h0217wait') then raise exception 'FAIL H1 an un-approved photo is still public'; end if;

  raise exception 'HARNESS-OK no existing photo waiting after back-fill | script-filed photo approved on save and public by view and proxy | non-publisher photo waiting, caller cannot pre-approve | waiting photo absent from every public view, the proxy and as a profile photo | refused on an appeal | non-publisher cannot approve or withdraw | Medical approved on save and still not public | approving makes it public, withdrawing removes it again';
end;
$h$;
rollback;
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
