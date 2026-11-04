// Rollback harness for 0311_adoption_update_media_by_news_card.sql against DEV only. One transaction, a deliberate
// `raise exception` carrying the evidence, so nothing commits.
//
//   node scripts/dev-signin.mjs --cards adoption_news --port <port>     (once, makes the one-card login)
//   node scripts/check-adoption-illustrate.mjs <that login's email>      (from the repo root; dev only)
//
// Proves, as a login holding ONLY the adoption_news card: it cannot publish; record_attachment accepts its file on an
// update about the resident, in that update's own dated folder, born unapproved and absent from the public views;
// and it refuses everything else (another folder, no update, another resident's update, Medical). A login without
// the card is refused even in the dated folder.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const email = process.argv[2];
if (!email || !/^[\w.@+-]+$/.test(email)) throw new Error("give the one-card login's email as the only argument");
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const { exitWith } = await import(pathToFileURL(join(root, "scripts/lib/exit.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;

create function pg_temp.as_user(u uuid) returns void language plpgsql as $f$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
end $f$;

create function pg_temp.refused(u uuid, r uuid, upd uuid, folder text, fname text) returns boolean language plpgsql as $f$
begin
  perform pg_temp.as_user(u);
  begin
    perform record_attachment('resident', r, 'h0311-' || gen_random_uuid()::text, fname, folder, current_date, upd);
    return false;
  exception when others then
    return true;
  end;
end $f$;

do $h$
declare
  r uuid; r2 uuid; u uuid; u2 uuid; v_card uuid; v_none uuid; v_day text := to_char(current_date, 'YYYYMMDD');
  v_id text; v_approved timestamptz;
begin
  select id into v_card from auth.users where email = '${email}';
  if v_card is null then raise exception 'FAIL 0 no such login ${email}'; end if;
  insert into residents (name, species, is_public_visible, resident_code) values ('Harness 0311 A', 'Dog', true, 'R-H311A') returning id into r;
  insert into residents (name, species, is_public_visible, resident_code) values ('Harness 0311 B', 'Dog', true, 'R-H311B') returning id into r2;
  insert into adoption_updates (resident_id, received_on, channel, share_publicly, public_story, public_first_name)
    values (r, current_date, 'line', true, 'Harness story', 'Harness') returning id into u;
  insert into adoption_updates (resident_id, received_on, channel) values (r2, current_date, 'line') returning id into u2;

  -- a login with none of the photo or adoption cells (any ordinary login that holds neither adoption_news nor publish/add)
  for v_none in select distinct ur.user_id from user_roles ur where ur.archived_at is null and ur.user_id <> v_card loop
    perform pg_temp.as_user(v_none);
    exit when not coalesce((select has_permission('resident.adoption_news')), false)
          and not coalesce((select has_permission('photos.resident_publish')), false)
          and not coalesce((select has_permission('photos.resident_add')), false)
          and not coalesce((select has_permission('photos.shelter_add')), false)
          and not coalesce((select is_admin()), false);
    v_none := null;
  end loop;

  perform pg_temp.as_user(v_card);
  if coalesce((select has_permission('photos.resident_publish')), false) then raise exception 'FAIL A1 the one-card login holds publish'; end if;
  if coalesce((select can_publish_resident_photos()), false) or coalesce((select can_approve_photos()), false) then raise exception 'FAIL A2 it can publish or approve'; end if;
  if not coalesce((select has_permission('resident.adoption_news')), false) then raise exception 'FAIL A3 it lacks adoption_news'; end if;

  -- B. the allowed path: this resident's update, the update's own dated folder
  v_id := 'h0311-ok';
  perform record_attachment('resident', r, v_id, 'a.jpg', v_day, current_date, u);
  select approved_at into v_approved from attachments where drive_file_id = v_id;
  if v_approved is not null then raise exception 'FAIL B1 the file was approved on save'; end if;
  perform record_attachment('resident', r, 'h0311-vid', 'b.mp4', v_day, current_date, u, 'bill', 'video');
  if (select approved_at from attachments where drive_file_id = 'h0311-vid') is not null then raise exception 'FAIL B2 the video was approved on save'; end if;

  -- C. everything else is refused
  if not pg_temp.refused(v_card, r, u, 'Adoption', 'c.jpg') then raise exception 'FAIL C1 an update file in the Adoption category folder was accepted'; end if;
  if not pg_temp.refused(v_card, r, null, v_day, 'c.jpg') then raise exception 'FAIL C2 a photo with no update was accepted'; end if;
  if not pg_temp.refused(v_card, r, null, 'Adoption', 'c.jpg') then raise exception 'FAIL C3 a plain Adoption-folder photo was accepted'; end if;
  if not pg_temp.refused(v_card, r, null, 'Shelter', 'c.jpg') then raise exception 'FAIL C4 a plain Shelter photo was accepted'; end if;
  if not pg_temp.refused(v_card, r, u2, v_day, 'c.jpg') then raise exception 'FAIL C5 another resident''s update was accepted'; end if;
  if not pg_temp.refused(v_card, r, u, 'Medical', 'c.jpg') then raise exception 'FAIL C6 the Medical folder was accepted'; end if;
  if not pg_temp.refused(v_card, r2, u, v_day, 'c.jpg') then raise exception 'FAIL C7 update u filed against resident B was accepted'; end if;

  -- D. nothing became public
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  if exists (select 1 from public_adoption_updates where drive_file_id in ('h0311-ok', 'h0311-vid')) then raise exception 'FAIL D1 a waiting file is on public_adoption_updates'; end if;
  if is_public_drive_file('h0311-ok') or is_public_drive_file('h0311-vid') then raise exception 'FAIL D2 the proxy serves a waiting file'; end if;
  reset role;

  -- E. a login without the card is refused even in the dated folder (when one exists on dev)
  if v_none is null then raise exception 'FAIL E0 no login on dev lacking all of adoption_news, publish, add and shelter_add to test with'; end if;
  if not pg_temp.refused(v_none, r, u, v_day, 'c.jpg') then raise exception 'FAIL E1 a login without the card filed on the update'; end if;

  raise exception 'HARNESS-OK one-card login cannot publish | files on its own resident''s update in the update''s dated folder, unapproved | refused: Adoption category folder, no update, plain Adoption/Shelter, other resident''s update, Medical | absent from public_adoption_updates and the proxy';
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
