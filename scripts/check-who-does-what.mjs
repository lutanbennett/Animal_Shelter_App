// Is every box on Settings → Who does what obeyed by the database? Against DEV only.
// docs/decisions/2026-10-11-who-does-what-view.md
//
//   node scripts/check-who-does-what.mjs            (from the repo root; dev only)
//   node scripts/check-who-does-what.mjs --verbose  (also list every box that is obeyed)
//   WDW_DROP=whoAndWhere node scripts/check-who-does-what.mjs  (leaves one entry out: must go red)
//
// The grid is a demo surface: Lutan points at a box and says "Medical can edit this". A box the database
// does not follow is worse than no grid, so every such box must be listed in FIXED_FOR_NOW
// (src/lib/permissions/fixed-for-now.ts), which the page marks "fixed for now" with its reason.
// This script is how that list is measured rather than asserted.
//
// For every live role but Admin (Admin is a rule, §6), every activity that has a database probe
// (scripts/lib/permission-probes.mjs, the parity check's own statements), and every probe of it, the
// statement is run twice under a throwaway login holding that role, each time in its own rolled-back
// subtransaction:
//   as is     with the role's cell as role_permissions holds it
//   flipped   with that one cell changed to the opposite answer (allowed → None; refused → the level
//             the probe needs), inside the same subtransaction
// The box is OBEYED when the database follows it both times: it allows exactly when the box does, and
// changes its answer when the box changes. Otherwise the box is
//   WRONG    the database answers differently from the box today
//   STICKY   yes, and still allowed with the box set to no: it cannot be taken away (a role named in a
//            function, another box that opens the same table)
//   INERT    no, and still refused with the box set to yes: it cannot be given. True today and often
//            only a missing prerequisite, so reported for who-does-what-edit and never required here
// Then it compares with FIXED_FOR_NOW:
//   UNLISTED   a WRONG or STICKY box that no `measured` entry covers: the page shows it as true. FAIL
//   STALE      a `measured` entry whose boxes are all obeyed now: shorten the list. FAIL
//   OVERLISTED an entry naming a box that is obeyed: the grid would mark a true box. FAIL
// Entries with `measured: false` are the ones a probe cannot see (the app's own role lists, the
// §6 rules); they are printed, not checked.
//
// Probes with `expect` (a hard delete no screen offers, default Admin only) test an act the grid has no
// box for, and are skipped. A scoped probe is run in scope only: out of scope a doctor is refused
// whatever the box says, which is the scope working, not the box failing.
//
// The fixtures are the parity check's (check-permission-parity.mjs, setup()), copied rather than
// shared because that script runs at import. Keep the two in step if a probe needs a new fixture.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const root = process.cwd();
const verbose = process.argv.includes("--verbose");
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);
const { PROBES: ALL_PROBES, NO_DB_PROBE } = await import(pathToFileURL(join(root, "scripts/lib/permission-probes.mjs")).href);
const { ACTIVITIES } = await import(pathToFileURL(join(root, "src/lib/permissions/catalogue.ts")).href);
const { FIXED_FOR_NOW: LISTED, boxesOf } = await import(pathToFileURL(join(root, "src/lib/permissions/fixed-for-now.ts")).href);
const { explainedByPrerequisite } = await import(pathToFileURL(join(root, "src/lib/permissions/prerequisites.ts")).href);
// WDW_DROP=<entry id> leaves one entry out, to show that the check can fail (it must go red).
const drop = process.env.WDW_DROP;
if (drop) console.log(`!! WDW_DROP: running without the ${drop} entry. The run below is meant to go red.
`);
const FIXED_FOR_NOW = LISTED.filter((e) => e.id !== drop);

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}

// The live roles and their cells, as the page reads them.
const rolesRes = await query(`select r.key, coalesce(json_object_agg(rp.activity, rp.level) filter (where rp.activity is not null), '{}') as cells
  from roles r left join role_permissions rp on rp.role_id = r.id
 where r.archived_at is null and r.opens_app and r.key <> 'admin'
 group by r.key order by r.key`);
if (!Array.isArray(rolesRes.body)) throw new Error(`could not read roles: ${JSON.stringify(rolesRes.body).slice(0, 400)}`);
const ROLES = rolesRes.body.map((r) => r.key);
const CELL = Object.fromEntries(rolesRes.body.map((r) => [r.key, r.cells]));
const cellOf = (role, activity) => Number(CELL[role]?.[activity] ?? 0);

const PRINCIPALS = ["admin", ...ROLES];
const PROBES = ALL_PROBES.filter((p) => !p.expect);

const F = {};
for (const k of ["R_IN", "R_OUT", "BARE", "CATEGORY", "DEAD", "ENC", "ZONE", "JOB", "PROJECT", "CLINIC", "OTHER_CLINIC", "DOCTOR", "DOCTOR2", "CONTACT", "CARER", "FRIEND", "RECEIPT", "DIET", "IMM_TYPE", "OUTGOING", "JOB_NONE", "JOB_ALL", "ATT_IN", "ATT_OUT"]) F[k] = randomUUID();
const ID = Object.fromEntries(PRINCIPALS.map((p) => [p, randomUUID()]));
const cat = await query("select id from project_folders where top_level_category = 'Events' and parent_folder_id is null limit 1");
F.CATEGORY = cat.body?.[0]?.id;
if (!F.CATEGORY) throw new Error("no root project folder for 'Events' on dev");
const lit = (id) => `'${id}'::uuid`;
const dq = (s) => { let tag = "p"; while (s.includes(`$${tag}$`)) tag += "x"; return `$${tag}$${s}$${tag}$`; };
// A probe that looks a row up in a list ("(select id from medication ... limit 1)") is asking two things:
// may this role write here, and may it read that list. The parity check's principals hold both; a role
// with one box flipped does not, and the lookup comes back null and fails a not-null column, which is
// neither an allow nor a refusal. So each lookup is resolved once, as the owner, before any probe runs,
// and only the box under test is asked. The resident's own attachment is a fixture with a known id.
const LOOKUPS = [...new Set(ALL_PROBES.flatMap((p) => p.sql.match(/\(select id from [a-z_]+(?: where type = 'Carer')?(?: order by id)? limit 1\)/g) ?? []))];
const looked = await query(`select ${LOOKUPS.map((l, i) => `${l} as l${i}`).join(", ")}`);
if (!Array.isArray(looked.body) || LOOKUPS.some((_, i) => !looked.body[0][`l${i}`])) throw new Error(`a lookup found no row on dev: ${JSON.stringify(looked.body)}`);
const resolveLookups = (sql) =>
  LOOKUPS.reduce((s, l, i) => s.split(l).join(lit(looked.body[0][`l${i}`])), sql)
    .split("(select id from attachments where owner_type = 'resident' and owner_id = $R limit 1)").join("$ATT_IN")
    .split("(select drive_file_id from attachments where owner_type = 'resident' and owner_id = $R limit 1)").join(`'harness-${"$"}R_IN_FILE'`);
const sqlOf = (p) => resolveLookups(p.sql).replace("$R_IN_FILE", `${F.R_IN}`).replace(/\$[A-Z_0-9]+/g, (m) => {
  if (m === "$R") return lit(F.R_IN);
  const v = F[m.slice(1)];
  if (!v) throw new Error(`probe for ${p.activity} names unknown fixture ${m}`);
  return lit(v);
});
const KIND = Object.fromEntries(ACTIVITIES.map((a) => [a.key, a.kind]));
// A Yes/No activity has one level, 2, even where its probe reads (friends.view, audit.view).
const need = (p) => (p.level === "read" && KIND[p.activity] === "level" ? 1 : 2);
const allowsAt = (level, p) => level >= need(p);
// The SQL that turns one role's cell into the opposite answer for this probe.
function flipSql(role, p) {
  const roleId = `(select id from public.roles where key = '${role}')`;
  return allowsAt(cellOf(role, p.activity), p)
    ? `delete from public.role_permissions where role_id = ${roleId} and activity = '${p.activity}'`
    : `insert into public.role_permissions (role_id, activity, level) select ${roleId}, '${p.activity}', ${need(p)} on conflict (role_id, activity) do update set level = excluded.level`;
}

function setup() {
  return `
begin;
create function pg_temp.probe(p_uid uuid, p_pre text, p_sql text) returns jsonb language plpgsql as $f$
declare v_n bigint; v_state text := null; v_msg text := null;
begin
  begin
    if p_pre is not null then execute p_pre; end if;
    perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
    set local role authenticated;
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
grant select on harness_ids to authenticated, service_role;
insert into harness_ids values
${PRINCIPALS.map((w) => `  ('${w}', ${lit(ID[w])})`).join(",\n")};

do $setup$
declare r record;
  v_own uuid := ${lit(F.CLINIC)}; v_oth uuid := ${lit(F.OTHER_CLINIC)};
begin
  for r in select * from harness_ids loop
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (r.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-wdw-' || r.who || '-' || r.id || '@example.invalid', '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || r.who), now(), now());
  end loop;
  -- by role_id, as the app's own writes do
  insert into user_roles (user_id, role_id) select h.id, ro.id from harness_ids h join roles ro on ro.key = h.who and ro.archived_at is null;

  insert into clinics (id, name) values (v_own, 'Harness own clinic'), (v_oth, 'Harness other clinic');
  with d as (insert into doctors (name, user_id) select 'Harness doctor', id from harness_ids where who = 'doctor' returning id)
    insert into doctor_clinics (clinic_id, doctor_id) select v_own, id from d;
  insert into doctors (id, name) values (${lit(F.DOCTOR)}, 'Harness doctor one'), (${lit(F.DOCTOR2)}, 'Harness doctor two');
  insert into doctor_clinics (clinic_id, doctor_id) values (v_own, ${lit(F.DOCTOR)}), (v_own, ${lit(F.DOCTOR2)});

  insert into residents (id, name, species, bio) values
    (${lit(F.R_IN)}, 'Harness in-scope', 'Dog', 'bio'), (${lit(F.R_OUT)}, 'Harness out-of-scope', 'Dog', 'bio'), (${lit(F.DEAD)}, 'Harness dead', 'Dog', 'bio'), (${lit(F.BARE)}, 'Harness bare', 'Dog', 'bio');
  insert into zones (id, name) values (${lit(F.ZONE)}, 'Harness zone');
  insert into enclosures (id, name, zone_id) values (${lit(F.ENC)}, 'Harness enclosure', ${lit(F.ZONE)});

  insert into clinic_visits (resident_id, clinic_id, appointment_date, status) values
    (${lit(F.R_IN)}, v_own, now() - interval '3 days', 'completed'), (${lit(F.R_OUT)}, v_oth, now() - interval '3 days', 'completed');
  insert into placement_history (resident_id, placement_type, start_date) select id, 'Intake', now() - interval '30 days'
    from residents where id in (${lit(F.R_IN)}, ${lit(F.R_OUT)}, ${lit(F.DEAD)});
  insert into placement_history (resident_id, placement_type, start_date) values (${lit(F.DEAD)}, 'Deceased', now() - interval '1 day');
  insert into contacts (id, name, type) values (${lit(F.CONTACT)}, 'Harness contact', 'Vendor'), (${lit(F.CARER)}, 'Harness carer', 'Carer');
  insert into shelter_friends (id, contact_id) values (${lit(F.FRIEND)}, ${lit(F.CONTACT)});
  insert into diet_types (id, name, daily_qty_small, daily_qty_medium, daily_qty_large) values (${lit(F.DIET)}, 'Harness diet', 1, 1, 1);
  insert into immunization_types (id, name, interval_months) values (${lit(F.IMM_TYPE)}, 'Harness immunization type', 12);
  insert into maintenance (id, title, zone_id) values (${lit(F.JOB)}, 'Harness job', ${lit(F.ZONE)});
  insert into project_folders (id, top_level_category, name, parent_folder_id) values (${lit(F.PROJECT)}, 'Events', 'Harness project', ${lit(F.CATEGORY)});
  insert into stock_receipts (id, item_kind, medication_id, quantity) values (${lit(F.RECEIPT)}, 'medication', (select id from medication order by id limit 1), 1);
  insert into fixed_outgoings (id, label, monthly_amount) values (${lit(F.OUTGOING)}, 'Harness outgoing', 1);
  insert into recurring_jobs (id, title, time_of_day, link_path, repeat, weekdays, starts_on) values
    (${lit(F.JOB_NONE)}, 'Harness job none', 'morning', '/', 'weekly', '{1,2,3,4,5,6,7}', current_date - 7),
    (${lit(F.JOB_ALL)}, 'Harness job all', 'morning', '/', 'weekly', '{1,2,3,4,5,6,7}', current_date - 7);
  insert into recurring_job_assignees (job_id, user_id) select ${lit(F.JOB_ALL)}, id from harness_ids;

  insert into weight (resident_id, date, weight_kg) select id, current_date - 1, 5 from residents where id in (${lit(F.R_IN)}, ${lit(F.R_OUT)});
  insert into blood_tests (resident_id, date, blood_test_type_id) select id, current_date, (select id from blood_test_types limit 1) from residents where id in (${lit(F.R_IN)}, ${lit(F.R_OUT)});
  insert into procedures (resident_id, date, procedure_type_id) select id, current_date, (select id from procedure_types limit 1) from residents where id in (${lit(F.R_IN)}, ${lit(F.R_OUT)});
  insert into prescriptions (resident_id, medication_id, start_date) select id, (select id from medication order by id limit 1), current_date from residents where id in (${lit(F.R_IN)}, ${lit(F.R_OUT)});
  insert into immunization_records (resident_id, immunization_type_id, date_administered) select id, (select id from immunization_types limit 1), current_date from residents where id in (${lit(F.R_IN)}, ${lit(F.R_OUT)});
  insert into resident_diets (resident_id, diet_type_id, start_date) select id, ${lit(F.DIET)}, current_date - 1 from residents where id in (${lit(F.R_IN)}, ${lit(F.R_OUT)});
  insert into adoption_updates (resident_id, received_on, channel) select id, current_date, 'visit' from residents where id in (${lit(F.R_IN)}, ${lit(F.R_OUT)});
  insert into attachments (id, owner_type, owner_id, drive_file_id, file_name, sub_folder) values
    (${lit(F.ATT_IN)}, 'resident', ${lit(F.R_IN)}, 'harness-${F.R_IN}', 'x.jpg', 'Medical'),
    (${lit(F.ATT_OUT)}, 'resident', ${lit(F.R_OUT)}, 'harness-${F.R_OUT}', 'x.jpg', 'Medical');
end $setup$;
create temp table harness_out (k text, res jsonb);
grant all on harness_out to authenticated, service_role;
`;
}

// One task per (probe, principal, as-is | flipped). Admin runs as is only: the control.
const tasks = [];
PROBES.forEach((p, i) => {
  const sql = sqlOf(p);
  tasks.push({ k: `${i}:admin:asis`, uid: ID.admin, pre: null, sql });
  for (const role of ROLES) {
    tasks.push({ k: `${i}:${role}:asis`, uid: ID[role], pre: null, sql });
    tasks.push({ k: `${i}:${role}:flip`, uid: ID[role], pre: flipSql(role, p), sql });
  }
});

const CHUNK = 120;
const actual = new Map();
for (let off = 0; off < tasks.length; off += CHUNK) {
  const slice = tasks.slice(off, off + CHUNK);
  const body = slice
    .map((t) => `  insert into harness_out values (${dq(t.k)}, pg_temp.probe(${lit(t.uid)}, ${t.pre ? dq(t.pre) : "null"}, ${dq(t.sql)}));`)
    .join("\n");
  const sql = `${setup()}
do $run$ begin
${body}
end $run$;
do $out$ begin
  raise exception 'HARNESS-RESULT %', (select json_agg(json_build_object('k', k, 'res', res)) from harness_out);
end $out$;
rollback;`;
  const { status, body: out } = await query(sql);
  const msg = typeof out === "string" ? out : out?.message ?? JSON.stringify(out);
  const m = /HARNESS-RESULT (.*)/.exec(msg);
  if (!m) throw new Error(`harness did not return a result (status ${status}): ${String(msg).slice(0, 1500)}`);
  for (const row of JSON.parse(m[1])) actual.set(row.k, row.res);
  process.stdout.write(`  probed ${Math.min(off + CHUNK, tasks.length)} / ${tasks.length}\r`);
}
console.log();

function allowed(res, p) {
  if (res.state) {
    if (res.state === "42501") return false;
    if (p.fn) return false; // a function refusing in its own words
    if (p.refusedBy?.includes(res.state)) return false;
    return null;
  }
  return Number(res.n) >= 1;
}

// Per box (role × activity), over every probe of the activity and both runs. A box is in the worst
// state any of its probes found:
//   WRONG    the database answers differently from the box today
//   STICKY   the box says yes, the database allows, and still allows with the box set to no: it cannot
//            be taken away (a role named in a function, another box that also opens it)
//   INERT    the box says no, the database refuses, and still refuses with the box set to yes: it
//            cannot be given. True today, and often only a missing prerequisite (photos need the
//            record), so it is reported for the edit stream and never fails this check
const faults = [];
const RANK = { obeyed: 0, inert: 1, sticky: 2, wrong: 3 };
const box = new Map(); // `${role}|${activity}` -> { state, notes: [] }
PROBES.forEach((p, i) => {
  const short = p.sql.replace(/\s+/g, " ").slice(0, 70);
  const adm = actual.get(`${i}:admin:asis`);
  if (allowed(adm, p) !== true) {
    faults.push(`${p.activity} ${p.level}: ${short}\n      Admin was not allowed (${adm.state ?? `${adm.n} rows`} ${adm.msg ?? ""}): the probe or its fixture is broken`);
    return;
  }
  for (const role of ROLES) {
    const asis = allowed(actual.get(`${i}:${role}:asis`), p);
    const flip = allowed(actual.get(`${i}:${role}:flip`), p);
    if (asis === null || flip === null) {
      const r = actual.get(`${i}:${role}:${asis === null ? "asis" : "flip"}`);
      faults.push(`${p.activity} ${p.level}: ${short}\n      ${role} (${asis === null ? "as is" : "flipped"}): unexpected error ${r.state} ${r.msg}`);
      continue;
    }
    const says = allowsAt(cellOf(role, p.activity), p);
    const state = asis !== says ? "wrong" : flip === asis ? (says ? "sticky" : "inert") : "obeyed";
    const key = `${role}|${p.activity}`;
    const b = box.get(key) ?? { state: "obeyed", notes: [] };
    if (RANK[state] > RANK[b.state]) b.state = state;
    if (state !== "obeyed") {
      const what = { wrong: `the box says ${says ? "yes" : "no"}, the database ${asis ? "allows" : "refuses"}`, sticky: "allowed with the box set to no", inert: "refused with the box set to yes" }[state];
      b.notes.push(`${p.level}: ${what}  (${short})`);
    }
    box.set(key, b);
  }
});

// Compare with FIXED_FOR_NOW.
const listed = new Map(); // box key -> entries
for (const e of FIXED_FOR_NOW) for (const k of boxesOf(e, ROLES)) listed.set(k, [...(listed.get(k) ?? []), e]);
const needsListing = (b) => b.state === "wrong" || b.state === "sticky";
const required = [...box.entries()].filter(([, b]) => needsListing(b));
// A box the grid's prerequisite rules account for (src/lib/permissions/prerequisites.ts) is not a lie the page tells:
// the edit refuses the combination and the page names it, so it needs no FIXED_FOR_NOW entry.
const byRule = ([k]) => { const [role, activity] = k.split("|"); return explainedByPrerequisite((a) => cellOf(role, a), activity); };
const unlisted = required.filter(([k]) => !(listed.get(k) ?? []).some((e) => e.measured) && !byRule([k]));
const stale = FIXED_FOR_NOW.filter((e) => e.measured).filter((e) => {
  const mine = boxesOf(e, ROLES).filter((k) => box.has(k));
  return mine.length > 0 && mine.every((k) => box.get(k).state === "obeyed");
});
// A box an entry marks that is obeyed: the page would call a true box "fixed for now".
const overListed = FIXED_FOR_NOW.filter((e) => e.measured && !stale.includes(e)).flatMap((e) =>
  boxesOf(e, ROLES).filter((k) => box.get(k)?.state === "obeyed").map((k) => `${e.id}: ${k.replace("|", " ")}${e.closedBy ? `  (closedBy ${e.closedBy}: if that stream has applied its migration to dev but not merged, this is expected until it merges and removes the box)` : ""}`));
const unprobedMeasured = FIXED_FOR_NOW.filter((e) => e.measured && boxesOf(e, ROLES).every((k) => !box.has(k)));

const count = (st) => [...box.values()].filter((b) => b.state === st).length;
const probed = new Set(PROBES.map((p) => p.activity));
console.log(`Roles: ${ROLES.join(", ")}. Admin is the control: allowed by every probe, or the probe is broken.`);
console.log(`Activities with a database probe: ${probed.size} of ${ACTIVITIES.length}. Boxes measured: ${box.size}.`);
console.log(`  OBEYED     ${count("obeyed")}`);
console.log(`  WRONG      ${count("wrong")}   (must be in FIXED_FOR_NOW)`);
console.log(`  STICKY     ${count("sticky")}   (must be in FIXED_FOR_NOW)`);
console.log(`  INERT      ${count("inert")}   (reported, not required)`);
console.log(`  UNLISTED   ${unlisted.length}`);
console.log(`  STALE      ${stale.length}`);
console.log(`  OVERLISTED ${overListed.length}`);
console.log(`  FAULT      ${faults.length}`);

const show = (title, st) => {
  const rows = [...box.entries()].filter(([, b]) => b.state === st);
  if (!rows.length) return;
  console.log(`\n${title}:`);
  for (const [k, b] of rows) {
    const ids = (listed.get(k) ?? []).filter((e) => e.measured).map((e) => e.id);
    const tag = st === "inert" ? "" : ids.length ? `  [${ids.join(", ")}]` : byRule([k]) ? "  [prerequisite rule]" : "  [UNLISTED]";
    console.log(`  ${k.replace("|", "  ")}${tag}`);
    for (const n of verbose || st !== "inert" ? b.notes : b.notes.slice(0, 1)) console.log(`      ${n}`);
  }
};
show("WRONG today", "wrong");
show("STICKY: cannot be taken away", "sticky");
show("INERT: cannot be given (often a prerequisite; for who-does-what-edit)", "inert");
if (verbose) {
  console.log("\nObeyed:");
  for (const [k, b] of box) if (b.state === "obeyed") console.log(`  ${k.replace("|", "  ")}`);
}
console.log("\nEntries a probe cannot see (read by hand; printed, not checked):");
for (const e of FIXED_FOR_NOW.filter((x) => !x.measured)) console.log(`  ${e.id}: ${e.activities.join(", ")} for ${e.roles === "all" ? "every role" : e.roles.join(", ")}`);
const unprobed = ACTIVITIES.map((a) => a.key).filter((a) => !probed.has(a));
console.log(`\nActivities with no database probe (${unprobed.length}); their boxes are the app's can() and page guards:`);
for (const a of unprobed) console.log(`  ${a}${NO_DB_PROBE[a] ? `: ${NO_DB_PROBE[a]}` : ""}`);

if (faults.length) { console.log("\nFAULTS (a probe that cannot be trusted; nothing it says is counted):"); for (const f of faults) console.log(`  ${f}`); }
if (unlisted.length) console.log(`\nFAIL: ${unlisted.length} box(es) wrong or sticky and not in FIXED_FOR_NOW. The page would show them as true.`);
if (stale.length) console.log(`\nFAIL: STALE entries, every box they cover is obeyed now. Remove them: ${stale.map((e) => (e.closedBy ? `${e.id} (closedBy ${e.closedBy})` : e.id)).join(", ")}`);
if (overListed.length) console.log(`\nFAIL: entries mark boxes that are obeyed (the grid would call a true box fixed). Take them out:\n  ${overListed.join("\n  ")}`);
if (unprobedMeasured.length) console.log(`\nFAIL: entries marked measured with no probed box: ${unprobedMeasured.map((e) => e.id).join(", ")} (set measured: false and say how it was read)`);
const ok = !faults.length && !unlisted.length && !stale.length && !overListed.length && !unprobedMeasured.length;
if (ok) console.log("\nOK: every probed box is obeyed or listed in FIXED_FOR_NOW.");
process.exit(ok ? 0 : 1);
