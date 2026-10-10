// perm-convert-residents (0144): residents, placement_history and adoption_updates now answer
// through has_permission() + sees_all_residents(). Against DEV only, one transaction that is
// always rolled back, real rows, each login's own JWT.
//
//   node scripts/check-perm-convert-residents.mjs            (from the repo root; dev only)
//   node scripts/check-perm-convert-residents.mjs --verbose  (also list every case)
//
// As each principal (read, update, insert, delete) on each table:
//   management             residents / placement_history: read, update, insert, no delete (C2 closed);
//                          adoption_updates: all four (Edit includes delete, A8)
//   admin                  everything (admin_all_* on residents/placement_history; has_permission() on adoption_updates)
//   volunteer, no role     nothing (0134 took the volunteer's table read; it reads resident_who_and_where)
//   vet (doctor, 0172)     reads the in-clinic resident's rows and NOT another clinic's; writes nothing
//   custom, borrows the volunteer, Read or Edit cells   NOTHING: a role on the who-and-where floor is
//                          never handed the whole record by a cell (this is what sees_all_residents() is for)
//   custom, borrows management, Read cells     reads, writes nothing
//   custom, borrows management, Edit cells     reads, updates, inserts; adoption_updates deletes; no other deletes
//   custom, borrows management, placement.move only   inserts a ChangeEnclosure row and no other placement type
//   custom, borrows management, own_clinic scope      nothing: a scoped role is never handed the whole table
// Staff, which answered exactly as management, left when 0173 retired the role; the custom roles that borrowed staff
// borrow management now (no policy on these tables names either: the sweep below).
// Then structural sweeps: no policy on these tables still names management or staff, and every
// new policy calls has_permission() inside a (select ...) init-plan.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const verbose = process.argv.includes("--verbose");
const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const lit = (id) => `'${id}'::uuid`;
const P = ["admin", "management", "volunteer", "norole", "vet", "c_vol_read", "c_vol_edit", "c_st_read", "c_st_edit", "c_st_move", "c_scoped"];
const ID = Object.fromEntries(P.map((p) => [p, randomUUID()]));
const DOC = randomUUID(), R_BARE = randomUUID(), R = randomUUID(), R_OUT = randomUUID(), OWN = randomUUID(), OTHER = randomUUID();
const ENC = "(select id from pg_temp.ref_ids where k = 'enclosure')";
const placement = (type, extra = "", resident = R) => `insert into placement_history (resident_id, placement_type, start_date${extra ? ", enclosure_id" : ""}) values ('${resident}', '${type}', now() + interval '1 minute'${extra ? `, ${ENC}` : ""})`;

// table, update statement, insert statement (against resident R), whether delete is an act of the cell
const T = [
  { table: "residents", read: `select 1 from residents where id = '${R}'`, upd: `update residents set bio = 'probe' where id = '${R}'`, ins: `insert into residents (name, species) values ('Harness new', 'Dog')`, del: `delete from residents where id = '${R_BARE}'`, deleteIsAct: false },
  { table: "placement_history", read: `select 1 from placement_history where resident_id = '${R}'`, upd: `update placement_history set notes = 'probe' where resident_id = '${R}'`, ins: placement("ChangeEnclosure", "enc"), del: `delete from placement_history where resident_id = '${R}'`, deleteIsAct: false },
  { table: "adoption_updates", read: `select 1 from adoption_updates where resident_id = '${R}'`, upd: `update adoption_updates set received_on = received_on where resident_id = '${R}'`, ins: `insert into adoption_updates (resident_id, received_on, channel) values ('${R}', current_date, 'visit')`, del: `delete from adoption_updates where resident_id = '${R}'`, deleteIsAct: true },
];

// expected per principal: [read, update, insert, delete], 1 = allowed. `d` is the delete answer for a
// table whose delete is an act of the cell (adoption_updates).
const EXPECT = {
  admin: { all: [1, 1, 1, 1] },
  management: { all: [1, 1, 1, 0], act: 1 },
  volunteer: { all: [0, 0, 0, 0] }, norole: { all: [0, 0, 0, 0] },
  c_vol_read: { all: [0, 0, 0, 0] }, c_vol_edit: { all: [0, 0, 0, 0] },
  c_st_read: { all: [1, 0, 0, 0] }, c_st_edit: { all: [1, 1, 1, 0], act: 1 }, c_st_move: { all: [1, 0, 0, 0] },
  c_scoped: { all: [0, 0, 0, 0] },
};
const expected = (who, t) => {
  const e = EXPECT[who];
  const row = [...e.all];
  if (t.deleteIsAct && e.act !== undefined) row[3] = e.act;
  // c_st_move holds placement.move only, so on placement_history it may insert a ChangeEnclosure row
  if (who === "c_st_move" && t.table === "placement_history") row[2] = 1;
  // it holds no adoption_news cell at all
  if (who === "c_st_move" && t.table === "adoption_updates") return [0, 0, 0, 0];
  return row;
};

const probes = [];
for (const t of T) {
  for (const who of Object.keys(EXPECT)) {
    for (const [cmd, q] of [["read", t.read], ["update", t.upd], ["insert", t.ins], ["delete", t.del]]) {
      probes.push(`  perform pg_temp.probe('${who}', ${lit(ID[who])}, '${t.table}', '${cmd}', $q$${q}$q$);`);
    }
  }
  probes.push(`  perform pg_temp.probe('vet', ${lit(ID.vet)}, '${t.table}', 'read', $q$${t.read}$q$);`);
  probes.push(`  perform pg_temp.probe('vet', ${lit(ID.vet)}, '${t.table}', 'read_other_clinic', $q$${t.read.replaceAll(R, R_OUT)}$q$);`);
  for (const cmd of ["update", "insert", "delete"]) {
    const q = { update: t.upd, insert: t.ins, delete: t.del }[cmd];
    probes.push(`  perform pg_temp.probe('vet', ${lit(ID.vet)}, '${t.table}', 'vet_${cmd}', $q$${q}$q$);`);
  }
}
// placement_history insert by type: the activity of the row's type, nothing else
const TYPES = [
  ["Intake", "resident.register"], ["ChangeEnclosure", "placement.move"], ["SendToHospital", "placement.hospital"],
  ["Foster", "placement.rehome"], ["Deceased", "placement.death"], ["DeceasedInError", "placement.death_withdraw"],
];
for (const [type] of TYPES) {
  for (const who of ["management", "c_st_edit", "c_st_move", "admin"]) {
    probes.push(`  perform pg_temp.probe('${who}', ${lit(ID[who])}, 'placement_history', 'type_${type}', $q$${type === "Intake" ? placement(type, "enc", R_BARE) : placement(type, type === "ChangeEnclosure" ? "enc" : "")}$q$);`);
  }
}
const tableList = T.map((t) => `'${t.table}'`).join(",");

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
  -- enclosures are not a borrower-of-the-volunteer's to look up by id under another table's policy, so the id is handed in
  insert into ref_ids values ('enclosure', (select id from enclosures order by id limit 1));
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-pcr-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${P.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role)
    select id, who::app_role from (values ${[["admin", "admin"], ["management", "management"], ["volunteer", "volunteer"], ["vet", "doctor"]].map(([p, r]) => `('${r}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  -- custom roles: two borrow the volunteer (the floor the Heads and the 2IC stand on), four borrow management (staff until 0173)
  insert into roles (key, name, kind, legacy_role, scope_residents) values
    ('harness_pcr_vol_read', 'Harness vol read', 'custom', 'volunteer', 'all'),
    ('harness_pcr_vol_edit', 'Harness vol edit', 'custom', 'volunteer', 'all'),
    ('harness_pcr_st_read',  'Harness staff read', 'custom', 'management', 'all'),
    ('harness_pcr_st_edit',  'Harness staff edit', 'custom', 'management', 'all'),
    ('harness_pcr_st_move',  'Harness staff move', 'custom', 'management', 'all'),
    ('harness_pcr_scoped',   'Harness scoped', 'custom', 'management', 'own_clinic');
  insert into role_permissions (role_id, activity, level)
    select r.id, a.key,
           case when r.key in ('harness_pcr_vol_read', 'harness_pcr_st_read') then 1 else 2 end
      from roles r cross join permission_activities a
     where r.key in ('harness_pcr_vol_read', 'harness_pcr_vol_edit', 'harness_pcr_st_read', 'harness_pcr_st_edit', 'harness_pcr_scoped')
       and (a.key like 'resident.%' or a.key like 'placement.%') and a.key <> 'placement.death_withdraw'
       -- a Read role holds only the Read-able activities; a Yes/No cell has no Read
       and (a.kind = 'level' or r.key not in ('harness_pcr_vol_read', 'harness_pcr_st_read'));
  -- the move-only role: Read on the record (to see the resident) and the one housing act
  insert into role_permissions (role_id, activity, level)
    select r.id, v.act, v.lvl from roles r, (values ('resident.record', 1), ('placement.move', 2)) as v(act, lvl) where r.key = 'harness_pcr_st_move';
  insert into user_roles (user_id, role_id, role) select ${lit(ID.c_vol_read)}, id, 'volunteer' from roles where key = 'harness_pcr_vol_read';
  insert into user_roles (user_id, role_id, role) select ${lit(ID.c_vol_edit)}, id, 'volunteer' from roles where key = 'harness_pcr_vol_edit';
  insert into user_roles (user_id, role_id, role) select ${lit(ID.c_st_read)}, id, 'management' from roles where key = 'harness_pcr_st_read';
  insert into user_roles (user_id, role_id, role) select ${lit(ID.c_st_edit)}, id, 'management' from roles where key = 'harness_pcr_st_edit';
  insert into user_roles (user_id, role_id, role) select ${lit(ID.c_st_move)}, id, 'management' from roles where key = 'harness_pcr_st_move';
  insert into user_roles (user_id, role_id, role) select ${lit(ID.c_scoped)}, id, 'management' from roles where key = 'harness_pcr_scoped';
  -- placement.death_withdraw is deliberately given to nobody custom: the c_st_edit insert of that type must be refused

  -- 0172: clinics / doctors + doctor_clinics / clinic_visits (were vets / vet_doctors / vet_appointments)
  insert into clinics (id, name) values (${lit(OWN)}, 'Harness own'), (${lit(OTHER)}, 'Harness other');
  insert into doctors (id, name, user_id) values (${lit(DOC)}, 'Harness doctor', ${lit(ID.vet)});
  insert into doctor_clinics (clinic_id, doctor_id) values (${lit(OWN)}, ${lit(DOC)});
  insert into residents (id, name, species) values (${lit(R)}, 'Harness in', 'Dog'), (${lit(R_OUT)}, 'Harness out', 'Dog'), (${lit(R_BARE)}, 'Harness bare', 'Dog');
  insert into clinic_visits (resident_id, clinic_id, appointment_date, status) values
    (${lit(R)}, ${lit(OWN)}, now() - interval '3 days', 'completed'), (${lit(R_OUT)}, ${lit(OTHER)}, now() - interval '3 days', 'completed');
  insert into placement_history (resident_id, placement_type, start_date, enclosure_id)
    select id, 'Intake', now() - interval '5 days', (select id from pg_temp.ref_ids where k = 'enclosure') from residents where id in (${lit(R)}, ${lit(R_OUT)});
  insert into adoption_updates (resident_id, received_on, channel) select id, current_date - 3, 'visit' from residents where id in (${lit(R)}, ${lit(R_OUT)});
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
  insert into res select 'sweep', 'perm_without_scope', 'count', count(*) from pg_policies
   where schemaname = 'public' and tablename in (${tableList}) and policyname like '%\\_perm'
     and (coalesce(qual,'') || coalesce(with_check,'')) !~ 'sees_all_residents';
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
for (const t of T) {
  for (const who of Object.keys(EXPECT)) {
    const exp = expected(who, t);
    [["read", exp[0]], ["update", exp[1]], ["insert", exp[2]], ["delete", exp[3]]].forEach(([cmd, allowed]) => {
      const n = get(who, t.table, cmd);
      const label = `${t.table} ${cmd} as ${who}: ${allowed ? "allowed" : "refused"}`;
      if (n === -2) fail(`${label} — the statement itself errored (-2); the fixture is wrong, not the policy`);
      else if ((n >= 1) === Boolean(allowed)) pass(label);
      else fail(`${label} — got ${n}`);
    });
  }
  const own = get("vet", t.table, "read"), other = get("vet", t.table, "read_other_clinic");
  if (own >= 1) pass(`${t.table} read as vet, own clinic's resident`); else fail(`${t.table}: a vet lost the own-clinic resident (${own})`);
  if (other === 0) pass(`${t.table} read as vet, other clinic's resident: refused`); else fail(`${t.table}: a vet reads another clinic's resident (${other})`);
  for (const cmd of ["update", "insert", "delete"]) {
    const n = get("vet", t.table, `vet_${cmd}`);
    if (n === -2) fail(`${t.table} ${cmd} as vet: the statement itself errored (-2)`);
    else if (n >= 1) fail(`${t.table} ${cmd} as vet: allowed (${n}), a vet writes none of these`);
    else pass(`${t.table} ${cmd} as vet: refused`);
  }
}
// placement_history insert by type
const ALLOWED_TYPES = {
  management: ["Intake", "ChangeEnclosure", "SendToHospital", "Foster", "Deceased"],
  c_st_edit: ["Intake", "ChangeEnclosure", "SendToHospital", "Foster", "Deceased"], c_st_move: ["ChangeEnclosure"],
  admin: ["Intake", "ChangeEnclosure", "SendToHospital", "Foster", "Deceased", "DeceasedInError"],
};
for (const [type, act] of TYPES) {
  for (const [who, list] of Object.entries(ALLOWED_TYPES)) {
    const n = get(who, "placement_history", `type_${type}`);
    const allowed = list.includes(type);
    const label = `placement_history insert of ${type} (${act}) as ${who}: ${allowed ? "allowed" : "refused"}`;
    if (n === -2) fail(`${label} — the statement itself errored (-2); the fixture is wrong, not the policy`);
    else if ((n >= 1) === allowed) pass(label);
    else fail(`${label} — got ${n}`);
  }
}
const sweep = (k) => get("sweep", k, "count");
if (sweep("names_mgmt_or_staff") === 0) pass("no policy on these tables names management or staff"); else fail(`${sweep("names_mgmt_or_staff")} policy(ies) still name management or staff`);
if (sweep("bare_has_permission") === 0) pass("every new policy wraps has_permission() in (select ...)"); else fail(`${sweep("bare_has_permission")} policy(ies) call has_permission() bare`);
if (sweep("perm_policies") === 10) pass("10 new policies (3 + 3 + 4)"); else fail(`expected 10 *_perm policies, found ${sweep("perm_policies")}`);
if (sweep("perm_without_scope") === 0) pass("every new policy also asks sees_all_residents()"); else fail(`${sweep("perm_without_scope")} policy(ies) do not ask sees_all_residents()`);
console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN (the three resident tables answer as the cells say; the volunteer floor and scoped roles see nothing; vets unchanged)");
process.exitCode = fails ? 1 : 0;
