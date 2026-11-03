// Who may read and who may change the clinics list, asserted against the LIVE schema on DEV, in
// one transaction that ends in a deliberate `raise exception` carrying the evidence, so nothing commits.
//
//   node scripts/check-clinics-readonly.mjs     (from the repo root; dev only)
//
// REWRITTEN 2026-11-03 (docs/decisions/2026-11-03-clinic-harness-rewrite.md). It used to assert a
// per-clinic model: a "doctor" login that current_user_clinic_ids() placed at a clinic could read
// clinics but not write them. 0264 made current_user_clinic_ids() a constant '{}' and dropped the
// doctor_read_clinics policy; every policy on clinics now asks one card, clinics.list (read for
// select, edit for insert/update/delete). So this asserts the card, with harness roles holding
// exactly the cells under test, never a role named doctor or management:
//   A  a login holding clinics.list at read reads every clinic
//   B  ... and cannot insert, update or delete one (the Data API path 0105 closed)
//   C  pg_policies: every policy on clinics asks has_permission('clinics.list') and nothing
//      narrows by clinic or by a role key
//   D  a login holding clinics.list at edit inserts, updates and deletes; an admin updates; a login
//      holding a different card reads none and writes none
//   E  the service role still writes
//
// Exits 0 when every assertion held. Writes nothing even on success.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const { runHarness } = await import(pathToFileURL(join(root, "scripts/lib/rollback-harness.mjs")).href);
const { exitWith } = await import(pathToFileURL(join(root, "scripts/lib/exit.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;

-- Run one statement as a login (null = service role). Returns the row
-- count, or -1 if RLS refused it outright.
create function pg_temp.try(p_uid uuid, p_sql text) returns bigint language plpgsql as $f$
declare v bigint;
begin
  if p_uid is null then
    perform set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
    set local role service_role;
  else
    perform set_config('request.jwt.claims',
      json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
    set local role authenticated;
  end if;
  begin
    execute p_sql;
    get diagnostics v = row_count;
  exception when insufficient_privilege then v := -1;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

create temp table harness_ids (who text primary key, id uuid not null);
insert into harness_ids values
  ('reader', gen_random_uuid()), ('editor', gen_random_uuid()), ('other', gen_random_uuid()), ('admin', gen_random_uuid()),
  ('clinic_a', gen_random_uuid()), ('clinic_b', gen_random_uuid()), ('new_clinic', gen_random_uuid());
grant select on harness_ids to authenticated, service_role;

do $setup$
declare r record; v_role uuid;
begin
  insert into clinics (id, name)
  select id, 'Harness ' || who from harness_ids where who in ('clinic_a', 'clinic_b');
  for r in select * from harness_ids where who in ('reader', 'editor', 'other', 'admin') loop
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (r.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-clinics-ro-' || r.who || '-' || r.id || '@example.invalid',
            '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || r.who), now(), now());
  end loop;
  -- Three harness roles, each holding exactly the cell under test.
  insert into roles (key, name, kind) values ('harness_clinics_ro_reader', 'Harness reader', 'custom') returning id into v_role;
  insert into role_permissions (role_id, activity, level) values (v_role, 'clinics.list', 1);
  insert into user_roles (user_id, role_id) select id, v_role from harness_ids where who = 'reader';
  insert into roles (key, name, kind) values ('harness_clinics_ro_editor', 'Harness editor', 'custom') returning id into v_role;
  insert into role_permissions (role_id, activity, level) values (v_role, 'clinics.list', 2);
  insert into user_roles (user_id, role_id) select id, v_role from harness_ids where who = 'editor';
  insert into roles (key, name, kind) values ('harness_clinics_ro_other', 'Harness other', 'custom') returning id into v_role;
  insert into role_permissions (role_id, activity, level) values (v_role, 'resident.record', 1);
  insert into user_roles (user_id, role_id) select id, v_role from harness_ids where who = 'other';
  insert into user_roles (user_id, role_id) select h.id, ro.id from harness_ids h join roles ro on ro.key = 'admin' where h.who = 'admin';
end $setup$;

do $h$
declare
  v_reader uuid := (select id from harness_ids where who = 'reader');
  v_editor uuid := (select id from harness_ids where who = 'editor');
  v_other uuid := (select id from harness_ids where who = 'other');
  v_admin uuid := (select id from harness_ids where who = 'admin');
  v_a uuid := (select id from harness_ids where who = 'clinic_a');
  v_b uuid := (select id from harness_ids where who = 'clinic_b');
  v_new uuid := (select id from harness_ids where who = 'new_clinic');
  v_total bigint := (select count(*) from clinics);
  v_bad text;
  n bigint;
  v_report text := '';
begin
  -- A: read at clinics.list reads every clinic, whichever clinic it might once have been "at".
  n := pg_temp.try(v_reader, 'select * from clinics');
  if n <> v_total then raise exception 'HARNESS-FAIL A: clinics.list reader read % of % clinics', n, v_total; end if;
  v_report := v_report || format('A: read-level reader reads %s/%s clinics | ', n, v_total);

  -- B: read does not write.
  n := pg_temp.try(v_reader, format('insert into clinics (id, name) values (%L, ''Reader-made clinic'')', v_new));
  if n <> -1 then raise exception 'HARNESS-FAIL B: reader insert gave %', n; end if;
  n := pg_temp.try(v_reader, format('update clinics set name = ''Renamed by reader'' where id = %L', v_a));
  if n <> 0 then raise exception 'HARNESS-FAIL B: reader update touched % rows', n; end if;
  n := pg_temp.try(v_reader, 'update clinics set name = name');
  if n <> 0 then raise exception 'HARNESS-FAIL B: reader blanket update touched % rows', n; end if;
  n := pg_temp.try(v_reader, format('delete from clinics where id in (%L, %L)', v_a, v_b));
  if n <> 0 then raise exception 'HARNESS-FAIL B: reader delete touched % rows', n; end if;
  if (select name from clinics where id = v_a) <> 'Harness clinic_a' then raise exception 'HARNESS-FAIL B: a clinic was renamed'; end if;
  v_report := v_report || 'B: reader insert refused, update 0, delete 0 | ';

  -- C: the policies. Every one asks clinics.list and nothing else decides it.
  select string_agg(policyname || ':' || cmd, ', ') into v_bad
  from pg_policies
  where schemaname = 'public' and tablename = 'clinics'
    and (coalesce(qual, '') || coalesce(with_check, '')) !~ 'has_permission[(]''clinics[.]list''';
  if v_bad is not null then raise exception 'HARNESS-FAIL C: policy on clinics not asking clinics.list: %', v_bad; end if;
  select string_agg(policyname, ', ') into v_bad
  from pg_policies
  where schemaname = 'public' and tablename = 'clinics'
    and (coalesce(qual, '') || coalesce(with_check, '')) ~ ('''doctor''|current_user_clinic_ids|is_clinic_login|r[.]key');
  if v_bad is not null then raise exception 'HARNESS-FAIL C: clinics policy narrows by clinic or role: %', v_bad; end if;
  v_report := v_report || format('C: all %s policies ask clinics.list only | ', (select count(*) from pg_policies where schemaname = 'public' and tablename = 'clinics'));

  -- D: edit writes; admin writes; another card neither reads nor writes.
  n := pg_temp.try(v_editor, format('insert into clinics (id, name) values (%L, ''Editor clinic'')', v_new));
  if n <> 1 then raise exception 'HARNESS-FAIL D: editor insert gave %', n; end if;
  n := pg_temp.try(v_editor, format('update clinics set contact_info = ''Edited'' where id = %L', v_new));
  if n <> 1 then raise exception 'HARNESS-FAIL D: editor update gave %', n; end if;
  n := pg_temp.try(v_admin, format('update clinics set contact_info = ''Edited again'' where id = %L', v_new));
  if n <> 1 then raise exception 'HARNESS-FAIL D: admin update gave %', n; end if;
  n := pg_temp.try(v_editor, format('delete from clinics where id = %L', v_new));
  if n <> 1 then raise exception 'HARNESS-FAIL D: editor delete gave %', n; end if;
  n := pg_temp.try(v_other, 'select * from clinics');
  if n <> 0 then raise exception 'HARNESS-FAIL D: a login without clinics.list read % clinics', n; end if;
  n := pg_temp.try(v_other, format('update clinics set name = ''x'' where id = %L', v_a));
  if n <> 0 then raise exception 'HARNESS-FAIL D: a login without clinics.list updated % rows', n; end if;
  v_report := v_report || 'D: edit-level insert/update/delete 1, admin update 1, a login without the card reads 0 and updates 0 | ';

  -- E: the service role.
  n := pg_temp.try(null, format('update clinics set contact_info = ''Service'' where id = %L', v_b));
  if n <> 1 then raise exception 'HARNESS-FAIL E: service update gave %', n; end if;
  v_report := v_report || 'E: service role update 1';

  raise exception '%', format('HARNESS-OK clinics follow the clinics.list card, live schema | %s', v_report);
end;
$h$;
rollback;
`;

const ok = await runHarness(ref, env, "clinics-readonly", sql);
await exitWith(ok ? 0 : 1);
