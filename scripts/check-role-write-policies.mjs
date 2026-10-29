// A table can get a select policy and a form in the app, and nothing notices
// that the write policy was never written (docs/decisions/2026-10-03-blood-test-write-policies.md).
// That is how staff could open "Log blood test", fill it in and be answered
// "You don't have permission to do that": 0001 gave staff read on blood_tests,
// the manual and the UI offered the write, and 130 migrations went by. A
// dry run found it. This finds it first.
//
// Against the DEV database, live schema (as check-doctor-own-clinic-writes.mjs
// does; nothing is committed). Two parts:
//
//   1  OFFERED — the writes the app puts in front of someone. Each row is a table
//      and a command; every one must have a permissive policy for that command
//      (a FOR ALL policy covers every command). Add a row when you add a form.
//      THIS PART NO LONGER ASKS WHICH ROLES. It once read role names out of the
//      policy text ('<role>'::app_role), which the has_permission() conversions
//      removed; the 14 failures on dev were that reading, not a missing policy.
//      Which role holds which cell is check-permission-parity's job (cells against
//      the paper); that is where the question now lives. What this part keeps is the
//      bug it was written for: a form offered and no write policy at all.
//   2  (retired) "Management mirrors staff", 0039's rule. Staff is an archived role
//      and holds no cells, so it compared an empty set and could not fail; it has
//      been vacuous since 0173. Removed with its advisory ("tables only staff can read").
//      docs/decisions/2026-10-13-red-harnesses.md.
//   3  Real rows, one rolled-back transaction, each role's own JWT: management
//      inserts and updates a blood test and files a scan on it; it
//      cannot delete one; a volunteer can read it and write nothing to it. Proves the policy works, not just exists.
//
//   node scripts/check-role-write-policies.mjs     (from the repo root; dev only)
//
// Exits 0 when every assertion held.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

// Part 1. [table, command] for each write the app offers.
const OFFERED = [
  ["blood_tests", "INSERT"], ["blood_tests", "UPDATE"],
  ["procedures", "INSERT"], ["procedures", "UPDATE"],
  ["prescriptions", "INSERT"], ["prescriptions", "UPDATE"],
  ["immunization_records", "INSERT"], ["immunization_records", "UPDATE"],
  ["clinic_visits", "INSERT"], ["clinic_visits", "UPDATE"],
  ["weight", "INSERT"], ["weight", "UPDATE"],
  ["resident_diets", "INSERT"], ["resident_diets", "UPDATE"],
];

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  let body = text;
  try { body = JSON.parse(text); } catch {}
  return { status: res.status, body };
}

// One row per (table, command) that a permissive policy covers. FOR ALL expands to the four commands.
const COVERED = `
  select distinct p.tablename, c.cmd
  from pg_policies p
  cross join lateral (select unnest(case when p.cmd = 'ALL'
    then array['SELECT','INSERT','UPDATE','DELETE'] else array[p.cmd] end) as cmd) c
  where p.schemaname = 'public' and p.permissive = 'PERMISSIVE'`;

let failures = 0;
const fail = (msg) => { failures++; console.log(`FAIL  ${msg}`); };

const cov = await query(COVERED);
if (cov.status !== 200 && cov.status !== 201) throw new Error(`policy query failed: ${cov.status} ${JSON.stringify(cov.body)}`);
if (!Array.isArray(cov.body)) throw new Error(`policy query failed: ${JSON.stringify(cov.body)}`);
const has = new Set(cov.body.map((r) => `${r.tablename}|${r.cmd}`));

// 1
for (const [table, cmd] of OFFERED) {
  if (!has.has(`${table}|${cmd}`)) fail(`${table} ${cmd}: the app offers it but no policy covers it`);
}
console.log(`1  offered writes: ${OFFERED.length} checked (a policy covers each; which card grants it is part 3 below)`);

// 3
const sql = `
begin;

create function pg_temp.try(p_uid uuid, p_sql text) returns bigint language plpgsql as $f$
declare v bigint;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  begin
    execute p_sql;
    get diagnostics v = row_count;
  exception
    when insufficient_privilege then v := -1;
    when others then v := -2;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

do $h$
declare
  v_res uuid := gen_random_uuid();
  v_type uuid := (select id from blood_test_types limit 1);
  v_bt uuid := gen_random_uuid();
  v_who text;
  v_uid uuid;
  v_role uuid;
  n bigint;
  v_report text := '';
begin
  insert into residents (id, name, species) values (v_res, 'Harness blood', 'Dog');
  insert into blood_tests (id, resident_id, blood_test_type_id, date) values (v_bt, v_res, v_type, current_date - 1);

  -- Card-shaped: three logins, each holding exactly the cards named and nothing else. The question is
  -- whether the write policies on blood_tests answer to the card (medical.blood_tests at edit), not to
  -- any role. Admin sits outside the card system and is not asked here.
  foreach v_who in array array['medical_records', 'view_medical', 'none'] loop
    v_uid := gen_random_uuid();
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-blood-' || v_who || '-' || v_uid || '@example.invalid',
            '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || v_who), now(), now());
    insert into roles (key, name, kind, home_path) values ('harness_cards_' || replace(v_uid::text, '-', ''), 'Harness ' || v_who, 'custom', '/home')
      returning id into v_role;
    if v_who <> 'none' then perform set_role_cards(v_role, array[v_who]); end if;
    insert into user_roles (user_id, role_id) values (v_uid, v_role);

    n := pg_temp.try(v_uid, format('insert into blood_tests (resident_id, blood_test_type_id, date, results) values (%L, %L, current_date, ''x'')', v_res, v_type));
    if v_who = 'medical_records' then
      if n <> 1 then raise exception 'HARNESS-FAIL: card % insert gave %', v_who, n; end if;
      n := pg_temp.try(v_uid, format('update blood_tests set results = ''y'' where id = %L', v_bt));
      if n <> 1 then raise exception 'HARNESS-FAIL: card % update gave %', v_who, n; end if;
      n := pg_temp.try(v_uid, format('select record_attachment(''blood_test'', %L, %L)', v_bt, 'harnessFile' || v_who));
      if n <> 1 then raise exception 'HARNESS-FAIL: card % record_attachment gave %', v_who, n; end if;
    else
      if n <> -1 then raise exception 'HARNESS-FAIL: card % insert gave % (want refused)', v_who, n; end if;
      n := pg_temp.try(v_uid, format('update blood_tests set results = ''y'' where id = %L', v_bt));
      if n <> 0 then raise exception 'HARNESS-FAIL: card % updated % rows', v_who, n; end if;
    end if;
    n := pg_temp.try(v_uid, format('select 1 from blood_tests where id = %L', v_bt));
    if v_who = 'none' and n <> 0 then raise exception 'HARNESS-FAIL: no card, read % rows', n; end if;
    if v_who <> 'none' and n < 1 then raise exception 'HARNESS-FAIL: card % read % rows', v_who, n; end if;
    v_report := v_report || v_who || (case when v_who = 'medical_records' then ' insert+update+file' when v_who = 'view_medical' then ' reads, writes refused' else ' refused, reads nothing' end) || ' | ';
  end loop;

  raise exception '%', 'HARNESS-OK blood_tests: ' || v_report;
end;
$h$;
rollback;
`;
const h = await query(sql);
const msg = typeof h.body === "object" && h.body?.message ? h.body.message : String(h.body);
if (/HARNESS-OK/.test(msg)) console.log(`3  ${msg.replace(/^[\s\S]*HARNESS-OK /, "").split("\n")[0].replace(/ \| $/, "").trim()}`);
else fail(`real-row harness: ${msg}`);

console.log(failures ? `\n${failures} failure(s)` : "\nall role write policies hold");
process.exitCode = failures ? 1 : 0;
