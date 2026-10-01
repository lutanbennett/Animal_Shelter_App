// Rollback harness for 0122_placement_lifecycle_and_site_views.sql and
// 0123_is_public_drive_file_views.sql against DEV only. One transaction: both
// files (twice), then each guard exercised, then a deliberate `raise
// exception` carrying the evidence, so nothing can commit. Safe to run before
// or after the files are applied.
//
//   node scripts/check-lifecycle-guards.mjs     (from the repo root; dev only)
//
// DB-9 refusals
//   R1  the Lifecycle zone cannot be renamed, deleted or unflagged
//   R2  each of its five pseudo-enclosures cannot be renamed, moved to another
//       zone, deleted or unflagged; the table owner and an admin are held to it
// DB-9 must still work
//   P1  an ordinary zone and enclosure rename, move and delete
//   P2  a protected row's capacity, notes, name_th and internal stay editable
//   P3  exactly six rows are protected
// DB-10 (anon reads the site_* tables only through fixed-column views)
//   A1  anon reads public_site_content / public_site_content_photos
//   A2  anon is refused site_content, site_content_photos and site_pages, and
//       cannot read vet_visit_estimate through the view
//   A3  a column added to site_content after the fact does not reach anon
//   A4  authenticated still reads the base tables; is_public_drive_file still
//       answers for a signed-out visitor
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

const files = [
  "supabase/migrations/0122_placement_lifecycle_and_site_views.sql",
  "supabase/migrations/0123_is_public_drive_file_views.sql",
].map((f) => readFileSync(join(root, f), "utf8"));

const sql = `
begin;
${files.join("\n")}
-- a second run of both files must be harmless
${files.join("\n")}

-- Run one statement as a role; returns 'ok' or the error text.
create function pg_temp.run(p_role text, p_uid uuid, p_sql text) returns text language plpgsql as $f$
declare v text := 'ok';
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', p_role, 'aal', 'aal1')::text, true);
  execute format('set local role %I', p_role);
  begin
    execute p_sql;
  exception when others then v := sqlerrm;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

do $h$
declare
  v_admin uuid := gen_random_uuid();
  v_life uuid; v_zone uuid := gen_random_uuid(); v_enc uuid := gen_random_uuid();
  v_e uuid; v_name text; v_r text; v_n int;
begin
  select id into v_life from zones where name = 'Lifecycle';
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (v_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'harness-lifecycle-' || v_admin || '@example.invalid', '{}'::jsonb, '{"full_name":"Harness"}'::jsonb, now(), now());
  insert into user_roles (user_id, role) values (v_admin, 'admin');

  -- P3
  select count(*) into v_n from zones where protected;
  if v_n <> 1 then raise exception 'FAIL P3 expected 1 protected zone, got %', v_n; end if;
  select count(*) into v_n from enclosures where protected;
  if v_n <> 5 then raise exception 'FAIL P3 expected 5 protected enclosures, got %', v_n; end if;
  select count(*) into v_n from enclosures e join zones z on z.id = e.zone_id
   where e.protected and z.name = 'Lifecycle'
     and e.name in ('Unassigned', 'Hospital', 'Fostered', 'Adopted', 'Deceased');
  if v_n <> 5 then raise exception 'FAIL P3 the five protected enclosures are not the Lifecycle five'; end if;

  -- R1: the owner (this transaction) and an admin
  begin update zones set name = 'Life' where id = v_life; v_r := 'ok'; exception when others then v_r := sqlerrm; end;
  if v_r not like '%zone is protected%renamed%' then raise exception 'FAIL R1 owner rename: %', v_r; end if;
  v_r := pg_temp.run('authenticated', v_admin, format('update zones set name = %L where id = %L', 'Life', v_life));
  if v_r not like '%zone is protected%renamed%' then raise exception 'FAIL R1 admin rename: %', v_r; end if;
  begin delete from zones where id = v_life; v_r := 'ok'; exception when others then v_r := sqlerrm; end;
  if v_r not like '%zone is protected%deleted%' then raise exception 'FAIL R1 owner delete: %', v_r; end if;
  v_r := pg_temp.run('authenticated', v_admin, format('delete from zones where id = %L', v_life));
  if v_r not like '%zone is protected%deleted%' then raise exception 'FAIL R1 admin delete: %', v_r; end if;
  begin update zones set protected = false where id = v_life; v_r := 'ok'; exception when others then v_r := sqlerrm; end;
  if v_r not like '%flag cannot be removed%' then raise exception 'FAIL R1 unflag: %', v_r; end if;

  -- R2: every pseudo-enclosure
  insert into zones (id, name) values (v_zone, 'Harness zone');
  foreach v_name in array array['Unassigned', 'Hospital', 'Fostered', 'Adopted', 'Deceased'] loop
    select id into v_e from enclosures where zone_id = v_life and name = v_name;
    begin update enclosures set name = v_name || ' x' where id = v_e; v_r := 'ok'; exception when others then v_r := sqlerrm; end;
    if v_r not like '%pseudo-enclosure is protected%renamed or moved%' then raise exception 'FAIL R2 owner rename %: %', v_name, v_r; end if;
    v_r := pg_temp.run('authenticated', v_admin, format('update enclosures set name = %L where id = %L', v_name || ' x', v_e));
    if v_r not like '%pseudo-enclosure is protected%renamed or moved%' then raise exception 'FAIL R2 admin rename %: %', v_name, v_r; end if;
    begin update enclosures set zone_id = v_zone where id = v_e; v_r := 'ok'; exception when others then v_r := sqlerrm; end;
    if v_r not like '%pseudo-enclosure is protected%renamed or moved%' then raise exception 'FAIL R2 move %: %', v_name, v_r; end if;
    begin delete from enclosures where id = v_e; v_r := 'ok'; exception when others then v_r := sqlerrm; end;
    if v_r not like '%pseudo-enclosure is protected%deleted%' then raise exception 'FAIL R2 owner delete %: %', v_name, v_r; end if;
    v_r := pg_temp.run('authenticated', v_admin, format('delete from enclosures where id = %L', v_e));
    if v_r not like '%pseudo-enclosure is protected%deleted%' then raise exception 'FAIL R2 admin delete %: %', v_name, v_r; end if;
    begin update enclosures set protected = false where id = v_e; v_r := 'ok'; exception when others then v_r := sqlerrm; end;
    if v_r not like '%flag cannot be removed%' then raise exception 'FAIL R2 unflag %: %', v_name, v_r; end if;
    -- P2: the rest of the row is still editable
    v_r := pg_temp.run('authenticated', v_admin, format('update enclosures set capacity = 7, notes = %L where id = %L', 'harness', v_e));
    if v_r <> 'ok' then raise exception 'FAIL P2 capacity/notes on %: %', v_name, v_r; end if;
  end loop;
  v_r := pg_temp.run('authenticated', v_admin, format('update zones set name_th = %L, internal = false where id = %L', 'harness', v_life));
  if v_r <> 'ok' then raise exception 'FAIL P2 name_th/internal on Lifecycle: %', v_r; end if;

  -- P1: an ordinary zone and enclosure are unaffected
  v_r := pg_temp.run('authenticated', v_admin, format('insert into enclosures (id, name, zone_id) values (%L, %L, %L)', v_enc, 'Harness E', v_zone));
  if v_r <> 'ok' then raise exception 'FAIL P1 insert enclosure: %', v_r; end if;
  v_r := pg_temp.run('authenticated', v_admin, format('update zones set name = %L where id = %L', 'Harness zone 2', v_zone));
  if v_r <> 'ok' then raise exception 'FAIL P1 rename ordinary zone: %', v_r; end if;
  v_r := pg_temp.run('authenticated', v_admin, format('update enclosures set name = %L where id = %L', 'Harness E2', v_enc));
  if v_r <> 'ok' then raise exception 'FAIL P1 rename ordinary enclosure: %', v_r; end if;
  v_r := pg_temp.run('authenticated', v_admin, format('delete from enclosures where id = %L', v_enc));
  if v_r <> 'ok' then raise exception 'FAIL P1 delete ordinary enclosure: %', v_r; end if;
  v_r := pg_temp.run('authenticated', v_admin, format('delete from zones where id = %L', v_zone));
  if v_r <> 'ok' then raise exception 'FAIL P1 delete ordinary zone: %', v_r; end if;

  -- A1, A2
  v_r := pg_temp.run('anon', null, 'select id, tagline, preferred_channels from public_site_content');
  if v_r <> 'ok' then raise exception 'FAIL A1 anon public_site_content: %', v_r; end if;
  v_r := pg_temp.run('anon', null, 'select id, drive_file_id, alt from public_site_content_photos');
  if v_r <> 'ok' then raise exception 'FAIL A1 anon public_site_content_photos: %', v_r; end if;
  v_r := pg_temp.run('anon', null, 'select slug, title from public_site_pages');
  if v_r <> 'ok' then raise exception 'FAIL A1 anon public_site_pages: %', v_r; end if;
  v_r := pg_temp.run('anon', null, 'select vet_visit_estimate from public_site_content');
  if v_r not like '%does not exist%' then raise exception 'FAIL A2 anon read vet_visit_estimate through the view: %', v_r; end if;
  foreach v_name in array array['site_content', 'site_content_photos', 'site_pages'] loop
    v_r := pg_temp.run('anon', null, format('select count(*) from %I', v_name));
    if v_r not like 'permission denied%' then raise exception 'FAIL A2 anon read %: %', v_name, v_r; end if;
  end loop;
  v_r := pg_temp.run('anon', null, 'update public_site_content set tagline = ''x''');
  if v_r not like 'permission denied%' then raise exception 'FAIL A2 anon wrote through the view: %', v_r; end if;

  -- A3: a column added later is not world-readable
  alter table site_content add column harness_secret text default 'secret';
  v_r := pg_temp.run('anon', null, 'select harness_secret from public_site_content');
  if v_r not like '%does not exist%' then raise exception 'FAIL A3 new column reached anon through the view: %', v_r; end if;
  v_r := pg_temp.run('anon', null, 'select harness_secret from site_content');
  if v_r not like 'permission denied%' then raise exception 'FAIL A3 new column reached anon through the table: %', v_r; end if;

  -- A4
  v_r := pg_temp.run('authenticated', v_admin, 'select vet_visit_estimate, harness_secret from site_content');
  if v_r <> 'ok' then raise exception 'FAIL A4 admin read of site_content: %', v_r; end if;
  v_r := pg_temp.run('authenticated', v_admin, 'select slug, body from site_pages');
  if v_r <> 'ok' then raise exception 'FAIL A4 admin read of site_pages: %', v_r; end if;
  v_r := pg_temp.run('anon', null, 'select is_public_drive_file(''harness-no-such-file'')');
  if v_r <> 'ok' then raise exception 'FAIL A4 anon is_public_drive_file: %', v_r; end if;

  raise exception 'HARNESS-OK files ran twice | R1 Lifecycle zone: rename, delete, unflag refused (owner and admin) | R2 five pseudo-enclosures: rename, move, delete, unflag refused (owner and admin) | P1 ordinary zone and enclosure insert, rename, delete | P2 protected rows keep capacity, notes, name_th, internal editable | P3 exactly 1 zone and 5 enclosures protected | A1 anon reads the three public_site_* views | A2 anon refused the three base tables and vet_visit_estimate, cannot write the view | A3 a new site_content column does not reach anon | A4 admin still reads the base tables, anon is_public_drive_file works';
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
// exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
