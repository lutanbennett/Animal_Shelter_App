// perm-functions-schema (0178): the functions and views that decided who may do something by the role's name now
// ask a cell or the clinic scope. docs/decisions/2026-10-11-perm-functions-schema.md.
//
//   node scripts/check-perm-functions.mjs                  (from the repo root; dev only)
//   node scripts/check-perm-functions.mjs <migration.sql>  (replay another file, e.g. a mutant)
//
// check-permission-parity probes tables, not these functions, so it cannot see a gate inside a function move.
// This does, in ONE transaction that always ends in `raise exception` (nothing is kept), under each live login's
// own JWT (aal2, so the admin-at-2-step gates answer on the role and not the factor):
//   1. BEFORE: call every converted function, and count every converted view, as that login. Each call runs in its
//      own sub-block that is rolled back, and its answer is "ok", a row count, or the error message.
//   2. Run the migration file in the same transaction (default: 0178).
//   3. AFTER: the same calls. Every answer that changed is listed as "role probe: before -> after".
//   4. The changes must be EXACTLY the ones in EXPECTED below: a change not listed fails (a conversion mistake, or
//      a gain nobody agreed), and so does a listed one that did not happen.
// Then, outside the transaction, a standing check: no function in public or private reads the enum
// (current_user_role(), or a user_roles.role / legacy_role comparison) except the ones LEFT for perm-drop-enum.
// Once 0178 is applied, the BEFORE side is already 0178, so steps 1-3 report no changes and EXPECTED is not
// required; pass --applied to say so, and the run then requires zero changes instead.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const applied = process.argv.includes("--applied");
const fileArg = process.argv.slice(2).find((a) => !a.startsWith("--"));
const migration = applied ? "" : readFileSync(fileArg ?? join(root, "supabase/migrations/0178_perm_functions.sql"), "utf8");

// "role probe: before -> after", each agreed (decision file §4). Anything else that moves is a failure.
const EXPECTED = new Set([
  // Settings -> Diets is Admin-only in the app since 2026-10-08; the function still let Management in.
  "management set_standard_diet: ok -> Not authorized to change the standard diet.",
  // A 2IC may record a death but the Drive filing was refused. Lutan agreed the gain in chat, 2026-10-11.
  "second_in_command record_deceased_archive: Not authorized to archive a deceased resident. -> ok",
  // The enum let every doctor in; no doctor has recurring.do_own and the app never offers My jobs to one.
  "doctor record_recurring_job: Only the people this job is assigned to, or management, can record it. -> Not authorized to record a recurring job.",
  // record_attachment: a role with maintenance.photos may file a maintenance photo here, which
  // attachments_insert_perm already lets it insert directly. (A doctor passed the old gate for maintenance and
  // project files too, but doctor_can_write_attachment() refused them further down, so nothing moves for one.)
  "head_of_maintenance record_attachment maintenance: Not authorized to add attachments. -> ok",
  "second_in_command record_attachment maintenance: Not authorized to add attachments. -> ok",
]);

// Nothing reads the enum any more: 0180 moved the last readers onto the role's own row and 0181 dropped it. The list
// stays, empty, so a function that starts asking for one fails this check instead of passing for want of a list.
const LEFT = new Set([]);

async function sql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  return { status: res.status, body: await res.json() };
}

// Sample rows, chosen on each run so the script does not go stale when dev is reseeded.
const idq = await sql(`select json_build_object(
  'med', (select id from medication order by id limit 1),
  'diet', (select id from diet_types order by id limit 1),
  'std', (select id from diet_types where is_standard limit 1),
  'job', (select j.id from recurring_jobs j order by j.id limit 1),
  'jobday', (select d::date from recurring_jobs j, generate_series(current_date, current_date + 120, '1 day') d
              where j.id = (select id from recurring_jobs order by id limit 1)
                and recurrence_occurs_on(d::date, j.repeat, j.every, j.weekdays, j.month_day, j.week_of_month, j.starts_on, j.ends_on)
              order by d limit 1),
  'live', (select r.id from residents r where not resident_is_deceased(r.id) order by r.id limit 1),
  'dead', (select ph.resident_id from placement_history ph where ph.placement_type = 'Deceased' and ph.end_date is null
            and exists (select 1 from placement_history p2 where p2.resident_id = ph.resident_id and p2.start_date < ph.start_date)
            order by ph.resident_id limit 1),
  'bt', (select id from blood_tests order by id limit 1),
  'proc', (select id from procedures order by id limit 1),
  'maint', (select id from maintenance order by id limit 1),
  'project', (select id from project_folders order by id limit 1),
  'docA', (select id from doctors where user_id is null order by id limit 1),
  'docB', (select id from doctors where user_id is not null order by id limit 1),
  'uDoctor', (select ur.user_id from user_roles ur join roles r on r.id = ur.role_id where r.key = 'doctor' and ur.archived_at is null order by 1 limit 1),
  'uVol', (select ur.user_id from user_roles ur join roles r on r.id = ur.role_id where r.key = 'volunteer' and ur.archived_at is null order by 1 limit 1)
) as j`);
const ids = idq.body?.[0]?.j;
if (!ids) throw new Error(`could not pick sample rows: ${JSON.stringify(idq.body).slice(0, 500)}`);
for (const [k, v] of Object.entries(ids)) if (!v) throw new Error(`no sample row for ${k} on dev`);
const L = (v) => `'${v}'`;

// name -> a statement returning one integer (how many rows / 1 for a call that returned). Any error is the answer.
const PROBES = {
  record_stocktake: `select count(*) from record_stocktake('[]'::jsonb, '[]'::jsonb)`,
  "record_stock_correction medication": `select count(*) from (select record_stock_correction('medication', ${L(ids.med)}, null)) x`,
  "record_stock_correction diet_type": `select count(*) from (select record_stock_correction('diet_type', ${L(ids.diet)}, null)) x`,
  set_standard_diet: `select count(*) from (select set_standard_diet(${L(ids.std)})) x`,
  record_recurring_job: `select count(*) from (select record_recurring_job(${L(ids.job)}, ${L(ids.jobday)}, null)) x`,
  "reassign_recurring_job none": `select count(*) from (select reassign_recurring_job(${L(ids.job)}, ${L(ids.jobday)}, '{}')) x`,
  "reassign_recurring_job people": `select count(*) from (select reassign_recurring_job(${L(ids.job)}, ${L(ids.jobday)}, array[${L(ids.uDoctor)}, ${L(ids.uVol)}]::uuid[])) x`,
  "record_attachment resident": `select count(*) from record_attachment('resident', ${L(ids.live)}, 'probe', null, 'Medical')`,
  "record_attachment blood_test": `select count(*) from record_attachment('blood_test', ${L(ids.bt)}, 'probe')`,
  "record_attachment procedure": `select count(*) from record_attachment('procedure', ${L(ids.proc)}, 'probe')`,
  "record_attachment maintenance": `select count(*) from record_attachment('maintenance', ${L(ids.maint)}, 'probe')`,
  "record_attachment project": `select count(*) from record_attachment('project', ${L(ids.project)}, 'probe')`,
  set_resident_microchip: `select count(*) from (select set_resident_microchip(${L(ids.live)}, null)) x`,
  record_deceased_archive: `select count(*) from (select record_deceased_archive(${L(ids.dead)})) x`,
  undo_deceased_placement: `select count(*) from (select undo_deceased_placement(${L(ids.dead)}, 'probe')) x`,
  "merge_doctors same": `select count(*) from (select merge_doctors(${L(ids.docA)}, ${L(ids.docA)})) x`,
  "merge_doctors login": `select count(*) from (select merge_doctors(${L(ids.docA)}, ${L(ids.docB)})) x`,
  doctors_guard_login: `with x as (update doctors set user_id = auth.uid() where id = ${L(ids.docA)} returning 1) select count(*) from x`,
  clinic_login_may_edit_doctor: `select count(*) from doctors d where clinic_login_may_edit_doctor(d.id)`,
  current_user_clinic_ids: `select cardinality(current_user_clinic_ids())`,
  current_doctor_resident_ids: `select count(*) from current_doctor_resident_ids()`,
  "view doctor_contacts": `select count(*) from doctor_contacts`,
  "view current_placement": `select count(*) from current_placement`,
  "view immunization_compliance": `select count(*) from immunization_compliance`,
  "view immunization_duplicate_check": `select count(*) from immunization_duplicate_check`,
  "view resident_current_state": `select count(*) from resident_current_state`,
  "view translation_queue": `select count(*) from translation_queue`,
};
const dq = (s) => `$q$${s}$q$`;
const probeArray = `array[${Object.keys(PROBES).map((k) => `array[${dq(k)}, ${dq(PROBES[k])}]`).join(", ")}]`;

const probe = (phase) => `
do $p$
declare u record; p text[]; n bigint; res text;
begin
  for u in select ur.user_id, coalesce(r.key, '?') as key
             from user_roles ur left join roles r on r.id = ur.role_id
            where ur.archived_at is null order by ur.user_id loop
    foreach p slice 1 in array ${probeArray} loop
      begin
        perform set_config('request.jwt.claims', json_build_object('sub', u.user_id, 'role', 'authenticated', 'aal', 'aal2')::text, true);
        set local role authenticated;
        execute p[2] into n;
        raise exception using errcode = 'ZZ001', message = case when p[1] like 'view %' or p[1] like 'current_%' or p[1] in ('clinic_login_may_edit_doctor', 'doctors_guard_login') then n::text else 'ok' end;
      exception when sqlstate 'ZZ001' then res := sqlerrm;
                when others then res := sqlerrm;
      end;
      insert into pg_temp.snap values ('${phase}', u.user_id, u.key, p[1], res);
    end loop;
  end loop;
end $p$;
`;
const final = `
do $f$
declare total int; s text; w text;
begin
  select count(*) into total from pg_temp.snap where phase = 'before';
  select string_agg(line || ' x' || n, E'\\n' order by line) into s from (
    select format('%s %s: %s -> %s', a.key, a.probe, a.res, b.res) as line, count(*) as n
      from pg_temp.snap a join pg_temp.snap b on b.phase = 'after' and a.uid = b.uid and a.probe = b.probe
     where a.phase = 'before' and a.res is distinct from b.res
     group by 1) d;
  -- Who gets past each gate afterwards, so "nothing changed" cannot mean "everyone is refused on both sides".
  select string_agg(format('%s: %s', probe, roles), E'\\n' order by probe) into w from (
    select probe, coalesce(string_agg(distinct key, ' ') filter (where res = 'ok' or res ~ '^[1-9][0-9]*$'), '-') as roles
      from pg_temp.snap where phase = 'after' group by probe) x;
  raise exception E'RESULT probes=%\\n%\\nWHO\\n%', total, coalesce(s, ''), w;
end $f$;
`;
const run = await sql(`begin;
create temp table snap (phase text, uid uuid, key text, probe text, res text);
${probe("before")}
${migration}
${probe("after")}
${final}
rollback;`);
// The Management API appends the PL/pgSQL CONTEXT to the message; the report is everything before it.
const msg = String(run.body?.message ?? "").replace(/\s*CONTEXT:[\s\S]*$/, "");
const m = msg.match(/RESULT probes=(\d+)\n?([\s\S]*)\nWHO\n([\s\S]*)$/);
if (!m) throw new Error(`harness did not report (${run.status}): ${msg.slice(0, 1500) || JSON.stringify(run.body).slice(0, 1500)}`);
const total = Number(m[1]);
const who = m[3];
// One change per line, each ending " x<count>"; an error message spanning lines is folded back onto its change.
const changes = m[2].split(/ x(\d+)(?:\n|$)/).reduce((acc, part, i, all) => {
  if (i % 2 === 0 && part.trim()) acc.push({ line: part.replace(/\s*\n\s*/g, " ").trim(), n: Number(all[i + 1]) });
  return acc;
}, []);
console.log(`${total} calls per side, ${Object.keys(PROBES).length} probes; ${applied ? "no file replayed (--applied)" : `replayed ${fileArg ?? "0178"}`}`);
let fails = 0;
for (const c of changes) {
  const ok = !applied && EXPECTED.has(c.line);
  if (!ok) fails++;
  console.log(`${ok ? "  agreed    " : "  UNEXPECTED"} ${c.line}  (${c.n} login${c.n === 1 ? "" : "s"})`);
}
if (!applied) {
  for (const e of EXPECTED) if (!changes.some((c) => c.line === e)) { fails++; console.log(`  MISSING    ${e}`); }
}
if (!changes.length) console.log("  no answer changed");
console.log(`\nwho gets past each gate afterwards (roles with at least one login answered ok / a non-zero count):\n${who.replace(/^/gm, "  ")}`);
if (!/record_stocktake: \S/.test(who) || /record_stocktake: -/.test(who)) { fails++; console.log("  nobody passes record_stocktake: the probes are not reaching the gates"); }

// Standing check: who still reads the enum.
const left = await sql(`select n.nspname || '.' || p.proname as fn from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'private') and p.prokind = 'f'
    and (pg_get_functiondef(p.oid) ~ 'current_user_role\\(\\)' or pg_get_functiondef(p.oid) ~* '(\\.|\\m)(role|legacy_role)\\s*(=|<>|in\\s*\\()')
    and p.proname <> 'role_can' order by 1`);
if (!Array.isArray(left.body)) throw new Error(`enum query failed: ${JSON.stringify(left.body).slice(0, 500)}`);
const still = left.body.map((r) => r.fn);
const stray = still.filter((f) => !LEFT.has(f));
console.log(`\nfunctions still reading the enum: ${still.length} (${still.join(", ")})`);
if (applied && stray.length) { fails += stray.length; console.log(`  NOT on the LEFT list: ${stray.join(", ")}`); }
if (!applied) console.log("  (judged after the apply: run again with --applied)");

console.log(fails ? `\nRESULT: RED (${fails})` : "\nRESULT: GREEN");
process.exitCode = fails ? 1 : 0;
