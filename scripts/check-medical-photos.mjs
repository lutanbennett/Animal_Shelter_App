// Rollback harness for 0101_public_photos_exclude_medical.sql against DEV only.
// One transaction: the migration (twice), fixtures, assertions, then a
// deliberate `raise exception` carrying the evidence — so nothing can commit.
//
//   node scripts/check-medical-photos.mjs     (from the repo root; dev only)
//
// What 0101 must do: a resident photo filed under Medical leaves the public
// gallery view AND stops being servable to a signed-out visitor through the
// photo proxy (is_public_drive_file, asked as anon, as the proxy asks), while
// every other public photo stays exactly as it was — including the
// adopted / deceased filter, which breaks silently if the status subquery
// binds to 0086's gated public.resident_current_state instead of
// private.resident_current_state.
//
// Then, read-only, it lists the residents whose PROFILE photo is filed under
// Medical (claude/medical-photos-profile). The app no longer lets anyone
// choose one, but record_attachment still makes a first upload the profile
// photo whatever its folder, and delete_resident_photo falls back to the
// oldest — so this list is what the public views' fallback (the follow-up)
// has to cover, and what staff can fix by hand where the resident has a
// photo in another folder. Listed, not asserted: it does not change the exit.
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

const migration = readFileSync(join(root, "supabase/migrations/0101_public_photos_exclude_medical.sql"), "utf8");

const sql = `
begin;
-- Before: what the old definition shows, minus Medical, is what the new
-- one must show. Captured before the migration runs.
create temp table h0101_before on commit drop as
  select drive_file_id, id from public_resident_photos p
  where not exists (select 1 from attachments a where a.id = p.id
                    and lower(btrim(coalesce(a.sub_folder, ''))) = 'medical');
create temp table h0101_before_medical on commit drop as
  select p.drive_file_id from public_resident_photos p
  join attachments a on a.id = p.id where a.sub_folder = 'Medical';

${migration}
-- a second run of the whole file must be harmless
${migration}

create function pg_temp.as_anon(p text) returns boolean language plpgsql as $f$
declare v boolean;
begin
  set local role anon;
  v := is_public_drive_file(p);
  reset role;
  return v;
end $f$;
create function pg_temp.anon_gallery(p text) returns boolean language plpgsql as $f$
declare v boolean;
begin
  set local role anon;
  v := exists (select 1 from public_resident_photos where drive_file_id = p);
  reset role;
  return v;
end $f$;

do $h$
declare
  r_pub uuid; v_n int; v_id text; v_prev int; v_med_before int;
  v_public text[] := array['h0101shelter', 'h0101foster', 'h0101adoption', 'h0101nullFolder', 'h0101dateFolder'];
  v_hidden text[] := array['h0101medical', 'h0101medicalLower', 'h0101medicalSpaced'];
begin
  insert into residents (name, species, is_public_visible) values ('Harness 0101 Public', 'Dog', true) returning id into r_pub;
  insert into attachments (owner_type, owner_id, drive_file_id, sub_folder) values
    ('resident', r_pub, 'h0101shelter', 'Shelter'),
    ('resident', r_pub, 'h0101foster', 'Foster'),
    ('resident', r_pub, 'h0101adoption', 'Adoption'),
    ('resident', r_pub, 'h0101nullFolder', null),
    ('resident', r_pub, 'h0101dateFolder', '20260927'),
    ('resident', r_pub, 'h0101medical', 'Medical'),
    ('resident', r_pub, 'h0101medicalLower', 'medical'),
    ('resident', r_pub, 'h0101medicalSpaced', ' Medical ');

  -- A. non-medical photos of a public resident: in the gallery and servable to anon
  foreach v_id in array v_public loop
    if not pg_temp.anon_gallery(v_id) then raise exception 'FAIL A % missing from the gallery', v_id; end if;
    if not pg_temp.as_anon(v_id) then raise exception 'FAIL A % not servable to anon', v_id; end if;
  end loop;

  -- B. Medical, in any case or padding: neither in the gallery nor servable
  foreach v_id in array v_hidden loop
    if pg_temp.anon_gallery(v_id) then raise exception 'FAIL B % still in the gallery', v_id; end if;
    if pg_temp.as_anon(v_id) then raise exception 'FAIL B % still servable to anon', v_id; end if;
    if not is_known_drive_file(v_id) then raise exception 'FAIL B % unknown to is_known_drive_file — fixture broken', v_id; end if;
  end loop;

  -- C. real rows: the new view is exactly the old view minus Medical (so the
  --    adopted / deceased / hidden filters survived the re-create), and no
  --    real Medical photo that was in the gallery still is
  select count(*) into v_prev from h0101_before;
  select count(*) into v_n from (
    (select drive_file_id, id from public_resident_photos where drive_file_id not like 'h0101%'
     except select drive_file_id, id from h0101_before)
    union all
    (select drive_file_id, id from h0101_before
     except select drive_file_id, id from public_resident_photos)
  ) d;
  if v_n <> 0 then raise exception 'FAIL C % row(s) differ from the old view minus Medical', v_n; end if;
  select count(*) into v_med_before from h0101_before_medical;
  select count(*) into v_n from public_resident_photos p join attachments a on a.id = p.id
   where lower(btrim(coalesce(a.sub_folder, ''))) = 'medical';
  if v_n <> 0 then raise exception 'FAIL C % real Medical photo(s) still in the view', v_n; end if;
  select count(*) into v_n from public_resident_photos p
   join residents r on r.id = p.resident_id
   join private.resident_current_state s on s.resident_id = r.id
   where s.current_status in ('Adopted', 'Deceased') or not r.is_public_visible;
  if v_n <> 0 then raise exception 'FAIL C % photo(s) of an adopted, deceased or hidden resident', v_n; end if;

  -- D. the view definition names the private status view, not the gate
  if pg_get_viewdef('public_resident_photos'::regclass) not like '%private.resident_current_state%'
    then raise exception 'FAIL D view binds to the gated public.resident_current_state'; end if;

  -- E. grants: anon and authenticated may SELECT and nothing else
  if not has_table_privilege('anon', 'public_resident_photos', 'select')
     or not has_table_privilege('authenticated', 'public_resident_photos', 'select')
    then raise exception 'FAIL E select grant lost'; end if;
  if has_table_privilege('anon', 'public_resident_photos', 'insert,update,delete,truncate')
     or has_table_privilege('authenticated', 'public_resident_photos', 'insert,update,delete,truncate')
    then raise exception 'FAIL E a write privilege on the view'; end if;

  raise exception 'HARNESS-OK Shelter/Foster/Adoption/null/date photos in gallery + servable to anon | Medical, medical, " Medical " in neither | real rows: view = old view minus Medical (% rows, % real Medical removed), none adopted/deceased/hidden | binds private.resident_current_state | anon+authenticated SELECT only | file ran twice', v_prev, v_med_before;
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

const profiles = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    query: `
      select r.resident_code, r.name, r.is_public_visible,
             count(o.id) filter (where lower(btrim(coalesce(o.sub_folder, ''))) <> 'medical') as other_folders
        from residents r
        join attachments a on a.owner_type = 'resident' and a.owner_id = r.id
                          and a.drive_file_id = r.profile_photo_drive_file_id
        left join attachments o on o.owner_type = 'resident' and o.owner_id = r.id
       where lower(btrim(coalesce(a.sub_folder, ''))) = 'medical'
       group by r.id
       order by r.is_public_visible desc, r.resident_code`,
  }),
}).then((r) => r.json());
if (Array.isArray(profiles)) {
  console.log(`
Residents whose profile photo is in Medical: ${profiles.length}`);
  for (const p of profiles) {
    console.log(
      `  ${p.resident_code} ${p.name}${p.is_public_visible ? " (ON THE WEBSITE)" : ""} — ` +
        (Number(p.other_folders) > 0
          ? `${p.other_folders} photo(s) in other folders; staff can choose one`
          : "no photo in another folder"),
    );
  }
} else {
  console.log(`
profile-photo listing failed: ${JSON.stringify(profiles)}`);
}

// exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
