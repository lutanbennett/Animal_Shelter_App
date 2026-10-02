// Rollback harness for 0101_public_photos_exclude_medical.sql and
// 0103_public_profile_photo_exclude_medical.sql against DEV only.
// One transaction: fixtures, assertions against the LIVE schema (neither file is replayed:
// later migrations redefined the views and functions they touch, so a replay tests a
// schema that no longer exists), then a
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
// What 0103 must do: a PROFILE photo filed under Medical reads as null in
// public_resident_profiles, public_recent_adoptions and public_resident_cards,
// and so stops being servable to anon, while residents.profile_photo_drive_file_id
// keeps it (the app still shows it), every other profile photo is untouched,
// and each view keeps exactly its rows — the same resident_current_state trap.
//
// Then, read-only, it lists the residents whose PROFILE photo is filed under
// Medical (claude/medical-photos-profile). The app no longer lets anyone
// choose one, but record_attachment still makes a first upload the profile
// photo whatever its folder, and delete_resident_photo falls back to the
// oldest — so this list is what 0103 hides from the website (the photo stays
// in the app), and what staff can fix by hand where the resident has a photo
// in another folder. Listed, not asserted: it does not change the exit.
//
// Exits 0 when every assertion held. Writes nothing even on success.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

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

-- 0103: every row each view shows now, with the profile photo it must show
-- afterwards (null where that file is the resident's Medical attachment).
create temp table h0103_expected on commit drop as
  select v.view, v.id, case when exists (
      select 1 from attachments a
       where a.owner_type = 'resident' and a.owner_id = v.resident_id and a.drive_file_id = v.photo
         and lower(btrim(coalesce(a.sub_folder, ''))) = 'medical')
    then null else v.photo end as photo
  from (
    select 'profiles' as view, id, id as resident_id, profile_photo_drive_file_id as photo from public_resident_profiles
    union all
    select 'cards', id, id, profile_photo_drive_file_id from public_resident_cards
    union all
    select 'adoptions', v.id, p.resident_id, v.profile_photo_drive_file_id
      from public_recent_adoptions v join placement_history p on p.id = v.id
  ) v;

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

  raise notice '0101 ok: % gallery rows, % real Medical removed', v_prev, v_med_before;
end;
$h$;

create function pg_temp.anon_profile(p_view text, p_id uuid) returns text language plpgsql as $f$
declare v text;
begin
  set local role anon;
  execute format('select profile_photo_drive_file_id from %I where id = $1', p_view) into v using p_id;
  reset role;
  return v;
end $f$;

do $h$
declare
  r_med uuid; r_padded uuid; r_ok uuid; r_hidden uuid; r_adopted uuid; p_adopted uuid;
  v_n int; v_s text; v_real_med int;
begin
  insert into residents (name, species, is_public_visible) values ('Harness 0103 Medical', 'Dog', true) returning id into r_med;
  insert into residents (name, species, is_public_visible) values ('Harness 0103 Padded', 'Dog', true) returning id into r_padded;
  insert into residents (name, species, is_public_visible) values ('Harness 0103 Shelter', 'Dog', true) returning id into r_ok;
  insert into residents (name, species, is_public_visible) values ('Harness 0103 Hidden', 'Dog', false) returning id into r_hidden;
  insert into residents (name, species, is_public_visible) values ('Harness 0103 Adopted', 'Dog', true) returning id into r_adopted;
  insert into attachments (owner_type, owner_id, drive_file_id, sub_folder) values
    ('resident', r_med, 'h0103med', 'Medical'),
    ('resident', r_padded, 'h0103padded', ' MEDICAL '),
    ('resident', r_ok, 'h0103shelter', 'Shelter'),
    ('resident', r_ok, 'h0103okMed', 'Medical'),
    ('resident', r_hidden, 'h0103hidden', 'Medical'),
    ('resident', r_adopted, 'h0103adopted', 'Medical');
  update residents set profile_photo_drive_file_id = 'h0103med' where id = r_med;
  update residents set profile_photo_drive_file_id = 'h0103padded' where id = r_padded;
  update residents set profile_photo_drive_file_id = 'h0103shelter' where id = r_ok;
  update residents set profile_photo_drive_file_id = 'h0103hidden' where id = r_hidden;
  update residents set profile_photo_drive_file_id = 'h0103adopted' where id = r_adopted;
  insert into placement_history (resident_id, placement_type, start_date)
    values (r_adopted, 'Adopt', now()) returning id into p_adopted;

  -- F. a Medical profile photo (any case / padding) reads null to anon in
  --    every view; the resident stays listed, only the photo goes
  foreach v_s in array array['public_resident_profiles', 'public_resident_cards'] loop
    if pg_temp.anon_profile(v_s, r_med) is not null then raise exception 'FAIL F % shows h0103med', v_s; end if;
    if pg_temp.anon_profile(v_s, r_padded) is not null then raise exception 'FAIL F % shows h0103padded', v_s; end if;
    if pg_temp.anon_profile(v_s, r_ok) is distinct from 'h0103shelter' then raise exception 'FAIL F % lost the Shelter profile photo', v_s; end if;
  end loop;
  if not exists (select 1 from public_resident_profiles where id = r_med) then raise exception 'FAIL F the Medical-photo resident left /adopt'; end if;
  if pg_temp.anon_profile('public_resident_cards', r_hidden) is not null then raise exception 'FAIL F a hidden resident''s card shows its Medical photo'; end if;
  if not exists (select 1 from public_recent_adoptions where id = p_adopted) then raise exception 'FAIL F adoption fixture not in public_recent_adoptions — fixture broken'; end if;
  if pg_temp.anon_profile('public_recent_adoptions', p_adopted) is not null then raise exception 'FAIL F a recent adoption shows its Medical photo'; end if;

  -- G. the proxy: no Medical profile photo is servable to anon; the Shelter one is
  foreach v_s in array array['h0103med', 'h0103padded', 'h0103hidden', 'h0103adopted', 'h0103okMed'] loop
    if pg_temp.as_anon(v_s) then raise exception 'FAIL G % still servable to anon', v_s; end if;
  end loop;
  if not pg_temp.as_anon('h0103shelter') then raise exception 'FAIL G h0103shelter not servable to anon'; end if;

  -- H. inside the app the Medical photo is still the profile photo
  if (select profile_photo_drive_file_id from residents where id = r_med) is distinct from 'h0103med'
    then raise exception 'FAIL H residents.profile_photo_drive_file_id changed'; end if;

  -- I. real rows: each view has exactly its old rows, the photo nulled
  --    exactly where it was Medical — so the status filters survived
  create temp table h0103_after on commit drop as
    select 'profiles' as view, id, profile_photo_drive_file_id as photo from public_resident_profiles
    union all select 'cards', id, profile_photo_drive_file_id from public_resident_cards
    union all select 'adoptions', id, profile_photo_drive_file_id from public_recent_adoptions;
  -- both harness blocks' fixtures (0101's resident is on the cards too)
  delete from h0103_after where id = p_adopted
     or id in (select id from residents where name like 'Harness 01%');
  select count(*) into v_n from (
    (select view, id, photo from h0103_expected except select view, id, photo from h0103_after)
    union all
    (select view, id, photo from h0103_after except select view, id, photo from h0103_expected)
  ) d;
  if v_n <> 0 then raise exception 'FAIL I % row(s) differ from the old views with Medical profile photos nulled', v_n; end if;
  select count(*) into v_real_med from h0103_expected e join residents r on r.id = e.id
   where e.view = 'profiles' and e.photo is null and r.profile_photo_drive_file_id is not null;

  -- J. no real Medical profile photo is servable to anon
  select count(*) into v_n from residents r
    join attachments a on a.owner_type = 'resident' and a.owner_id = r.id
                      and a.drive_file_id = r.profile_photo_drive_file_id
   where lower(btrim(coalesce(a.sub_folder, ''))) = 'medical'
     and pg_temp.as_anon(r.profile_photo_drive_file_id);
  if v_n <> 0 then raise exception 'FAIL J % real Medical profile photo(s) still servable to anon', v_n; end if;

  -- K. the definitions name the private objects, not the gates
  if pg_get_viewdef('public_resident_profiles'::regclass) not like '%private.resident_current_state%'
     or pg_get_viewdef('public_resident_profiles'::regclass) not like '%private.approved_translations%'
     or pg_get_viewdef('public_recent_adoptions'::regclass) not like '%private.resident_current_state%'
     or pg_get_viewdef('public_resident_cards'::regclass) not like '%private.resident_current_state%'
     or pg_get_viewdef('public_resident_cards'::regclass) not like '%private.approved_translations%'
    then raise exception 'FAIL K a view binds to a gated public object'; end if;

  -- L. grants: anon and authenticated may SELECT and nothing else
  foreach v_s in array array['public_resident_profiles', 'public_recent_adoptions', 'public_resident_cards'] loop
    if not has_table_privilege('anon', v_s, 'select') or not has_table_privilege('authenticated', v_s, 'select')
      then raise exception 'FAIL L % select grant lost', v_s; end if;
    if has_table_privilege('anon', v_s, 'insert,update,delete,truncate')
       or has_table_privilege('authenticated', v_s, 'insert,update,delete,truncate')
      then raise exception 'FAIL L % has a write privilege', v_s; end if;
  end loop;

  raise exception 'HARNESS-OK 0101: Shelter/Foster/Adoption/null/date photos in gallery + servable to anon; Medical, medical, " Medical " in neither; real rows = old view minus Medical, none adopted/deceased/hidden; binds private.resident_current_state; SELECT only | 0103: Medical profile photo (incl. " MEDICAL ") null in profiles, cards and recent adoptions and not servable to anon, resident still listed, still the profile photo in residents, Shelter profile untouched; real rows unchanged except % Medical profile photo(s) nulled on /adopt; no real Medical profile photo servable; binds private objects; SELECT only', v_real_med;
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
             exists (select 1 from public_resident_cards c
                      where c.id = r.id and c.profile_photo_drive_file_id is not null) as on_site,
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
      `  ${p.resident_code} ${p.name}${p.is_public_visible ? " (on the website)" : ""}` +
        `${p.on_site ? " — PHOTO STILL PUBLIC, 0103 not applied" : ""} — ` +
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
