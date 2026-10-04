// Rollback harness for 0119_placement_history_guards.sql against DEV only.
// One transaction: the file (twice), then each guard exercised as the roles
// that matter, then a deliberate `raise exception` carrying the evidence, so
// nothing can commit. Safe to run before or after the file is applied.
//
//   node scripts/check-placement-guards.mjs     (from the repo root; dev only)
//
// Refusals (DB-3, DB-4)
//   R1  end_date cannot be set, cleared or changed by hand (staff, admin, owner)
//   R2  notes stay editable
//   R3  ChangeEnclosure into Deceased / Adopted (volunteer) or Hospital
//       (staff); Adopt into Hospital; Deceased into Adopted; Intake into
//       Deceased; a zone-only Lifecycle row — all refused, and a refused
//       row closes nothing
// Must still work
//   P1  ChangeEnclosure between ordinary enclosures, volunteer and staff,
//       closing the prior placement through close_prior_placement()
//   P2  the deceased workflow end to end: Deceased -> cascade snapshot ->
//       undo_deceased_placement() restores it
//   P3  Intake, SendToHospital, ReturnFromHospital, Foster, Adopt and
//       ReturnToShelter, each into the target that owns it
//   P4  death from hospital, then undo: DeceasedInError targets Hospital
//   P5  the flag leaves nothing behind after a close
//
// Exits 0 when every assertion held. Writes nothing even on success.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync(join(root, "supabase/migrations/0119_placement_history_guards.sql"), "utf8");

const sql = `
begin;
${migration}
-- a second run of the whole file must be harmless
${migration}

-- Run one statement as a login; returns 'ok' or the error text.
create function pg_temp.run(p_uid uuid, p_sql text) returns text language plpgsql as $f$
declare v text := 'ok';
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  begin
    execute p_sql;
  exception when others then v := sqlerrm;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end $f$;

do $h$
declare
  v_vol uuid := gen_random_uuid(); v_staff uuid := gen_random_uuid(); v_admin uuid := gen_random_uuid();
  v_zone uuid := gen_random_uuid(); v_e1 uuid := gen_random_uuid(); v_e2 uuid := gen_random_uuid();
  v_vet uuid := gen_random_uuid(); v_carer uuid := gen_random_uuid();
  v_life uuid; v_un uuid; v_hosp uuid; v_fost uuid; v_adop uuid; v_dead uuid;
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid();
  v_appt uuid; v_r text; v_n int; v_id uuid; v_end timestamptz; v_uid uuid;
  t0 timestamptz := now() - interval '20 days';
begin
  select id into v_life from zones where name = 'Lifecycle';
  select id into v_un from enclosures where zone_id = v_life and name = 'Unassigned';
  select id into v_hosp from enclosures where zone_id = v_life and name = 'Hospital';
  select id into v_fost from enclosures where zone_id = v_life and name = 'Fostered';
  select id into v_adop from enclosures where zone_id = v_life and name = 'Adopted';
  select id into v_dead from enclosures where zone_id = v_life and name = 'Deceased';

  foreach v_uid in array array[v_vol, v_staff, v_admin] loop
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harness-placement-' || v_uid || '@example.invalid', '{}'::jsonb, '{"full_name":"Harness"}'::jsonb, now(), now());
  end loop;
  insert into user_roles (user_id, role) values (v_vol, 'volunteer'), (v_staff, 'staff'), (v_admin, 'admin');
  insert into zones (id, name) values (v_zone, 'Harness zone');
  insert into enclosures (id, name, zone_id) values (v_e1, 'Harness E1', v_zone), (v_e2, 'Harness E2', v_zone);
  insert into contacts (id, name, type) values (v_carer, 'Harness carer', 'Carer');
  insert into vets (id, name, clinic_name) values (v_vet, 'Harness vet', 'Harness clinic');
  insert into residents (id, name, species) values (a, 'Harness A', 'Dog'), (b, 'Harness B', 'Dog'), (c, 'Harness C', 'Dog');

  -- A: Intake (Unassigned) -> volunteer ChangeEnclosure E1 -> staff ChangeEnclosure E2
  insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id)
  values (a, 'Intake', t0, v_life, v_un);

  -- P1
  -- 0134: a volunteer no longer moves a resident; staff makes the first move
  v_r := pg_temp.run(v_vol, format($q$insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id, previous_enclosure_id)
    values (%L, 'ChangeEnclosure', %L, %L, %L, %L)$q$, a, t0 + interval '1 day', v_zone, v_e1, v_un));
  if v_r not like '%row-level security%' then raise exception 'FAIL P1 volunteer ChangeEnclosure should be refused by RLS: %', v_r; end if;
  v_r := pg_temp.run(v_staff, format($q$insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id, previous_enclosure_id)
    values (%L, 'ChangeEnclosure', %L, %L, %L, %L)$q$, a, t0 + interval '1 day', v_zone, v_e1, v_un));
  if v_r <> 'ok' then raise exception 'FAIL P1 staff ChangeEnclosure between ordinary enclosures: %', v_r; end if;
  v_r := pg_temp.run(v_staff, format($q$insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id, previous_enclosure_id)
    values (%L, 'ChangeEnclosure', %L, %L, %L, %L)$q$, a, t0 + interval '2 days', v_zone, v_e2, v_e1));
  if v_r <> 'ok' then raise exception 'FAIL P1 staff ChangeEnclosure: %', v_r; end if;
  select count(*) into v_n from placement_history where resident_id = a and end_date is not null;
  if v_n <> 2 then raise exception 'FAIL P1 expected 2 closed placements via close_prior_placement(), got %', v_n; end if;
  select count(*) into v_n from placement_history where resident_id = a and end_date is null and enclosure_id = v_e2;
  if v_n <> 1 then raise exception 'FAIL P1 expected one open placement in E2'; end if;
  -- P5
  if coalesce(current_setting('app.placement_close', true), '') = 'on' then
    raise exception 'FAIL P5 the flag was left on after a close';
  end if;

  -- R1: end_date by hand, closed row and open row, as staff, admin and the owner
  select id, end_date into v_id, v_end from placement_history where resident_id = a and end_date is not null order by start_date limit 1;
  foreach v_uid in array array[v_staff, v_admin] loop
    v_r := pg_temp.run(v_uid, format('update placement_history set end_date = null where id = %L', v_id));
    if v_r not like '%end_date is only set by close_prior_placement%' then raise exception 'FAIL R1 reopen as %: %', v_uid, v_r; end if;
    v_r := pg_temp.run(v_uid, format('update placement_history set end_date = now() where resident_id = %L and end_date is null', a));
    if v_r not like '%end_date is only set by close_prior_placement%' then raise exception 'FAIL R1 close as %: %', v_uid, v_r; end if;
  end loop;
  begin
    update placement_history set end_date = null where id = v_id;
    raise exception 'FAIL R1 the table owner reopened a placement';
  exception when others then
    if sqlerrm not like '%end_date is only set by close_prior_placement%' then raise; end if;
  end;
  if (select end_date from placement_history where id = v_id) is distinct from v_end then
    raise exception 'FAIL R1 a refused update changed end_date';
  end if;
  -- R2
  v_r := pg_temp.run(v_staff, format($q$update placement_history set notes = 'edited' where id = %L$q$, v_id));
  if v_r <> 'ok' then raise exception 'FAIL R2 notes edit: %', v_r; end if;
  if (select notes from placement_history where id = v_id) is distinct from 'edited' then
    raise exception 'FAIL R2 notes edit did not land (RLS filtered it)';
  end if;

  -- R3: B starts in E1 (Intake into a physical enclosure is ordinary)
  insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id)
  values (b, 'Intake', t0, v_zone, v_e1);
  v_r := pg_temp.run(v_staff, format($q$insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id)
    values (%L, 'ChangeEnclosure', %L, %L, %L)$q$, b, t0 + interval '1 day', v_life, v_dead));
  if v_r not like '%cannot target the Lifecycle pseudo-enclosure "Deceased"%' then raise exception 'FAIL R3 staff ChangeEnclosure -> Deceased: %', v_r; end if;
  v_r := pg_temp.run(v_staff, format($q$insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id)
    values (%L, 'ChangeEnclosure', %L, %L, %L)$q$, b, t0 + interval '1 day', v_life, v_adop));
  if v_r not like '%cannot target the Lifecycle pseudo-enclosure "Adopted"%' then raise exception 'FAIL R3 staff ChangeEnclosure -> Adopted: %', v_r; end if;
  v_r := pg_temp.run(v_staff, format($q$insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id)
    values (%L, 'ChangeEnclosure', %L, %L, %L)$q$, b, t0 + interval '1 day', v_life, v_hosp));
  if v_r not like '%cannot target the Lifecycle pseudo-enclosure "Hospital"%' then raise exception 'FAIL R3 ChangeEnclosure -> Hospital: %', v_r; end if;
  v_r := pg_temp.run(v_staff, format($q$insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id, carer_id)
    values (%L, 'Adopt', %L, %L, %L, %L)$q$, b, t0 + interval '1 day', v_life, v_hosp, v_carer));
  if v_r not like '%"Hospital"%' then raise exception 'FAIL R3 Adopt -> Hospital: %', v_r; end if;
  v_r := pg_temp.run(v_staff, format($q$insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id)
    values (%L, 'Deceased', %L, %L, %L)$q$, b, t0 + interval '1 day', v_life, v_adop));
  if v_r not like '%"Adopted"%' then raise exception 'FAIL R3 Deceased -> Adopted: %', v_r; end if;
  v_r := pg_temp.run(v_staff, format($q$insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id)
    values (%L, 'Intake', %L, %L, %L)$q$, b, t0 + interval '1 day', v_life, v_dead));
  if v_r not like '%"Deceased"%' then raise exception 'FAIL R3 Intake -> Deceased: %', v_r; end if;
  v_r := pg_temp.run(v_staff, format($q$insert into placement_history (resident_id, placement_type, start_date, zone_id)
    values (%L, 'ChangeEnclosure', %L, %L)$q$, b, t0 + interval '1 day', v_life));
  if v_r not like '%(none)%' then raise exception 'FAIL R3 zone-only Lifecycle row: %', v_r; end if;
  select count(*) into v_n from placement_history where resident_id = b;
  if v_n <> 1 then raise exception 'FAIL R3 a refused insert left % rows for B', v_n; end if;
  select count(*) into v_n from placement_history where resident_id = b and end_date is null and enclosure_id = v_e1;
  if v_n <> 1 then raise exception 'FAIL R3 a refused insert closed the prior placement'; end if;

  -- P2: the deceased workflow, with something for the cascade to snapshot
  insert into vet_appointments (resident_id, vet_id, appointment_date, status)
  values (b, v_vet, now() + interval '3 days', 'scheduled') returning id into v_appt;
  v_r := pg_temp.run(v_staff, format($q$insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id, previous_enclosure_id, cause_of_death)
    values (%L, 'Deceased', %L, %L, %L, %L, 'harness')$q$, b, t0 + interval '2 days', v_life, v_dead, v_e1));
  if v_r <> 'ok' then raise exception 'FAIL P2 Deceased placement: %', v_r; end if;
  if (select status from vet_appointments where id = v_appt) <> 'cancelled' then raise exception 'FAIL P2 cascade did not cancel the visit'; end if;
  select count(*) into v_n from placement_history
   where resident_id = b and placement_type = 'Deceased' and deceased_cascade is not null;
  if v_n <> 1 then raise exception 'FAIL P2 no cascade snapshot on the Deceased row'; end if;
  select count(*) into v_n from placement_history where resident_id = b and end_date is not null;
  if v_n <> 1 then raise exception 'FAIL P2 the Deceased insert did not close the prior placement'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform undo_deceased_placement(b, 'harness: recorded in error');
  reset role;
  perform set_config('request.jwt.claims', '', true);
  if (select status from vet_appointments where id = v_appt) <> 'scheduled' then raise exception 'FAIL P2 undo did not restore the visit'; end if;
  select count(*) into v_n from placement_history
   where resident_id = b and end_date is null and placement_type = 'DeceasedInError' and enclosure_id = v_e1;
  if v_n <> 1 then raise exception 'FAIL P2 undo did not put B back in E1'; end if;
  select count(*) into v_n from placement_history where resident_id = b and placement_type = 'Deceased' and end_date is not null;
  if v_n <> 1 then raise exception 'FAIL P2 undo did not close the Deceased row'; end if;

  -- P3: C: Intake Unassigned -> Hospital -> ReturnFromHospital E1 -> Foster
  -- -> Adopt -> ReturnToShelter E2
  insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id)
  values (c, 'Intake', t0, v_life, v_un);
  v_r := pg_temp.run(v_staff, format($q$insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id, previous_enclosure_id)
    values (%L, 'SendToHospital', %L, %L, %L, %L)$q$, c, t0 + interval '1 day', v_life, v_hosp, v_un));
  if v_r <> 'ok' then raise exception 'FAIL P3 SendToHospital: %', v_r; end if;
  v_r := pg_temp.run(v_staff, format($q$insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id, previous_enclosure_id)
    values (%L, 'ReturnFromHospital', %L, %L, %L, %L)$q$, c, t0 + interval '2 days', v_zone, v_e1, v_hosp));
  if v_r <> 'ok' then raise exception 'FAIL P3 ReturnFromHospital: %', v_r; end if;
  v_r := pg_temp.run(v_staff, format($q$insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id, previous_enclosure_id, carer_id)
    values (%L, 'Foster', %L, %L, %L, %L, %L)$q$, c, t0 + interval '3 days', v_life, v_fost, v_e1, v_carer));
  if v_r <> 'ok' then raise exception 'FAIL P3 Foster: %', v_r; end if;
  v_r := pg_temp.run(v_staff, format($q$insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id, previous_enclosure_id, carer_id)
    values (%L, 'Adopt', %L, %L, %L, %L, %L)$q$, c, t0 + interval '4 days', v_life, v_adop, v_fost, v_carer));
  if v_r <> 'ok' then raise exception 'FAIL P3 Adopt: %', v_r; end if;
  v_r := pg_temp.run(v_staff, format($q$insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id, previous_enclosure_id)
    values (%L, 'ReturnToShelter', %L, %L, %L, %L)$q$, c, t0 + interval '5 days', v_zone, v_e2, v_adop));
  if v_r <> 'ok' then raise exception 'FAIL P3 ReturnToShelter: %', v_r; end if;
  select count(*) into v_n from placement_history where resident_id = c and end_date is null;
  if v_n <> 1 then raise exception 'FAIL P3 C has % open placements', v_n; end if;

  -- P4: death from hospital, then undo returns to the Hospital pseudo-enclosure
  v_r := pg_temp.run(v_staff, format($q$insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id, previous_enclosure_id)
    values (%L, 'SendToHospital', %L, %L, %L, %L)$q$, c, t0 + interval '6 days', v_life, v_hosp, v_e2));
  if v_r <> 'ok' then raise exception 'FAIL P4 SendToHospital: %', v_r; end if;
  v_r := pg_temp.run(v_staff, format($q$insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id, previous_enclosure_id)
    values (%L, 'Deceased', %L, %L, %L, %L)$q$, c, t0 + interval '7 days', v_life, v_dead, v_hosp));
  if v_r <> 'ok' then raise exception 'FAIL P4 Deceased from hospital: %', v_r; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform undo_deceased_placement(c, 'harness: recorded in error');
  reset role;
  perform set_config('request.jwt.claims', '', true);
  select count(*) into v_n from placement_history
   where resident_id = c and end_date is null and placement_type = 'DeceasedInError' and enclosure_id = v_hosp;
  if v_n <> 1 then raise exception 'FAIL P4 undo did not return C to Hospital'; end if;

  raise exception 'HARNESS-OK file ran twice | R1 end_date cannot be set, cleared or changed by hand (staff, admin, owner); a refused update changes nothing | R2 notes still editable | R3 refused: staff ChangeEnclosure -> Deceased and -> Adopted, ChangeEnclosure -> Hospital, Adopt -> Hospital, Deceased -> Adopted, Intake -> Deceased, zone-only Lifecycle row; a refused insert leaves the prior placement open | P1 ChangeEnclosure between ordinary enclosures (volunteer and staff) closes the prior row via close_prior_placement() | P2 Deceased cascade snapshots and undo_deceased_placement() restores | P3 Intake, SendToHospital, ReturnFromHospital, Foster, Adopt, ReturnToShelter each into its own target | P4 death from hospital and undo back to Hospital | P5 flag not left on';
end
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
