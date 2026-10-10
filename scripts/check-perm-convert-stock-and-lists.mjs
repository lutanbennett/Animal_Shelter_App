// perm-convert-stock-and-lists (0148): medication, diet_types, frequency, procedure_types, blood_test_types and
// immunization_types now answer through has_permission(). Against DEV only, one transaction that is always
// rolled back, each login's own JWT.
//
//   node scripts/check-perm-convert-stock-and-lists.mjs            (from the repo root; dev only)
//   node scripts/check-perm-convert-stock-and-lists.mjs --verbose  (also list every case)
//
// For each table, each principal's read / update / insert / delete (1 = took effect, 0 = refused):
//   medication          read stock.medications Read or reference.add_while_recording; insert the same with Edit;
//                       update and delete stock.medications Edit
//   diet_types          read stock.diets Read or resident.register; write stock.diets Edit
//   frequency           read medical.prescriptions Read (+ clinical scope) or reference.types Read; insert the add cell or
//                       reference.types Edit; update and delete reference.types Edit
//   procedure_types     read medical.procedures / reference.types Read / the add cell; insert the add cell or reference.types Edit
//   blood_test_types    read medical.blood_tests or reference.types Read; write reference.types Edit
//   immunization_types  read reference.types Read (0155; medical.immunizations reads picker_immunization_types); write reference.types Edit
// The vet (a doctor login since 0172) keeps what its own doctor_* policies give it, unchanged (C3, C10). Then structural sweeps: no policy on these
// tables names management or staff, every new policy wraps has_permission() in (select ...), the two price tables never
// ask a medical.* cell, and 24 *_perm policies exist.
//
// The custom roles borrow the MANAGEMENT floor (STAFF until 0173 retired it) and hold one or two cells (c_none holds none), except c_vol_medical, which
// sits on the VOLUNTEER floor holding the medical cells the 2IC holds in the Director's draft: the proof that the two
// price tables (medication, diet_types) do not open to a role that sees names and stock through views, and that the four
// type lists DO open to it for reading, because the cell for recording one is the cell for choosing one (immunization_types
// carries a per-dose cost: recorded in the decision file, not hidden).
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const verbose = process.argv.includes("--verbose");
const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const lit = (id) => `'${id}'::uuid`;
// custom roles: name -> { floor, cells: [[activity, level]] }
const CUSTOM = {
  c_none: { cells: [] },
  c_med_read: { cells: [["stock.medications", 1]] },
  c_med_edit: { cells: [["stock.medications", 2]] },
  c_add: { cells: [["reference.add_while_recording", 2]] },
  c_diet_read: { cells: [["stock.diets", 1]] },
  c_diet_edit: { cells: [["stock.diets", 2]] },
  c_register: { cells: [["resident.register", 2]] },
  c_types_read: { cells: [["reference.types", 1]] },
  c_types_edit: { cells: [["reference.types", 2]] },
  c_proc_read: { cells: [["medical.procedures", 1]] },
  c_blood_read: { cells: [["medical.blood_tests", 1]] },
  c_imm_read: { cells: [["medical.immunizations", 1]] },
  c_rx_read: { cells: [["medical.prescriptions", 1]] },
  c_vol_medical: {
    floor: "volunteer",
    cells: [["medical.prescriptions", 2], ["medical.diet", 2], ["medical.procedures", 2], ["medical.blood_tests", 2], ["medical.immunizations", 2], ["stock.count", 2], ["stock.delivery", 2], ["stock.purchasing", 2]],
  },
};
// Staff left with 0173: each outcome it had is also another principal's (c_add on medication, management elsewhere).
const REAL = ["admin", "management", "volunteer", "vet"];
const APP_ROLE = { vet: "doctor" }; // 0172 renamed the 'vet' app_role
const P = [...REAL, "norole", ...Object.keys(CUSTOM)];
const ID = Object.fromEntries(P.map((p) => [p, randomUUID()]));
const ROW = Object.fromEntries(["medication", "diet_types", "frequency", "procedure_types", "blood_test_types", "immunization_types"].map((t) => [t, randomUUID()]));

// table -> [read, update, insert, delete] statements
const T = {
  medication: [`select 1 from medication where id = '${ROW.medication}'`, `update medication set name = name where id = '${ROW.medication}'`, `insert into medication (name) values ('Harness new med')`, `delete from medication where id = '${ROW.medication}'`],
  diet_types: [`select 1 from diet_types where id = '${ROW.diet_types}'`, `update diet_types set name = name where id = '${ROW.diet_types}'`, `insert into diet_types (name, daily_qty_small, daily_qty_medium, daily_qty_large) values ('Harness new diet', 1, 1, 1)`, `delete from diet_types where id = '${ROW.diet_types}'`],
  frequency: [`select 1 from frequency where id = '${ROW.frequency}'`, `update frequency set label = label where id = '${ROW.frequency}'`, `insert into frequency (label) values ('Harness new frequency')`, `delete from frequency where id = '${ROW.frequency}'`],
  procedure_types: [`select 1 from procedure_types where id = '${ROW.procedure_types}'`, `update procedure_types set name = name where id = '${ROW.procedure_types}'`, `insert into procedure_types (name) values ('Harness new procedure')`, `delete from procedure_types where id = '${ROW.procedure_types}'`],
  blood_test_types: [`select 1 from blood_test_types where id = '${ROW.blood_test_types}'`, `update blood_test_types set name = name where id = '${ROW.blood_test_types}'`, `insert into blood_test_types (name) values ('Harness new blood test')`, `delete from blood_test_types where id = '${ROW.blood_test_types}'`],
  immunization_types: [`select 1 from immunization_types where id = '${ROW.immunization_types}'`, `update immunization_types set name = name where id = '${ROW.immunization_types}'`, `insert into immunization_types (name, interval_months) values ('Harness new immunization', 12)`, `delete from immunization_types where id = '${ROW.immunization_types}'`],
};

// expected "RUID" per principal; anything not listed is 0000
const A = "1111", RO = "1000", RI = "1010", I = "0010";
const EXPECT = {
  medication: { admin: A, management: A, vet: RI, c_med_read: RO, c_med_edit: A, c_add: I }, // 0151: the add cell no longer reads the table
  diet_types: { admin: A, management: A, vet: RO, c_diet_read: RO, c_diet_edit: A }, // 0151: resident.register no longer reads the table
  frequency: { admin: A, management: RI, vet: RI, c_types_read: RO, c_types_edit: A, c_add: I, c_rx_read: RO, c_vol_medical: RO },
  procedure_types: { admin: A, management: RI, vet: RI, c_add: RI, c_proc_read: RO, c_types_read: RO, c_types_edit: A, c_vol_medical: RO },
  blood_test_types: { admin: A, management: RO, vet: RO, c_blood_read: RO, c_types_read: RO, c_types_edit: A, c_vol_medical: RO },
  immunization_types: { admin: A, vet: A, c_types_read: RO, c_types_edit: A }, // 0155: medical.immunizations reads picker_immunization_types, not the table (it carries a price)
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
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-sl-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${P.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role)
    select id, who::app_role from (values ${REAL.map((p) => `('${APP_ROLE[p] ?? p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into roles (key, name, kind, legacy_role, scope_residents, scope_contacts) values
    ${Object.entries(CUSTOM).map(([c, d]) => `('harness_sl_${c}', 'Harness ${c}', 'custom', '${d.floor ?? "management"}', 'all', 'full')`).join(",\n    ")};
  insert into role_permissions (role_id, activity, level)
    select r.id, v.act, v.lvl from roles r join (values
      ${Object.entries(CUSTOM).flatMap(([c, d]) => d.cells.map(([a, l]) => `('harness_sl_${c}', '${a}', ${l})`)).join(",\n      ")}
    ) as v(rkey, act, lvl) on v.rkey = r.key;
  ${Object.keys(CUSTOM).map((c) => `insert into user_roles (user_id, role_id, role) select ${lit(ID[c])}, id, '${CUSTOM[c].floor ?? "management"}' from roles where key = 'harness_sl_${c}';`).join("\n  ")}

  insert into medication (id, name) values (${lit(ROW.medication)}, 'Harness med');
  insert into diet_types (id, name, daily_qty_small, daily_qty_medium, daily_qty_large) values (${lit(ROW.diet_types)}, 'Harness diet', 1, 1, 1);
  insert into frequency (id, label) values (${lit(ROW.frequency)}, 'Harness frequency');
  insert into procedure_types (id, name) values (${lit(ROW.procedure_types)}, 'Harness procedure');
  insert into blood_test_types (id, name) values (${lit(ROW.blood_test_types)}, 'Harness blood test');
  insert into immunization_types (id, name, interval_months) values (${lit(ROW.immunization_types)}, 'Harness immunization', 12);
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
  insert into res select 'sweep', 'price_tables_ask_medical', 'count', count(*) from pg_policies
   where schemaname = 'public' and tablename in ('medication', 'diet_types') and policyname like '%\\_perm'
     and (coalesce(qual,'') || coalesce(with_check,'')) like '%medical.%';
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
if (sweep("price_tables_ask_medical") === 0) pass("medication and diet_types policies ask no medical.* cell"); else fail(`${sweep("price_tables_ask_medical")} price-table policy(ies) ask a medical.* cell`);
if (sweep("perm_policies") === 24) pass("24 *_perm policies"); else fail(`expected 24 *_perm policies, found ${sweep("perm_policies")}`);
console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN (each table answers as its cell says; the volunteer-floor medical role reads no price table; the vet is unchanged)");
process.exitCode = fails ? 1 : 0;
