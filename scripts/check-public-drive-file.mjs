// Rollback harness for 0084_is_public_drive_file.sql against DEV only.
// One transaction: the migration (twice), fixtures, assertions, then a
// deliberate `raise exception` carrying the evidence — so nothing can commit.
//
//   node scripts/check-public-drive-file.mjs     (from the repo root; dev only)
//
// The point of 0084 is which Drive files a signed-out visitor may fetch
// through the photo proxy, so every answer is asked with `set local role
// anon`, as the proxy asks for a visitor, and again as a signed-in admin
// (role authenticated with a JWT sub), which must get the same answer:
// the function borrows no privilege, so the caller cannot change it.
//
// Exits 0 when every assertion held. Writes nothing even on success.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync(join(root, "supabase/migrations/0084_is_public_drive_file.sql"), "utf8");

const sql = `
begin;
${migration}
-- a second run of the whole file must be harmless
${migration}

-- The answer as anon, and as a signed-in admin.
create function pg_temp.as_anon(p text) returns boolean language plpgsql as $f$
declare v boolean;
begin
  set local role anon;
  v := is_public_drive_file(p);
  reset role;
  return v;
end $f$;
create function pg_temp.as_admin(p text) returns boolean language plpgsql as $f$
declare v boolean;
begin
  perform set_config('request.jwt.claims', json_build_object('sub',
    (select user_id from user_roles where role = 'admin' and archived_at is null limit 1),
    'role', 'authenticated')::text, true);
  set local role authenticated;
  v := is_public_drive_file(p);
  reset role;
  return v;
end $f$;

do $h$
declare
  r_pub uuid; r_hid uuid; v_proj_parent uuid; v_proj_pub uuid; v_proj_hid uuid;
  v_zone uuid; v_maint uuid; v_c1 uuid; v_c2 uuid; v_n int; v_id text;
  v_public text[] := array[
    'h0084resPublicPhoto', 'h0084resHiddenProfile', 'h0084projPublicPhoto',
    'h0084siteGallery', 'h0084siteHero', 'h0084friendPublished'];
  v_private text[] := array[
    'h0084bloodTest', 'h0084procedure', 'h0084maintAttach', 'h0084resHiddenPhoto',
    'h0084projHiddenPhoto', 'h0084maintPhoto', 'h0084projectPhotosTable',
    'h0084friendUnpublished', 'h0084noSuchFile'];
begin
  -- Fixtures: one public resident, one hidden one, a public and a private
  -- project, a maintenance job, two Friends, a site gallery photo.
  insert into residents (name, species, is_public_visible) values ('Harness 0084 Public', 'Dog', true) returning id into r_pub;
  insert into residents (name, species) values ('Harness 0084 Hidden', 'Cat') returning id into r_hid;
  -- new folders must go inside an existing category (project_folders_before_write)
  select id into v_proj_parent from project_folders where parent_folder_id is null limit 1;
  insert into project_folders (top_level_category, name, parent_folder_id, is_public)
    select top_level_category, 'Harness 0084 Public', id, true from project_folders where id = v_proj_parent
    returning id into v_proj_pub;
  insert into project_folders (top_level_category, name, parent_folder_id)
    select top_level_category, 'Harness 0084 Private', id from project_folders where id = v_proj_parent
    returning id into v_proj_hid;
  select id into v_zone from zones limit 1;
  insert into maintenance (zone_id, title) values (v_zone, 'harness 0084') returning id into v_maint;

  insert into attachments (owner_type, owner_id, drive_file_id) values
    ('resident', r_pub, 'h0084resPublicPhoto'),
    ('resident', r_hid, 'h0084resHiddenProfile'),
    ('resident', r_hid, 'h0084resHiddenPhoto'),
    ('project', v_proj_pub, 'h0084projPublicPhoto'),
    ('project', v_proj_hid, 'h0084projHiddenPhoto'),
    ('blood_test', r_pub, 'h0084bloodTest'),
    ('procedure', r_pub, 'h0084procedure'),
    ('maintenance', v_maint, 'h0084maintAttach');
  update residents set profile_photo_drive_file_id = 'h0084resHiddenProfile' where id = r_hid;
  insert into project_photos (project_folder_id, drive_file_id) values (v_proj_pub, 'h0084projectPhotosTable');
  insert into maintenance_photos (maintenance_id, drive_file_id) values (v_maint, 'h0084maintPhoto');
  insert into site_content_photos (drive_file_id) values ('h0084siteGallery');
  update site_content set hero_drive_file_id = 'h0084siteHero';
  insert into contacts (name, type) values ('Harness 0084 Published', 'Vendor') returning id into v_c1;
  insert into contacts (name, type) values ('Harness 0084 Unpublished', 'Vendor') returning id into v_c2;
  insert into shelter_friends (contact_id, logo_drive_file_id, published) values
    (v_c1, 'h0084friendPublished', true), (v_c2, 'h0084friendUnpublished', false);

  -- A. public files: yes to anon and to admin
  foreach v_id in array v_public loop
    if not pg_temp.as_anon(v_id) then raise exception 'FAIL A anon: % should be public', v_id; end if;
    if not pg_temp.as_admin(v_id) then raise exception 'FAIL A admin: % should be public', v_id; end if;
  end loop;

  -- B. internal files: no to anon and to admin, though the proxy knows them all
  foreach v_id in array v_private loop
    if pg_temp.as_anon(v_id) then raise exception 'FAIL B anon: % should not be public', v_id; end if;
    if pg_temp.as_admin(v_id) then raise exception 'FAIL B admin: % should not be public', v_id; end if;
    if v_id <> 'h0084noSuchFile' and not is_known_drive_file(v_id) then
      raise exception 'FAIL B % unknown to is_known_drive_file — fixture broken', v_id;
    end if;
  end loop;

  -- C. the answer follows the data: hide the public resident, unpublish the
  --    project, archive the Friend's contact, and each file stops being public
  update residents set is_public_visible = false where id = r_pub;
  if pg_temp.as_anon('h0084resPublicPhoto') then raise exception 'FAIL C resident photo still public once hidden'; end if;
  update project_folders set is_public = false where id = v_proj_pub;
  if pg_temp.as_anon('h0084projPublicPhoto') then raise exception 'FAIL C project photo still public once unpublished'; end if;
  update contacts set archived_at = now() where id = v_c1;
  if pg_temp.as_anon('h0084friendPublished') then raise exception 'FAIL C logo still public once the contact is archived'; end if;

  -- D. real rows: no existing blood-test or procedure file is public, and
  --    every Drive id anon can read from a public view is
  select count(*) into v_n from attachments a
   where a.owner_type in ('blood_test', 'procedure') and a.drive_file_id not like 'h0084%'
     and pg_temp.as_anon(a.drive_file_id);
  if v_n <> 0 then raise exception 'FAIL D % real blood-test/procedure file(s) public', v_n; end if;
  select count(*) into v_n from (
    select drive_file_id f from public_resident_photos
    union select profile_photo_drive_file_id from public_resident_cards
    union select cover_drive_file_id from public_projects
    union select drive_file_id from public_project_photos
    union select logo_drive_file_id from public_shelter_friends
    union select drive_file_id from site_content_photos
  ) s where f is not null and f not like 'h0084%' and not pg_temp.as_anon(f);
  if v_n <> 0 then raise exception 'FAIL D % Drive id(s) shown by a public view but not public', v_n; end if;

  -- E. grants: anon, authenticated and service_role may execute; PUBLIC may not
  if not has_function_privilege('anon', 'is_public_drive_file(text)', 'execute')
     or not has_function_privilege('authenticated', 'is_public_drive_file(text)', 'execute')
     or not has_function_privilege('service_role', 'is_public_drive_file(text)', 'execute')
    then raise exception 'FAIL E an API role cannot execute'; end if;
  select count(*) into v_n from pg_proc p, aclexplode(p.proacl) x
   where p.oid = 'is_public_drive_file(text)'::regprocedure and x.grantee = 0;
  if v_n <> 0 then raise exception 'FAIL E PUBLIC holds EXECUTE'; end if;
  select count(*) into v_n from pg_proc where oid = 'is_public_drive_file(text)'::regprocedure and prosecdef;
  if v_n <> 0 then raise exception 'FAIL E function is security definer'; end if;

  raise exception 'HARNESS-OK public (resident photo, hidden resident''s profile photo via cards, project photo, site hero + gallery, published logo) yes to anon and admin | internal (blood test, procedure, maintenance attachment + photo, hidden resident''s other photo, private project photo, legacy project_photos, unpublished logo, unknown id) no to both | hiding resident / unpublishing project / archiving contact withdraws each | real rows: 0 blood-test/procedure files public, every public-view id public | EXECUTE anon+authenticated+service_role, not PUBLIC, invoker | file ran twice';
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
