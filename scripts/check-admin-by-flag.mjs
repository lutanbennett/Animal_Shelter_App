// Rollback harness for 0277_admin_by_flag_and_profile_photo_medical.sql against DEV only. One transaction: the live
// functions are asked BEFORE the file, the file is replayed, they are asked AFTER, then a deliberate `raise exception`
// carries the evidence, so nothing can commit. Safe to run any number of times, and still meaningful once 0277 is applied
// (the BEFORE half then reads the already-fixed functions, so only the AFTER assertions are binding).
//
//   node scripts/check-admin-by-flag.mjs     (from the repo root; dev only)
//
// It checks
//   A  Admin passes before and after (has_permission, is_admin, holds_app_role, my_permissions().is_admin)
//   B  a RENAMED Admin role (key changed, flag untouched) still passes after -- the reason for the change. Before 0277 it
//      did not, which is printed as evidence the harness can tell the two apart
//   C  a non-Admin login does not pass: an activity no card gives it is refused, is_admin() is false
//   D  Admin still holds no cards: the bypass answers before any cell is read
//   E  a login holding photos.resident_manage cannot set a Medical file (any case or padding, tabs and newlines included)
//      as the profile photo, and can still set a Shelter one
//
// Exits 0 when every assertion held. Writes nothing even on success.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const dir = join(root, "supabase/migrations");
const file = readdirSync(dir).find((f) => /^0277_admin_by_flag_and_profile_photo_medical\.sql$/.test(f));
if (!file) throw new Error("no 0277_admin_by_flag_and_profile_photo_medical.sql in supabase/migrations");
const migration = readFileSync(join(dir, file), "utf8");

const sql = `
begin;

create function pg_temp.q(p_uid uuid, p_expr text) returns text language plpgsql as $f$
declare v text;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  begin
    execute 'select (' || p_expr || ')::text' into v;
  exception when others then v := 'ERR:' || sqlstate;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

create function pg_temp.eq(p_label text, p_got text, p_want text) returns void language plpgsql as $f$
begin
  if p_got is distinct from p_want then
    raise exception 'HARNESS-FAIL %: got %, wanted %', p_label, coalesce(p_got, 'null'), coalesce(p_want, 'null');
  end if;
end $f$;

create temp table harness_ids (who text primary key, id uuid not null);
insert into harness_ids values ('admin', gen_random_uuid()), ('other', gen_random_uuid()), ('photo', gen_random_uuid());
grant select on harness_ids to authenticated;
create temp table harness_note (k text, v text);
grant select, insert on harness_note to authenticated;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'harness-adminflag-' || who || '-' || id || '@example.invalid', '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || who), now(), now()
  from harness_ids;

-- A role with one real cell, for the non-Admin and the photo cases. No Admin cell is ever written.
insert into roles (key, name, kind) values ('harness_photo_role', 'Harness photo role', 'custom'), ('harness_other_role', 'Harness other role', 'custom');
insert into role_permissions (role_id, activity, level) select id, 'photos.resident_manage', 2 from roles where key = 'harness_photo_role';
insert into role_permissions (role_id, activity, level) select id, 'stock.count', 2 from roles where key = 'harness_other_role';
insert into user_roles (user_id, role_id) select h.id, r.id from harness_ids h join roles r on r.key = 'admin' where h.who = 'admin';
insert into user_roles (user_id, role_id) select h.id, r.id from harness_ids h join roles r on r.key = 'harness_other_role' where h.who = 'other';
insert into user_roles (user_id, role_id) select h.id, r.id from harness_ids h join roles r on r.key = 'harness_photo_role' where h.who = 'photo';

create function pg_temp.admin_answers() returns text language plpgsql as $f$
declare u uuid := (select id from harness_ids where who = 'admin');
begin
  return concat_ws(',',
    pg_temp.q(u, 'has_permission(''harness.no_such_activity'', ''edit'')'),
    pg_temp.q(u, 'is_admin()'),
    pg_temp.q(u, 'holds_app_role()'),
    pg_temp.q(u, '(my_permissions()->>''is_admin'')'));
end $f$;

create temp table harness_resident (id uuid);
do $setup$
declare r uuid;
begin
  insert into residents (name, species) values ('Harness 0277', 'Dog') returning id into r;
  insert into harness_resident values (r);
  insert into attachments (owner_type, owner_id, drive_file_id, sub_folder) values
    ('resident', r, 'h0277shelter', 'Shelter'),
    ('resident', r, 'h0277medical', 'Medical'),
    ('resident', r, 'h0277lower', 'medical'),
    ('resident', r, 'h0277padded', ' Medical '),
    ('resident', r, 'h0277tab', E'Medical\\t'),
    ('resident', r, 'h0277newline', E'\\nMEDICAL\\n');
end $setup$;
grant select on harness_resident to authenticated;

-- BEFORE
do $b$
declare
  v_admin text := pg_temp.admin_answers();
  v_med text;
begin
  insert into harness_note values ('admin_before', v_admin);
  -- 'harness.no_such_activity' has no cell anywhere, so only the bypass can say true
  perform pg_temp.eq('A admin before', v_admin, 'true,true,true,true');
  v_med := pg_temp.q((select id from harness_ids where who = 'photo'),
    'set_resident_profile_photo((select id from harness_resident), ''h0277medical'')');
  insert into harness_note values ('medical_before', v_med);
end $b$;

${migration}

do $a$
declare
  v_admin_u uuid := (select id from harness_ids where who = 'admin');
  v_other_u uuid := (select id from harness_ids where who = 'other');
  v_photo_u uuid := (select id from harness_ids where who = 'photo');
  v_res text := '(select id from harness_resident)';
  f text;
begin
  -- A. Admin after
  perform pg_temp.eq('A admin after', pg_temp.admin_answers(), 'true,true,true,true');

  -- B. renamed Admin: the key changes, the flag does not
  -- the DB itself pins fixed roles to reserved keys (roles_fixed_iff_reserved), so a shelter can only rename Admin's NAME; the
  -- constraint is dropped here (rolled back with everything else) to prove the functions do not read the key at all
  alter table roles drop constraint roles_fixed_iff_reserved;
  alter table roles disable trigger user;
  update roles set key = 'harness_renamed_admin', name = 'Harness renamed admin' where is_admin;
  alter table roles enable trigger user;
  perform pg_temp.eq('B renamed admin after', pg_temp.admin_answers(), 'true,true,true,true');
  insert into harness_note values ('renamed_after', pg_temp.admin_answers());

  -- C. non-Admin: no bypass
  perform pg_temp.eq('C other has_permission', pg_temp.q(v_other_u, 'has_permission(''harness.no_such_activity'', ''edit'')'), 'false');
  perform pg_temp.eq('C other still has its own cell', pg_temp.q(v_other_u, 'has_permission(''stock.count'', ''edit'')'), 'true');
  perform pg_temp.eq('C other is_admin', pg_temp.q(v_other_u, 'is_admin()'), 'false');
  perform pg_temp.eq('C other my_permissions.is_admin', pg_temp.q(v_other_u, '(my_permissions()->>''is_admin'')'), 'false');
  perform pg_temp.eq('C other holds_app_role (has a cell)', pg_temp.q(v_other_u, 'holds_app_role()'), 'true');
  -- a role named 'admin' that is not flagged gets nothing: the name no longer matters
  update roles set key = 'admin' where key = 'harness_other_role';
  perform pg_temp.eq('C name admin without flag, no bypass', pg_temp.q(v_other_u, 'has_permission(''harness.no_such_activity'', ''edit'')'), 'false');
  perform pg_temp.eq('C name admin without flag, is_admin', pg_temp.q(v_other_u, 'is_admin()'), 'false');

  -- D. Admin holds no cards
  perform pg_temp.eq('D admin has no cells', (select count(*) from role_permissions rp join roles r on r.id = rp.role_id where r.is_admin)::text, '0');

  -- E. the photo guard
  -- the first upload already became the profile photo (record_attachment); clear it so the later assertions mean something
  update residents set profile_photo_drive_file_id = null where id = (select id from harness_resident);
  foreach f in array array['h0277medical', 'h0277lower', 'h0277padded', 'h0277tab', 'h0277newline'] loop
    perform pg_temp.eq('E medical refused ' || f, pg_temp.q(v_photo_u, format('set_resident_profile_photo(%s, %L)', v_res, f)), 'ERR:P0001');
  end loop;
  perform pg_temp.eq('E profile unchanged by the refusals', ((select profile_photo_drive_file_id from residents where id = (select id from harness_resident)) is null)::text, 'true');
  perform pg_temp.eq('E shelter allowed', pg_temp.q(v_photo_u, format('set_resident_profile_photo(%s, %L)', v_res, 'h0277shelter')), '');
  perform pg_temp.eq('E shelter took effect', (select profile_photo_drive_file_id from residents where id = (select id from harness_resident)), 'h0277shelter');
  perform pg_temp.eq('E unknown file still refused', pg_temp.q(v_photo_u, format('set_resident_profile_photo(%s, %L)', v_res, 'nope')), 'ERR:P0001');
  perform pg_temp.eq('E no card, no set', pg_temp.q(v_other_u, format('set_resident_profile_photo(%s, %L)', v_res, 'h0277shelter')), 'ERR:P0001');

  raise exception '%', format('HARNESS-OK %s | admin before: %s | medical set before (old body): %s | renamed admin after: %s',
    ${JSON.stringify(file).replace(/"/g, "'")},
    (select v from harness_note where k = 'admin_before'),
    coalesce(nullif((select v from harness_note where k = 'medical_before'), ''), 'allowed (the gap)'),
    (select v from harness_note where k = 'renamed_after'));
end $a$;
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
