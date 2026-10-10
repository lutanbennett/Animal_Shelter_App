// perm-convert-work (0149): maintenance, maintenance_assignees and project_folders now answer through
// has_permission(). Against DEV only, one transaction that is always rolled back, each login's own JWT.
//
//   node scripts/check-perm-convert-work.mjs            (from the repo root; dev only)
//   node scripts/check-perm-convert-work.mjs --verbose  (also list every case)
//
// For each table, each principal's read / update / insert / delete (1 = took effect, 0 = refused):
//   maintenance            read maintenance.jobs Read; insert and update Edit; delete Edit AND not on the volunteer floor
//                          (delete has no activity of its own, so the Head of Maintenance still cannot remove a job: 0141)
//   maintenance_assignees  all four through maintenance.jobs (read Read, the rest Edit): a job's team is rewritten as a set
//   project_folders        read projects.folders Read; insert, update and delete Edit; projects.publish alone opens nothing
// Principals: admin, management, volunteer, a doctor, no role, the real Head of Maintenance (volunteer floor, jobs
// and progress Edit) and configured roles (staff left the principals and the custom roles borrow management, not
// staff, since 0173 retired it; the vet login is a doctor since 0172). Then structural sweeps: no policy on these
// tables names management or staff, every *_perm policy wraps has_permission() in (select ...), and there are 12 *_perm policies on them.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const verbose = process.argv.includes("--verbose");
const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const lit = (id) => `'${id}'::uuid`;
const CUSTOM = {
  c_jobs_read: { cells: [["maintenance.jobs", 1]] },
  c_jobs_edit: { cells: [["maintenance.jobs", 2]] }, // management floor (staff until 0173)
  c_jobs_edit_vol: { floor: "volunteer", cells: [["maintenance.jobs", 2]] }, // the 2IC's shape: volunteer floor
  c_progress: { cells: [["maintenance.progress", 2]] },
  c_folders_read: { cells: [["projects.folders", 1]] },
  c_folders_edit: { cells: [["projects.folders", 2]] },
  c_publish: { cells: [["projects.publish", 2]] },
};
const REAL = ["admin", "management", "volunteer", "doctor"];
const P = [...REAL, "norole", "hm", ...Object.keys(CUSTOM)];
const ID = Object.fromEntries(P.map((p) => [p, randomUUID()]));
const ZONE = randomUUID(), JOB = randomUUID(), FOLDER = randomUUID();

const T = {
  maintenance: [
    `select 1 from maintenance where id = '${JOB}'`,
    `update maintenance set description = 'x' where id = '${JOB}'`,
    `insert into maintenance (title, zone_id) values ('Harness new job', '${ZONE}')`,
    `delete from maintenance where id = '${JOB}'`,
  ],
  maintenance_assignees: [
    `select 1 from maintenance_assignees where maintenance_id = '${JOB}'`,
    `update maintenance_assignees set user_id = user_id where maintenance_id = '${JOB}'`,
    `insert into maintenance_assignees (maintenance_id, user_id) values ('${JOB}', '${ID.doctor}')`,
    `delete from maintenance_assignees where maintenance_id = '${JOB}'`,
  ],
  project_folders: [
    `select 1 from project_folders where id = '${FOLDER}'`,
    `update project_folders set summary = 'x' where id = '${FOLDER}'`,
    `insert into project_folders (top_level_category, name, parent_folder_id) values ('Events', 'Harness new project', (select id from project_folders where parent_folder_id is null and top_level_category = 'Events'))`,
    `delete from project_folders where id = '${FOLDER}'`,
  ],
};
const A = "1111", RO = "1000", NODEL = "1110";
const EXPECT = {
  maintenance: { admin: A, management: A, hm: NODEL, c_jobs_read: RO, c_jobs_edit: A, c_jobs_edit_vol: NODEL },
  maintenance_assignees: { admin: A, management: A, hm: A, c_jobs_read: RO, c_jobs_edit: A, c_jobs_edit_vol: A },
  project_folders: { admin: A, management: A, c_folders_read: RO, c_folders_edit: A },
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
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-wk-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${P.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role)
    select id, who::app_role from (values ${REAL.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role_id, role) select ${lit(ID.hm)}, id, 'volunteer' from roles where key = 'head_of_maintenance';
  insert into roles (key, name, kind, legacy_role, scope_residents, scope_contacts) values
    ${Object.entries(CUSTOM).map(([c, d]) => `('harness_wk_${c}', 'Harness ${c}', 'custom', '${d.floor ?? "management"}', 'all', 'full')`).join(",\n    ")};
  insert into role_permissions (role_id, activity, level)
    select r.id, v.act, v.lvl from roles r join (values
      ${Object.entries(CUSTOM).flatMap(([c, d]) => d.cells.map(([a, l]) => `('harness_wk_${c}', '${a}', ${l})`)).join(",\n      ")}
    ) as v(rkey, act, lvl) on v.rkey = r.key;
  ${Object.keys(CUSTOM).map((c) => `insert into user_roles (user_id, role_id, role) select ${lit(ID[c])}, id, '${CUSTOM[c].floor ?? "management"}' from roles where key = 'harness_wk_${c}';`).join("\n  ")}

  insert into zones (id, name) values (${lit(ZONE)}, 'Harness zone');
  insert into maintenance (id, title, zone_id) values (${lit(JOB)}, 'Harness job', ${lit(ZONE)});
  insert into maintenance_assignees (maintenance_id, user_id) values (${lit(JOB)}, ${lit(ID.management)}); -- was the staff login until 0173
  insert into project_folders (id, top_level_category, name, parent_folder_id)
    select ${lit(FOLDER)}, 'Events', 'Harness project', id from project_folders where parent_folder_id is null and top_level_category = 'Events';
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
for (const tbl of Object.keys(T)) {
  for (const who of P) {
    const exp = expected(tbl, who);
    CMDS.forEach((cmd, i) => {
      const n = get(who, tbl, cmd);
      const label = `${tbl} ${cmd} as ${who}: ${exp[i] ? "allowed" : "refused"}`;
      // project_folders_before_write reads the parent as the caller: a role that cannot see it is refused there (P0001) first
      if (n === -2 && tbl === "project_folders" && cmd === "insert" && !exp[i]) pass(`${label} (by the trigger)`);
      else if (n === -2) fail(`${label} - the statement itself errored (-2); the fixture is wrong, not the policy`);
      else if ((n >= 1) === Boolean(exp[i])) pass(label);
      else fail(`${label} - got ${n}`);
    });
  }
}
const sweep = (k) => get("sweep", k, "count");
if (sweep("names_mgmt_or_staff") === 0) pass("no policy names management or staff"); else fail(`${sweep("names_mgmt_or_staff")} policy(ies) still name management or staff`);
if (sweep("bare_has_permission") === 0) pass("every *_perm policy wraps has_permission() in (select ...)"); else fail(`${sweep("bare_has_permission")} policy(ies) call has_permission() bare`);
if (sweep("perm_policies") === 12) pass("12 *_perm policies"); else fail(`expected 12 *_perm policies, found ${sweep("perm_policies")}`);
console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN (each table answers as its cell says; the Head of Maintenance cannot delete a job; projects.publish alone opens nothing)");
process.exitCode = fails ? 1 : 0;
