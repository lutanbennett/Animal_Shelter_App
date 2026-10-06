// photo-split (0152): attachments, maintenance_photos and project_photos now answer through has_permission(),
// and a resident photo is filed outside Medical only by a login that may publish (A5). Against DEV only, one
// transaction that is always rolled back, real rows, each login's own JWT.
//
//   node scripts/check-perm-convert-photos.mjs            (from the repo root; dev only)
//   node scripts/check-perm-convert-photos.mjs --verbose  (also list every case)
//
// 1. A resident's photo row, eight statements per principal: read, insert into Medical, insert into Shelter, caption
//    a Shelter row, caption a Medical row, refile Medical to Shelter, refile Shelter into Medical, delete.
//    Principals: admin, management, staff, volunteer, no role, a vet (own clinic), and ten configured roles that
//    each hold a different combination of photos.resident_add / manage / publish / scope_photos.
// 2. The other four owner types (maintenance, project, blood_test, procedure) on `attachments`.
// 3. maintenance_photos and project_photos, four commands.
// 4. The security-definer functions: delete_resident_photo, set_resident_profile_photo, record_attachment (Medical,
//    Shelter, and an adopter's photo). record_attachment as a vet into Shelter is the Security backlog item.
// 5. Structural sweeps.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const verbose = process.argv.includes("--verbose");
const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const lit = (id) => `'${id}'::uuid`;
const P = ["admin", "management", "staff", "volunteer", "norole", "vet",
  "c_vol_all", "c_add", "c_nopub", "c_nomanage", "c_all", "c_medonly", "c_maint", "c_proj", "c_bt", "c_pr"];
const ID = Object.fromEntries(P.map((p) => [p, randomUUID()]));
const R = randomUUID(), R_OUT = randomUUID(), OWN = randomUUID(), OTHER = randomUUID();
const A_SH = randomUUID(), A_MED = randomUUID(), A_MAINT = randomUUID(), A_PROJ = randomUUID(), A_BT = randomUUID(), A_PR = randomUUID();
const MP = randomUUID(), PP = randomUUID(), BT = randomUUID(), PR = randomUUID(), UPD = randomUUID();
const JOB = "(select id from pg_temp.ref_ids where k = 'job')";
const PROJECT = "(select id from pg_temp.ref_ids where k = 'project')";

// [read, ins_med, ins_shelter, upd_shelter, upd_med, refile_out, refile_in, delete]
const RES_STMTS = {
  read: `select 1 from attachments where id = '${A_SH}'`,
  ins_med: `insert into attachments (owner_type, owner_id, sub_folder, drive_file_id) values ('resident', '${R}', 'Medical', 'h-ins-med')`,
  ins_shelter: `insert into attachments (owner_type, owner_id, sub_folder, drive_file_id) values ('resident', '${R}', 'Shelter', 'h-ins-sh')`,
  upd_shelter: `update attachments set caption = 'p' where id = '${A_SH}'`,
  upd_med: `update attachments set caption = 'p' where id = '${A_MED}'`,
  refile_out: `update attachments set sub_folder = 'Shelter' where id = '${A_MED}'`,
  refile_in: `update attachments set sub_folder = 'Medical' where id = '${A_SH}'`,
  delete: `delete from attachments where id = '${A_SH}'`,
};
const ORDER = Object.keys(RES_STMTS);
const ALL = [1, 1, 1, 1, 1, 1, 1, 1], NONE = [0, 0, 0, 0, 0, 0, 0, 0];
const RES_EXPECT = {
  admin: ALL, management: ALL, staff: ALL,
  volunteer: NONE, norole: NONE,
  // The vet's own policies are unchanged; the new restrictive guard is what stops the Shelter folder (A5).
  // delete is vet_delete_attachments, left for the Vet conversion.
  vet: [1, 1, 0, 0, 1, 0, 1, 1],
  c_vol_all: NONE,          // every photo cell, on the volunteer floor: the table answers nothing
  c_add: [1, 1, 0, 0, 0, 0, 0, 0],
  c_nopub: [1, 1, 0, 0, 1, 0, 1, 1],
  c_nomanage: [1, 1, 1, 0, 0, 0, 0, 0],
  c_all: ALL,
  c_medonly: [1, 1, 0, 0, 1, 0, 1, 1],
  c_maint: NONE, c_proj: NONE, c_bt: NONE, c_pr: NONE,
};

// other owner types: [read, insert, update, delete]
const OT = {
  maintenance: { id: A_MAINT, ins: `insert into attachments (owner_type, owner_id, drive_file_id) values ('maintenance', ${JOB}, 'h-m')` },
  project: { id: A_PROJ, ins: `insert into attachments (owner_type, owner_id, drive_file_id) values ('project', ${PROJECT}, 'h-p')` },
  blood_test: { id: A_BT, ins: `insert into attachments (owner_type, owner_id, drive_file_id) values ('blood_test', '${BT}', 'h-b')` },
  procedure: { id: A_PR, ins: `insert into attachments (owner_type, owner_id, drive_file_id) values ('procedure', '${PR}', 'h-r')` },
};
const OT_STMTS = (o) => ({
  read: `select 1 from attachments where id = '${OT[o].id}'`, ins: OT[o].ins,
  upd: `update attachments set caption = 'p' where id = '${OT[o].id}'`, del: `delete from attachments where id = '${OT[o].id}'`,
});
const ON = [1, 1, 1, 1], OFF = [0, 0, 0, 0];
const OT_EXPECT = {
  maintenance: { admin: ON, management: ON, staff: ON, volunteer: OFF, norole: OFF, c_add: OFF, c_all: OFF, c_maint: ON, c_proj: OFF, c_bt: OFF, c_pr: OFF, vet: ON /* vet_* policies, unchanged */ },
  project: { admin: ON, management: ON, staff: ON, volunteer: OFF, norole: OFF, c_add: OFF, c_all: OFF, c_maint: OFF, c_proj: ON, c_bt: OFF, c_pr: OFF, vet: ON },
  blood_test: { admin: ON, management: ON, staff: ON, volunteer: OFF, norole: OFF, c_add: OFF, c_all: OFF, c_maint: OFF, c_proj: OFF, c_bt: ON, c_pr: OFF },
  procedure: { admin: ON, management: ON, staff: ON, volunteer: OFF, norole: OFF, c_add: OFF, c_all: OFF, c_maint: OFF, c_proj: OFF, c_bt: OFF, c_pr: ON },
};

// photo tables: [read, insert, update, delete]
const PT = {
  maintenance_photos: { read: `select 1 from maintenance_photos where id = '${MP}'`, ins: `insert into maintenance_photos (maintenance_id, drive_file_id) values (${JOB}, 'h-mp')`, upd: `update maintenance_photos set drive_file_id = 'h-mp2' where id = '${MP}'`, del: `delete from maintenance_photos where id = '${MP}'`, cell: "c_maint" },
  project_photos: { read: `select 1 from project_photos where id = '${PP}'`, ins: `insert into project_photos (project_folder_id, drive_file_id) values (${PROJECT}, 'h-pp')`, upd: `update project_photos set drive_file_id = 'h-pp2' where id = '${PP}'`, del: `delete from project_photos where id = '${PP}'`, cell: "c_proj" },
};
const PT_WHO = ["admin", "management", "staff", "volunteer", "norole", "vet", "c_add", "c_all", "c_maint", "c_proj"];
const ptExpect = (who, t) => (["admin", "management", "staff"].includes(who) || who === PT[t].cell ? ON : OFF);

// functions: yes = who may
const FN = {
  delete_resident_photo: { sql: `select delete_resident_photo('${A_SH}')`, yes: ["admin", "management", "staff", "c_nopub", "c_all", "c_medonly"] },
  set_resident_profile_photo: { sql: `select set_resident_profile_photo('${R}', 'h-sh-file')`, yes: ["admin", "management", "staff", "c_nopub", "c_all", "c_medonly"] },
  record_attachment_medical: { sql: `select record_attachment('resident', '${R}', 'h-rec-med', 'p.jpg', 'Medical', null, null)`, yes: ["admin", "management", "staff", "vet", "c_add", "c_nopub", "c_nomanage", "c_all", "c_medonly", "c_vol_all"] },
  record_attachment_shelter: { sql: `select record_attachment('resident', '${R}', 'h-rec-sh', 'p.jpg', 'Shelter', null, null)`, yes: ["admin", "management", "staff", "c_nomanage", "c_all", "c_vol_all"] },
  record_attachment_adopter: { sql: `select record_attachment('resident', '${R}', 'h-rec-ad', 'p.jpg', '20261001', null, '${UPD}')`, yes: ["admin", "management", "staff", "c_nomanage", "c_all", "c_vol_all"] },
};
const FN_WHO = ["admin", "management", "staff", "volunteer", "norole", "vet", "c_vol_all", "c_add", "c_nopub", "c_nomanage", "c_all", "c_medonly"];

const probes = [];
const push = (who, tbl, cmd, q) => probes.push(`  perform pg_temp.probe('${who}', ${lit(ID[who])}, '${tbl}', '${cmd}', $q$${q}$q$);`);
for (const who of Object.keys(RES_EXPECT)) for (const k of ORDER) push(who, "res", k, RES_STMTS[k]);
for (const o of Object.keys(OT)) for (const who of Object.keys(OT_EXPECT[o])) for (const [k, q] of Object.entries(OT_STMTS(o))) push(who, o, k, q);
for (const t of Object.keys(PT)) for (const who of PT_WHO) for (const k of ["read", "ins", "upd", "del"]) push(who, t, k, PT[t][k]);
for (const f of Object.keys(FN)) for (const who of FN_WHO) push(who, f, "call", FN[f].sql);

const roleRows = [
  // key, legacy, scope_photos
  ["c_vol_all", "volunteer", "all"], ["c_add", "staff", "all"], ["c_nopub", "staff", "all"], ["c_nomanage", "staff", "all"],
  ["c_all", "staff", "all"], ["c_medonly", "staff", "medical_only"], ["c_maint", "staff", "all"], ["c_proj", "staff", "all"],
  ["c_bt", "staff", "all"], ["c_pr", "staff", "all"],
];
const CELLS = {
  c_vol_all: [["resident.record", 1], ["photos.resident_add", 2], ["photos.resident_manage", 2], ["photos.resident_publish", 2]],
  c_add: [["resident.record", 1], ["photos.resident_add", 2]],
  c_nopub: [["resident.record", 1], ["photos.resident_add", 2], ["photos.resident_manage", 2]],
  c_nomanage: [["resident.record", 1], ["photos.resident_add", 2], ["photos.resident_publish", 2]],
  c_all: [["resident.record", 1], ["photos.resident_add", 2], ["photos.resident_manage", 2], ["photos.resident_publish", 2]],
  c_medonly: [["resident.record", 1], ["photos.resident_add", 2], ["photos.resident_manage", 2], ["photos.resident_publish", 2]],
  c_maint: [["maintenance.photos", 2]], c_proj: [["projects.photos", 2]],
  c_bt: [["medical.blood_tests", 2]], c_pr: [["medical.procedures", 2]],
};
const tableList = "'attachments','maintenance_photos','project_photos'";

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
  insert into ref_ids values ('job', (select id from maintenance order by id limit 1)), ('project', (select id from project_folders where parent_folder_id is not null order by id limit 1));
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-ps-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${P.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role)
    select id, who::app_role from (values ${["admin", "management", "staff", "volunteer", "vet"].map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into roles (key, name, kind, legacy_role, scope_residents, scope_clinical, scope_photos) values
    ${roleRows.map(([k, l, s]) => `('harness_ps_${k}', 'Harness ${k}', 'custom', '${l}', 'all', 'any', '${s}')`).join(",\n    ")};
  insert into role_permissions (role_id, activity, level)
    select r.id, v.act, v.lvl from roles r join (values ${Object.entries(CELLS).flatMap(([k, cs]) => cs.map(([a, l]) => `('harness_ps_${k}', '${a}', ${l})`)).join(",")}) as v(rk, act, lvl) on r.key = v.rk;
  insert into user_roles (user_id, role_id, role)
    select u.id, r.id, r.legacy_role from (values ${roleRows.map(([k]) => `('harness_ps_${k}', ${lit(ID[k])})`).join(",")}) as u(rk, id) join roles r on r.key = u.rk;

  insert into vets (id, name, clinic_name) values (${lit(OWN)}, 'Harness own', 'Harness own'), (${lit(OTHER)}, 'Harness other', 'Harness other');
  insert into vet_doctors (name, user_id, vet_id) values ('Harness vet', ${lit(ID.vet)}, ${lit(OWN)});
  insert into residents (id, name, species) values (${lit(R)}, 'Harness in', 'Dog'), (${lit(R_OUT)}, 'Harness out', 'Dog');
  insert into vet_appointments (resident_id, vet_id, appointment_date, status) values
    (${lit(R)}, ${lit(OWN)}, now() - interval '3 days', 'completed'), (${lit(R_OUT)}, ${lit(OTHER)}, now() - interval '3 days', 'completed');
  insert into adoption_updates (id, resident_id, received_on, channel) values (${lit(UPD)}, ${lit(R)}, current_date - 3, 'visit');
  insert into blood_tests (id, resident_id, date, blood_test_type_id) values (${lit(BT)}, ${lit(R)}, current_date, (select id from blood_test_types limit 1));
  insert into procedures (id, resident_id, date, procedure_type_id) values (${lit(PR)}, ${lit(R)}, current_date, (select id from procedure_types limit 1));
  insert into attachments (id, owner_type, owner_id, sub_folder, drive_file_id) values
    (${lit(A_SH)}, 'resident', ${lit(R)}, 'Shelter', 'h-sh-file'), (${lit(A_MED)}, 'resident', ${lit(R)}, 'Medical', 'h-med-file'),
    (${lit(A_MAINT)}, 'maintenance', ${JOB}, null, 'h-m-file'), (${lit(A_PROJ)}, 'project', ${PROJECT}, null, 'h-p-file'),
    (${lit(A_BT)}, 'blood_test', ${lit(BT)}, null, 'h-b-file'), (${lit(A_PR)}, 'procedure', ${lit(PR)}, null, 'h-r-file');
  insert into maintenance_photos (id, maintenance_id, drive_file_id) values (${lit(MP)}, ${JOB}, 'h-mp-file');
  insert into project_photos (id, project_folder_id, drive_file_id) values (${lit(PP)}, ${PROJECT}, 'h-pp-file');
end $setup$;

do $run$ begin
${probes.join("\n")}
end $run$;

do $sweep$ begin
  insert into res select 'sweep', 'names_role', 'count', count(*) from pg_policies
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
  insert into res select 'sweep', 'restrictive_guards', 'count', count(*) from pg_policies
   where schemaname = 'public' and tablename = 'attachments' and permissive = 'RESTRICTIVE' and policyname like '%\\_folder\\_guard';
  insert into res select 'sweep', 'role_named_anywhere', 'count', count(*) from pg_policies
   where schemaname = 'public'
     and ((coalesce(qual,'') || coalesce(with_check,'')) like '%''management''::app_role%'
          or (coalesce(qual,'') || coalesce(with_check,'')) like '%''staff''::app_role%');
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
const check = (who, tbl, cmd, allowed, label) => {
  const n = get(who, tbl, cmd);
  const l = `${label} as ${who}: ${allowed ? "allowed" : "refused"}`;
  if (n === -2 && allowed) fail(`${l} — the statement itself errored (-2)`);
  // A refused read, update or delete is zero rows; an error there means the fixture is wrong, not the policy.
  else if (n === -2 && !/(^|[^a-z])ins/.test(cmd) && cmd !== "call") fail(`${l} — errored (-2) where a refusal is zero rows; the fixture is wrong`);
  else if ((n >= 1) === Boolean(allowed)) pass(l);
  else fail(`${l} — got ${n}`);
};
for (const [who, exp] of Object.entries(RES_EXPECT)) ORDER.forEach((k, i) => check(who, "res", k, exp[i], `resident photo ${k}`));
for (const [o, byWho] of Object.entries(OT_EXPECT)) for (const [who, exp] of Object.entries(byWho)) ["read", "ins", "upd", "del"].forEach((k, i) => check(who, o, k, exp[i], `${o} attachment ${k}`));
for (const t of Object.keys(PT)) for (const who of PT_WHO) { const exp = ptExpect(who, t); ["read", "ins", "upd", "del"].forEach((k, i) => check(who, t, k, exp[i], `${t} ${k}`)); }
for (const [f, def] of Object.entries(FN)) for (const who of FN_WHO) check(who, f, "call", def.yes.includes(who), `${f}()`);
const sweep = (k) => get("sweep", k, "count");
if (sweep("names_role") === 0) pass("no policy on these tables names management or staff"); else fail(`${sweep("names_role")} policy(ies) still name management or staff`);
if (sweep("role_named_anywhere") === 0) pass("no policy in the database names management or staff"); else fail(`${sweep("role_named_anywhere")} policy(ies) in the database still name management or staff`);
if (sweep("bare_has_permission") === 0) pass("every new policy wraps has_permission() in (select ...)"); else fail(`${sweep("bare_has_permission")} policy(ies) call has_permission() bare`);
if (sweep("perm_policies") === 12) pass("12 *_perm policies (4 + 4 + 4)"); else fail(`expected 12 *_perm policies, found ${sweep("perm_policies")}`);
if (sweep("restrictive_guards") === 2) pass("2 restrictive folder guards on attachments"); else fail(`expected 2 restrictive folder guards, found ${sweep("restrictive_guards")}`);
console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN (the photo tables answer as the cells say; only a login that may publish files outside Medical; the volunteer floor sees nothing)");
process.exitCode = fails ? 1 : 0;
