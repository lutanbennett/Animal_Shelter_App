// Rollback harness for 0090_standard_diet_functions.sql against DEV only.
// One transaction: the migration (twice), harness logins, calls to
// set_standard_diet() and record_intake() as each of them, then a
// deliberate `raise exception` carrying the evidence — so nothing can
// commit. Works before and after 0090 is applied.
//
//   node scripts/check-standard-diet-functions.mjs     (repo root; dev only)
//
// Exits 0 when every assertion held. Writes nothing.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync(join(root, "supabase/migrations/0090_standard_diet_functions.sql"), "utf8");

const intakeSig = `record_intake(
  text, date, text, text, text, text, text, numeric, text, text, text, text,
  boolean, boolean, uuid, text, uuid, text, numeric, resident_size, uuid,
  compatibility, compatibility, compatibility, energy_level, text, boolean, integer
)`;

const sql = `
begin;

-- record_intake's grants before the file runs: create or replace must keep them.
create temp table g as
select r.rolname, has_function_privilege(r.rolname, '${intakeSig}', 'execute') as can
  from pg_roles r where r.rolname in ('anon', 'authenticated', 'service_role');

${migration}
-- a second run of the whole file must be harmless
${migration}

create temp table who (who text primary key, uid uuid);
insert into who values
  ('management', gen_random_uuid()), ('admin', gen_random_uuid()),
  ('staff', gen_random_uuid()), ('roleless', gen_random_uuid()), ('anon', null);
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'harness-0090-' || who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
  from who where uid is not null;
insert into user_roles (user_id, role)
select uid, who::app_role from who where who in ('management', 'admin', 'staff');
grant select on who to authenticated, anon;

-- Run a SQL expression returning text as a login (null uid = anon).
-- Returns its value, or 'ERR <sqlstate> <message>'.
create function pg_temp.as_login(p_who text, p_expr text) returns text language plpgsql as $f$
declare v_uid uuid; v text;
begin
  select uid into v_uid from who where who = p_who;
  if v_uid is null then
    perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
    set local role anon;
  else
    perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
    set local role authenticated;
  end if;
  begin
    execute 'select (' || p_expr || ')::text' into v;
  exception when others then v := 'ERR ' || sqlstate || ' ' || sqlerrm;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

do $h$
declare
  v_std uuid; v_other uuid; v_res uuid;
  v text; v_n bigint; v_residents bigint;
  v_report text := '';
begin
  select id into v_std from diet_types where is_standard;
  select id into v_other from diet_types where not is_standard order by name limit 1;
  if v_std is null or v_other is null then
    raise exception 'FAIL setup: need a standard and another diet type in dev';
  end if;

  -- A. management moves the standard: one standard, the new one
  v := pg_temp.as_login('management', format('(set_standard_diet(%L)).name', v_other));
  if v like 'ERR%' then raise exception 'FAIL A: management could not move the standard: %', v; end if;
  select count(*) into v_n from diet_types where is_standard;
  if v_n <> 1 or not exists (select 1 from diet_types where id = v_other and is_standard) then
    raise exception 'FAIL A: after the move, % standard(s), new one flagged: %', v_n,
      exists (select 1 from diet_types where id = v_other and is_standard);
  end if;
  v_report := v_report || 'A management moved it to "' || v || '", one standard | ';

  -- B. admin sets the same one again: no-op, still one
  v := pg_temp.as_login('admin', format('(set_standard_diet(%L)).id', v_other));
  if v like 'ERR%' or (select count(*) from diet_types where is_standard) <> 1 then
    raise exception 'FAIL B: re-setting the standard: %', v;
  end if;
  v_report := v_report || 'B admin re-set it, still one | ';

  -- C. unknown id: refused, and the clear is rolled back with it
  v := pg_temp.as_login('management', format('(set_standard_diet(%L)).id', gen_random_uuid()));
  if v not like 'ERR P0001 That diet type was not found%' then raise exception 'FAIL C: unknown id gave %', v; end if;
  if not exists (select 1 from diet_types where id = v_other and is_standard) then
    raise exception 'FAIL C: unknown id cleared the standard';
  end if;
  v_report := v_report || 'C unknown id refused, standard kept | ';

  -- D. null: refused
  v := pg_temp.as_login('management', '(set_standard_diet(null)).id');
  if v not like 'ERR P0001 Choose a diet type%' then raise exception 'FAIL D: null gave %', v; end if;
  v_report := v_report || 'D null refused | ';

  -- E. staff and role-less refused by the guard, anon by the grant; nothing moved
  foreach v in array array['staff', 'roleless', 'anon'] loop
    declare r text := pg_temp.as_login(v, format('(set_standard_diet(%L)).id', v_std));
    begin
      if (v = 'anon' and r not like 'ERR 42501%')
         or (v <> 'anon' and r not like 'ERR P0001 Not authorized%') then
        raise exception 'FAIL E: % gave %', v, r;
      end if;
    end;
  end loop;
  if not exists (select 1 from diet_types where id = v_other and is_standard) then
    raise exception 'FAIL E: a refused caller moved the standard';
  end if;
  v_report := v_report || 'E staff/role-less refused by the guard, anon by the grant | ';

  -- F. record_intake with no diet: refused, no resident written
  select count(*) into v_residents from residents;
  v := pg_temp.as_login('staff', '(record_intake(p_name => ''Harness 0090 none'', p_intake_date => shelter_today())).id');
  if v not like 'ERR P0001 Choose a diet for the new resident%' then raise exception 'FAIL F: null diet gave %', v; end if;
  if (select count(*) from residents) <> v_residents then raise exception 'FAIL F: a resident was written'; end if;
  v_report := v_report || 'F intake with no diet refused, nothing written | ';

  -- G. record_intake with a diet: resident plus one diet row from the intake date
  v := pg_temp.as_login('staff', format(
    '(record_intake(p_name => ''Harness 0090 fed'', p_intake_date => shelter_today() - 2, p_diet_type_id => %L)).id',
    v_std));
  if v like 'ERR%' then raise exception 'FAIL G: intake with a diet gave %', v; end if;
  v_res := v::uuid;
  select count(*) into v_n from resident_diets
   where resident_id = v_res and diet_type_id = v_std and start_date = shelter_today() - 2 and end_date is null;
  if v_n <> 1 then raise exception 'FAIL G: % diet row(s) for the new resident', v_n; end if;
  v_report := v_report || 'G staff intake with a diet: resident + one diet row from intake date | ';

  -- H. grants: set_standard_diet closed to anon; record_intake's unchanged
  if has_function_privilege('anon', 'set_standard_diet(uuid)', 'execute')
     or not has_function_privilege('authenticated', 'set_standard_diet(uuid)', 'execute')
     or not has_function_privilege('service_role', 'set_standard_diet(uuid)', 'execute') then
    raise exception 'FAIL H: set_standard_diet grants not anon no / authenticated yes / service_role yes';
  end if;
  select count(*) into v_n from g
   where can is distinct from has_function_privilege(rolname, '${intakeSig}', 'execute');
  if v_n <> 0 then raise exception 'FAIL H: record_intake grants changed for % role(s)', v_n; end if;
  v_report := v_report || 'H grants: set_standard_diet anon no, authenticated/service_role yes; record_intake unchanged ('
    || (select string_agg(rolname || '=' || can, ', ' order by rolname) from g) || ')';

  raise exception 'HARNESS-OK file ran twice | %', v_report;
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
