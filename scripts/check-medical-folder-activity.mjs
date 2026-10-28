// Rollback harness for 0278_medical_folder_filing_activity.sql against DEV only. 0278 must already be applied; one transaction,
// every assertion a `raise exception`, a final HARNESS-OK exception carries the evidence, and `rollback` means nothing commits.
//
//   node scripts/check-medical-folder-activity.mjs     (from the repo root; dev only)
//
//   A  a login holding only photos.resident_add cannot file into Medical through record_attachment() nor insert a Medical row
//   B  a login holding photos.resident_add + photos.resident_publish (the Residents shape) cannot file into Medical in any spelling
//      of the folder, and CAN still file into Shelter, Foster and Adoption (the reason the grant could not simply be taken off)
//   C  a login holding photos.medical_add files into Medical, directly and through record_attachment()
//   D  Admin files into Medical and Shelter, holding no cell
//   E  the activity is granted by cards: Add medical photos and Manage medical hold it, Residents does not
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

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
insert into harness_ids values ('add', gen_random_uuid()), ('res', gen_random_uuid()), ('med', gen_random_uuid()), ('admin', gen_random_uuid());
grant select on harness_ids to authenticated;
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'harness-0278-' || who || '-' || id || '@example.invalid', '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || who), now(), now()
  from harness_ids;

insert into roles (key, name, kind) values ('h0278_add', 'h add', 'custom'), ('h0278_res', 'h res', 'custom'), ('h0278_med', 'h med', 'custom');
insert into role_permissions (role_id, activity, level) select id, 'photos.resident_add', 2 from roles where key in ('h0278_add','h0278_res','h0278_med');
insert into role_permissions (role_id, activity, level) select id, 'photos.resident_publish', 2 from roles where key = 'h0278_res';
insert into role_permissions (role_id, activity, level) select id, 'photos.medical_add', 2 from roles where key = 'h0278_med';
insert into user_roles (user_id, role_id) select h.id, r.id from harness_ids h join roles r on r.key = 'h0278_' || h.who where h.who in ('add','res','med');
insert into user_roles (user_id, role_id) select h.id, r.id from harness_ids h join roles r on r.is_admin where h.who = 'admin';

create temp table harness_resident (id uuid);
insert into residents (name, species) values ('Harness 0278', 'Dog');
insert into harness_resident select id from residents where name = 'Harness 0278' order by created_at desc limit 1;
grant select on harness_resident to authenticated;
grant insert, select on attachments to authenticated;

create function pg_temp.rec(p_who text, p_folder text) returns text language plpgsql as $f$
begin
  return pg_temp.q((select id from harness_ids where who = p_who),
    format('(select count(*) from record_attachment(''resident'', (select id from harness_resident), %L, ''x.jpg'', %L, null, null, ''bill''))', 'f-' || gen_random_uuid(), p_folder));
end $f$;
create function pg_temp.ins(p_who text, p_folder text) returns text language plpgsql as $f$
declare v text := 'inserted';
begin
  perform set_config('request.jwt.claims', json_build_object('sub', (select id from harness_ids where who = p_who), 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  begin
    insert into attachments (owner_type, owner_id, drive_file_id, sub_folder)
    values ('resident', (select id from harness_resident), 'd-' || gen_random_uuid(), p_folder);
  exception when others then v := 'ERR:' || sqlstate;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

do $a$
declare f text;
begin
  -- A. resident_add alone
  perform pg_temp.eq('A record Medical refused', pg_temp.rec('add', 'Medical'), 'ERR:P0001');
  perform pg_temp.eq('A insert Medical refused', pg_temp.ins('add', 'Medical'), 'ERR:42501');
  -- B. the Residents shape
  foreach f in array array['Medical', 'medical', ' Medical ', E'Medical\\t', E'\\nMEDICAL\\n'] loop
    perform pg_temp.eq('B record Medical refused [' || f || ']', pg_temp.rec('res', f), 'ERR:P0001');
    perform pg_temp.eq('B insert Medical refused [' || f || ']', pg_temp.ins('res', f), 'ERR:42501');
  end loop;
  foreach f in array array['Shelter', 'Foster', 'Adoption'] loop
    perform pg_temp.eq('B record other folder ok [' || f || ']', pg_temp.rec('res', f), '1');
    perform pg_temp.eq('B insert other folder ok [' || f || ']', pg_temp.ins('res', f), 'inserted');
  end loop;
  -- C. the new activity
  perform pg_temp.eq('C record Medical ok', pg_temp.rec('med', 'Medical'), '1');
  perform pg_temp.eq('C insert Medical ok', pg_temp.ins('med', 'Medical'), 'inserted');
  perform pg_temp.eq('C record Medical ok (tab)', pg_temp.rec('med', E'Medical\\t'), '1');
  perform pg_temp.eq('C no publish: Shelter still refused', pg_temp.rec('med', 'Shelter'), 'ERR:P0001');
  -- D. Admin
  perform pg_temp.eq('D admin Medical', pg_temp.rec('admin', 'Medical'), '1');
  perform pg_temp.eq('D admin Shelter', pg_temp.rec('admin', 'Shelter'), '1');
  perform pg_temp.eq('D admin holds no cells', (select count(*) from role_permissions rp join roles r on r.id = rp.role_id where r.is_admin)::text, '0');
  -- E. cards
  perform pg_temp.eq('E add_medical_photos', (select count(*) from card_grants where card = 'add_medical_photos' and activity = 'photos.medical_add')::text, '1');
  perform pg_temp.eq('E medical_records', (select count(*) from card_grants where card = 'medical_records' and activity = 'photos.medical_add')::text, '1');
  perform pg_temp.eq('E residents does not', (select count(*) from card_grants where card = 'residents' and activity = 'photos.medical_add')::text, '0');
  raise exception 'HARNESS-OK 0278: all assertions held';
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
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
