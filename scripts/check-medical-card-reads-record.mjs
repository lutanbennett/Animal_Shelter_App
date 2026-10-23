// medical-card-reads-record (0249): who gains the read of the resident record, and who does not.
// Against DEV only, one transaction that is always rolled back; it applies 0249's own text inside that
// transaction, so it works before and after the file is applied for real.
//
//   node scripts/check-medical-card-reads-record.mjs        (from the repo root; dev only)
//
// For each role a throwaway login is made, given that role as its main role, and what it can read of
// `residents` and `placement_history` is counted as that login (role authenticated) BEFORE and AFTER the
// migration text runs. Expected: head_of_medical, second_in_command and a card-only login holding a medical
// edit go from 0 to all; the volunteer and head_of_maintenance stay at 0 (0134); doctor and management are
// identical before and after; and no new reader can change a resident.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync("supabase/migrations/0249_medical_card_reads_the_record.sql", "utf8");
const roleKeys = ["volunteer", "head_of_maintenance", "head_of_medical", "second_in_command", "doctor", "management", "admin"];

const harness = `
begin;
create temp table res (k text, v text);
create temp table logins (role_key text, uid uuid);

do $setup$
declare k text; u uuid; v_role uuid;
begin
  foreach k in array array[${roleKeys.map((r) => `'${r}'`).join(", ")}] loop
    u := gen_random_uuid();
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
      values (u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-' || k || '@example.invalid', '', now(), now(), now(), '{}', '{}');
    select id into v_role from roles where key = k;
    delete from user_roles where user_id = u;
    insert into user_roles (user_id, role_id, is_main) values (u, v_role, true);
    insert into logins values (k, u);
  end loop;
end $setup$;

create or replace function pg_temp.measure(p_uid uuid, out n_res bigint, out n_ph bigint, out n_upd bigint)
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  select count(*) into n_res from residents;
  select count(*) into n_ph from placement_history;
  with u as (update residents set id = id returning 1) select count(*) into n_upd from u;
  reset role;
end $$;

do $before$
declare l record; m record;
begin
  for l in select * from logins loop
    select * into m from pg_temp.measure(l.uid);
    insert into res values ('before_res_' || l.role_key, m.n_res::text), ('before_ph_' || l.role_key, m.n_ph::text);
  end loop;
end $before$;

${migration}

do $after$
declare l record; m record;
begin
  for l in select * from logins loop
    select * into m from pg_temp.measure(l.uid);
    insert into res values ('after_res_' || l.role_key, m.n_res::text), ('after_ph_' || l.role_key, m.n_ph::text), ('after_upd_' || l.role_key, m.n_upd::text);
  end loop;
  insert into res select 'all_residents', count(*)::text from residents;
  insert into res select 'all_placements', count(*)::text from placement_history;
end $after$;

do $o$ begin raise exception 'HARNESS-RESULT %', (select json_agg(row_to_json(res)) from res); end $o$;
rollback;`;

const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: harness }),
});
const text = await r.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
const m = /HARNESS-RESULT (.*)/.exec(msg);
if (!m) throw new Error(`no result (status ${r.status}): ${msg.slice(0, 2000)}`);
const rows = JSON.parse(m[1]);
const get = (k) => rows.find((x) => x.k === k)?.v;

let fails = 0, ok = 0;
const check = (cond, what, detail) => {
  if (cond) { ok++; console.log(`ok    ${what}${detail ? ` (${detail})` : ""}`); } else { fails++; console.log(`FAIL  ${what}${detail ? ` - ${detail}` : ""}`); }
};
const total = get("all_residents"), totalPh = get("all_placements");
console.log(`${total} residents, ${totalPh} placement rows in dev`);
for (const role of ["head_of_medical", "second_in_command"]) {
  check(get(`before_res_${role}`) === "0" && get(`after_res_${role}`) === total, `${role} gains the resident read`, `${get(`before_res_${role}`)} -> ${get(`after_res_${role}`)}`);
  check(get(`before_ph_${role}`) === "0" && get(`after_ph_${role}`) === totalPh, `${role} gains the placement history read`, `${get(`before_ph_${role}`)} -> ${get(`after_ph_${role}`)}`);
  check(get(`after_upd_${role}`) === "0", `${role} still cannot change a resident`);
}
for (const role of ["volunteer", "head_of_maintenance"]) {
  check(get(`before_res_${role}`) === "0" && get(`after_res_${role}`) === "0", `${role} stays at stranger-plus-location (0134)`, `${get(`after_res_${role}`)} rows`);
  check(get(`after_ph_${role}`) === "0", `${role} reads no placement history`);
}
for (const role of ["doctor", "management", "admin"]) {
  check(get(`before_res_${role}`) === get(`after_res_${role}`) && get(`before_ph_${role}`) === get(`after_ph_${role}`), `${role} unchanged`, `${get(`after_res_${role}`)} residents, ${get(`after_ph_${role}`)} placement rows`);
}
check(get("after_res_management") === total && get("after_res_admin") === total, "management and admin still read every resident");
console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN");
process.exitCode = fails ? 1 : 0;
