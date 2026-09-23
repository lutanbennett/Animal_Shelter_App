// Rollback harness for 0073_shelter_today.sql against DEV only.
// One transaction: the migration, assertions, an anon read, then a
// deliberate `raise exception` carrying the evidence — so nothing can commit.
//
//   node scripts/check-shelter-today.mjs     (from the repo root; dev only)
//
// Exits 0 when every assertion held. The run is inside begin…rollback and
// ends in a raise, so it writes nothing even on success. Postgres now()
// is the real clock, so run it between 00:00 and 07:00 Bangkok to see
// current_date and shelter_today() actually differ in the evidence line.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

// The TypeScript side's answer, from the real helper merged in #59.
const { todayIso } = await import(pathToFileURL(join(root, "src/lib/format.ts")).href);
const tsToday = todayIso();

const migration = readFileSync(join(root, "supabase/migrations/0073_shelter_today.sql"), "utf8");

const sql = `
begin;
${migration}

do $h$
declare
  v_zone uuid; v_enc uuid; v_med uuid;
  v_res uuid; v_prev_enc uuid; v_res2 uuid;
  p1 uuid; p2 uuid; p3 uuid;
  v_death uuid; v_cascade jsonb;
  v_m uuid; v_created date; v_completed date;
  v_base int; v_after_yday int; v_after_today int;
  v_old_ity int; v_new_ity int; v_old_aty int; v_new_aty int;
  v_adopt_shift int; v_dev_early int;
  e1 date; e2 date; e3 date;
begin
  -- A. the calendar functions
  if shelter_time_zone() <> 'Asia/Bangkok' then raise exception 'FAIL A zone'; end if;
  if shelter_date('2026-09-22 18:26:00+00') <> date '2026-09-23' then raise exception 'FAIL A 01:26 Bangkok'; end if;
  if shelter_date('2026-09-22 16:59:59+00') <> date '2026-09-22' then raise exception 'FAIL A 23:59:59 Bangkok'; end if;
  if shelter_date('2026-09-22 17:00:00+00') <> date '2026-09-23' then raise exception 'FAIL A 00:00 Bangkok'; end if;
  if shelter_today() <> date '${tsToday}' then
    raise exception 'FAIL A shelter_today() % <> todayIso() ${tsToday}', shelter_today();
  end if;

  -- B. maintenance: created default and completed stamp
  select id into v_zone from zones where name <> 'Lifecycle' limit 1;
  insert into maintenance (zone_id, title) values (v_zone, 'harness 0073') returning id, date_created into v_m, v_created;
  update maintenance set status = 'Completed' where id = v_m returning date_completed into v_completed;
  if v_created <> shelter_today() then raise exception 'FAIL B date_created %', v_created; end if;
  if v_completed <> shelter_today() then raise exception 'FAIL B date_completed %', v_completed; end if;

  -- C. the death cascade: a death at 01:26 Bangkok on 23 Sep (18:26Z on the 22nd)
  select e.id, e.zone_id into v_enc, v_zone
    from enclosures e join zones z on z.id = e.zone_id
   where z.name = 'Lifecycle' and e.name = 'Deceased';
  select id into v_med from medication limit 1;
  select s.resident_id, s.current_enclosure_id into v_res, v_prev_enc
    from resident_current_state s
    join current_placement cp on cp.id = s.current_placement_id
   where s.current_status in ('Resident', 'Unassigned')
     and cp.start_date < '2026-09-22 00:00+00'
   limit 1;
  if v_res is null then raise exception 'FAIL C no living resident to use'; end if;

  -- open course: must close on the day of death, 23 Sep
  insert into prescriptions (resident_id, medication_id, start_date) values (v_res, v_med, '2026-09-01') returning id into p1;
  -- ends on the day of death: must be left alone (old code picked it and moved it to the 22nd)
  insert into prescriptions (resident_id, medication_id, start_date, end_date) values (v_res, v_med, '2026-09-01', '2026-09-23') returning id into p2;
  -- started on the day of death: closes on its own start
  insert into prescriptions (resident_id, medication_id, start_date) values (v_res, v_med, '2026-09-23') returning id into p3;

  insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id, previous_enclosure_id, cause_of_death)
  values (v_res, 'Deceased', '2026-09-22 18:26:00+00', v_zone, v_enc, v_prev_enc, 'harness 0073')
  returning id, deceased_cascade into v_death, v_cascade;

  select end_date into e1 from prescriptions where id = p1;
  select end_date into e2 from prescriptions where id = p2;
  select end_date into e3 from prescriptions where id = p3;
  if e1 is distinct from date '2026-09-23' then raise exception 'FAIL C open course ended % (want 2026-09-23)', e1; end if;
  if e2 is distinct from date '2026-09-23' then raise exception 'FAIL C course ending on death day moved to %', e2; end if;
  if e3 is distinct from date '2026-09-23' then raise exception 'FAIL C same-day course ended %', e3; end if;
  if (v_cascade -> 'prescriptions') @> jsonb_build_array(jsonb_build_object('id', p2)) then
    raise exception 'FAIL C cascade recorded the course that ends on the death day';
  end if;
  if not ((v_cascade -> 'prescriptions') @> jsonb_build_array(jsonb_build_object('id', p1, 'end_date', null))) then
    raise exception 'FAIL C cascade did not record the open course: %', v_cascade;
  end if;

  -- D. in_treatment: a course that ended yesterday (shelter) does not count; one ending today does
  select s.resident_id into v_res2
    from resident_current_state s
   where s.current_status in ('Resident', 'Unassigned')
     and s.resident_id <> v_res
     and not exists (select 1 from prescriptions p where p.resident_id = s.resident_id
                      and (p.end_date is null or p.end_date >= shelter_today() - 1))
   limit 1;
  select in_treatment into v_base from public_shelter_stats;
  insert into prescriptions (resident_id, medication_id, start_date, end_date)
    values (v_res2, v_med, shelter_today() - 10, shelter_today() - 1);
  select in_treatment into v_after_yday from public_shelter_stats;
  insert into prescriptions (resident_id, medication_id, start_date, end_date)
    values (v_res2, v_med, shelter_today() - 10, shelter_today());
  select in_treatment into v_after_today from public_shelter_stats;
  if v_after_yday <> v_base then raise exception 'FAIL D yesterday''s course counted (% -> %)', v_base, v_after_yday; end if;
  if v_after_today <> v_base + 1 then raise exception 'FAIL D today''s course not counted (% -> %)', v_base, v_after_today; end if;

  -- E. evidence only: this-year counts old vs new, adoptions shown on a shifted day, dev deaths already closed early
  select intakes_this_year, adopted_this_year into v_new_ity, v_new_aty from public_shelter_stats;
  select count(*) into v_old_ity from placement_history where placement_type = 'Intake' and start_date >= date_trunc('year', now());
  select count(*) into v_old_aty from placement_history where placement_type = 'Adopt' and start_date >= date_trunc('year', now());
  select count(*) into v_adopt_shift from placement_history
   where placement_type = 'Adopt' and shelter_date(start_date) <> (start_date at time zone 'UTC')::date;
  select count(*) into v_dev_early
    from placement_history d
    join prescriptions p on p.resident_id = d.resident_id
   where d.placement_type = 'Deceased' and d.id <> v_death
     and p.end_date = (d.start_date at time zone 'UTC')::date
     and p.end_date < shelter_date(d.start_date);

  perform set_config('harness.msg', format(
    'todayIso()=%s shelter_today()=%s current_date=%s | maintenance created=%s completed=%s | death 18:26Z closes on %s/%s/%s | in_treatment %s->%s->%s | intakes_this_year old=%s new=%s adopted_this_year old=%s new=%s | adoptions ever on a shifted day=%s | dev prescriptions already closed early=%s',
    '${tsToday}', shelter_today(), current_date, v_created, v_completed, e1, e2, e3,
    v_base, v_after_yday, v_after_today, v_old_ity, v_new_ity, v_old_aty, v_new_aty, v_adopt_shift, v_dev_early), true);
end;
$h$;

-- F. anon can read both public views (functions run with the caller's EXECUTE)
set local role anon;
do $h$
declare v_ok int; v_n int;
begin
  select in_treatment into v_ok from public_shelter_stats;
  select count(*) into v_n from public_recent_adoptions;
  raise exception 'HARNESS-OK % | anon: in_treatment=% recent_adoptions=%', current_setting('harness.msg'), v_ok, v_n;
end;
$h$;
rollback;
`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
console.log(`status ${res.status}`);
console.log(msg);
// exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
