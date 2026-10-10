// maintenance-role (0141): the Head of Maintenance, the second configured role. Against DEV only, one
// transaction that is always rolled back, each login's own JWT.
//
//   node scripts/check-maintenance-role.mjs            (from the repo root; dev only)
//   node scripts/check-maintenance-role.mjs --verbose  (also list every passing check)
//
// What it holds, for six principals (the Head of Maintenance "hm", admin, management, volunteer,
// a doctor, no role):
//   her board     she reads maintenance, a job's team, its Thai title, zones, enclosures, the people list,
//                 who-and-where; a volunteer, a doctor and no role read none of the three job tables
//   her work      she creates, changes, completes and assigns a job (and removes a team member)
//   her limits    she cannot delete a job, add a photo or file to one, set up a recurring task, reassign
//                 one, or read a resident's record, medication, weight, diet, stock or contacts
//   her own tasks record_recurring_job() accepts her on a task she is assigned to and refuses her on one
//                 she is not
//   controls      admin and management still read and write what they did before (staff left the
//                 principals when 0173 retired it; a live staff login can no longer be made)
//   the cells     role_permissions of head_of_maintenance are exactly the union of its jobs in jobs.ts
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const verbose = process.argv.includes("--verbose");
const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);
const { bundleOfRole } = await import(pathToFileURL(join(process.cwd(), "src/lib/permissions/jobs.ts")).href);

const lit = (id) => `'${id}'::uuid`;
const P = ["hm", "admin", "management", "volunteer", "doctor", "norole"];
const ID = Object.fromEntries(P.map((p) => [p, randomUUID()]));
const R = randomUUID(), OWN = randomUUID(), ZONE = randomUUID(), ENC = randomUUID(), JOB = randomUUID();
const RJ_MINE = randomUUID(), RJ_OTHER = randomUUID();

const NONE = { hm: 0, admin: 0, management: 0, volunteer: 0, doctor: 0, norole: 0 };
const STAFF_UP = { ...NONE, admin: 1, management: 1 };
const WITH_HM = { ...STAFF_UP, hm: 1 };
// 0174: a doctor reaches only the three clinical owner types of attachments, and residents' translations, so a
// job's attachments and translations are refused to it (they were doctor_*_attachments' fallthrough, 0110-0172).
const MANAGERS = { ...NONE, admin: 1, management: 1 };

// [name, sql, expectation]: a table of who may (1) or may not (0); "hm-one" = she must reach at least a row
// (the others are not asserted); "hm-zero" = only she is asserted, and she must reach nothing
const probes = [
  // her board
  ["maintenance", `select 1 from maintenance where id = '${JOB}'`, WITH_HM],
  ["maintenance_assignees", `select 1 from maintenance_assignees where maintenance_id = '${JOB}'`, WITH_HM],
  ["translations of a job", `select 1 from translations where table_name = 'maintenance' and row_id = '${JOB}'`, WITH_HM],
  ["translations of anything else", `select 1 from translations where table_name <> 'maintenance'`, "hm-zero"],
  ["zones", `select 1 from zones where id = '${ZONE}'`, "hm-one"],
  ["enclosures", `select 1 from enclosures where id = '${ENC}'`, "hm-one"],
  ["app_users", `select 1 from app_users limit 1`, "hm-one"],
  ["resident_who_and_where", `select 1 from resident_who_and_where where id = '${R}'`, { ...NONE, hm: 1, volunteer: 1 }],
  ["recurring_jobs", `select 1 from recurring_jobs where id = '${RJ_MINE}'`, "hm-one"],
  ["recurring_job_assignees", `select 1 from recurring_job_assignees where job_id = '${RJ_MINE}'`, "hm-one"],
  // her work
  ["insert maintenance", `insert into maintenance (title, zone_id) values ('probe', '${ZONE}')`, WITH_HM],
  ["update maintenance", `update maintenance set description = 'probe' where id = '${JOB}'`, WITH_HM],
  ["complete a job", `update maintenance set status = 'Completed' where id = '${JOB}'`, WITH_HM],
  ["move a job on", `update maintenance set status = 'In Progress' where id = '${JOB}'`, WITH_HM],
  ["assign a job", `insert into maintenance_assignees (maintenance_id, user_id) values ('${JOB}', '${ID.volunteer}')`, WITH_HM],
  ["unassign a job", `delete from maintenance_assignees where maintenance_id = '${JOB}'`, WITH_HM],
  // her limits
  ["delete a job", `delete from maintenance where id = '${JOB}'`, STAFF_UP],
  // RE-BASELINED 2026-10-07 (photo-split, 0152): the draft gives her maintenance.photos and the policies now follow the cell
  ["add a job photo", `insert into maintenance_photos (maintenance_id, drive_file_id) values ('${JOB}', 'probe')`, WITH_HM],
  ["file a job attachment", `insert into attachments (owner_type, owner_id, drive_file_id, file_name) values ('maintenance', '${JOB}', 'probe', 'probe.jpg')`, WITH_HM],
  ["set up a recurring task", `insert into recurring_jobs (title, repeat, weekdays) values ('probe', 'weekly', '{1}')`, MANAGERS],
  ["change a recurring task", `update recurring_jobs set title = 'probe' where id = '${RJ_MINE}'`, MANAGERS],
  ["assign a recurring task", `insert into recurring_job_assignees (job_id, user_id) values ('${RJ_MINE}', '${ID.volunteer}')`, MANAGERS],
  ["reassign a recurring date", `select reassign_recurring_job('${RJ_MINE}', current_date, array['${ID.volunteer}'::uuid])`, "hm-zero"],
  ["residents", `select 1 from residents where id = '${R}'`, "hm-zero"],
  ["resident_list_view", `select 1 from resident_list_view where resident_id = '${R}'`, "hm-zero"],
  ["weight", `select 1 from weight where resident_id = '${R}'`, "hm-zero"],
  ["prescriptions", `select 1 from prescriptions where resident_id = '${R}'`, "hm-zero"],
  ["medication", `select 1 from medication limit 1`, "hm-zero"],
  ["diet_types", `select 1 from diet_types limit 1`, "hm-zero"],
  ["attachments", `select 1 from attachments limit 1`, WITH_HM], // her own maintenance.photos cell reads a job's attachments (0152)
  ["stock_counts", `select 1 from stock_counts limit 1`, "hm-zero"],
  ["contacts", `select 1 from contacts limit 1`, "hm-zero"],
  ["assistant_actions", `select 1 from assistant_actions limit 1`, "hm-zero"],
  ["insert placement", `insert into placement_history (resident_id, placement_type, start_date) values ('${R}', 'SendToHospital', now() + interval '1 minute')`, "hm-zero"],
  // her own recurring tasks
  ["mark my recurring task done", `select record_recurring_job('${RJ_MINE}', current_date, 'done')`, { ...NONE, hm: 1, admin: 1, management: 1 }],
  ["mark another's recurring task done", `select record_recurring_job('${RJ_OTHER}', current_date, 'done')`, { ...NONE, admin: 1, management: 1, doctor: 1 }], // the doctor is its assignee; she is not,
];

const lines = [];
for (const [name, sql] of probes) {
  for (const who of P) lines.push(`  perform pg_temp.probe('${who}', ${lit(ID[who])}, $n$${name}$n$, $q$${sql}$q$);`);
}

const harness = `
begin;
create temp table res (who text, tbl text, n bigint);
grant all on res to authenticated;
create function pg_temp.probe(p_who text, p_uid uuid, p_name text, p_sql text) returns void language plpgsql as $f$
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
  insert into res values (p_who, p_name, v);
end $f$;

do $setup$
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-mnt-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${P.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role)
    select id, who::app_role from (values ${["admin", "management", "volunteer", "doctor"].map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role_id, role) select ${lit(ID.hm)}, id, legacy_role from roles where key = 'head_of_maintenance';
  insert into clinics (id, name) values (${lit(OWN)}, 'Harness own');
  with d as (insert into doctors (name, user_id) values ('Harness doctor', ${lit(ID.doctor)}) returning id) insert into doctor_clinics (clinic_id, doctor_id) select ${lit(OWN)}, id from d;
  insert into zones (id, name) values (${lit(ZONE)}, 'Harness zone');
  insert into enclosures (id, name, zone_id) values (${lit(ENC)}, 'Harness enclosure', ${lit(ZONE)});
  insert into residents (id, name, species) values (${lit(R)}, 'Harness resident', 'Dog');
  insert into weight (resident_id, date, weight_kg) values (${lit(R)}, current_date - 1, 5);
  insert into prescriptions (resident_id, medication_id, start_date) values (${lit(R)}, (select id from medication order by id limit 1), current_date);
  insert into maintenance (id, title, zone_id) values (${lit(JOB)}, 'Harness job', ${lit(ZONE)});
  insert into maintenance_assignees (maintenance_id, user_id) values (${lit(JOB)}, ${lit(ID.management)}); -- was the staff login until 0173
  if not exists (select 1 from translations where table_name = 'maintenance' and row_id = ${lit(JOB)}) then
    insert into translations (table_name, row_id, column_name, source_lang, target_lang, source_text, text, status)
    values ('maintenance', ${lit(JOB)}, 'title', 'en', 'th', 'Harness job', 'งานทดสอบ', 'approved');
  end if;
  insert into recurring_jobs (id, title, repeat, weekdays, starts_on) values
    (${lit(RJ_MINE)}, 'Harness mine', 'weekly', '{1,2,3,4,5,6,7}', current_date - 7),
    (${lit(RJ_OTHER)}, 'Harness other', 'weekly', '{1,2,3,4,5,6,7}', current_date - 7);
  insert into recurring_job_assignees (job_id, user_id) values (${lit(RJ_MINE)}, ${lit(ID.hm)}), (${lit(RJ_OTHER)}, ${lit(ID.doctor)});
end $setup$;

do $run$ begin
${lines.join("\n")}
end $run$;

do $role$ begin
  insert into res select 'role', 'row', 0 where exists (select 1 from roles where key = 'head_of_maintenance' and kind = 'custom' and legacy_role = 'volunteer' and opens_app and name_th is not null and archived_at is null);
  insert into res select 'role', 'cell:' || rp.activity || ':' || rp.level, 0 from role_permissions rp join roles r on r.id = rp.role_id where r.key = 'head_of_maintenance';
end $role$;
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
const get = (who, tbl) => rows.find((r) => r.who === who && r.tbl === tbl)?.n;

let fails = 0, ok = 0;
const fail = (s) => { fails++; console.log(`FAIL  ${s}`); };
const pass = (s) => { ok++; if (verbose) console.log(`ok    ${s}`); };

for (const [name, , exp] of probes) {
  if (exp === "hm-one") {
    const n = get("hm", name);
    if (n >= 1) pass(`${name} as hm: allowed`); else fail(`${name}: she should reach it, got ${n}`);
    continue;
  }
  if (exp === "hm-zero") {
    const n = get("hm", name);
    if (n <= 0) pass(`${name} as hm: refused or empty`); else fail(`${name}: the Head of Maintenance reaches ${n} row(s)`);
    continue;
  }
  for (const who of P) {
    const n = get(who, name), want = exp[who];
    const label = `${name} as ${who}: ${want ? "allowed" : "refused"}`;
    if ((n >= 1) === Boolean(want)) pass(label);
    else fail(`${label} — got ${n}`);
  }
}

if (get("role", "row") === 0) pass("role row: custom, borrows volunteer, opens the app, has a Thai name"); else fail("role row head_of_maintenance missing or wrong shape");
const have = new Map(rows.filter((r) => r.who === "role" && r.tbl.startsWith("cell:")).map((r) => r.tbl.split(":").slice(1)).map(([a, l]) => [a, Number(l)]));
const want = new Map([...bundleOfRole("head_of_maintenance")].map(([a, l]) => [a, l === "edit" ? 2 : 1]));
const same = have.size === want.size && [...want].every(([a, l]) => have.get(a) === l);
if (same) pass(`bundle: role_permissions = the union of its jobs (${[...want.keys()].join(", ")})`);
else fail(`bundle: role_permissions ${JSON.stringify([...have])} differ from jobs.ts ${JSON.stringify([...want])}`);

console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN (the Head of Maintenance runs the board and her own tasks and nothing else; the cells and jobs.ts agree)");
process.exitCode = fails ? 1 : 0;
