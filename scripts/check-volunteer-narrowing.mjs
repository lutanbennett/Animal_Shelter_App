// R1 (docs/roles-and-permissions.md §12): "a script shows each removed right
// refused under a volunteer's own JWT". Against DEV only, in one transaction that
// is always rolled back.
//
//   node scripts/check-volunteer-narrowing.mjs            (from the repo root; dev only)
//   node scripts/check-volunteer-narrowing.mjs --verbose  (also list every case)
//   VOLUNTEER_RESTORE=weight|stocktake|translation_queue node scripts/check-volunteer-narrowing.mjs
//        puts one removed right back inside the rolled-back transaction, to show
//        that the check can fail (it must go red)
//
// It uses the technique of check-permission-parity.mjs (a login minted per role, the
// statement run under that login's own JWT and `authenticated` role, each probe in
// its own rolled-back subtransaction) rather than the parity run itself, because most
// of what 0134 removed is not an activity in §4: the translation queue, the group
// origins, the assistant's log, the views a volunteer read around the policies. Parity
// covers the activities; this covers the rights. They agree by construction: 0134
// deletes the volunteer's cells in the same file.
//
// For every case:
//   volunteer   must be REFUSED: 42501, zero rows, or (a function) its own refusal text
//   staff or management, and admin   must still be ALLOWED. Narrowing one role by
//               breaking another is the failure this half catches. A table with no rows
//               at all on dev is reported "no rows to see", not counted as a control.
// Then the volunteer's three kept rights must work (who and where, enclosures, zones),
// the who-and-where view must have exactly its fixed columns and be empty for everyone
// else, and two structural sweeps must hold: only the two kept policies name the
// volunteer, and only reassign_recurring_job() still says 'volunteer' in a function.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const root = process.cwd();
const verbose = process.argv.includes("--verbose");
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const WHO = ["admin", "management", "staff", "volunteer"];
const F = {};
for (const k of ["R", "ENC", "ZONE", "JOB", "PROJECT", "CATEGORY", "JOB_ALL", "ATT", ...WHO]) F[k] = randomUUID();
const dbq = async (query) => {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  return { status: res.status, text };
};
const root0 = await dbq("select id from project_folders where top_level_category = 'Events' and parent_folder_id is null limit 1");
F.CATEGORY = JSON.parse(root0.text)[0]?.id;
if (!F.CATEGORY) throw new Error("no root project folder for 'Events' on dev");
const lit = (id) => `'${id}'::uuid`;

// ---- the cases ----------------------------------------------------------------------------
const READ = (table, where = "true") => ({ key: `read ${table}`, kind: "read", sql: `select 1 from ${table} where ${where}` });
const CASES = [
  // the resident, and everything about it but who and where
  READ("residents"), READ("placement_history"), READ("adoption_updates"),
  READ("blood_tests"), READ("blood_test_types"), READ("procedures"), READ("procedure_types"),
  READ("prescriptions"), READ("medication"), READ("frequency"), READ("diet_types"), READ("resident_diets"),
  READ("immunization_records"), READ("immunization_types"), READ("weight"), READ("vet_appointments"),
  READ("group_origins"), READ("attachments"),
  // clinics, contacts, supporters
  READ("vets"), READ("vet_doctors"), READ("vet_doctor_clinics"), READ("contacts"), READ("shelter_friends"),
  { key: "read volunteer_contacts", kind: "read", sql: "select 1 from volunteer_contacts", others: "none" },
  // maintenance and projects
  READ("maintenance"), READ("maintenance_assignees"), READ("maintenance_photos"), READ("project_folders"), READ("project_photos"),
  // stock and recurring jobs
  READ("stock_counts"), READ("stock_receipts"), READ("item_unit_conversions"),
  READ("recurring_jobs"), READ("recurring_job_assignees"), READ("recurring_job_occurrences"), READ("recurring_job_occurrence_assignees"),
  // the assistant and the translations
  READ("assistant_actions"), READ("translations"),
  // the views that excluded only vets
  READ("current_placement"), READ("resident_current_state"), READ("immunization_compliance"),
  READ("immunization_duplicate_check"), READ("translation_queue"), READ("resident_list_view"),
  // writes
  { key: "write attachments (add a photo)", kind: "write", sql: `insert into attachments (owner_type, owner_id, drive_file_id, file_name, sub_folder) values ('resident', ${lit(F.R)}, 'vol-probe-a', 'p.jpg', 'Medical')` },
  { key: "write attachments (remove a photo)", kind: "write", sql: `delete from attachments where owner_id = ${lit(F.R)}` },
  { key: "write maintenance_photos", kind: "write", sql: `insert into maintenance_photos (maintenance_id, drive_file_id) values (${lit(F.JOB)}, 'vol-probe-m')` },
  { key: "write project_photos", kind: "write", sql: `insert into project_photos (project_folder_id, drive_file_id) values (${lit(F.PROJECT)}, 'vol-probe-p')` },
  { key: "write placement_history (the move)", kind: "write", sql: `insert into placement_history (resident_id, placement_type, start_date, enclosure_id) values (${lit(F.R)}, 'ChangeEnclosure', now() + interval '1 minute', ${lit(F.ENC)})` },
  { key: "write assistant_actions", kind: "write", sql: "insert into assistant_actions (user_id, request_text, status) values (auth.uid(), 'probe', 'unmatched')" },
  // the five function role lists
  { key: "fn record_stocktake", kind: "fn", sql: "select record_stocktake('[]'::jsonb, '[]'::jsonb)", refusal: /not authorized/i },
  { key: "fn delete_resident_photo", kind: "fn", sql: `select delete_resident_photo(${lit(F.ATT)})`, refusal: /not authorized/i },
  { key: "fn set_resident_profile_photo", kind: "fn", sql: `select set_resident_profile_photo(${lit(F.R)}, 'harness-vol-file')`, refusal: /not authorized/i },
  { key: "fn record_attachment", kind: "fn", sql: `select record_attachment('resident', ${lit(F.R)}, 'vol-probe-fn', 'p.jpg', 'Medical', null, null)`, refusal: /not authorized/i },
  { key: "fn record_recurring_job", kind: "fn", sql: `select record_recurring_job(${lit(F.JOB_ALL)}, current_date, 'done', null)`, refusal: /not authorized/i },
];

// What the volunteer keeps, and the view's fixed shape.
const WHO_AND_WHERE_COLUMNS = ["id", "name", "thai_name", "resident_code", "species", "sex", "profile_photo_drive_file_id", "current_status", "enclosure_id", "enclosure_name", "enclosure_name_th", "zone_id", "zone_name", "zone_name_th"];

const RESTORE = {
  weight: "create policy volunteer_read_weight on weight for select using (current_user_role() = 'volunteer'::app_role);",
  stocktake: `do $r$ begin execute replace(pg_get_functiondef('public.record_stocktake(jsonb,jsonb)'::regprocedure), '''staff'')', '''staff'', ''volunteer'')'); end $r$;`,
  translation_queue: `do $r$ begin execute 'create or replace view public.translation_queue as ' || replace(pg_get_viewdef('public.translation_queue'::regclass), '(current_user_role() IS DISTINCT FROM ''volunteer''::app_role) AND ', ''); end $r$;`,
};
const restoreKey = process.env.VOLUNTEER_RESTORE;
if (restoreKey && !RESTORE[restoreKey]) throw new Error(`VOLUNTEER_RESTORE: one of ${Object.keys(RESTORE).join(", ")}`);
if (restoreKey) console.log(`!! VOLUNTEER_RESTORE=${restoreKey}: one removed right is put back inside the transaction. The run below is meant to go red.\n`);

const dq = (s) => { let tag = "p"; while (s.includes(`$${tag}$`)) tag += "x"; return `$${tag}$${s}$${tag}$`; };

const sql = `
begin;
create function pg_temp.probe(p_uid uuid, p_sql text) returns jsonb language plpgsql as $f$
declare v_n bigint; v_state text := null; v_msg text := null;
begin
  begin
    if p_uid is not null then
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
insert into harness_ids values ${WHO.map((w) => `('${w}', ${lit(F[w])})`).join(", ")};

do $setup$
declare r record;
begin
  for r in select * from harness_ids loop
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (r.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-volunteer-' || r.who || '-' || r.id || '@example.invalid', '{}'::jsonb, jsonb_build_object('full_name', 'Harness ' || r.who), now(), now());
  end loop;
  insert into user_roles (user_id, role) select id, who::app_role from harness_ids;

  insert into zones (id, name) values (${lit(F.ZONE)}, 'Harness zone');
  insert into enclosures (id, name, zone_id) values (${lit(F.ENC)}, 'Harness enclosure', ${lit(F.ZONE)});
  insert into residents (id, name, species, bio) values (${lit(F.R)}, 'Harness who and where', 'Dog', 'private bio');
  insert into placement_history (resident_id, placement_type, start_date, enclosure_id)
    values (${lit(F.R)}, 'Intake', now() - interval '30 days', ${lit(F.ENC)});
  insert into attachments (id, owner_type, owner_id, drive_file_id, file_name, sub_folder)
    values (${lit(F.ATT)}, 'resident', ${lit(F.R)}, 'harness-vol-file', 'x.jpg', 'Medical');
  insert into maintenance (id, title, zone_id) values (${lit(F.JOB)}, 'Harness job', ${lit(F.ZONE)});
  insert into project_folders (id, top_level_category, name, parent_folder_id) values (${lit(F.PROJECT)}, 'Events', 'Harness project', ${lit(F.CATEGORY)});
  insert into recurring_jobs (id, title, time_of_day, link_path, repeat, weekdays, starts_on)
    values (${lit(F.JOB_ALL)}, 'Harness job', 'morning', '/', 'weekly', '{1,2,3,4,5,6,7}', current_date - 7);
  insert into recurring_job_assignees (job_id, user_id) select ${lit(F.JOB_ALL)}, id from harness_ids;
  insert into assistant_actions (user_id, request_text, status) select id, 'harness', 'unmatched' from harness_ids;
  insert into maintenance_photos (maintenance_id, drive_file_id) values (${lit(F.JOB)}, 'harness-m');
  insert into project_photos (project_folder_id, drive_file_id) values (${lit(F.PROJECT)}, 'harness-p');
  insert into weight (resident_id, date, weight_kg) values (${lit(F.R)}, current_date - 1, 5);
  insert into blood_tests (resident_id, date, blood_test_type_id) values (${lit(F.R)}, current_date, (select id from blood_test_types limit 1));
  insert into procedures (resident_id, date, procedure_type_id) values (${lit(F.R)}, current_date, (select id from procedure_types limit 1));
  insert into prescriptions (resident_id, medication_id, start_date) values (${lit(F.R)}, (select id from medication order by id limit 1), current_date);
  insert into immunization_records (resident_id, immunization_type_id, date_administered) values (${lit(F.R)}, (select id from immunization_types limit 1), current_date);
  insert into adoption_updates (resident_id, received_on, channel) values (${lit(F.R)}, current_date, 'visit');
end $setup$;
${restoreKey ? RESTORE[restoreKey] : ""}

-- the statement as the superuser: does it see anything at all?
create function pg_temp.base_n(p_sql text) returns bigint language plpgsql as $f$
declare v_n bigint;
begin
  begin
    execute p_sql; get diagnostics v_n = row_count;
    raise exception using errcode = 'P0999', message = 'rollback';
  exception when sqlstate 'P0999' then null;
  end;
  return v_n;
end $f$;

create temp table harness_out (idx int, who text, res jsonb);
grant all on harness_out to authenticated, anon, service_role;
create temp table harness_base (idx int primary key, n bigint);
create function pg_temp.rec(p_idx int, p_sql text) returns void language plpgsql as $f$
declare r record;
begin
  for r in select who, id from harness_ids loop
    insert into harness_out values (p_idx, r.who, pg_temp.probe(r.id, p_sql));
  end loop;
end $f$;
do $run$ begin
${CASES.map((c, i) => `  perform pg_temp.rec(${i}, ${dq(c.sql)});\n  insert into harness_base values (${i}, case ${c.kind === "read" ? "when true" : "when false"} then pg_temp.base_n(${dq(c.sql)}) end);`).join("\n")}
  -- the kept rights, and the view's shape, under each login
  perform pg_temp.rec(1000, 'select 1 from resident_who_and_where where id = ''${F.R}''');
  perform pg_temp.rec(1001, 'select 1 from resident_who_and_where where id = ''${F.R}'' and enclosure_name = ''Harness enclosure'' and zone_name = ''Harness zone''');
  perform pg_temp.rec(1002, 'select 1 from enclosures where id = ''${F.ENC}''');
  perform pg_temp.rec(1003, 'select 1 from zones where id = ''${F.ZONE}''');
  perform pg_temp.rec(1004, 'select * from resident_who_and_where where id = ''${F.R}''');
end $run$;
do $out$
declare v_cols text; v_pol text; v_fn text;
begin
  select string_agg(column_name, ',' order by ordinal_position) into v_cols
    from information_schema.columns where table_schema = 'public' and table_name = 'resident_who_and_where';
  select string_agg(policyname, ',' order by policyname) into v_pol from pg_policies
   where schemaname = 'public' and (coalesce(qual, '') || coalesce(with_check, '') || policyname) ilike '%volunteer%';
  select string_agg(p.proname, ',' order by p.proname) into v_fn from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname in ('public', 'private') and p.prokind = 'f' and pg_get_functiondef(p.oid) ilike '%volunteer%';
  raise exception 'HARNESS-RESULT %', json_build_object(
    'rows', (select json_agg(json_build_object('idx', idx, 'who', who, 'res', res)) from harness_out),
    'base', (select json_agg(json_build_object('idx', idx, 'n', n)) from harness_base),
    'cols', v_cols, 'policies', v_pol, 'functions', v_fn);
end $out$;
rollback;
`;

const out = await dbq(sql);
let msg = out.text;
try { msg = JSON.parse(out.text).message ?? out.text; } catch {}
const m = /HARNESS-RESULT (.*)/.exec(msg);
if (!m) throw new Error(`harness did not return a result (status ${out.status}): ${msg.slice(0, 1500)}`);
const result = JSON.parse(m[1]);
const got = new Map(result.rows.map((r) => [`${r.idx}:${r.who}`, r.res]));
const baseN = new Map(result.base.map((r) => [r.idx, r.n]));

// ---- classify ---------------------------------------------------------------------------------
// allowed: true / false, or null when the probe itself broke (a fault, never read as a refusal)
function allowed(res, c) {
  if (res.state) {
    if (res.state === "42501") return false;
    if (c.kind === "fn" && c.refusal?.test(res.msg ?? "")) return false;
    return null;
  }
  return Number(res.n) >= 1;
}

const failures = [];
const faults = [];
const inconclusive = [];
let refused = 0;
let controls = 0;
const lines = [];

CASES.forEach((c, i) => {
  const adm = allowed(got.get(`${i}:admin`), c);
  const v = got.get(`${i}:volunteer`);
  const vol = allowed(v, c);
  const above = ["management", "staff"].map((w) => [w, allowed(got.get(`${i}:${w}`), c)]);
  // Admin is the fixture check: if Admin cannot do it, the case is broken, not the system.
  const needsRows = c.kind === "read" && Number(baseN.get(i)) === 0;
  if (!needsRows && adm !== true && c.others !== "none") { faults.push(`${c.key}: admin was not allowed (${got.get(`${i}:admin`).state ?? "0 rows"} ${got.get(`${i}:admin`).msg ?? ""}), so the case or its fixture is broken`); return; }
  if (vol === null) { faults.push(`${c.key}: volunteer hit an unexpected error ${v.state} ${v.msg}, a broken case and not a refusal`); return; }
  if (vol === true) { failures.push(`${c.key}: the VOLUNTEER WAS ALLOWED`); lines.push(`  FAIL  ${c.key}: volunteer allowed`); return; }
  refused++;
  if (c.others === "none") {
    // a view gated on the role: everyone else gets no rows; there is no control to run
    lines.push(`  ok    ${c.key}: volunteer refused`);
    return;
  }
  if (needsRows) {
    inconclusive.push(c.key);
    lines.push(`  ok    ${c.key}: volunteer refused (no rows to see on dev, so staff and management are not a control)`);
    return;
  }
  controls++;
  const someone = above.some(([, a]) => a === true);
  if (!someone) {
    failures.push(`${c.key}: the volunteer was refused, but neither management nor staff was allowed either (${above.map(([w, a]) => `${w}=${a}`).join(", ")}). Narrowing one role must not break another`);
    lines.push(`  FAIL  ${c.key}: refused for everyone`);
  } else lines.push(`  ok    ${c.key}: volunteer refused; ${above.map(([w, a]) => `${w} ${a ? "allowed" : "refused"}`).join(", ")}`);
});

// What the volunteer keeps.
const KEPT = [[1000, "a resident through resident_who_and_where"], [1001, "its enclosure and zone names through that view"], [1002, "the enclosures"], [1003, "the zones"]];
for (const [idx, label] of KEPT) {
  const a = allowed(got.get(`${idx}:volunteer`), { kind: "read" });
  if (a !== true) failures.push(`the volunteer lost ${label}: ${JSON.stringify(got.get(`${idx}:volunteer`))}`);
  else lines.push(`  ok    kept: volunteer reads ${label}`);
}
for (const w of ["management", "staff"]) {
  const a = allowed(got.get(`1000:${w}`), { kind: "read" });
  if (a !== false) failures.push(`resident_who_and_where returned rows to ${w}; it is the volunteer's view only`);
}
// the view carries exactly the fixed columns
if (result.cols !== WHO_AND_WHERE_COLUMNS.join(",")) failures.push(`resident_who_and_where columns are ${result.cols}, expected ${WHO_AND_WHERE_COLUMNS.join(",")}`);
else lines.push("  ok    resident_who_and_where has exactly its fixed columns");
// the structural sweeps
if (result.policies !== "volunteer_read_enclosures,volunteer_read_zones") failures.push(`policies that still name the volunteer: ${result.policies}; expected only volunteer_read_enclosures and volunteer_read_zones`);
else lines.push("  ok    only volunteer_read_enclosures and volunteer_read_zones still name the volunteer");
if (result.functions !== "has_app_access,has_shelter_floor,reassign_recurring_job,sees_all_contacts,sees_all_residents") failures.push(`functions that still say 'volunteer': ${result.functions}; expected only has_app_access (may sign in), reassign_recurring_job (who a date may be handed to), has_shelter_floor (0149: the one test left for deleting a job) sees_all_residents (0144) and sees_all_contacts (0147): each excludes the volunteer floor from the whole record, grants nothing. None is a right`);
else lines.push("  ok    only has_app_access() (may sign in), has_shelter_floor() (0149, a refusal), reassign_recurring_job() (who a date may be handed to) sees_all_residents() (0144) and sees_all_contacts() (0147), both refusals, not rights, still say 'volunteer'");

if (verbose) console.log(lines.join("\n") + "\n");
console.log(`${CASES.length} removed rights, each under the volunteer's own JWT: ${refused} refused.`);
console.log(`${controls} of them also checked that management or staff still has the right (${inconclusive.length} tables had no rows on dev to check that against${inconclusive.length ? `: ${inconclusive.join(", ")}` : ""}).`);
for (const f of faults) console.log(`  HARNESS FAULT ${f}`);
for (const f of failures) console.log(`  FAIL ${f}`);
const red = failures.length > 0 || faults.length > 0;
console.log(red ? "\nRESULT: RED" : "\nRESULT: GREEN (every removed right refused; every kept right works; nobody else lost anything)");
// exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
process.exitCode = red ? 1 : 0;
