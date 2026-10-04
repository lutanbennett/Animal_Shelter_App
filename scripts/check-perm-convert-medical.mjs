// perm-convert-medical (0135): the seven resident medical tables now answer through
// has_permission() + sees_all_clinical(). Against DEV only, one transaction that is
// always rolled back, real rows, each login's own JWT.
//
//   node scripts/check-perm-convert-medical.mjs            (from the repo root; dev only)
//   node scripts/check-perm-convert-medical.mjs --verbose  (also list every case)
//
// For each converted table, as each principal (read, update, insert, delete):
//   staff, management      read, update and insert work; delete is refused (C5 closed)
//   admin                  everything, delete included (admin_all_* is left in place)
//   volunteer              sees nothing, writes nothing (0134 removed the cells; the
//                          conversion must not hand them back through an OR-ed policy)
//   no role                sees nothing, writes nothing
//   vet                    still sees the in-clinic resident's rows and NOT another
//                          clinic's: the vet_* policies are untouched and the new ones
//                          must not widen them (sees_all_clinical() is false for a vet)
//   custom Read role       (legacy volunteer, Read cells)  reads, cannot write
//   custom Edit role       (legacy volunteer, Edit cells)  reads, updates, inserts, no delete
//   custom clinic-scoped   (legacy volunteer, own_clinic, Edit cells)  sees nothing: a
//                          scoped role is never handed the whole record by a cell
// Then structural sweeps: no policy on these tables still names management or staff,
// and every new policy calls has_permission() inside a (select ...) init-plan.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const verbose = process.argv.includes("--verbose");
const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const lit = (id) => `'${id}'::uuid`;
const P = ["admin", "management", "staff", "volunteer", "norole", "vet", "c_read", "c_edit", "c_scoped"];
const ID = Object.fromEntries(P.map((p) => [p, randomUUID()]));
const R = randomUUID(), R_OUT = randomUUID(), OWN = randomUUID(), OTHER = randomUUID();
const MED = "(select id from pg_temp.ref_ids where k = 'medication')";

// table, activity, update, insert (against resident R)
const T = [
  ["vet_appointments", "medical.visits", `update vet_appointments set reason = 'probe' where resident_id = '${R}'`, `insert into vet_appointments (resident_id, vet_id, appointment_date, status) values ('${R}', '${OWN}', now() + interval '9 days', 'scheduled')`],
  ["procedures", "medical.procedures", `update procedures set notes = 'probe' where resident_id = '${R}'`, `insert into procedures (resident_id, date, procedure_type_id) values ('${R}', current_date, (select id from pg_temp.ref_ids where k = 'procedure'))`],
  ["blood_tests", "medical.blood_tests", `update blood_tests set results = 'probe' where resident_id = '${R}'`, `insert into blood_tests (resident_id, date, blood_test_type_id) values ('${R}', current_date, (select id from pg_temp.ref_ids where k = 'blood'))`],
  ["prescriptions", "medical.prescriptions", `update prescriptions set notes = 'probe' where resident_id = '${R}'`, `insert into prescriptions (resident_id, medication_id, start_date) values ('${R}', ${MED}, current_date)`],
  ["immunization_records", "medical.immunizations", `update immunization_records set notes = 'probe' where resident_id = '${R}'`, `insert into immunization_records (resident_id, immunization_type_id, date_administered) values ('${R}', (select id from pg_temp.ref_ids where k = 'immunization'), current_date - 400)`],
  ["weight", "medical.weight", `update weight set notes = 'probe' where resident_id = '${R}'`, `insert into weight (resident_id, date, weight_kg) values ('${R}', current_date - 400, 5)`],
  ["resident_diets", "medical.diet", `update resident_diets set notes = 'probe' where resident_id = '${R}'`, `insert into resident_diets (resident_id, diet_type_id, start_date) values ('${R}', (select id from pg_temp.ref_ids where k = 'diet'), current_date - 400)`],
];

// expected per principal: [read, update, insert, delete], 1 = allowed
const EXPECT = {
  admin: [1, 1, 1, 1], management: [1, 1, 1, 0], staff: [1, 1, 1, 0],
  volunteer: [0, 0, 0, 0], norole: [0, 0, 0, 0], c_read: [1, 0, 0, 0], c_edit: [1, 1, 1, 0], c_scoped: [0, 0, 0, 0],
};

const cases = T.map(([table, act, upd, ins]) => ({
  table, act, upd, ins,
  read: `select 1 from ${table} where resident_id = '${R}'`,
  del: `delete from ${table} where resident_id = '${R}'`,
}));
const tableList = T.map((t) => `'${t[0]}'`).join(",");
const probes = [];
for (const c of cases) {
  for (const who of Object.keys(EXPECT)) {
    for (const [cmd, q] of [["read", c.read], ["update", c.upd], ["insert", c.ins], ["delete", c.del]]) {
      probes.push(`  perform pg_temp.probe('${who}', ${lit(ID[who])}, '${c.table}', '${cmd}', $q$${q}$q$);`);
    }
  }
  probes.push(`  perform pg_temp.probe('vet', ${lit(ID.vet)}, '${c.table}', 'read', $q$${c.read}$q$);`);
  probes.push(`  perform pg_temp.probe('vet', ${lit(ID.vet)}, '${c.table}', 'read_other_clinic', $q$${c.read.replace(R, R_OUT)}$q$);`);
}

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
begin
  -- the reference lists are not a volunteer's to read (0134), so a role that borrows the volunteer
  -- cannot look an id up under its own login; the ids are handed in here, and the foreign key checks
  -- still run as the table owner
  insert into diet_types (name, daily_qty_small, daily_qty_medium, daily_qty_large) select 'Harness diet', 1, 1, 1 where not exists (select 1 from diet_types);
  insert into ref_ids values ('procedure', (select id from procedure_types limit 1)), ('blood', (select id from blood_test_types limit 1)), ('immunization', (select id from immunization_types limit 1)), ('diet', (select id from diet_types limit 1)), ('medication', (select id from medication order by id limit 1));
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-pcm-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${P.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role)
    select id, who::app_role from (values ${["admin", "management", "staff", "volunteer", "vet"].map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  -- custom roles borrow the volunteer (the narrowest) as the Heads will
  insert into roles (key, name, kind, legacy_role, scope_clinical) values
    ('harness_pcm_read', 'Harness read', 'custom', 'volunteer', 'any'),
    ('harness_pcm_edit', 'Harness edit', 'custom', 'volunteer', 'any'),
    ('harness_pcm_scoped', 'Harness scoped', 'custom', 'volunteer', 'own_clinic');
  insert into role_permissions (role_id, activity, level)
    select r.id, a.key, case r.key when 'harness_pcm_read' then 1 else 2 end
      from roles r cross join permission_activities a
     where r.key like 'harness_pcm_%' and a.key like 'medical.%' and a.kind = 'level';
  insert into user_roles (user_id, role_id, role) select ${lit(ID.c_read)}, id, 'volunteer' from roles where key = 'harness_pcm_read';
  insert into user_roles (user_id, role_id, role) select ${lit(ID.c_edit)}, id, 'volunteer' from roles where key = 'harness_pcm_edit';
  insert into user_roles (user_id, role_id, role) select ${lit(ID.c_scoped)}, id, 'volunteer' from roles where key = 'harness_pcm_scoped';

  insert into vets (id, name, clinic_name) values (${lit(OWN)}, 'Harness own', 'Harness own'), (${lit(OTHER)}, 'Harness other', 'Harness other');
  insert into vet_doctors (name, user_id, vet_id) values ('Harness vet', ${lit(ID.vet)}, ${lit(OWN)});
  insert into residents (id, name, species) values (${lit(R)}, 'Harness in', 'Dog'), (${lit(R_OUT)}, 'Harness out', 'Dog');
  insert into vet_appointments (resident_id, vet_id, appointment_date, status) values
    (${lit(R)}, ${lit(OWN)}, now() - interval '3 days', 'completed'), (${lit(R_OUT)}, ${lit(OTHER)}, now() - interval '3 days', 'completed');
  insert into weight (resident_id, date, weight_kg) select id, current_date - 1, 5 from residents where id in (${lit(R)}, ${lit(R_OUT)});
  insert into blood_tests (resident_id, date, blood_test_type_id) select id, current_date, (select id from pg_temp.ref_ids where k = 'blood') from residents where id in (${lit(R)}, ${lit(R_OUT)});
  insert into procedures (resident_id, date, procedure_type_id) select id, current_date, (select id from pg_temp.ref_ids where k = 'procedure') from residents where id in (${lit(R)}, ${lit(R_OUT)});
  insert into prescriptions (resident_id, medication_id, start_date) select id, ${MED}, current_date from residents where id in (${lit(R)}, ${lit(R_OUT)});
  insert into immunization_records (resident_id, immunization_type_id, date_administered) select id, (select id from pg_temp.ref_ids where k = 'immunization'), current_date from residents where id in (${lit(R)}, ${lit(R_OUT)});
  insert into resident_diets (resident_id, diet_type_id, start_date) select id, (select id from pg_temp.ref_ids where k = 'diet'), current_date - 1 from residents where id in (${lit(R)}, ${lit(R_OUT)});
end $setup$;

do $run$ begin
${probes.join("\n")}
end $run$;

do $sweep$ begin
  insert into res select 'sweep', 'names_mgmt_or_staff', 'count', count(*) from pg_policies
   where schemaname = 'public' and tablename in (${tableList})
     and (policyname like 'management\\_%' or policyname like 'staff\\_%'
          or (coalesce(qual,'') || coalesce(with_check,'')) like '%''management''::app_role%'
          or (coalesce(qual,'') || coalesce(with_check,'')) like '%''staff''::app_role%');
  insert into res select 'sweep', 'bare_has_permission', 'count', count(*) from pg_policies
   where schemaname = 'public' and tablename in (${tableList}) and policyname like '%\\_perm'
     and (coalesce(qual,'') || coalesce(with_check,'')) ~ 'has_permission'
     and (coalesce(qual,'') || coalesce(with_check,'')) !~ 'SELECT has_permission';
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
for (const c of cases) {
  for (const [who, exp] of Object.entries(EXPECT)) {
    [["read", exp[0]], ["update", exp[1]], ["insert", exp[2]], ["delete", exp[3]]].forEach(([cmd, allowed]) => {
      const n = get(who, c.table, cmd);
      const label = `${c.table} ${cmd} as ${who}: ${allowed ? "allowed" : "refused"}`;
      if (n === -2) fail(`${label} — the statement itself errored (-2); the fixture is wrong, not the policy`);
      else if ((n >= 1) === Boolean(allowed)) pass(label);
      else fail(`${label} — got ${n}`);
    });
  }
  const own = get("vet", c.table, "read"), other = get("vet", c.table, "read_other_clinic");
  if (own >= 1) pass(`${c.table} read as vet, own clinic's resident`); else fail(`${c.table}: a vet lost the own-clinic resident (${own})`);
  if (other === 0) pass(`${c.table} read as vet, other clinic's resident: refused`); else fail(`${c.table}: a vet reads another clinic's resident (${other})`);
}
const sweep = (k) => get("sweep", k, "count");
if (sweep("names_mgmt_or_staff") === 0) pass("no policy on these tables names management or staff"); else fail(`${sweep("names_mgmt_or_staff")} policy(ies) still name management or staff`);
if (sweep("bare_has_permission") === 0) pass("every new policy wraps has_permission() in (select ...)"); else fail(`${sweep("bare_has_permission")} policy(ies) call has_permission() bare`);
if (sweep("perm_policies") === T.length * 3) pass(`${T.length * 3} new policies`); else fail(`expected ${T.length * 3} *_perm policies, found ${sweep("perm_policies")}`);
console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN (every converted table answers as the cells say; volunteer, no-role and scoped roles still see nothing; vets unchanged)");
process.exitCode = fails ? 1 : 0;
