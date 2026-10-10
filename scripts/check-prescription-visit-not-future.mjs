// Rollback harness for 0107_prescriptions_visit_not_in_future.sql against DEV
// only, asserting the LIVE schema. One transaction: seed a harness resident with
// visits yesterday, today, and tomorrow at the shelter, then write
// prescriptions as a signed-in management user straight through the tables — the
// second-tab / direct-API case the form's filter never sees — ending in a
// deliberate `raise exception` carrying the evidence, so nothing can commit.
//
// It used to replay 0107 twice first. 0172 renamed vet_appointments to
// clinic_visits and vet_appointment_id to clinic_visit_id and redefined both
// trigger functions, so a replay of 0107 names columns that no longer exist; it
// asserts the live schema instead (docs/decisions/2026-10-02-replay-or-assert-live.md).
// The signed-in user was staff until 0173 retired that role (a live staff row is
// refused); management writes prescriptions the same way.
//
//   node scripts/check-prescription-visit-not-future.mjs   (repo root; dev only)
//
// It checks, dates relative to shelter_today():
//   A  management linking a new prescription to tomorrow's visit is refused
//      (check_violation, named prescriptions_visit_not_in_future) — including
//      a visit at 06:00 Bangkok tomorrow, which is still today in UTC
//   B  what still works for management: yesterday's visit, a visit at 23:30
//      tonight, and no visit at all
//   C  management re-linking an existing prescription to tomorrow's visit is
//      refused; editing its dose, dates and notes without touching the link
//      is not
//   D  a link that predates the rule (planted with the trigger off) survives
//      an edit of the row's other columns — nothing is refused after the fact
//   E  the other door: moving a visit that has a prescription to tomorrow is
//      refused; moving it to another past day, or moving a visit with no
//      prescription into the future, is not
//
// Exits 0 when every assertion held. Writes nothing even on success.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const setup = `
begin;

create temp table harness (k text primary key, id uuid);
grant select on harness to authenticated;

do $setup$
declare
  v_mgmt uuid := gen_random_uuid();
  v_res uuid;
  v_today date := shelter_today();
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (v_mgmt, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'harness-rx-future-mgmt@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now());
  insert into user_roles (user_id, role) values (v_mgmt, 'management');

  insert into residents (name) values ('Harness rx no future visit') returning id into v_res;
  insert into harness values ('mgmt', v_mgmt), ('res', v_res),
    ('med', (select id from medication order by name limit 1));

  -- Instants built in the shelter zone, so "tomorrow 06:00" is 23:00Z today.
  create temp table harness_visits (k text, at timestamptz);
  insert into harness_visits values
    ('past',     (v_today - 1 + time '10:00') at time zone shelter_time_zone()),
    ('tonight',  (v_today + time '23:30') at time zone shelter_time_zone()),
    ('tomorrow', (v_today + 1 + time '10:00') at time zone shelter_time_zone()),
    ('early',    (v_today + 1 + time '06:00') at time zone shelter_time_zone()),
    ('empty',    (v_today - 3 + time '10:00') at time zone shelter_time_zone());
  insert into harness select k, gen_random_uuid() from harness_visits;
  insert into clinic_visits (id, resident_id, appointment_date, reason)
  select h.id, v_res, v.at, 'Harness ' || v.k
  from harness_visits v join harness h using (k);
end $setup$;
`;

const checks = `
do $h$
declare
  v_res uuid := (select id from harness where k = 'res');
  v_med uuid := (select id from harness where k = 'med');
  v_mgmt uuid := (select id from harness where k = 'mgmt');
  v_past uuid := (select id from harness where k = 'past');
  v_tonight uuid := (select id from harness where k = 'tonight');
  v_tomorrow uuid := (select id from harness where k = 'tomorrow');
  v_early uuid := (select id from harness where k = 'early');
  v_empty uuid := (select id from harness where k = 'empty');
  v_today date := shelter_today();
  v_rx uuid;
  v_legacy uuid;
  v_state text;
  v_msg text;
  v_report text := '';
begin
  if (select (appointment_date at time zone 'UTC')::date from clinic_visits where id = v_early) <> v_today then
    raise exception 'HARNESS-FAIL setup: the 06:00 visit is not on today''s UTC date';
  end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_mgmt, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- A: tomorrow's visit, and 06:00 tomorrow (still today in UTC).
  begin
    insert into prescriptions (resident_id, medication_id, start_date, clinic_visit_id)
    values (v_res, v_med, v_today, v_tomorrow);
    raise exception 'HARNESS-FAIL A: a prescription on tomorrow''s visit was accepted';
  exception when check_violation then
    get stacked diagnostics v_msg = message_text;
    if v_msg not like 'prescriptions_visit_not_in_future:%' then raise exception 'HARNESS-FAIL A: refused with %', v_msg; end if;
  end;
  begin
    insert into prescriptions (resident_id, medication_id, start_date, clinic_visit_id)
    values (v_res, v_med, v_today, v_early);
    raise exception 'HARNESS-FAIL A: a prescription on 06:00 tomorrow (today in UTC) was accepted';
  exception when check_violation then null;
  end;
  v_report := v_report || 'A: management insert on tomorrow''s visit refused, 06:00 tomorrow too | ';

  -- B: what still works.
  insert into prescriptions (resident_id, medication_id, start_date, clinic_visit_id)
  values (v_res, v_med, v_today - 1, v_past) returning id into v_rx;
  insert into prescriptions (resident_id, medication_id, start_date, clinic_visit_id)
  values (v_res, v_med, v_today, v_tonight);
  insert into prescriptions (resident_id, medication_id, start_date)
  values (v_res, v_med, v_today);
  v_report := v_report || 'B: yesterday''s visit, 23:30 tonight and unlinked accepted | ';

  -- C: relink to the future refused; other edits fine.
  begin
    update prescriptions set clinic_visit_id = v_tomorrow where id = v_rx;
    raise exception 'HARNESS-FAIL C: re-linking to tomorrow''s visit was accepted';
  exception when check_violation then null;
  end;
  update prescriptions set dose_quantity = 2, end_date = v_today + 5, notes = 'edited' where id = v_rx;
  if (select dose_quantity from prescriptions where id = v_rx) <> 2 then
    raise exception 'HARNESS-FAIL C: the dose edit did not land (RLS?)';
  end if;
  v_report := v_report || 'C: management re-link to tomorrow refused, dose/date/notes edit accepted | ';

  reset role;

  -- D: a link from before the rule is not refused when the row is edited.
  alter table prescriptions disable trigger prescriptions_visit_not_in_future;
  insert into prescriptions (resident_id, medication_id, start_date, clinic_visit_id)
  values (v_res, v_med, v_today, v_tomorrow) returning id into v_legacy;
  alter table prescriptions enable trigger prescriptions_visit_not_in_future;
  set local role authenticated;
  update prescriptions set notes = 'still linked' where id = v_legacy;
  update prescriptions set clinic_visit_id = v_tomorrow, notes = 'same link resent' where id = v_legacy;
  if (select notes from prescriptions where id = v_legacy) <> 'same link resent' then
    raise exception 'HARNESS-FAIL D: the legacy row edit did not land';
  end if;
  reset role;
  v_report := v_report || 'D: pre-rule future link survives edits, same link resent included | ';

  -- E: the visit side.
  begin
    update clinic_visits set appointment_date = appointment_date + interval '3 days' where id = v_past;
    raise exception 'HARNESS-FAIL E: a visit with a prescription moved into the future';
  exception when check_violation then
    get stacked diagnostics v_msg = message_text;
    if v_msg not like 'prescriptions_visit_not_in_future:%' then raise exception 'HARNESS-FAIL E: refused with %', v_msg; end if;
  end;
  update clinic_visits set appointment_date = appointment_date - interval '1 day' where id = v_past;
  update clinic_visits set appointment_date = appointment_date + interval '10 days' where id = v_empty;
  v_report := v_report || 'E: visit with a prescription cannot move past today; earlier day and prescription-free visit can';

  raise exception '%', format('HARNESS-OK prescriptions_visit_not_in_future, live schema | %s', v_report);
end;
$h$;
rollback;
`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: setup + checks }),
});
const text = await res.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
console.log(`status ${res.status}`);
console.log(msg);
// exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
