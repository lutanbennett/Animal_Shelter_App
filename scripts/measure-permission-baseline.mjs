// §10 of docs/roles-and-permissions.md chose the live lookup (has_permission() asked from
// each policy) over the token hook and committed to measuring it, not assuming it:
// `explain (analyze, buffers)` on the residents list and the medication list, as a
// volunteer and as staff, BEFORE and after the first converted table.
//
// It took the BEFORE when no table was converted, and each perm-convert-* stream reran it
// for its own before/after. Since 0167 every policy is converted (none calls
// current_user_role()), and 2026-10-09 it answered whether has_permission() needs a
// statement-level cache: docs/decisions/2026-10-09-has-permission-no-cache.md.
//
//   node scripts/measure-permission-baseline.mjs     (from the repo root; dev only)
//
// Each query is the one the page sends (src/app/residents/page.tsx and
// src/lib/medication-list/load.ts), run under a login's own JWT in a rolled-back
// transaction. Five runs each; the first is discarded as cold and the median of the
// rest is reported, with the buffers of that run. Writes nothing.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const QUERIES = {
  "residents list": `select resident_id, name, resident_code, thai_name, other_names, current_status, enclosure_id, enclosure_name, enclosure_name_th, zone_id, zone_name, zone_name_th, zone_internal from resident_list_view order by name`,
  "medication list: prescriptions": `select p.id, p.resident_id, p.dose_quantity, p.start_date, p.end_date, m.name, m.dose_unit, m.label_drive_file_id, f.label, f.doses_per_day, r.name, r.thai_name, r.profile_photo_drive_file_id from prescriptions p left join medication m on m.id = p.medication_id left join frequency f on f.id = p.frequency_id left join residents r on r.id = p.resident_id where p.archived_at is null and p.start_date <= current_date and (p.end_date is null or p.end_date >= current_date)`,
  // 0147: the address book and the clinics list, read by /contacts and the vet-visit form
  "contacts list": `select id, name, type, phone, email, line_id, address, notes, archived_at from contacts where archived_at is null order by name`,
  "clinics list": `select v.id, v.name, v.clinic_name, d.name from vets v left join doctors d on d.clinic_id = v.id order by v.name`,
  "medication list: placements": `select resident_id, current_status, enclosure_id, enclosure_name, enclosure_name_th, zone_name, zone_name_th from resident_list_view`,
  // 2026-10-09: the statements with the most init-plans. /projects reads 34 through the
  // view; the photo route asks attachments once per image shown (src/app/api/photos/[fileId]).
  "projects: categories": `select id, parent_folder_id, top_level_category, name, name_th, summary, project_date, location, is_public, cover_attachment_id, drive_folder_id, created_at, updated_at, child_count, photo_count, thumbnail_drive_file_id from project_folder_summary where parent_folder_id is null`,
  "photo route: attachment": `select id from attachments where drive_file_id = (select drive_file_id from attachments where drive_file_id is not null limit 1) limit 1`,
};
const WHO = ["staff", "volunteer"];
const RUNS = 5;
const ids = Object.fromEntries(WHO.map((w) => [w, randomUUID()]));

// MEASURE_PRE_SQL=<file>: SQL run first inside the rolled-back transaction, to measure a policy shape the database no longer has.
const preSql = process.env.MEASURE_PRE_SQL ? readFileSync(process.env.MEASURE_PRE_SQL, "utf8") : "";
const sql = `
begin;
${preSql}
create temp table harness_ids (who text primary key, id uuid not null);
grant select on harness_ids to authenticated;
insert into harness_ids values ${WHO.map((w) => `('${w}', '${ids[w]}')`).join(", ")};
do $s$ declare r record; begin
  for r in select * from harness_ids loop
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (r.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-baseline-' || r.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now());
    insert into user_roles (user_id, role) values (r.id, r.who::app_role);
  end loop;
end $s$;
create temp table out (who text, q text, run int, ms numeric, planning numeric, hit bigint, read bigint, rows bigint, initplans int, initplan_ms numeric);
grant all on out to authenticated;
create function pg_temp.measure(p_uid uuid, p_who text, p_name text, p_sql text, p_run int) returns void language plpgsql as $f$
declare l text; v_ms numeric; v_plan numeric; v_hit bigint := 0; v_read bigint := 0; v_rows bigint; v_first boolean := true;
  v_ip int := 0; v_ip_ms numeric := 0; v_in_ip boolean := false;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  for l in execute 'explain (analyze, buffers) ' || p_sql loop
    if v_first then v_rows := substring(l from 'actual time=[0-9.]+\\.\\.[0-9.]+ rows=([0-9]+)')::bigint; v_first := false; end if;
    -- an init-plan's own time is the "actual time=..<end>" of the node on the line after "InitPlan n"
    if v_in_ip then v_ip_ms := v_ip_ms + coalesce(substring(l from 'actual time=[0-9.]+\\.\\.([0-9.]+)')::numeric, 0); v_in_ip := false; end if;
    if btrim(l) ~ '^InitPlan' then v_ip := v_ip + 1; v_in_ip := true; end if;
    if l like 'Execution Time:%' then v_ms := substring(l from '[0-9.]+')::numeric; end if;
    if l like 'Planning Time:%' then v_plan := substring(l from '[0-9.]+')::numeric; end if;
    if btrim(l) like 'Buffers:%' and v_hit = 0 and v_read = 0 then
      v_hit := coalesce(substring(l from 'shared hit=([0-9]+)')::bigint, 0);
      v_read := coalesce(substring(l from 'read=([0-9]+)')::bigint, 0);
    end if;
  end loop;
  reset role;
  insert into out values (p_who, p_name, p_run, v_ms, v_plan, v_hit, v_read, v_rows, v_ip, v_ip_ms);
end $f$;
do $m$ begin
${WHO.flatMap((w) => Object.entries(QUERIES).flatMap(([n, q]) => Array.from({ length: RUNS }, (_, i) => `  perform pg_temp.measure('${ids[w]}', '${w}', '${n}', $q$${q}$q$, ${i + 1});`))).join("\n")}
end $m$;
do $o$ begin raise exception 'HARNESS-RESULT %', (select json_agg(row_to_json(out)) from out); end $o$;
rollback;`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
const m = /HARNESS-RESULT (.*)/.exec(msg);
if (!m) throw new Error(`no result (status ${res.status}): ${msg.slice(0, 1200)}`);
const rows = JSON.parse(m[1]);
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
console.log(`${new Date().toISOString().slice(0, 10)}, dev${preSql ? ", with MEASURE_PRE_SQL" : ""}. Init-plans: how many the plan holds (some never run); their ms is the sum of their own times, an upper bound (one nested in another counts twice).\n`);
console.log("login      query                              rows   exec ms (median of 4)  planning ms  shared hit  read  init-plans  their ms");
for (const who of WHO) for (const q of Object.keys(QUERIES)) {
  const rs = rows.filter((r) => r.who === who && r.q === q && r.run > 1);
  const mid = rs.sort((a, b) => a.ms - b.ms)[Math.floor(rs.length / 2)];
  console.log(`${who.padEnd(10)} ${q.padEnd(34)} ${String(mid.rows).padStart(4)}   ${String(median(rs.map((r) => Number(r.ms)))).padStart(8)}              ${String(mid.planning).padStart(8)}     ${String(mid.hit).padStart(8)}  ${String(mid.read).padStart(4)}  ${String(mid.initplans).padStart(10)}  ${Number(mid.initplan_ms).toFixed(3).padStart(8)}`);
}
process.exitCode = 0;
