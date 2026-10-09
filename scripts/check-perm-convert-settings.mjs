// perm-convert-settings (0150): assistant_actions, translations, facility_maps and fixed_outgoings now answer through
// has_permission(). Against DEV only, one transaction that is always rolled back, each login's own JWT.
//
//   node scripts/check-perm-convert-settings.mjs            (from the repo root; dev only)
//   node scripts/check-perm-convert-settings.mjs --verbose  (also list every case)
//
// For each table, each principal's four commands (1 = took effect, 0 = refused):
//   assistant_actions  read mine / read someone else's / insert mine / insert in someone else's name
//                      mine needs assistant.record; someone else's is Admin's alone (management lost it: 0150)
//   translations       read / update / insert / delete: write translations.manage; read that or translations.view (0154);
//                      a vet reads through its own policy and writes nothing
//   facility_maps      read / update / insert / delete: read is every login with app access (0170); write facility.enclosures Edit
//                      (facility.map, which staff and volunteers hold, opens nothing)
//   fixed_outgoings    read / update / insert / delete: reports.cashflow Read for read, Edit for the rest
// Principals: admin, management, staff, volunteer, a vet, no role, and configured roles. Then structural sweeps: no policy
// on these tables names management or staff, every *_perm policy wraps has_permission() in (select ...), and the count.
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
  c_record: { cells: [["assistant.record", 2]] },
  c_ask: { cells: [["assistant.ask", 2]] },
  c_trans: { scope: "own_clinic", cells: [["translations.manage", 2]] },
  c_view: { scope: "own_clinic", cells: [["translations.view", 2]] }, // the new cell alone: reads, writes nothing
  c_floor_all: { scope: "all", cells: [] }, // staff floor, reads every resident: the staff shape, no cell at all
  c_floor_scoped: { scope: "own_clinic", cells: [] }, // staff floor, scoped to a clinic
  c_closed: { scope: "all", opens: false, cells: [] }, // scope all but opens no app: the public_viewer shape, refused (check-app-access-gate caught it)
  c_vol_all: { floor: "volunteer", cells: [] }, // volunteer floor, scope all: still refused
  c_encl_read: { cells: [["facility.enclosures", 1]] },
  c_encl_edit: { cells: [["facility.enclosures", 2]] },
  c_map: { cells: [["facility.map", 2]] },
  c_cash_read: { cells: [["reports.cashflow", 1]] },
  c_cash_edit: { cells: [["reports.cashflow", 2]] },
};
const REAL = ["admin", "management", "staff", "volunteer", "vet"];
const P = [...REAL, "norole", ...Object.keys(CUSTOM)];
const ID = Object.fromEntries(P.map((p) => [p, randomUUID()]));
const ZONE = randomUUID(), ZONE2 = randomUUID(), MAP = randomUUID(), OUT = randomUUID(), TR = randomUUID(), TR_ROW = randomUUID();

const T = {
  assistant_actions: [
    ["read mine", (who) => `select 1 from assistant_actions where user_id = ${lit(ID[who])}`],
    ["read theirs", () => `select 1 from assistant_actions where user_id = ${lit(ID.admin)} and request_text = 'harness-theirs'`],
    ["insert mine", (who) => `insert into assistant_actions (user_id, request_text, status) values (${lit(ID[who])}, 'harness-new', 'unmatched')`],
    ["insert as someone else", () => `insert into assistant_actions (user_id, request_text, status) values (${lit(ID.admin)}, 'harness-forged', 'unmatched')`],
  ],
  translations: [
    ["read", () => `select 1 from translations where id = '${TR}'`],
    ["update", () => `update translations set source_text = 'x' where id = '${TR}'`],
    ["insert", () => `insert into translations (table_name, row_id, column_name, source_lang, target_lang, source_text) values ('project_folders', '${randomUUID()}', 'summary', 'en', 'th', 'x')`],
    ["delete", () => `delete from translations where id = '${TR}'`],
  ],
  facility_maps: [
    ["read", () => `select 1 from facility_maps where id = '${MAP}'`],
    ["update", () => `update facility_maps set width = 11 where id = '${MAP}'`],
    ["insert", () => `insert into facility_maps (kind, zone_id, image_path, width, height) values ('zone', '${ZONE2}', 'harness2.png', 10, 10)`],
    ["delete", () => `delete from facility_maps where id = '${MAP}'`],
  ],
  fixed_outgoings: [
    ["read", () => `select 1 from fixed_outgoings where id = '${OUT}'`],
    ["update", () => `update fixed_outgoings set label = 'x' where id = '${OUT}'`],
    ["insert", () => `insert into fixed_outgoings (label, monthly_amount) values ('Harness new outgoing', 1)`],
    ["delete", () => `delete from fixed_outgoings where id = '${OUT}'`],
  ],
};
const ALL = "1111", NONE = "0000", READ_ONLY = "1000";
const EXPECT = {
  // management and staff: their own rows only. Nobody but Admin reads or writes in someone else's name.
  assistant_actions: { admin: ALL, management: "1010", staff: "1010", c_record: "1010" },
  translations: { admin: ALL, management: ALL, staff: READ_ONLY, vet: READ_ONLY, c_trans: ALL, c_view: READ_ONLY },
  // read is every login with app access (0170: a login with no role, public_viewer and an archived person read nothing)
  facility_maps: {
    ...Object.fromEntries(P.map((p) => [p, READ_ONLY])),
    norole: NONE,
    admin: ALL, c_encl_edit: ALL, // management holds facility.enclosures Read only (0132), so it no longer writes a plan: the page never let it
  },
  fixed_outgoings: { admin: ALL, management: ALL, c_cash_read: READ_ONLY, c_cash_edit: ALL },
};
const expected = (tbl, who) => (EXPECT[tbl][who] ?? NONE).split("").map(Number);

const probes = [];
for (const [tbl, cmds] of Object.entries(T)) {
  for (const who of P) {
    cmds.forEach(([cmd, q]) => probes.push(`  perform pg_temp.probe('${who}', ${lit(ID[who])}, '${tbl}', '${cmd}', $q$${q(who)}$q$);`));
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
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-st-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${P.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role)
    select id, who::app_role from (values ${REAL.map((p) => `('${p}', ${lit(ID[p])})`).join(",")}) as u(who, id);
  insert into roles (key, name, kind, legacy_role, scope_residents, scope_contacts, opens_app) values
    ${Object.entries(CUSTOM).map(([c, d]) => `('harness_st_${c}', 'Harness ${c}', 'custom', '${d.floor ?? "staff"}', '${d.scope ?? "own_clinic"}', 'full', ${d.opens ?? true})`).join(",\n    ")};
  insert into role_permissions (role_id, activity, level)
    select r.id, v.act, v.lvl from roles r join (values
      ${Object.entries(CUSTOM).flatMap(([c, d]) => d.cells.map(([a, l]) => `('harness_st_${c}', '${a}', ${l})`)).join(",\n      ")}
    ) as v(rkey, act, lvl) on v.rkey = r.key;
  ${Object.keys(CUSTOM).map((c) => `insert into user_roles (user_id, role_id, role) select ${lit(ID[c])}, id, '${CUSTOM[c].floor ?? "staff"}' from roles where key = 'harness_st_${c}';`).join("\n  ")}

  insert into assistant_actions (user_id, request_text, status)
    select id, 'harness-mine', 'unmatched' from auth.users where id in (${P.map((p) => lit(ID[p])).join(",")});
  insert into assistant_actions (user_id, request_text, status) values (${lit(ID.admin)}, 'harness-theirs', 'unmatched');
  insert into translations (id, table_name, row_id, column_name, source_lang, target_lang, source_text)
    values (${lit(TR)}, 'project_folders', ${lit(TR_ROW)}, 'summary', 'en', 'th', 'Harness text');
  insert into zones (id, name) values (${lit(ZONE)}, 'Harness zone'), (${lit(ZONE2)}, 'Harness zone two');
  insert into facility_maps (id, kind, zone_id, image_path, width, height) values (${lit(MAP)}, 'zone', ${lit(ZONE)}, 'harness.png', 10, 10);
  insert into fixed_outgoings (id, label, monthly_amount) values (${lit(OUT)}, 'Harness outgoing', 1);
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
for (const [tbl, cmds] of Object.entries(T)) {
  for (const who of P) {
    const exp = expected(tbl, who);
    cmds.forEach(([cmd], i) => {
      const n = get(who, tbl, cmd);
      const label = `${tbl} ${cmd} as ${who}: ${exp[i] ? "allowed" : "refused"}`;
      if (n === -2) fail(`${label} - the statement itself errored (-2); the fixture is wrong, not the policy`);
      else if ((n >= 1) === Boolean(exp[i])) pass(label);
      else fail(`${label} - got ${n}`);
    });
  }
}
const sweep = (k) => get("sweep", k, "count");
if (sweep("names_mgmt_or_staff") === 0) pass("no policy names management or staff"); else fail(`${sweep("names_mgmt_or_staff")} policy(ies) still name management or staff`);
if (sweep("bare_has_permission") === 0) pass("every *_perm policy wraps has_permission() in (select ...)"); else fail(`${sweep("bare_has_permission")} policy(ies) call has_permission() bare`);
if (sweep("perm_policies") === 14) pass("14 *_perm policies"); else fail(`expected 14 *_perm policies (13 new plus 0141's translations_maintenance_select_perm), found ${sweep("perm_policies")}`);
console.log(`\n${ok} checks held, ${fails} failed.`);
console.log(fails ? "RESULT: RED" : "RESULT: GREEN (each table answers as its cell says; facility.map alone opens no map write; management reads only its own assistant rows)");
process.exitCode = fails ? 1 : 0;
