// Rollback harness for 0174_close_the_remaining_over_grants.sql against DEV only. Asserts the LIVE schema
// (docs/decisions/2026-10-02-replay-or-assert-live.md): before the file is applied it fails on exactly the
// over-grants it closes, afterwards it passes. One transaction, ended by a deliberate `raise exception` that
// carries the evidence, so nothing can commit.
//
//   node scripts/check-clinic-allow-lists.mjs     (from the repo root; dev only)
//
// Fixtures: clinics "own" and "other"; doctor logins "doctor" and "colleague" at own, "stranger" at other; a
// volunteer and an admin login; a resident with a visit at own, a blood test and a procedure on it, a file on each
// and a Medical photo, and a Thai translation of the resident's name. Driven through RLS under each login's JWT.
//
//   A  the doctor reads no project or maintenance file, updates and deletes none, and cannot insert one, directly or
//      through record_attachment()
//   B  the doctor still reads its resident's photo, blood-test and procedure files, and still adds a file on its own
//      blood test (the clinical case 0110 kept)
//   C  the doctor reads its resident's translation and no translation of any other table
//   D  app_users for the doctor: itself and its colleague, not the stranger and not the admin
//   E  app_users for the volunteer: every login, emails blank (the recurring-jobs pickers' case, unchanged)
//
// Exits 0 when every assertion held.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;

-- rows a statement reaches under p_uid; -1 refused by RLS or a grant, -2 refused by anything else
create function pg_temp.try(p_uid uuid, p_sql text) returns bigint language plpgsql as $f$
declare v bigint;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  begin
    execute p_sql;
    get diagnostics v = row_count;
    raise exception 'HARNESS-UNDO %', v;
  exception
    when insufficient_privilege then v := -1;
    when others then
      v := case when sqlerrm like 'HARNESS-UNDO %' then substr(sqlerrm, 14)::bigint else -2 end;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

-- the single value a query returns under p_uid
create function pg_temp.val(p_uid uuid, p_sql text) returns bigint language plpgsql as $f$
declare v bigint;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  execute p_sql into v;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

create temp table harness_ids (who text primary key, id uuid not null);
insert into harness_ids
select w, gen_random_uuid() from unnest(array[
  'doctor', 'colleague', 'stranger', 'volunteer', 'admin', 'own_clinic', 'other_clinic', 'res', 'visit',
  'blood', 'proc', 'f_photo', 'f_blood', 'f_proc']) w;
grant select on harness_ids to authenticated;
create function pg_temp.hid(p text) returns uuid language sql as $$ select id from harness_ids where who = p $$;

do $setup$
declare r record;
begin
  insert into clinics (id, name) values
    (pg_temp.hid('own_clinic'), 'Harness allow-list own'), (pg_temp.hid('other_clinic'), 'Harness allow-list other');
  for r in select * from harness_ids where who in ('doctor', 'colleague', 'stranger', 'volunteer', 'admin') loop
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (r.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-allow-' || r.who || '-' || r.id || '@example.invalid',
            '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || r.who), now(), now());
  end loop;
  insert into user_roles (user_id, role_id, role)
  select h.id, rl.id, rl.legacy_role
    from harness_ids h
    join roles rl on rl.key = case when h.who in ('doctor', 'colleague', 'stranger') then 'doctor' else h.who end
   where h.who in ('doctor', 'colleague', 'stranger', 'volunteer', 'admin');
  for r in select * from harness_ids where who in ('doctor', 'colleague', 'stranger') loop
    with d as (insert into doctors (name, user_id) values ('Harness Dr ' || r.who, r.id) returning id)
      insert into doctor_clinics (clinic_id, doctor_id)
      select case when r.who = 'stranger' then pg_temp.hid('other_clinic') else pg_temp.hid('own_clinic') end, id from d;
  end loop;

  insert into residents (id, name, species) values (pg_temp.hid('res'), 'Harness allow-list', 'Dog');
  insert into clinic_visits (id, resident_id, clinic_id, appointment_date, status)
  values (pg_temp.hid('visit'), pg_temp.hid('res'), pg_temp.hid('own_clinic'), now() - interval '2 days', 'completed');
  insert into blood_tests (id, resident_id, clinic_visit_id, blood_test_type_id, date)
  values (pg_temp.hid('blood'), pg_temp.hid('res'), pg_temp.hid('visit'), (select id from blood_test_types limit 1), current_date - 2);
  insert into procedures (id, resident_id, clinic_visit_id, procedure_type_id, date)
  values (pg_temp.hid('proc'), pg_temp.hid('res'), pg_temp.hid('visit'), (select id from procedure_types limit 1), current_date - 2);
  insert into attachments (id, owner_type, owner_id, sub_folder, drive_file_id) values
    (pg_temp.hid('f_photo'), 'resident', pg_temp.hid('res'), 'Medical', 'harnessAllowPhoto01'),
    (pg_temp.hid('f_blood'), 'blood_test', pg_temp.hid('blood'), null, 'harnessAllowBlood01'),
    (pg_temp.hid('f_proc'), 'procedure', pg_temp.hid('proc'), null, 'harnessAllowProc001');
  -- a project and a maintenance file of our own, so A has something to refuse even on an emptied dev
  insert into attachments (owner_type, owner_id, drive_file_id) values
    ('project', gen_random_uuid(), 'harnessAllowProj001'),
    ('maintenance', gen_random_uuid(), 'harnessAllowMaint01');
  insert into translations (table_name, row_id, column_name, source_lang, target_lang, source_text)
  values ('residents', pg_temp.hid('res'), 'bio', 'en', 'th', 'Harness allow-list');
end $setup$;

create temp table harness_out (k text primary key, got text, want text);
grant all on harness_out to authenticated;

do $run$
declare
  d uuid := pg_temp.hid('doctor');
  v uuid := pg_temp.hid('volunteer');
  a uuid := pg_temp.hid('admin');
  owned text := format('(%L, %L, %L)', pg_temp.hid('f_photo'), pg_temp.hid('f_blood'), pg_temp.hid('f_proc'));
  ext text := '(''project'', ''maintenance'')';
  n_logins bigint;
begin
  -- A
  insert into harness_out values
    ('A read project+maintenance files', pg_temp.val(d, 'select count(*) from attachments where owner_type in ' || ext), '0'),
    ('A update project+maintenance files', pg_temp.try(d, 'update attachments set file_name = file_name where owner_type in ' || ext), '0'),
    ('A delete project+maintenance files', pg_temp.try(d, 'delete from attachments where owner_type in ' || ext), '0'),
    ('A insert a project file', pg_temp.try(d,
       'insert into attachments (owner_type, owner_id, drive_file_id) values (''project'', gen_random_uuid(), ''harnessAllowIns0001'')'), '-1'),
    ('A record_attachment on a project', pg_temp.try(d,
       'select record_attachment(''project'', gen_random_uuid(), ''harnessAllowRpc0001'')'), '-2');
  -- B
  insert into harness_out values
    ('B read own resident''s three files', pg_temp.val(d, 'select count(*) from attachments where id in ' || owned), '3'),
    ('B add a file on own blood test', pg_temp.try(d, format(
       'insert into attachments (owner_type, owner_id, drive_file_id) values (''blood_test'', %L, ''harnessAllowIns0002'')',
       pg_temp.hid('blood'))), '1'),
    ('B rename own blood-test file', pg_temp.try(d, format(
       'update attachments set file_name = ''x'' where id = %L', pg_temp.hid('f_blood'))), '1');
  -- C
  insert into harness_out values
    ('C read own resident''s translation', pg_temp.val(d, format(
       'select count(*) from translations where table_name = ''residents'' and row_id = %L', pg_temp.hid('res'))), '1'),
    ('C read other tables'' translations', pg_temp.val(d, 'select count(*) from translations where table_name <> ''residents'''), '0');
  -- D
  insert into harness_out values
    ('D doctor sees itself', pg_temp.val(d, format('select count(*) from app_users where id = %L', d)), '1'),
    ('D doctor sees its colleague', pg_temp.val(d, format('select count(*) from app_users where id = %L', pg_temp.hid('colleague'))), '1'),
    ('D doctor sees the other clinic''s doctor', pg_temp.val(d, format('select count(*) from app_users where id = %L', pg_temp.hid('stranger'))), '0'),
    ('D doctor sees the admin', pg_temp.val(d, format('select count(*) from app_users where id = %L', a)), '0'),
    ('D doctor sees any admin row', pg_temp.val(d, 'select count(*) from app_users where role_key = ''admin'''), '0');
  -- E: every login an admin sees, the volunteer sees too, still without emails
  n_logins := pg_temp.val(a, 'select count(*) from app_users');
  insert into harness_out values
    ('E volunteer sees every login', pg_temp.val(v, 'select count(*) from app_users'), n_logins::text),
    ('E volunteer sees no email', pg_temp.val(v, 'select count(*) from app_users where email is not null'), '0'),
    ('E admin still sees emails', (pg_temp.val(a, 'select count(*) from app_users where email is not null') > 0)::text, 'true');
end $run$;

do $o$ begin raise exception 'HARNESS-RESULT %', (select json_agg(harness_out order by k) from harness_out); end $o$;
rollback;`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
const m = /HARNESS-RESULT (.*)/s.exec(msg);
if (!m) {
  console.error(`no result (status ${res.status}): ${String(msg).slice(0, 2000)}`);
  process.exitCode = 2;
  throw new Error("no result");
}
const rows = JSON.parse(m[1].replace(/\nCONTEXT:[\s\S]*$/, ""));
let failed = 0;
for (const r of rows) {
  const ok = String(r.got) === String(r.want);
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${r.k.padEnd(44)} got ${r.got}, want ${r.want}`);
}
console.log(failed ? `\n${failed} of ${rows.length} failed` : `\nall ${rows.length} held`);
process.exitCode = failed ? 1 : 0;
