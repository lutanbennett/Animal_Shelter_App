// A table can get a select policy and a form in the app, and nothing notices
// that the write policy was never written (docs/decisions/2026-10-03-blood-test-write-policies.md).
// That is how staff could open "Log blood test", fill it in and be answered
// "You don't have permission to do that": 0001 gave staff read on blood_tests,
// the manual and the UI offered the write, and 130 migrations went by. A
// dry run found it. This finds it first.
//
// Against the DEV database, live schema (as check-vet-own-clinic-writes.mjs
// does; nothing is committed). Three parts:
//
//   1  OFFERED — the writes the app puts in front of a role. Each row is a
//      table, a command and the roles the manual says do it; every one must
//      have a permissive policy that names the role for that command (a
//      FOR ALL policy covers every command). Add a row when you add a form.
//   2  Management mirrors staff — 0039's rule: whatever staff can do on a
//      table, management can. Checked for every table, so no list to forget.
//   3  Real rows, one rolled-back transaction, each role's own JWT: staff and
//      management insert and update a blood test and file a scan on it; neither
//      can delete one; a volunteer can read it and write nothing to it. Proves the policy works, not just exists.
//
// And one advisory, never a failure: tables staff can read and nothing else.
// Most are meant to be (types, vets, translations); the list is there so that
// the next one that is not gets seen.
//
// Not covered, said plainly: a table the app writes that is not in OFFERED.
// Finding those mechanically means reading every `.from(t).insert(…)` chain in
// src/ — and which roles reach each is a property of the page, not the call —
// so the list is kept by hand, next to the manual. Matching names to roles is
// by the `'<role>'::app_role` text in each policy's expression, which is how
// every policy in this schema is written; one that tests the role another way
// will read as missing and has to be added to this script's reading.
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

// Part 1. [table, command, roles that the manual says do this]. Vets are
// narrowed to their own clinic by 0110 and proved by check-vet-own-clinic-writes;
// here they only need to be named.
const CLINICAL = ["admin", "management", "staff", "vet"];
const OFFERED = [
  ["blood_tests", "INSERT", CLINICAL],
  ["blood_tests", "UPDATE", CLINICAL],
  ["procedures", "INSERT", CLINICAL],
  ["procedures", "UPDATE", CLINICAL],
  ["prescriptions", "INSERT", CLINICAL],
  ["prescriptions", "UPDATE", CLINICAL],
  ["immunization_records", "INSERT", CLINICAL],
  ["immunization_records", "UPDATE", CLINICAL],
  ["vet_appointments", "INSERT", CLINICAL],
  ["vet_appointments", "UPDATE", CLINICAL],
  ["weight", "INSERT", CLINICAL],
  ["weight", "UPDATE", CLINICAL],
  ["resident_diets", "INSERT", ["admin", "management", "staff"]],
  ["resident_diets", "UPDATE", ["admin", "management", "staff"]],
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

// One row per (table, command, role) a permissive policy grants. FOR ALL
// expands to the four commands.
const EFFECTIVE = `
  select p.tablename, c.cmd, r.role
  from pg_policies p
  cross join lateral (select unnest(case when p.cmd = 'ALL'
    then array['SELECT','INSERT','UPDATE','DELETE'] else array[p.cmd] end) as cmd) c
  cross join (values ('staff'),('management'),('vet'),('volunteer'),('admin')) r(role)
  where p.schemaname = 'public' and p.permissive = 'PERMISSIVE'
    and (coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')) like '%''' || r.role || '''::app_role%'`;

let failures = 0;
const fail = (msg) => { failures++; console.log(`FAIL  ${msg}`); };

const eff = await query(`select tablename, cmd, role from (${EFFECTIVE}) e`);
if (eff.status !== 200 && eff.status !== 201) throw new Error(`policy query failed: ${eff.status} ${JSON.stringify(eff.body)}`);
if (!Array.isArray(eff.body)) throw new Error(`policy query failed: ${JSON.stringify(eff.body)}`);
const has = new Set(eff.body.map((r) => `${r.tablename}|${r.cmd}|${r.role}`));

// 1
for (const [table, cmd, roles] of OFFERED) {
  const missing = roles.filter((r) => !has.has(`${table}|${cmd}|${r}`));
  if (missing.length) fail(`${table} ${cmd}: the app offers it to ${missing.join(", ")} but no policy lets them`);
}
console.log(`1  offered writes: ${OFFERED.length} checked`);

// 2
const tables = [...new Set(eff.body.map((r) => r.tablename))].sort();
const staffGrants = eff.body.filter((x) => x.role === "staff");
for (const r of staffGrants) {
  if (!has.has(`${r.tablename}|${r.cmd}|management`)) fail(`${r.tablename} ${r.cmd}: staff can, management cannot (0039: management mirrors staff)`);
}
console.log(`2  management mirrors staff: ${staffGrants.length} staff grants over ${tables.length} tables`);

// advisory
const readOnly = tables.filter((t) =>
  has.has(`${t}|SELECT|staff`) && !["INSERT", "UPDATE", "DELETE"].some((c) => has.has(`${t}|${c}|staff`)));
console.log(`   read-only for staff (advisory): ${readOnly.join(", ")}`);

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
  n bigint;
  v_report text := '';
begin
  insert into residents (id, name, species) values (v_res, 'Harness blood', 'Dog');
  insert into blood_tests (id, resident_id, blood_test_type_id, date) values (v_bt, v_res, v_type, current_date - 1);

  foreach v_who in array array['staff', 'management', 'volunteer'] loop
    v_uid := gen_random_uuid();
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-blood-' || v_who || '-' || v_uid || '@example.invalid',
            '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || v_who), now(), now());
    insert into user_roles (user_id, role) values (v_uid, v_who::app_role);

    n := pg_temp.try(v_uid, format('insert into blood_tests (resident_id, blood_test_type_id, date, results) values (%L, %L, current_date, ''x'')', v_res, v_type));
    if v_who in ('staff', 'management') then
      if n <> 1 then raise exception 'HARNESS-FAIL: % insert gave %', v_who, n; end if;
      n := pg_temp.try(v_uid, format('update blood_tests set results = ''y'' where id = %L', v_bt));
      if n <> 1 then raise exception 'HARNESS-FAIL: % update gave %', v_who, n; end if;
    else
      if n <> -1 then raise exception 'HARNESS-FAIL: % insert gave % (want refused)', v_who, n; end if;
      n := pg_temp.try(v_uid, format('update blood_tests set results = ''y'' where id = %L', v_bt));
      if n <> 0 then raise exception 'HARNESS-FAIL: % updated % rows', v_who, n; end if;
    end if;
    -- the file half of "Log blood test": record_attachment is what the upload route calls
    n := pg_temp.try(v_uid, format('select record_attachment(''blood_test'', %L, %L)', v_bt, 'harnessFile' || v_who));
    if v_who in ('staff', 'management') then
      if n <> 1 then raise exception 'HARNESS-FAIL: % record_attachment gave %', v_who, n; end if;
    end if;
    n := pg_temp.try(v_uid, format('delete from blood_tests where id = %L', v_bt));
    if n <> 0 then raise exception 'HARNESS-FAIL: % deleted % rows', v_who, n; end if;
    n := pg_temp.try(v_uid, format('select 1 from blood_tests where id = %L', v_bt));
    if n < 1 then raise exception 'HARNESS-FAIL: % read % rows', v_who, n; end if;
    v_report := v_report || v_who || (case when v_who = 'volunteer' then ' read only' else ' insert+update+file, no delete' end) || ' | ';
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
