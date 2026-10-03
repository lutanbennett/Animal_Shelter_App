// §11 of docs/roles-and-permissions.md: do the default cells reproduce today?
// For every probe (scripts/lib/permission-probes.mjs), each role's own login, and
// "no role", compare what the paper's §4 cell says should happen with what the
// database actually does. Against DEV only. One rollback transaction per chunk of
// probes, each probe in its own subtransaction that is rolled back, so nothing
// commits and probes cannot spoil each other's fixtures.
//
//   node scripts/check-permission-parity.mjs            (from the repo root; dev only)
//   node scripts/check-permission-parity.mjs --verbose  (also list every match)
//   PARITY_FLIP=volunteer:stock.delivery:2 node scripts/check-permission-parity.mjs
//        flips one expected cell, to show that the check can fail (it must go red)
//
// Three outcomes, not two (the way check-test-plan.mjs separates "unsigned"
// from "wrong"):
//   MATCH            the database does what the default cell says
//   KNOWN TIGHTENING the database allows more than the default, and the probe's
//                    `known` list names it with its §3 C row. Expected; closes as
//                    that table converts (L8). Never a failure ...
//   MISMATCH         anything else, in either direction. A failure.
// ... except that a `known` entry which no longer differs is a failure too
// ("STALE"): the list can neither hide a regression nor rot
// (decisions/2026-10-02-check-scripts-assert-live-not-replay.md).
//
// Layer 1 of §11 only: the database. The principals are the six legacy roles,
// a login with no role, and an archived person. A configured role that has been
// archived is probed through has_permission() alone, because today's policies
// read the enum and would still let the person in; that gap is what conversion
// closes, and section Z asserts the function already answers no.
//
// Layers 2 (app predicates) and 3 (routes) are not here: see the decision file.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const root = process.cwd();
const verbose = process.argv.includes("--verbose");
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);
const { PROBES: TABLE_PROBES, NO_DB_PROBE } = await import(pathToFileURL(join(root, "scripts/lib/permission-probes.mjs")).href);

// The expected cells, from the paper at run time (as check-permission-tables.mjs does).
const paper = readFileSync(join(root, "docs/roles-and-permissions.md"), "utf8").split("\n");
const start = paper.findIndex((l) => l.startsWith("| Key | Activity | Kind | Admin | Mgmt | Staff | Vet | Vol |"));
if (start < 0) throw new Error("§4 table not found in docs/roles-and-permissions.md");
const ROLE_COLUMN = { management: 5, staff: 6, vet: 7, volunteer: 8 };
const LEVEL = { E: 2, R: 1, Y: 2 };
const cells = {}; // activity -> role -> level
for (const line of paper.slice(start + 2)) {
  if (!line.startsWith("|")) break;
  const c = line.split("|").map((x) => x.trim());
  const m = /^`([a-z_.]+)`$/.exec(c[1] ?? "");
  if (!m) continue;
  cells[m[1]] = { admin: 2 };
  for (const [role, i] of Object.entries(ROLE_COLUMN)) {
    const v = c[i].replace(/\*/g, "").replace("°", "");
    cells[m[1]][role] = v === "–" ? 0 : LEVEL[v];
  }
}
if (Object.keys(cells).length !== 55) throw new Error(`expected 55 activities in §4, parsed ${Object.keys(cells).length}`);

// Deliberately flip a cell to prove the check can fail.
const flip = process.env.PARITY_FLIP;
if (flip) {
  const [role, activity, level] = flip.split(":");
  if (!cells[activity]) throw new Error(`PARITY_FLIP: no activity ${activity}`);
  cells[activity][role] = Number(level);
  console.log(`!! PARITY_FLIP: expecting ${role} to have level ${level} on ${activity}. The run below is meant to go red.\n`);
}

// Layer 0: the seeded cells themselves. has_permission() under each login must say what the paper says,
// so a cell edited in the database (or flipped with PARITY_FLIP_DB) goes red here as well as in the policies.
const PROBES = [
  ...TABLE_PROBES,
  ...Object.keys(cells).flatMap((a) => [
    { activity: a, level: "read", sql: `select 1 where has_permission('${a}', 'read')`, layer0: true },
    { activity: a, level: "edit", sql: `select 1 where has_permission('${a}', 'edit')`, layer0: true },
  ]),
];

// PARITY_FLIP_DB=role:activity:level edits one seeded cell inside the rolled-back transaction.
const flipDb = process.env.PARITY_FLIP_DB;
let flipDbSql = "";
if (flipDb) {
  const [role, activity, level] = flipDb.split(":");
  console.log(`!! PARITY_FLIP_DB: setting ${role}'s seeded cell for ${activity} to ${level} inside the transaction. The run below is meant to go red.\n`);
  flipDbSql = Number(level) === 0
    ? `delete from role_permissions where activity = '${activity}' and role_id = (select id from roles where key = '${role}');`
    : `insert into role_permissions (role_id, activity, level) select id, '${activity}', ${Number(level)} from roles where key = '${role}' on conflict (role_id, activity) do update set level = excluded.level;`;
}

const PRINCIPALS = ["admin", "management", "staff", "vet", "volunteer", "public_viewer", "norole", "archperson"];
const ROLE_OF = { admin: "admin", management: "management", staff: "staff", vet: "vet", volunteer: "volunteer", public_viewer: "public_viewer" };
const expectedLevel = (role, activity) => (ROLE_OF[role] ? (cells[activity][role] ?? 0) : 0);

// Fixture ids, minted here so probes can name them.
const F = {};
for (const k of ["R_IN", "R_OUT", "BARE", "CATEGORY", "DEAD", "ENC", "ZONE", "JOB", "PROJECT", "CLINIC", "OTHER_CLINIC", "DOCTOR", "DOCTOR2", "CONTACT", "CARER", "FRIEND", "RECEIPT", "DIET", "OUTGOING", "JOB_NONE", "JOB_ALL", ...PRINCIPALS, "archrole"]) F[k] = randomUUID();
// the seeded root folder of a project category, which new folders must sit inside
const rootRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: "select id from project_folders where top_level_category = 'Events' and parent_folder_id is null limit 1" }),
});
F.CATEGORY = (await rootRes.json())[0]?.id;
if (!F.CATEGORY) throw new Error("no root project folder for 'Events' on dev");
const lit = (id) => `'${id}'::uuid`;

// A runnable probe: one row per (probe, scope).
const runs = [];
PROBES.forEach((p, i) => {
  const scopes = p.scoped ? ["IN", "OUT"] : ["IN"];
  for (const scope of scopes) {
    const sql = p.sql.replace(/\$[A-Z_0-9]+/g, (m) => {
      if (m === "$R") return lit(scope === "IN" ? F.R_IN : F.R_OUT);
      const k = m.slice(1);
      if (!F[k]) throw new Error(`probe ${i} (${p.activity}) names unknown fixture ${m}`);
      return lit(F[k]);
    });
    const over = {};
    for (const [who, o] of Object.entries(p.byRole ?? {})) over[who] = o.replace(/\$[A-Z_0-9]+/g, (m) => (m === "$R" ? lit(scope === "IN" ? F.R_IN : F.R_OUT) : lit(F[m.slice(1)])));
    runs.push({ i, scope, sql, over });
  }
});
for (const p of PROBES) if (!cells[p.activity]) throw new Error(`probe for unknown activity ${p.activity}`);

const dq = (s) => { let tag = "p"; while (s.includes(`$${tag}$`)) tag += "x"; return `$${tag}$${s}$${tag}$`; };
const CHUNK = 45;

function setup() {
  return `
begin;
create function pg_temp.probe(p_uid uuid, p_sql text) returns jsonb language plpgsql as $f$
declare v_n bigint; v_state text := null; v_msg text := null;
begin
  begin
    if p_uid is null then
      perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
      set local role anon;
    else
      perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
      set local role authenticated;
    end if;
    begin
      execute p_sql;
      get diagnostics v_n = row_count;
    exception when others then
      v_state := sqlstate; v_msg := sqlerrm;
    end;
    raise exception using errcode = 'P0999', message = 'probe-rollback';
  exception when sqlstate 'P0999' then null;
  end;
  return jsonb_build_object('n', v_n, 'state', v_state, 'msg', left(v_msg, 160));
end $f$;

create temp table harness_ids (who text primary key, id uuid not null);
grant select on harness_ids to authenticated, anon, service_role;
insert into harness_ids values
${[...PRINCIPALS, "archrole"].map((w) => `  ('${w}', ${lit(F[w])})`).join(",\n")};

do $setup$
declare r record;
  v_own uuid := ${lit(F.CLINIC)}; v_oth uuid := ${lit(F.OTHER_CLINIC)};
begin
  for r in select * from harness_ids loop
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (r.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-parity-' || r.who || '-' || r.id || '@example.invalid', '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || r.who), now(), now());
  end loop;
  insert into user_roles (user_id, role) select id, who::app_role from harness_ids
   where who in ('admin', 'management', 'staff', 'vet', 'volunteer', 'public_viewer');
  insert into user_roles (user_id, role, archived_at) select id, 'staff', now() from harness_ids where who = 'archperson';

  insert into vets (id, name, clinic_name) values (v_own, 'Harness own', 'Harness own clinic'), (v_oth, 'Harness other', 'Harness other clinic');
  insert into vet_doctors (name, user_id, vet_id) select 'Harness vet doctor', id, v_own from harness_ids where who = 'vet';
  insert into vet_doctors (id, name, vet_id) values (${lit(F.DOCTOR)}, 'Harness doctor one', v_own), (${lit(F.DOCTOR2)}, 'Harness doctor two', v_own);

  insert into residents (id, name, species, bio) values
    (${lit(F.R_IN)}, 'Harness in-scope', 'Dog', 'bio'), (${lit(F.R_OUT)}, 'Harness out-of-scope', 'Dog', 'bio'), (${lit(F.DEAD)}, 'Harness dead', 'Dog', 'bio'), (${lit(F.BARE)}, 'Harness bare', 'Dog', 'bio');
  insert into zones (id, name) values (${lit(F.ZONE)}, 'Harness zone');
  insert into enclosures (id, name, zone_id) values (${lit(F.ENC)}, 'Harness enclosure', ${lit(F.ZONE)});

  insert into vet_appointments (resident_id, vet_id, appointment_date, status) values
    (${lit(F.R_IN)}, v_own, now() - interval '3 days', 'completed'), (${lit(F.R_OUT)}, v_oth, now() - interval '3 days', 'completed');
  insert into placement_history (resident_id, placement_type, start_date) select id, 'Intake', now() - interval '30 days'
    from residents where id in (${lit(F.R_IN)}, ${lit(F.R_OUT)}, ${lit(F.DEAD)});
  insert into placement_history (resident_id, placement_type, start_date) values (${lit(F.DEAD)}, 'Deceased', now() - interval '1 day');
  insert into contacts (id, name, type) values (${lit(F.CONTACT)}, 'Harness contact', 'Vendor'), (${lit(F.CARER)}, 'Harness carer', 'Carer');
  insert into shelter_friends (id, contact_id) values (${lit(F.FRIEND)}, ${lit(F.CONTACT)});
  insert into diet_types (id, name, daily_qty_small, daily_qty_medium, daily_qty_large) values (${lit(F.DIET)}, 'Harness diet', 1, 1, 1);
  insert into maintenance (id, title, zone_id) values (${lit(F.JOB)}, 'Harness job', ${lit(F.ZONE)});
  insert into project_folders (id, top_level_category, name, parent_folder_id) values (${lit(F.PROJECT)}, 'Events', 'Harness project', ${lit(F.CATEGORY)});
  insert into stock_receipts (id, item_kind, medication_id, quantity) values (${lit(F.RECEIPT)}, 'medication', (select id from medication order by id limit 1), 1);
  insert into fixed_outgoings (id, label, monthly_amount) values (${lit(F.OUTGOING)}, 'Harness outgoing', 1);
  insert into recurring_jobs (id, title, time_of_day, link_path, repeat, weekdays, starts_on) values
    (${lit(F.JOB_NONE)}, 'Harness job none', 'morning', '/', 'weekly', '{1,2,3,4,5,6,7}', current_date - 7),
    (${lit(F.JOB_ALL)}, 'Harness job all', 'morning', '/', 'weekly', '{1,2,3,4,5,6,7}', current_date - 7);
  insert into recurring_job_assignees (job_id, user_id) select ${lit(F.JOB_ALL)}, id from harness_ids;

  -- one child row per resident for the update, delete and read probes
  insert into weight (resident_id, date, weight_kg) select id, current_date - 1, 5 from residents where id in (${lit(F.R_IN)}, ${lit(F.R_OUT)});
  insert into blood_tests (resident_id, date, blood_test_type_id) select id, current_date, (select id from blood_test_types limit 1) from residents where id in (${lit(F.R_IN)}, ${lit(F.R_OUT)});
  insert into procedures (resident_id, date, procedure_type_id) select id, current_date, (select id from procedure_types limit 1) from residents where id in (${lit(F.R_IN)}, ${lit(F.R_OUT)});
  insert into prescriptions (resident_id, medication_id, start_date) select id, (select id from medication order by id limit 1), current_date from residents where id in (${lit(F.R_IN)}, ${lit(F.R_OUT)});
  insert into immunization_records (resident_id, immunization_type_id, date_administered) select id, (select id from immunization_types limit 1), current_date from residents where id in (${lit(F.R_IN)}, ${lit(F.R_OUT)});
  insert into resident_diets (resident_id, diet_type_id, start_date) select id, ${lit(F.DIET)}, current_date - 1 from residents where id in (${lit(F.R_IN)}, ${lit(F.R_OUT)});
  insert into adoption_updates (resident_id, received_on, channel) select id, current_date, 'visit' from residents where id in (${lit(F.R_IN)}, ${lit(F.R_OUT)});
  insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder) select 'resident', id, 'harness-' || id, 'x.jpg', 'Medical' from residents where id in (${lit(F.R_IN)}, ${lit(F.R_OUT)});
end $setup$;
${flipDbSql}
`;
}

// Z: has_permission() for the cases today's policies cannot yet show.
function sectionZ() {
  return `
do $z$
declare v_report jsonb := '[]'::jsonb; r record; a record; n bigint;
begin
  insert into roles (key, name, kind, legacy_role) values ('harness_parity_archived', 'Harness archived', 'custom', 'staff');
  insert into role_permissions (role_id, activity, level) select id, 'stock.count', 2 from roles where key = 'harness_parity_archived';
  insert into user_roles (user_id, role_id, role) select ${lit(F.archrole)}, id, 'staff' from roles where key = 'harness_parity_archived';
  update roles set archived_at = now() where key = 'harness_parity_archived';
  -- every activity, both levels, for the three people who must always be answered no
  for r in select who, id from harness_ids where who in ('norole', 'archperson', 'archrole') loop
    for a in select key from permission_activities loop
      n := (select (pg_temp.probe(r.id, format('select has_permission(%L, %L) where has_permission(%L, %L)', a.key, 'read', a.key, 'read'))->>'n')::bigint);
      if n is distinct from 0 then v_report := v_report || jsonb_build_object('z', r.who || ' answered yes to ' || a.key || ' read'); end if;
      n := (select (pg_temp.probe(r.id, format('select 1 where has_permission(%L, %L)', a.key, 'edit'))->>'n')::bigint);
      if n is distinct from 0 then v_report := v_report || jsonb_build_object('z', r.who || ' answered yes to ' || a.key || ' edit'); end if;
    end loop;
  end loop;
  -- an unknown activity and a missing cell, as a role that would otherwise have rights
  n := (select (pg_temp.probe(${lit(F.staff)}, 'select 1 where has_permission(''no.such.activity'', ''read'')')->>'n')::bigint);
  if n is distinct from 0 then v_report := v_report || jsonb_build_object('z', 'staff answered yes to an unknown activity'); end if;
  n := (select (pg_temp.probe(${lit(F.volunteer)}, 'select 1 where has_permission(''stock.delivery'', ''read'')')->>'n')::bigint);
  if n is distinct from 0 then v_report := v_report || jsonb_build_object('z', 'volunteer answered yes to a missing cell'); end if;
  -- and the positive control: the same function does say yes where a cell exists
  n := (select (pg_temp.probe(${lit(F.staff)}, 'select 1 where has_permission(''stock.delivery'', ''edit'')')->>'n')::bigint);
  if n is distinct from 1 then v_report := v_report || jsonb_build_object('z', 'staff was not answered yes to stock.delivery edit (control)'); end if;
  create temp table harness_z as select v_report as r;
end $z$;
`;
}

async function run(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  let msg = text;
  try { msg = JSON.parse(text).message ?? text; } catch {}
  const m = /HARNESS-RESULT (.*)/.exec(msg);
  if (!m) throw new Error(`harness did not return a result (status ${res.status}): ${msg.slice(0, 1500)}`);
  return JSON.parse(m[1]);
}

// Run every (probe, scope, principal) in chunks.
const actual = new Map(); // `${runIndex}:${who}` -> {n,state,msg}
let zReport = [];
for (let off = 0; off < runs.length; off += CHUNK) {
  const slice = runs.slice(off, off + CHUNK);
  const body = slice
    .map((r, j) => `  perform pg_temp.rec(${off + j}, ${dq(r.sql)}, ${dq(JSON.stringify(r.over))}::jsonb);`)
    .join("\n");
  const first = off === 0;
  const sql = `${setup()}
create temp table harness_out (run int, who text, res jsonb);
grant all on harness_out to authenticated, anon, service_role;
create function pg_temp.rec(p_run int, p_sql text, p_over jsonb) returns void language plpgsql as $f$
declare r record;
begin
  for r in select who, id from harness_ids where who <> 'archrole' loop
    insert into harness_out values (p_run, r.who, pg_temp.probe(r.id, coalesce(p_over ->> r.who, p_sql)));
  end loop;
end $f$;
do $run$ begin
${body}
end $run$;
${first ? sectionZ() : ""}
do $out$ begin
  raise exception 'HARNESS-RESULT %', (select json_build_object('rows', (select json_agg(json_build_object('run', run, 'who', who, 'res', res)) from harness_out),
     'z', ${first ? "(select r from harness_z)" : "'[]'::jsonb"}));
end $out$;
rollback;
`;
  const out = await run(sql);
  for (const row of out.rows) actual.set(`${row.run}:${row.who}`, row.res);
  if (first) zReport = out.z ?? [];
  process.stdout.write(`  probed ${Math.min(off + CHUNK, runs.length)} / ${runs.length}\r`);
}
console.log();

// Classify.
const REFUSED_STATE = new Set(["42501"]);
function allowed(res, probe) {
  if (res.state) {
    if (REFUSED_STATE.has(res.state)) return false;
    if (probe.fn) return false; // a function refusing in its own words
    if (probe.refusedBy?.includes(res.state)) return false; // a trigger that refuses first
    return null; // some other error: a harness fault
  }
  return Number(res.n) >= 1;
}

const faults = [];
const mismatches = [];
const knownSeen = [];
const matched = [];
const knownFound = new Set(); // `${probe}:${id}:${role}`
const lines = [];

runs.forEach((r, ri) => {
  const p = PROBES[r.i];
  const need = p.level === "read" ? 1 : 2;
  const label = `${p.activity} ${p.level}${p.scoped ? ` (${r.scope === "IN" ? "in scope" : "out of scope"})` : ""}: ${p.sql.replace(/\s+/g, " ").slice(0, 80)}`;
  // Admin first: if Admin is refused the probe is broken, not the system.
  const adm = actual.get(`${ri}:admin`);
  if (allowed(adm, p) !== true) {
    faults.push(`${label}\n      Admin was not allowed (${adm.state ?? `${adm.n} rows`} ${adm.msg ?? ""}) — the probe or its fixture is broken`);
    return;
  }
  const defaultAllows = (who) => {
    if (p.scoped && r.scope === "OUT" && who === "vet") return false;
    if (p.expect) return p.expect.includes(who);
    return expectedLevel(who, p.activity) >= need;
  };
  for (const who of PRINCIPALS) {
    const res = actual.get(`${ri}:${who}`);
    const got = allowed(res, p);
    if (got === null) {
      faults.push(`${label}\n      ${who}: unexpected error ${res.state} ${res.msg} — a broken probe, not a refusal`);
      continue;
    }
    const want = defaultAllows(who);
    const knownHere = (p.known ?? []).find((k) => k.roles.includes(who));
    if (got === want) {
      if (knownHere && !(p.scoped && r.scope === "OUT")) {
        // a listed tightening that no longer differs
        mismatches.push({ kind: "STALE", label, who, text: `${knownHere.id} lists ${who} as allowed beyond the default, but the database now matches the default. Remove the entry` });
      } else matched.push({ label, who });
    } else if (got && !want && knownHere) {
      knownSeen.push({ id: knownHere.id, label, who });
      knownFound.add(`${r.i}:${knownHere.id}:${who}`);
    } else {
      mismatches.push({ kind: "MISMATCH", label, who, text: `${who}: the default says ${want ? "ALLOWED" : "REFUSED"}, the database ${got ? "ALLOWS" : "REFUSES"}` });
    }
  }
});

// A listed tightening whose probe never differed for a role is stale even if every other cell matched
// (covered per-cell above); a listed role the probe never produced is a typo.
PROBES.forEach((p, i) => {
  for (const k of p.known ?? []) for (const who of k.roles) {
    if (!PRINCIPALS.includes(who)) mismatches.push({ kind: "STALE", label: p.activity, who, text: `${k.id}: ${who} is not a principal of this check` });
  }
});

// Report.
console.log("== Layer 1: the database ==");
console.log(`(${PROBES.filter((p) => p.layer0).length} of the probes read has_permission() itself, the seeded cells; the rest exercise tables and functions)
${runs.length} probe runs across ${PRINCIPALS.length} principals (${runs.length * PRINCIPALS.length} answers)`);
console.log(`  MATCH             ${matched.length}`);
console.log(`  KNOWN TIGHTENING  ${knownSeen.length}`);
console.log(`  MISMATCH          ${mismatches.length}`);
console.log(`  HARNESS FAULT     ${faults.length}`);

if (knownSeen.length) {
  console.log("\nKnown tightenings (§3 C, expected, closed by L8 as the table converts):");
  const byId = new Map();
  for (const k of knownSeen) {
    const key = `${k.id} ${k.who}`;
    byId.set(key, (byId.get(key) ?? 0) + 1);
  }
  const ids = [...new Set(knownSeen.map((k) => k.id))].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  for (const id of ids) {
    const rows = knownSeen.filter((k) => k.id === id);
    console.log(`  ${id}: ${[...new Set(rows.map((r) => r.who))].join(", ")} — ${[...new Set(rows.map((r) => r.label.split(":")[0]))].join("; ")}`);
  }
}
if (verbose) { console.log("\nMatches:"); for (const m of matched) console.log(`  ${m.who}  ${m.label}`); }

if (zReport.length) {
  console.log("\nSection Z (has_permission, no-role / archived person / archived role / unknown activity / missing cell):");
  for (const z of zReport) console.log(`  FAIL ${z.z}`);
} else console.log("\nSection Z: no role, an archived person, an archived role, an unknown activity and a missing cell all answer NO for every activity and level; a seeded cell answers yes (control)");

if (faults.length) { console.log("\nHARNESS FAULTS (a probe that cannot be trusted, so nothing it says is counted):"); for (const f of faults) console.log(`  ${f}`); }
if (mismatches.length) {
  console.log("\nMISMATCHES:");
  for (const m of mismatches) console.log(`  [${m.kind}] ${m.label}\n      ${m.text}`);
}

const uncovered = Object.entries(NO_DB_PROBE);
const probed = new Set(TABLE_PROBES.map((p) => p.activity));
const unaccounted = Object.keys(cells).filter((a) => !probed.has(a) && !(a in NO_DB_PROBE));
console.log(`\nActivities probed: ${probed.size} of 55. Not probed, with the reason: ${uncovered.length}.`);
for (const [a, why] of uncovered) console.log(`  ${a}: ${why}`);
if (unaccounted.length) console.log(`\nNEITHER PROBED NOR EXPLAINED: ${unaccounted.join(", ")}`);

// ---- Layer 2: the app's predicates ----------------------------------------------------------
// Each activity paired with the predicate that guards it today. legacy(role) must equal the
// default cell, for every role, null and public_viewer included. The truth table is also kept in
// scripts/fixtures/legacy-predicates.json (written with --write-fixture), so that once the
// predicates are deleted the check goes on comparing against what they said. While a predicate
// still exists it is read live, and must agree with the fixture; if it has changed, regenerate.
import { register } from "node:module";
import { existsSync, writeFileSync } from "node:fs";
const src = pathToFileURL(join(root, "src") + "/").href;
register("data:text/javascript," + encodeURIComponent(`
  export async function resolve(spec, ctx, next) {
    // the predicates sit in modules that also import server-only plumbing, which is not under test
    if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (spec.startsWith("next/") || spec === "react") return { url: "data:text/javascript," + encodeURIComponent("export const cookies=()=>{},headers=()=>{},redirect=()=>{},notFound=()=>{},cache=(f)=>f,revalidatePath=()=>{},revalidateTag=()=>{},unstable_cache=(f)=>f,createClient=()=>{};export default {}"), shortCircuit: true };
    if (spec.startsWith("@/")) return next(${JSON.stringify(src)} + spec.slice(2) + ".ts", ctx);
    if (spec.startsWith(".") && !/\\.[a-z]+$/.test(spec)) return next(spec + ".ts", ctx);
    return next(spec, ctx);
  }`));
const PREDICATES = [
  { id: "canManage", file: "src/lib/auth/require-management.ts", activity: "reports.dashboard", level: 2 },
  { id: "canStocktake", file: "src/lib/management/stocktake.ts", activity: "stock.count", level: 2 },
  { id: "canRecordDelivery", file: "src/lib/management/stock-receipts.ts", activity: "stock.delivery", level: 2 },
  { id: "canArchiveMedical", file: "src/lib/medical-archive/kinds.ts", activity: "medical.archive", level: 2 },
  { id: "canWriteMaintenance", file: "src/lib/maintenance/queries.ts", activity: "maintenance.jobs", level: 2 },
  { id: "canReadMaintenance", file: "src/lib/maintenance/queries.ts", activity: "maintenance.jobs", level: 1 },
  { id: "canWriteProjects", file: "src/lib/projects/queries.ts", activity: "projects.folders", level: 2 },
  { id: "canUseAssistant", file: "src/lib/assistant/data.ts", activity: "assistant.ask", level: 2 },
  { id: "canWriteWithAssistant", file: "src/lib/assistant/data.ts", activity: "assistant.record", level: 2 },
];
// Predicates with no single activity to pair with, and why (stated, not silently absent):
const UNPAIRED = {
  hasAppAccess: "'may sign in to the app at all': not an activity (§6 rule 5)",
  isShelterRole: "a set of roles used by several pages, not one right",
  canReadRecurringJobs: "every role reads recurring jobs because anyone can be given one; there is no 'read the rules' cell",
  canDoJob: "takes the page a job links to; it is the eligibility rule for assignees, covered by check-recurring-job-eligibility.mjs",
  assertPhotoWriteAccess: "photo uploads span photos.* and maintenance.photos; paired when the photo split is built",
};
const ROLES_FOR_TABLE = ["admin", "management", "staff", "vet", "volunteer", "public_viewer", null];
const fixturePath = join(root, "scripts/fixtures/legacy-predicates.json");
const fixture = existsSync(fixturePath) ? JSON.parse(readFileSync(fixturePath, "utf8")) : {};
const live = {};
const layer2 = [];
for (const pr of PREDICATES) {
  let fn = null;
  try { fn = (await import(pathToFileURL(join(root, pr.file)).href))[pr.id]; } catch (e) { layer2.push({ pr, problem: "could not load " + pr.file + ": " + String(e.message).split("\n")[0] }); continue; }
  if (typeof fn !== "function") {
    if (!fixture[pr.id]) layer2.push({ pr, problem: `${pr.id} no longer exists and there is no fixture row for it` });
    continue;
  }
  live[pr.id] = Object.fromEntries(ROLES_FOR_TABLE.map((r) => [String(r), fn(r)]));
}
if (process.argv.includes("--write-fixture")) {
  writeFileSync(fixturePath, JSON.stringify({ ...fixture, ...live }, null, 2) + "\n");
  console.log("wrote " + fixturePath);
}
let l2checked = 0;
for (const pr of PREDICATES) {
  const table = live[pr.id] ?? fixture[pr.id];
  if (!table) continue;
  if (live[pr.id] && fixture[pr.id] && JSON.stringify(live[pr.id]) !== JSON.stringify(fixture[pr.id])) {
    layer2.push({ pr, problem: `${pr.id} now answers differently from scripts/fixtures/legacy-predicates.json. If that was intended, rerun with --write-fixture` });
  }
  for (const r of ROLES_FOR_TABLE) {
    const want = r != null && (expectedLevel(r, pr.activity) >= pr.level);
    const got = table[String(r)];
    l2checked++;
    if (got !== want) layer2.push({ pr, problem: `${pr.id}(${r}) is ${got}, the default for ${pr.activity} says ${want}` });
  }
}
console.log(`
== Layer 2: the app's predicates ==
${l2checked} answers (${PREDICATES.length} predicates x 7 roles incl. no role)`);
for (const [k, why] of Object.entries(UNPAIRED)) console.log(`  not paired: ${k}: ${why}`);
for (const l of layer2) console.log(`  MISMATCH ${l.problem}`);

const red = layer2.length > 0 || mismatches.length > 0 || faults.length > 0 || zReport.length > 0 || unaccounted.length > 0;
console.log(red ? "\nRESULT: RED" : "\nRESULT: GREEN (matches and listed tightenings only)");
// exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
process.exitCode = red ? 1 : 0;
