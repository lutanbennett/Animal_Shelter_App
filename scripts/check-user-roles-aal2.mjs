// Rollback harness for *_user_roles_require_aal2.sql against DEV only. One
// transaction: the migration (twice), then what each kind of session can do
// to user_roles, then a deliberate `raise exception` carrying the evidence —
// so nothing can commit. Safe to run before or after the file is applied.
//
//   node scripts/check-user-roles-aal2.mjs     (from the repo root; dev only)
//
// The question it answers is the one that matters before 2-step verification
// exists: does the policy lock an admin out today? So it checks
//   A  an admin at aal1 still reads user_roles and still resolves as admin
//      (current_user_role()), i.e. every other page and policy is unaffected
//   B  an admin at aal1 cannot insert, update or delete a user_roles row
//      through their own JWT — the Data API path the policy closes
//   C  an admin at aal2 can, so the policy is satisfiable once TOTP exists
//   D  staff at aal2 still cannot — aal2 adds a requirement, grants nothing
//   E  the service role, which every /admin/security action and
//      scripts/bootstrap-admin.mjs use, inserts, updates and deletes as
//      before
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
const file = readdirSync(dir).find((f) => /^\d+_user_roles_require_aal2\.sql$/.test(f));
if (!file) throw new Error("no *_user_roles_require_aal2.sql in supabase/migrations");
const migration = readFileSync(join(dir, file), "utf8");

const sql = `
begin;
${migration}
${migration}

-- Run one statement as a login at an assurance level (null = service role).
-- Returns the row count, or -1 if RLS refused it outright.
create function pg_temp.try(p_uid uuid, p_aal text, p_sql text) returns bigint language plpgsql as $f$
declare v bigint;
begin
  if p_uid is null then
    perform set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
    set local role service_role;
  else
    perform set_config('request.jwt.claims',
      json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', p_aal)::text, true);
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

create function pg_temp.role_as(p_uid uuid, p_aal text) returns text language plpgsql as $f$
declare v text;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', p_aal)::text, true);
  set local role authenticated;
  v := current_user_role()::text;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

do $h$
declare
  v_admin uuid := gen_random_uuid();
  v_staff uuid := gen_random_uuid();
  v_target uuid := gen_random_uuid();
  v_new uuid := gen_random_uuid();
  v_real int := (select count(*) from user_roles where role = 'admin' and archived_at is null);
  r record;
  n bigint;
  v_report text := '';
begin
  if v_real = 0 then raise exception 'HARNESS-FAIL: dev has no live admin to compare with'; end if;

  for r in select * from (values (v_admin, 'admin'), (v_staff, 'staff'), (v_target, 'target'), (v_new, 'new')) t(uid, who) loop
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (r.uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-aal2-' || r.who || '-' || r.uid || '@example.invalid',
            '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || r.who), now(), now());
  end loop;
  insert into user_roles (user_id, role) values (v_admin, 'admin'), (v_staff, 'staff'), (v_target, 'volunteer');

  -- A: an admin at aal1 is still an admin everywhere, and reads user_roles.
  if pg_temp.role_as(v_admin, 'aal1') is distinct from 'admin' then
    raise exception 'HARNESS-FAIL A: admin at aal1 resolves as %', pg_temp.role_as(v_admin, 'aal1');
  end if;
  n := pg_temp.try(v_admin, 'aal1', 'select * from user_roles');
  if n < v_real + 3 then raise exception 'HARNESS-FAIL A: admin at aal1 read % user_roles rows', n; end if;
  v_report := v_report || format('A: admin aal1 resolves admin, reads %s rows | ', n);

  -- B: admin at aal1 cannot write through their own JWT.
  n := pg_temp.try(v_admin, 'aal1', format('insert into user_roles (user_id, role) values (%L, ''staff'')', v_new));
  if n <> -1 then raise exception 'HARNESS-FAIL B: aal1 insert gave %', n; end if;
  n := pg_temp.try(v_admin, 'aal1', format('update user_roles set role = ''admin'' where user_id = %L', v_target));
  if n <> 0 then raise exception 'HARNESS-FAIL B: aal1 update touched % rows', n; end if;
  n := pg_temp.try(v_admin, 'aal1', format('delete from user_roles where user_id = %L', v_target));
  if n <> 0 then raise exception 'HARNESS-FAIL B: aal1 delete touched % rows', n; end if;
  -- A session with no aal claim at all is refused the same way.
  n := pg_temp.try(v_admin, null, format('update user_roles set role = ''admin'' where user_id = %L', v_target));
  if n <> 0 then raise exception 'HARNESS-FAIL B: no-aal update touched % rows', n; end if;
  v_report := v_report || 'B: admin aal1 insert refused, update 0, delete 0; no aal claim update 0 | ';

  -- C: admin at aal2 can.
  n := pg_temp.try(v_admin, 'aal2', format('insert into user_roles (user_id, role) values (%L, ''staff'')', v_new));
  if n <> 1 then raise exception 'HARNESS-FAIL C: aal2 insert gave %', n; end if;
  n := pg_temp.try(v_admin, 'aal2', format('update user_roles set role = ''staff'' where user_id = %L', v_target));
  if n <> 1 then raise exception 'HARNESS-FAIL C: aal2 update gave %', n; end if;
  n := pg_temp.try(v_admin, 'aal2', format('delete from user_roles where user_id = %L', v_new));
  if n <> 1 then raise exception 'HARNESS-FAIL C: aal2 delete gave %', n; end if;
  v_report := v_report || 'C: admin aal2 insert 1, update 1, delete 1 | ';

  -- D: staff at aal2 still cannot.
  n := pg_temp.try(v_staff, 'aal2', format('insert into user_roles (user_id, role) values (%L, ''admin'')', v_new));
  if n <> -1 then raise exception 'HARNESS-FAIL D: staff aal2 insert gave %', n; end if;
  n := pg_temp.try(v_staff, 'aal2', format('update user_roles set role = ''admin'' where user_id = %L', v_staff));
  if n <> 0 then raise exception 'HARNESS-FAIL D: staff aal2 update touched % rows', n; end if;
  v_report := v_report || 'D: staff aal2 insert refused, update 0 | ';

  -- E: the service role, as /admin/security and bootstrap-admin use it.
  n := pg_temp.try(null, null, format('insert into user_roles (user_id, role) values (%L, ''admin'')', v_new));
  if n <> 1 then raise exception 'HARNESS-FAIL E: service insert gave %', n; end if;
  n := pg_temp.try(null, null, format('insert into user_roles (user_id, role) values (%L, ''volunteer'') on conflict (user_id) do update set role = excluded.role', v_target));
  if n <> 1 then raise exception 'HARNESS-FAIL E: service upsert gave %', n; end if;
  n := pg_temp.try(null, null, format('update user_roles set archived_at = now() where user_id = %L', v_target));
  if n <> 1 then raise exception 'HARNESS-FAIL E: service archive gave %', n; end if;
  n := pg_temp.try(null, null, format('update user_roles set archived_at = null where user_id = %L', v_target));
  if n <> 1 then raise exception 'HARNESS-FAIL E: service restore gave %', n; end if;
  n := pg_temp.try(null, null, format('delete from user_roles where user_id = %L', v_new));
  if n <> 1 then raise exception 'HARNESS-FAIL E: service delete gave %', n; end if;
  v_report := v_report || 'E: service role insert, upsert, archive, restore, delete all 1';

  raise exception '%', format('HARNESS-OK %s ran twice | %s real live admin(s) on dev | %s', ${JSON.stringify(file).replace(/"/g, "'")}, v_real, v_report);
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
