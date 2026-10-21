// Rollback harness for 0245_public_story_drive_file.sql against DEV only. Run AFTER it is applied.
//
//   node scripts/check-public-story-drive-file.mjs     (from the repo root; dev only)
//
// Exits 0 when every assertion held. Writes nothing: ends in a `raise`.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;
do $h$
declare
  v_res uuid; v_upd uuid; v_old text; v_ok boolean;
begin
  select r.id into v_res from residents r
    where coalesce((select s.current_status from private.resident_current_state s where s.resident_id = r.id),'Resident') <> 'Deceased' limit 1;
  update residents set is_public_visible = true where id = v_res;
  insert into adoption_updates (resident_id, received_on, channel, public_story, public_first_name)
    values (v_res, current_date, 'line', 'Lucky loves it here', 'Somchai') returning id into v_upd;
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, adoption_update_id, approved_at)
    values ('resident', v_res, 'h-story-photo', 'a.jpg', v_upd, now());
  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name, adoption_update_id, approved_at)
    values ('resident', v_res, 'Medical', 'h-story-med', 'm.jpg', v_upd, now());

  -- An already-working branch: any photo the public site shows today.
  select drive_file_id into v_old from public_site_content_photos limit 1;
  if v_old is null then select profile_photo_drive_file_id into v_old from public_resident_cards where profile_photo_drive_file_id is not null limit 1; end if;
  if v_old is null then raise exception 'FAIL setup: no existing public photo to compare with'; end if;

  set local role anon;
  -- 1. unticked story: false
  select is_public_drive_file('h-story-photo') into v_ok;
  if v_ok then raise exception 'FAIL 1 unticked story photo is public'; end if;
  reset role;

  update adoption_updates set share_publicly = true where id = v_upd;
  set local role anon;
  -- 2. ticked story: true
  select is_public_drive_file('h-story-photo') into v_ok;
  if not v_ok then raise exception 'FAIL 2 ticked story photo is not public'; end if;
  -- 3. medical photo of a ticked story: false
  select is_public_drive_file('h-story-med') into v_ok;
  if v_ok then raise exception 'FAIL 3 medical photo is public'; end if;
  -- 4. existing branch: still true
  select is_public_drive_file(v_old) into v_ok;
  if not v_ok then raise exception 'FAIL 4 existing public photo no longer public'; end if;
  reset role;

  -- 5. untick again: false
  update adoption_updates set share_publicly = false where id = v_upd;
  set local role anon;
  select is_public_drive_file('h-story-photo') into v_ok;
  if v_ok then raise exception 'FAIL 5 unticked-again story photo still public'; end if;
  reset role;

  raise exception 'HARNESS-OK unticked false; ticked true; medical false; existing public photo still true; unticked again false';
end
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
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
