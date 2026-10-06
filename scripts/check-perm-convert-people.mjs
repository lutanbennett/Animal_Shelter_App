// perm-convert-people (0147): contacts, shelter_friends, vets, vet_doctors, vet_doctor_clinics and
// bulk_appointments now answer through has_permission(). Against DEV only, one transaction that is always
// rolled back, each login's own JWT.
//
//   node scripts/check-perm-convert-people.mjs            (from the repo root; dev only)
//   node scripts/check-perm-convert-people.mjs --verbose  (also list every case)
//
// For each table, each principal's read / update / insert / delete (1 = took effect, 0 = refused):
//   contacts            contacts.directory read / edit, insert contacts.add, and sees_all_contacts(): a custom role on the
//                       VOLUNTEER floor, or with scope_contacts below full, holding every contacts cell reads nothing
//   shelter_friends     friends.manage writes; anyone who reads contacts reads (N3 stays open on purpose)
//   vets                clinics.list / clinics.doctors / visit.book read; clinics.list Edit writes
//   vet_doctors         clinics.doctors writes, visit.book inserts (the booking trigger adds a typed doctor)
//   vet_doctor_clinics  as vet_doctors, with a login-linked doctor still off limits to non-admins
//   bulk_appointments   visit.book, all four
// The vet keeps what its own vet_* policies give it, unchanged. Then structural sweeps: no policy on these tables
// names management or staff, every new policy wraps has_permission() in (select ...), and 24 *_perm policies exist.
//
// The custom roles borrow the STAFF floor (one the volunteer floor, one a narrower scope) and hold one or two cells;
// c_none holds none. That is the proof that the role-named policies are gone.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const verbose = process.argv.includes("--verbose");
const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const lit = (id) => `'${id}'::uuid`;
// custom roles: name -> { floor, scope, cells }
const CUSTOM = {
  c_none: { cells: [] },
  c_dir_read: { cells: [["contacts.directory", 1]] },
  c_dir_edit: { cells: [["contacts.directory", 2]] },
  c_add: { cells: [["contacts.add", 2]] },
  c_dir_all: { cells: [["contacts.directory", 2], ["contacts.add", 2]] },
  c_dir_namephone: { scope: "name_phone", cells: [["contacts.directory", 2], ["contacts.add", 2]] },
  v_dir_all: { floor: "volunteer", cells: [["contacts.directory", 2], ["contacts.add", 2]] },
  c_friends: { cells: [["friends.manage", 2]] },
  c_clinics_read: { cells: [["clinics.list", 1]] },
  c_clinics_edit: { cells: [["clinics.list", 2]] },
  c_doctors: { cells: [["clinics.doctors", 2]] },
  c_book: { cells: [["visit.book", 2]] },
};
const REAL = ["admin", "management", "staff", "volunteer", "vet"];
const P = [...REAL, "norole", ...Object.keys(CUSTOM)];
const ID = Object.fromEntries(P.map((p) => [p, randomUUID()]));
const OWN = randomUUID(), OWN2 = randomUUID(), DOC = randomUUID(), CT = randomUUID(), CT2 = randomUUID(), CT3 = randomUUID(), FR = randomUUID(), BA = randomUUID();

// table -> [read, update, insert, delete] statements
const T = {
  contacts: [`select 1 from contacts where id = '${CT}'`, `update contacts set notes = 'probe' where id = '${CT}'`, `insert into contacts (name, type) values ('Harness new', 'Vendor')`, `delete from contacts where id = '${CT}'`],
  shelter_friends: [`select 1 from shelter_friends where id = '${FR}'`, `update shelter_friends set published = published where id = '${FR}'`, `insert into shelter_friends (contact_id) values ('${CT3}')`, `delete from shelter_friends where id = '${FR}'`],
  vets: [`select 1 from vets where id = '${OWN}'`, `update vets set notes = 'probe' where id = '${OWN}'`, `insert into vets (name, clinic_name) values ('Harness new', 'Harness new')`, `delete from vets where id = '${OWN2}'`],
  vet_doctors: [`select 1 from vet_doctors where id = '${DOC}'`, `update vet_doctors set active = active where id = '${DOC}'`, `insert into vet_doctors (name, vet_id) values ('Harness new doc', '${OWN}')`, `delete from vet_doctors where id = '${DOC}'`],
  vet_doctor_clinics: [`select 1 from vet_doctor_clinics where doctor_id = '${DOC}'`, `update vet_doctor_clinics set active = active where doctor_id = '${DOC}'`, `insert into vet_doctor_clinics (vet_id, doctor_id) values ('${OWN2}', '${DOC}')`, `delete from vet_doctor_clinics where doctor_id = '${DOC}'`],
  bulk_appointments: [`select 1 from bulk_appointments where id = '${BA}'`, `update bulk_appointments set reason = 'probe' where id = '${BA}'`, `insert into bulk_appointments (vet_id, appointment_date) values ('${OWN}', now())`, `delete from bulk_appointments where id = '${BA}'`],
};

// expected "RUID" per principal; anything not listed is 0000
const A = "1111", RO = "1000";
const EXPECT = {
  contacts: { admin: A, management: A, staff: "1010", c_dir_read: RO, c_dir_edit: "1101", c_add: "0010", c_dir_all: A },
  shelter_friends: { admin: A, management: A, staff: RO, vet: RO, c_dir_read: RO, c_dir_edit: RO, c_dir_all: RO, c_friends: A },
  vets: { admin: A, management: A, staff: RO, vet: RO, c_clinics_read: RO, c_clinics_edit: A, c_doctors: RO, c_book: RO },
  vet_doctors: { admin: A, management: A, staff: "1010", vet: A, c_clinics_read: RO, c_clinics_edit: RO, c_doctors: A, c_book: "1010" },
  vet_doctor_clinics: { admin: A, management: A, staff: "1010", vet: "1101", c_clinics_read: RO, c_clinics_edit: RO, c_doctors: A, c_book: "1010" },
  bulk_appointments: { admin: A, management: A, staff: A, vet: A, c_book: A },
};
const CMDS = ["read", "update", "insert", "delete"];
const expected = (tbl, who) => (EXPECT[tbl][who] ?? "0000").split("").map(Number);

const probes = [];
for (const [tbl, stmts] of Object.entries(T)) {
  for (const who of P) {
    stmts.forEach((q, i) => probes.push(`  perform pg_temp.probe('${who}', ${lit(ID[who])}, '${tbl}', '${CMDS[i]}', $q$${q}$q$);`));
  }
}
const tableList = Object.keys(T).map((t) => `'${t}'`).join(",");

const harness = `
begin;
create temp table res (who text, tbl text, cmd text, n bigint);
grant all on res to authenticated;
create function pg_temp.probe(p_who text, p_uid uuid, p_tbl text, p_cmd text, p_sql text) returns void language plpgsql as $f$
declare v bigint := -2;
begin
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
    set local role authenticated;
    begin
      execute p_sql; get diagnostics v = row_count;
    exception when insufficient_privilege then v := -1; when others then v := -2;
    end;
    reset role;
    raise exception using errcode = 'P0999', message = 'probe-rollback';
  exception when sqlstate 'P0999' then null;
  end;
  insert into res values (p_who, p_tbl, p_cmd, v);
end $f$;

do $setup$
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-ppl-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${P.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role)
    select id, who::app_role from (values ${REAL.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into roles (key, name, kind, legacy_role, scope_residents, scope_contacts) values
    ${Object.entries(CUSTOM).map(([c, d]) => `('harness_ppl_${c}', 'Harness ${c}', 'custom', '${d.floor ?? "staff"}', 'all', '${d.scope ?? "full"}')`).join(",\n    ")};
  insert into role_permissions (role_id, activity, level)
    select r.id, v.act, v.lvl from roles r join (values
      ${Object.entries(CUSTOM).flatMap(([c, d]) => d.cells.map(([a, l]) => `('harness_ppl_${c}', '${a}', ${l})`)).join(",\n      ")}
    ) as v(rkey, act, lvl) on v.rkey = r.key;
  ${Object.keys(CUSTOM).map((c) => `insert into user_roles (user_id, role_id, role) select ${lit(ID[c])}, id, '${CUSTOM[c].floor ?? "staff"}' from roles where key = 'harness_ppl_${c}';`).join("\n  ")}

  insert into vets (id, name, clinic_name) values (${lit(OWN)}, 'Harness own', 'Harness own'), (${lit(OWN2)}, 'Harness other', 'Harness other');
  insert into vet_doctors (name, user_id, vet_id) values ('Harness vet', ${lit(ID.vet)}, ${lit(OWN)});
  insert into vet_doctors (id, name, vet_id) values (${lit(DOC)}, 'Harness doctor', ${lit(OWN)});
  insert into contacts (id, name, type) values (${lit(CT)}, 'Harness contact', 'Vendor'), (${lit(CT2)}, 'Harness friend', 'Vendor'), (${lit(CT3)}, 'Harness newfriend', 'Vendor');
  insert into shelter_friends (id, contact_id) values (${lit(FR)}, ${lit(CT2)});
  insert into bulk_appointments (id, vet_id, appointment_date) values (${lit(BA)}, ${lit(OWN)}, now());
end $setup$;

do $run$ begin
${probes.join("\n")}
end $run$;

do $sweep$ begin
  insert into res select 'sweep', 'names_mgmt_or_staff', 'count', count(*) from pg_policies
   where schemaname = 'public' and tablename in (${tableList})
     and ((coalesce(qual,'') || coalesce(with_check,'')) like '%''management''::app_role%'
          or (coalesce(qual,'') || coalesce(with_check,'')) like '%''staff''::app_role%'
          or policyname like 'management\\_%' or policyname like 'staff\\_%');
  insert into res select 'sweep', 'bare_has_permission', 'count', count(*) from pg_policies
   where schemaname = 'public' and tablename in (${tableList}) and policyname like '%\\_perm'
     and (coalesce(qual,'') || coalesce(with_check,'')) ~ 'has_permission'
     and (coalesce(qual,'') || coalesce(with_check,'')) !~ 'SELECT has_permission';
  insert into res select 'sweep', 'contacts_scoped', 'count', count(*) from pg_policies
   where schemaname = 'public' and tablename = 'contacts' and policyname like '%\\_perm'
     and (coalesce(qual,'') || coalesce(with_check,'')) !~ 'sees_all_contacts';
  insert into res select 'sweep', 'perm_policies', 'count', count(*) from pg_policies
   where schemaname = 'public' and tablename in (${tableList}) and policyname like '%\\_perm';
end $sweep$;
do $o$ begin raise exception 'HARNESS-RESULT %', (select json_agg(row_to_json(res)) from res); end $o$;
rollback;`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: harness }),
});
const text = await res.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
const m = /HARNESS-RESULT (.*)/.exec(msg);
if (!m) throw new Error(`no result (status ${res.status}): ${msg.slice(0, 1500)}`);
const rows = JSON.parse(m[1]);
const get = (who, tbl, cmd) => rows.find((r) => r.who === who && r.tbl === tbl && r.cmd === cmd)?.n;

let fails = 0, ok = 0;
const fail = (s) => { fails++; console.log(`FAIL  ${s}`); };
const pass = (s) => { ok++; if (verbose) console.log(`ok    ${s}`); };
for (const [tbl] of Object.entries(T)) {
  for (const who of P) {
    const exp = expected(tbl, who);
    CMDS.forEach((cmd, i) => {
      const n = get(who, tbl, cmd);
      const label = `${tbl} ${cmd} as ${who}: ${exp[i] ? "allowed" : "refused"}`;
      if (n === -2) fail(`${label} - the statement itself errored (-2); the fixture is wrong, not the policy`);
      else if ((n >= 1) === Boolean(exp[i])) pass(label);
      else fail(`${label} - got ${n}`);
    });
  }
}
const sweep = (k) => get("sweep", k, "count");
if (sweep("names_mgmt_or_staff") === 0) pass("no policy on these tables names management or staff"); else fail(`${sweep("names_mgmt_or_staff")} policy(ies) still name management or staff`);
if (sweep("bare_has_permission") === 0) pass("every new policy wraps has_permission() in (select ...)"); else fail(`${sweep("bare_has_permission")} policy(ies) call has_permission() bare`);
if (sweep("contacts_scoped") === 0) pass("every contacts policy asks sees_all_contacts()"); else fail(`${sweep("contacts_scoped")} contacts policy(ies) do not ask sees_all_contacts()`);
if (sweep("perm_policies") === 24) pass("24 *_perm policies"); else fail(`expected 24 *_perm policies, found ${sweep("perm_policies")}`);
console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN (each table answers as its cell says; a role with no cell, or off the full contacts scope, gets nothing; the vet is unchanged)");
process.exitCode = fails ? 1 : 0;
