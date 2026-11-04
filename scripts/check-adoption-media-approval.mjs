// Rollback harness for 0309_adoption_media_needs_approval.sql against DEV only. One transaction, a deliberate
// `raise exception` carrying the evidence, so nothing commits.
//
//   node scripts/check-adoption-media-approval.mjs     (from the repo root; dev only)
//
// Proves: a photo or video on a shared adoption update, filed by a login that may neither publish nor approve, is
// born unapproved and is ABSENT from public_adoption_updates (and the proxy's is_public_drive_file); approving it
// puts it there; a script filing still approves on save (the other exemptions are unchanged).
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const { exitWith } = await import(pathToFileURL(join(root, "scripts/lib/exit.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;

create function pg_temp.anon_update_has(p text) returns boolean language plpgsql as $f$
declare v boolean;
begin
  set local role anon;
  v := exists (select 1 from public_adoption_updates where drive_file_id = p);
  reset role;
  return v;
end $f$;

create function pg_temp.anon_proxy(p text) returns boolean language plpgsql as $f$
declare v boolean;
begin
  set local role anon;
  v := is_public_drive_file(p);
  reset role;
  return v;
end $f$;

do $h$
declare
  r uuid; u uuid; v_user uuid; a_photo uuid; a_video uuid; a_script uuid;
begin
  insert into residents (name, species, is_public_visible, resident_code) values ('Harness 0309', 'Dog', true, 'R-H309A') returning id into r;
  insert into adoption_updates (resident_id, received_on, channel, share_publicly, public_story, public_first_name)
    values (r, current_date, 'line', true, 'Harness story', 'Harness') returning id into u;

  select ur.user_id into v_user from user_roles ur
    where ur.archived_at is null
      and not exists (select 1 from user_roles x join roles ro on ro.id = x.role_id
                       where x.user_id = ur.user_id and x.archived_at is null and ro.key in ('admin', 'management'))
    limit 1;
  if v_user is null then raise exception 'FAIL 0 no non-publisher login on dev to test with'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  if coalesce((select can_publish_resident_photos()), false) or coalesce((select can_approve_photos()), false) then
    raise exception 'FAIL 0b the chosen login can publish or approve';
  end if;

  -- A. a photo and a video filed on the update by that login are born unapproved
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder, uploaded_by, adoption_update_id)
    values ('resident', r, 'h0309photo', 'a.jpg', to_char(current_date, 'YYYYMMDD'), v_user, u) returning id into a_photo;
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder, uploaded_by, adoption_update_id, media_kind)
    values ('resident', r, 'h0309video', 'b.mp4', to_char(current_date, 'YYYYMMDD'), v_user, u, 'video') returning id into a_video;
  if (select approved_at from attachments where id = a_photo) is not null then raise exception 'FAIL A1 an adoption-update photo was approved on save'; end if;
  if (select approved_at from attachments where id = a_video) is not null then raise exception 'FAIL A2 an adoption-update video was approved on save'; end if;

  -- B. both are ABSENT from public_adoption_updates and the proxy while waiting
  if pg_temp.anon_update_has('h0309photo') or pg_temp.anon_update_has('h0309video') then raise exception 'FAIL B1 public_adoption_updates lists a waiting file'; end if;
  if pg_temp.anon_proxy('h0309photo') or pg_temp.anon_proxy('h0309video') then raise exception 'FAIL B2 the proxy serves a waiting file'; end if;

  -- C. the login cannot approve its own file
  begin
    update attachments set approved_at = now() where id = a_photo;
    raise exception 'FAIL C1 a non-approver approved a file';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;

  -- D. approval (script, no login) puts exactly the approved file on the view and the proxy
  perform set_config('request.jwt.claims', '', true);
  update attachments set approved_at = now() where id = a_video;
  if not pg_temp.anon_update_has('h0309video') or not pg_temp.anon_proxy('h0309video') then raise exception 'FAIL D1 an approved video is not public'; end if;
  if pg_temp.anon_update_has('h0309photo') then raise exception 'FAIL D2 approving the video published the photo'; end if;

  -- E. unchanged: a script filing (no login) is approved on save
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder, adoption_update_id)
    values ('resident', r, 'h0309script', 'c.jpg', to_char(current_date, 'YYYYMMDD'), u) returning id into a_script;
  if (select approved_at from attachments where id = a_script) is null then raise exception 'FAIL E1 a script-filed file is waiting'; end if;

  raise exception 'HARNESS-OK adoption-update photo and video born unapproved | absent from public_adoption_updates and the proxy | non-approver cannot approve | approving one file publishes only that file | script filing still approved on save';
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
await exitWith(/HARNESS-OK/.test(msg) ? 0 : 1);
