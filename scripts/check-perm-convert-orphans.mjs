// perm-convert-orphans (0145): the policies no conversion stream owned now answer through
// has_permission(). Against DEV only, one transaction that is always rolled back, each login's own JWT.
//
//   node scripts/check-perm-convert-orphans.mjs            (from the repo root; dev only)
//   node scripts/check-perm-convert-orphans.mjs --verbose  (also list every case)
//
// For each table, each principal's read / update / insert / delete (1 = took effect, 0 = refused):
//   enclosures, zones        facility.enclosures: admin all four; management, staff, volunteer, vet read only
//                            (C1 closed); a custom role above the floor with the cell reads / writes by the cell
//   group_origins            resident.register reads; nobody but admin writes
//   resident_diet_rounds, prescription_rounds   the cell (medical.diet / medical.prescriptions) writes, and a
//                            vet keeps writing through the parent's own clinic limit
//   frequency_rounds         read by prescriptions Read (vet too); written by reference.types, which is Admin's
//   item_unit_conversions    read by the three stock cells (0143); written by stock.diets
//   stock_receipts           stock.delivery reads, inserts, deletes; NOBODY updates (C8)
//   stock_counts             read by the stock cells
//   recurring_* (4 tables)   read by recurring.do_own (a vet by vet_read_*); jobs and assignees written by recurring.manage
// Then structural sweeps: no policy on these tables names management or staff, and every new policy calls
// has_permission() inside a (select ...) init-plan.
//
// The custom roles all borrow the MANAGEMENT floor (STAFF until 0173 retired it) and hold one or two cells; one holds
// none. That is the proof that the role-named policies are gone: a role that borrows management and has no cell gets
// nothing.
// "staff" is no longer the Staff role (0173 refuses a live one): it is a harness custom role carrying the archived
// Staff role's cells, so its expectations below still hold. Management holds more (item_unit_conversions, recurring
// jobs), so it could not stand in. "vet" is a doctor login (0172 renamed the role and the clinic tables).
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const verbose = process.argv.includes("--verbose");
const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const lit = (id) => `'${id}'::uuid`;
// custom roles: name -> [activity, level] cells
const CUSTOM = {
  c_none: [],
  c_enc_read: [["facility.enclosures", 1]],
  c_enc_edit: [["facility.enclosures", 2]],
  c_register: [["resident.register", 2]],
  c_diet: [["medical.diet", 2]],
  c_rx: [["medical.prescriptions", 2]],
  c_ref: [["reference.types", 2], ["medical.prescriptions", 1]],
  c_stock: [["stock.diets", 2], ["stock.delivery", 2], ["stock.count", 2]],
  c_recur: [["recurring.manage", 2], ["recurring.do_own", 2]],
  c_manage_only: [["recurring.manage", 2]],
};
const REAL = ["admin", "management", "volunteer", "vet"];
const APP_ROLE = { vet: "doctor" };
const P = [...REAL, "staff", "norole", ...Object.keys(CUSTOM)];
const ID = Object.fromEntries(P.map((p) => [p, randomUUID()]));
const DOC = randomUUID(), ZD = randomUUID(), R = randomUUID(), OWN = randomUUID(), Z = randomUUID(), E = randomUUID(), D = randomUUID(), RX = randomUUID(), F = randomUUID(), J = randomUUID(), C = randomUUID(), GO = randomUUID(), REC = randomUUID();
const ref_ = (k) => `(select id from pg_temp.ref_ids where k = '${k}')`;

// table -> [read, update, insert, delete] statements
const T = {
  enclosures: [`select 1 from enclosures where id = '${E}'`, `update enclosures set notes = 'probe' where id = '${E}'`, `insert into enclosures (name, zone_id) values ('Harness new', '${Z}')`, `delete from enclosures where id = '${E}'`],
  zones: [`select 1 from zones where id = '${Z}'`, `update zones set internal = internal where id = '${Z}'`, `insert into zones (name) values ('Harness new')`, `delete from zones where id = '${ZD}'`],
  group_origins: [`select 1 from group_origins where id = '${GO}'`, `update group_origins set notes = 'probe' where id = '${GO}'`, `insert into group_origins (name) values ('Harness new')`, `delete from group_origins where id = '${GO}'`],
  resident_diet_rounds: [`select 1 from resident_diet_rounds where resident_diet_id = '${D}'`, `update resident_diet_rounds set round_id = round_id where resident_diet_id = '${D}'`, `insert into resident_diet_rounds (resident_diet_id, round_id) values ('${D}', ${ref_("food_b")})`, `delete from resident_diet_rounds where resident_diet_id = '${D}'`],
  prescription_rounds: [`select 1 from prescription_rounds where prescription_id = '${RX}'`, `update prescription_rounds set round_id = round_id where prescription_id = '${RX}'`, `insert into prescription_rounds (prescription_id, round_id) values ('${RX}', ${ref_("round_b")})`, `delete from prescription_rounds where prescription_id = '${RX}'`],
  frequency_rounds: [`select 1 from frequency_rounds where frequency_id = '${F}'`, `update frequency_rounds set round_id = round_id where frequency_id = '${F}'`, `insert into frequency_rounds (frequency_id, round_id) values ('${F}', ${ref_("round_b")})`, `delete from frequency_rounds where frequency_id = '${F}'`],
  item_unit_conversions: [`select 1 from item_unit_conversions where id = '${C}'`, `update item_unit_conversions set note = 'probe' where id = '${C}'`, `insert into item_unit_conversions (item_kind, medication_id, unit, base_units_per) values ('medication', ${ref_("med")}, 'harness-box', 10)`, `delete from item_unit_conversions where id = '${C}'`],
  stock_receipts: [`select 1 from stock_receipts where id = '${REC}'`, `update stock_receipts set quantity = quantity where id = '${REC}'`, `insert into stock_receipts (item_kind, medication_id, quantity) values ('medication', ${ref_("med")}, 1)`, `delete from stock_receipts where id = '${REC}'`],
  stock_counts: [`select 1 from stock_counts limit 1`, null, null, null],
  recurring_jobs: [`select 1 from recurring_jobs where id = '${J}'`, `update recurring_jobs set description = 'probe' where id = '${J}'`, `insert into recurring_jobs (title, time_of_day, link_path, repeat, weekdays, starts_on) values ('Harness new', 'morning', '/', 'weekly', '{1}', current_date)`, `delete from recurring_jobs where id = '${J}'`],
  recurring_job_assignees: [`select 1 from recurring_job_assignees where job_id = '${J}'`, `update recurring_job_assignees set user_id = user_id where job_id = '${J}'`, `insert into recurring_job_assignees (job_id, user_id) values ('${J}', '${ID.management}')`, `delete from recurring_job_assignees where job_id = '${J}'`],
  recurring_job_occurrences: [`select 1 from recurring_job_occurrences limit 1`, null, null, null],
  recurring_job_occurrence_assignees: [`select 1 from recurring_job_occurrence_assignees limit 1`, null, null, null],
};

// expected "RUID" per principal (read, update, insert, delete); anything not listed is 0000
const A = "1111", RO = "1000", NO = "0000";
const EXPECT = {
  enclosures: { admin: A, management: RO, staff: RO, volunteer: RO, vet: RO, c_enc_read: RO, c_enc_edit: A },
  zones: { admin: A, management: RO, staff: RO, volunteer: RO, vet: RO, c_enc_read: RO, c_enc_edit: A },
  group_origins: { admin: A, management: RO, staff: RO, c_register: RO },
  resident_diet_rounds: { admin: A, management: A, staff: A, vet: A, c_diet: A },
  prescription_rounds: { admin: A, management: A, staff: A, vet: A, c_rx: A, c_ref: RO },
  frequency_rounds: { admin: A, management: RO, staff: RO, vet: RO, c_rx: RO, c_ref: "1111" },
  item_unit_conversions: { admin: A, management: A, staff: RO, c_stock: A },
  stock_receipts: { admin: "1011", management: "1011", staff: "1011", c_stock: "1011" },
  stock_counts: { admin: "1", management: "1", staff: "1", c_stock: "1" },
  // RE-BASELINED 2026-10-06 (director-draft-apply): the volunteer holds recurring.do_own (draft row 47, confirmed by Lutan), so reads these
  recurring_jobs: { admin: A, management: A, staff: RO, volunteer: RO, vet: RO, c_recur: A, c_manage_only: "0010" },
  recurring_job_assignees: { admin: A, management: A, staff: RO, volunteer: RO, vet: RO, c_recur: A, c_manage_only: "0010" },
  recurring_job_occurrences: { admin: "1", management: "1", staff: "1", volunteer: "1", vet: "1", c_recur: "1" },
  recurring_job_occurrence_assignees: { admin: "1", management: "1", staff: "1", volunteer: "1", vet: "1", c_recur: "1" },
};
const CMDS = ["read", "update", "insert", "delete"];
const expected = (tbl, who) => (EXPECT[tbl][who] ?? NO.padEnd(T[tbl].filter(Boolean).length, "0")).split("").map(Number);

const probes = [];
for (const [tbl, stmts] of Object.entries(T)) {
  for (const who of P) {
    stmts.forEach((q, i) => { if (q) probes.push(`  perform pg_temp.probe('${who}', ${lit(ID[who])}, '${tbl}', '${CMDS[i]}', $q$${q}$q$);`); });
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

create temp table ref_ids (k text primary key, id uuid not null);
grant select on ref_ids to authenticated;
do $setup$
declare r_a uuid; r_b uuid;
begin
  select id into r_a from rounds where for_medication order by sort_order limit 1;
  select id into r_b from rounds where for_medication order by sort_order offset 1 limit 1;
  insert into ref_ids values ('round_a', r_a), ('round_b', r_b), ('food_a', (select id from rounds where for_food order by sort_order limit 1)), ('food_b', (select id from rounds where for_food order by sort_order offset 1 limit 1)), ('med', (select id from medication order by id limit 1));

  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-pco-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${P.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role)
    select id, who::app_role from (values ${REAL.map((p) => `('${APP_ROLE[p] ?? p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into roles (key, name, kind, legacy_role, scope_residents) values
    ${Object.keys(CUSTOM).map((c) => `('harness_pco_${c}', 'Harness ${c}', 'custom', 'management', 'all')`).join(",\n    ")};
  insert into role_permissions (role_id, activity, level)
    select r.id, v.act, v.lvl from roles r join (values
      ${Object.entries(CUSTOM).flatMap(([c, cells]) => cells.map(([a, l]) => `('harness_pco_${c}', '${a}', ${l})`)).join(",\n      ")}
    ) as v(rkey, act, lvl) on v.rkey = r.key;
  ${Object.keys(CUSTOM).map((c) => `insert into user_roles (user_id, role_id, role) select ${lit(ID[c])}, id, 'management' from roles where key = 'harness_pco_${c}';`).join("\n  ")}
  -- staff: the archived Staff role's cells on a custom role (0173), so the login keeps exactly what Staff held
  insert into roles (key, name, kind, legacy_role, scope_residents) values ('harness_pco_staff', 'Harness staff', 'custom', 'management', 'all');
  insert into role_permissions (role_id, activity, level)
    select (select id from roles where key = 'harness_pco_staff'), rp.activity, rp.level
      from role_permissions rp join roles s on s.id = rp.role_id where s.key = 'staff';
  insert into user_roles (user_id, role_id, role) select ${lit(ID.staff)}, id, legacy_role from roles where key = 'harness_pco_staff';

  insert into zones (id, name) values (${lit(Z)}, 'Harness zone'), (${lit(ZD)}, 'Harness empty zone');
  insert into enclosures (id, name, zone_id) values (${lit(E)}, 'Harness enclosure', ${lit(Z)});
  insert into group_origins (id, name) values (${lit(GO)}, 'Harness origin');

  -- a resident the vet's clinic treats, with one diet and one prescription, each holding one round
  insert into clinics (id, name) values (${lit(OWN)}, 'Harness own');
  insert into doctors (id, name, user_id) values (${lit(DOC)}, 'Harness doctor', ${lit(ID.vet)});
  insert into doctor_clinics (clinic_id, doctor_id) values (${lit(OWN)}, ${lit(DOC)});
  insert into residents (id, name, species) values (${lit(R)}, 'Harness in', 'Dog');
  insert into clinic_visits (resident_id, clinic_id, appointment_date, status) values (${lit(R)}, ${lit(OWN)}, now() - interval '3 days', 'completed');
  insert into resident_diets (id, resident_id, diet_type_id, start_date) values (${lit(D)}, ${lit(R)}, (select id from diet_types limit 1), current_date - 5);
  insert into prescriptions (id, resident_id, medication_id, start_date) values (${lit(RX)}, ${lit(R)}, ${ref_("med")}, current_date - 5);
  insert into frequency (id, label) values (${lit(F)}, 'Harness frequency');
  delete from resident_diet_rounds where resident_diet_id = ${lit(D)};
  delete from prescription_rounds where prescription_id = ${lit(RX)};
  delete from frequency_rounds where frequency_id = ${lit(F)};
  insert into resident_diet_rounds (resident_diet_id, round_id) select ${lit(D)}, id from ref_ids where k = 'food_a';
  insert into prescription_rounds (prescription_id, round_id) values (${lit(RX)}, r_a);
  insert into frequency_rounds (frequency_id, round_id) values (${lit(F)}, r_a);

  insert into item_unit_conversions (id, item_kind, medication_id, unit, base_units_per) values (${lit(C)}, 'medication', ${ref_("med")}, 'harness-pack', 5);
  insert into stock_receipts (id, item_kind, medication_id, quantity) values (${lit(REC)}, 'medication', ${ref_("med")}, 1);
  insert into recurring_jobs (id, title, time_of_day, link_path, repeat, weekdays, starts_on) values (${lit(J)}, 'Harness job', 'morning', '/', 'weekly', '{1,2,3,4,5,6,7}', current_date - 7);
  insert into recurring_job_assignees (job_id, user_id) values (${lit(J)}, ${lit(ID.staff)});
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
  insert into res select 'sweep', 'new_perm_policies', 'count', count(*) from pg_policies
   where schemaname = 'public' and policyname like '%\\_perm'
     and policyname in ('enclosures_select_perm','enclosures_insert_perm','enclosures_update_perm','enclosures_delete_perm',
       'zones_select_perm','zones_insert_perm','zones_update_perm','zones_delete_perm','group_origins_select_perm',
       'resident_diet_rounds_insert_perm','resident_diet_rounds_update_perm','resident_diet_rounds_delete_perm',
       'prescription_rounds_insert_perm','prescription_rounds_update_perm','prescription_rounds_delete_perm',
       'frequency_rounds_select_perm','frequency_rounds_insert_perm','frequency_rounds_update_perm','frequency_rounds_delete_perm',
       'item_unit_conversions_insert_perm','item_unit_conversions_update_perm','item_unit_conversions_delete_perm',
       'recurring_jobs_insert_perm','recurring_jobs_update_perm','recurring_jobs_delete_perm',
       'recurring_job_assignees_insert_perm','recurring_job_assignees_update_perm','recurring_job_assignees_delete_perm');
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
for (const [tbl, stmts] of Object.entries(T)) {
  const cmds = stmts.map((q, i) => (q ? CMDS[i] : null)).filter(Boolean);
  for (const who of P) {
    const exp = expected(tbl, who);
    cmds.forEach((cmd, i) => {
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
if (sweep("new_perm_policies") === 28) pass("28 new policies"); else fail(`expected 28 new *_perm policies, found ${sweep("new_perm_policies")}`);
console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN (each table answers as its cell says; a management-floor role with no cell gets nothing; vets unchanged)");
process.exitCode = fails ? 1 : 0;
