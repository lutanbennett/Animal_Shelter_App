// A doctor login reads the shelter's clinics but cannot change one. Asserted
// against the LIVE schema on DEV, in one transaction that ends in a deliberate
// `raise exception` carrying the evidence — so nothing can commit.
//
//   node scripts/check-clinics-readonly.mjs     (from the repo root; dev only)
//
// Was check-vets-readonly.mjs, which replayed 0105 (vet_rw_vets became
// vet_read_vets). 0172 renamed the table (vets -> clinics), the role (vet ->
// doctor) and the policy (doctor_read_clinics), so a replay of 0105 now names a
// table that is only a read-only stand-in view. It asserts the live schema
// instead (docs/decisions/2026-10-02-replay-or-assert-live.md); the "before the
// file a vet could rename a clinic" step went with the replay.
//
// It checks
//   A  a doctor login still reads every clinic — the clinic visit forms need the names
//   B  a doctor login cannot insert, update or delete a clinic, their own included,
//      through their own JWT — the Data API path 0105 closed
//   C  pg_policies: every policy on clinics a clinic login meets (is_clinic_login()
//      or 'doctor') is a SELECT, and doctor_read_clinics is there
//   D  management and admin still insert, update and delete, as
//      /management/clinics does; a login holding the retired Staff role's cells (a
//      harness custom role, since 0173 refuses a live staff login) still only reads;
//      a volunteer reads none
//   E  the service role still writes
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
  ('doctor', gen_random_uuid()), ('mgmt', gen_random_uuid()), ('admin', gen_random_uuid()),
  ('clerk', gen_random_uuid()), ('volunteer', gen_random_uuid()), ('doctor_row', gen_random_uuid()),
  ('own_clinic', gen_random_uuid()), ('other_clinic', gen_random_uuid()), ('new_clinic', gen_random_uuid());
grant select on harness_ids to authenticated, service_role;

do $setup$
declare r record;
begin
  insert into clinics (id, name)
  select id, 'Harness ' || who from harness_ids where who in ('own_clinic', 'other_clinic');
  for r in select * from harness_ids where who in ('doctor', 'mgmt', 'admin', 'clerk', 'volunteer') loop
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (r.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-clinics-ro-' || r.who || '-' || r.id || '@example.invalid',
            '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || r.who), now(), now());
  end loop;
  insert into user_roles (user_id, role) select id, 'doctor' from harness_ids where who = 'doctor';
  -- 0127/0172: a doctor login's clinics are its linked doctor's active doctor_clinics links.
  insert into doctors (id, name, user_id)
  select (select id from harness_ids where who = 'doctor_row'), 'Harness doctor', id from harness_ids where who = 'doctor';
  insert into doctor_clinics (clinic_id, doctor_id, active)
  values ((select id from harness_ids where who = 'own_clinic'), (select id from harness_ids where who = 'doctor_row'), true);
  insert into user_roles (user_id, role)
  select id, case who when 'mgmt' then 'management' else who end::app_role
  from harness_ids where who in ('mgmt', 'admin', 'volunteer');
  -- clerk: Staff was this login until 0173 retired it; a custom role carrying its cells reaches the same path
  insert into roles (key, name, kind, legacy_role) values ('harness_clinics_ro_clerk', 'Harness clerk', 'custom', 'management');
  insert into role_permissions (role_id, activity, level)
    select (select id from roles where key = 'harness_clinics_ro_clerk'), rp.activity, rp.level
      from role_permissions rp join roles s on s.id = rp.role_id where s.key = 'staff';
  insert into user_roles (user_id, role_id, role)
    select (select id from harness_ids where who = 'clerk'), id, legacy_role from roles where key = 'harness_clinics_ro_clerk';
end $setup$;

do $h$
declare
  v_doc uuid := (select id from harness_ids where who = 'doctor');
  v_mgmt uuid := (select id from harness_ids where who = 'mgmt');
  v_admin uuid := (select id from harness_ids where who = 'admin');
  v_clerk uuid := (select id from harness_ids where who = 'clerk');
  v_vol uuid := (select id from harness_ids where who = 'volunteer');
  v_own uuid := (select id from harness_ids where who = 'own_clinic');
  v_other uuid := (select id from harness_ids where who = 'other_clinic');
  v_new uuid := (select id from harness_ids where who = 'new_clinic');
  v_total bigint := (select count(*) from clinics);
  v_bad text;
  n bigint;
  v_report text := '';
begin
  -- The harness login really is a doctor at its clinic, so B's refusals are RLS, not a login with no clinic.
  perform set_config('request.jwt.claims', json_build_object('sub', v_doc, 'role', 'authenticated')::text, true);
  if not (v_own = any (public.current_user_clinic_ids())) then
    raise exception 'HARNESS-FAIL setup: the doctor login is not at its own clinic (current_user_clinic_ids)';
  end if;
  perform set_config('request.jwt.claims', '', true);

  -- A: a doctor login reads every clinic.
  n := pg_temp.try(v_doc, 'select * from clinics');
  if n <> v_total then raise exception 'HARNESS-FAIL A: doctor read % of % clinics', n, v_total; end if;
  v_report := v_report || format('A: doctor reads %s/%s clinics | ', n, v_total);

  -- B: a doctor login cannot write, their own clinic included.
  n := pg_temp.try(v_doc, format('insert into clinics (id, name) values (%L, ''Doctor-made clinic'')', v_new));
  if n <> -1 then raise exception 'HARNESS-FAIL B: doctor insert gave %', n; end if;
  n := pg_temp.try(v_doc, format('update clinics set name = ''Renamed by doctor'' where id = %L', v_other));
  if n <> 0 then raise exception 'HARNESS-FAIL B: doctor update of another clinic touched % rows', n; end if;
  n := pg_temp.try(v_doc, format('update clinics set name = ''Renamed by doctor'' where id = %L', v_own));
  if n <> 0 then raise exception 'HARNESS-FAIL B: doctor update of own clinic touched % rows', n; end if;
  n := pg_temp.try(v_doc, 'update clinics set name = name');
  if n <> 0 then raise exception 'HARNESS-FAIL B: doctor blanket update touched % rows', n; end if;
  n := pg_temp.try(v_doc, format('delete from clinics where id in (%L, %L)', v_own, v_other));
  if n <> 0 then raise exception 'HARNESS-FAIL B: doctor delete touched % rows', n; end if;
  if (select name from clinics where id = v_other) <> 'Harness other_clinic' then
    raise exception 'HARNESS-FAIL B: other clinic was renamed';
  end if;
  v_report := v_report || 'B: doctor insert refused, update 0 (own, other, all), delete 0 | ';

  -- C: every policy on clinics a clinic login meets is a SELECT.
  select string_agg(policyname || ':' || cmd, ', ') into v_bad
  from pg_policies
  where schemaname = 'public' and tablename = 'clinics' and cmd <> 'SELECT'
    and (coalesce(qual, '') || coalesce(with_check, '')) ~ ('is_clinic_login|''doctor''|current_user_clinic_ids');
  if v_bad is not null then raise exception 'HARNESS-FAIL C: doctor write policy on clinics: %', v_bad; end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'clinics'
                  and policyname = 'doctor_read_clinics' and cmd = 'SELECT') then
    raise exception 'HARNESS-FAIL C: doctor_read_clinics missing';
  end if;
  v_report := v_report || 'C: only doctor_read_clinics (SELECT) for clinic logins | ';

  -- D: management and admin still write; the clerk (Staff's cells) only reads; a volunteer reads none.
  n := pg_temp.try(v_mgmt, format('insert into clinics (id, name) values (%L, ''Mgmt clinic'')', v_new));
  if n <> 1 then raise exception 'HARNESS-FAIL D: management insert gave %', n; end if;
  n := pg_temp.try(v_mgmt, format('update clinics set contact_info = ''Edited'' where id = %L', v_new));
  if n <> 1 then raise exception 'HARNESS-FAIL D: management update gave %', n; end if;
  n := pg_temp.try(v_admin, format('update clinics set contact_info = ''Edited again'' where id = %L', v_new));
  if n <> 1 then raise exception 'HARNESS-FAIL D: admin update gave %', n; end if;
  n := pg_temp.try(v_mgmt, format('delete from clinics where id = %L', v_new));
  if n <> 1 then raise exception 'HARNESS-FAIL D: management delete gave %', n; end if;
  n := pg_temp.try(v_clerk, 'select * from clinics');
  if n <> v_total then raise exception 'HARNESS-FAIL D: clerk (Staff cells) read % of %', n, v_total; end if;
  n := pg_temp.try(v_vol, 'select * from clinics');
  if n <> 0 then raise exception 'HARNESS-FAIL D: volunteer read % clinics (0134 took them away)', n; end if;
  n := pg_temp.try(v_clerk, format('update clinics set name = ''x'' where id = %L', v_other));
  if n <> 0 then raise exception 'HARNESS-FAIL D: clerk (Staff cells) update touched % rows', n; end if;
  v_report := v_report || 'D: management insert/update/delete 1, admin update 1, clerk (Staff cells) read all, volunteer none (0134), clerk update 0 | ';

  -- E: the service role.
  n := pg_temp.try(null, format('update clinics set contact_info = ''Service'' where id = %L', v_other));
  if n <> 1 then raise exception 'HARNESS-FAIL E: service update gave %', n; end if;
  v_report := v_report || 'E: service role update 1';

  raise exception '%', format('HARNESS-OK clinics read-only for doctor logins, live schema | %s', v_report);
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
