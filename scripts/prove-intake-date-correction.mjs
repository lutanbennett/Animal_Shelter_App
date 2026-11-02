#!/usr/bin/env node
/**
 * Proves 0302_correct_intake_date.sql does what it claims, against REAL rows, keeping nothing.
 *
 *   node scripts/prove-intake-date-correction.mjs              # test (dev) project
 *
 * Everything runs inside one `begin … rollback`, so no row survives. Each claim is a `raise exception` inside a
 * `do $$ … $$` block, which the Management API surfaces as an error (the CLAUDE.md harness shape). Same shape as
 * scripts/prove-label-drafts.mjs, and with the same limit: the SQL role is never switched, so the grant side is
 * read from has_permission() under a chosen auth.uid(), not exercised as `authenticated` over PostgREST.
 *
 * WHAT IT PROVES
 *   1  a date moved EARLIER moves all five values: residents.intake_date, age_estimated_on, the Intake placement's
 *      start, the intake weight and the intake diet
 *   2  a LATER diet, weight and move are left exactly alone by that correction
 *   3  moving LATER than a later diet is refused, and the message names the diet
 *   4  moving later than a later move is refused, and the message names the move
 *   5  moving later than a later weight is refused, and the message names the weight
 *   6  a refused correction changes nothing (the transaction is whole)
 *   7  p_preview writes nothing
 *   8  group_origins.date is NOT moved
 *   9  a login without resident.correct_intake_date is refused with 42501
 *  10  a future date is refused
 */
import { exitWith } from "./lib/exit.mjs";
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";

const { name: envName } = parseEnvArg(process.argv.slice(2));
const env = loadEnv(envName);
const token = env.SUPABASE_ACCESS_TOKEN;
if (!token || !env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ACCESS_TOKEN are required.");
  await exitWith(2);
}
const ref = projectRef(env);

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    let message = text;
    try {
      message = JSON.parse(text).message ?? text;
    } catch {
      /* not JSON, keep the raw body */
    }
    throw new Error(message);
  }
  return text ? JSON.parse(text) : [];
}

const harness = `
begin;

do $$
declare
  v_admin   uuid;
  v_nobody  uuid;
  v_diet    uuid;
  v_enc     uuid;
  v_zone    uuid;
  v_res     residents;
  v_id      uuid;
  v_d0      date := current_date - 20;
  v_origin  uuid;
  v_msg     text;
  v_n       integer;
  v_start   timestamptz;
  v_ph_start timestamptz;
  v_ph_end   timestamptz;
begin
  -- An Admin login (passes has_permission by is_admin) and a login with the activity absent.
  select ur.user_id into v_admin from user_roles ur join roles r on r.id = ur.role_id
   where r.key = 'admin' and ur.archived_at is null limit 1;
  if v_admin is null then raise exception 'PROOF SETUP: no Admin login in this database'; end if;
  for v_nobody in select distinct ur.user_id from user_roles ur where ur.archived_at is null and ur.user_id <> v_admin loop
    perform set_config('request.jwt.claims', json_build_object('sub', v_nobody, 'role', 'authenticated')::text, true);
    if not has_permission('resident.correct_intake_date') then exit; end if;
    v_nobody := null;
  end loop;
  if v_nobody is null then raise exception 'PROOF SETUP: every login holds the new activity already, so the refusal cannot be exercised'; end if;

  select id into v_diet from diets limit 1;
  select e.id, e.zone_id into v_enc, v_zone from enclosures e join zones z on z.id = e.zone_id where z.name <> 'Lifecycle' limit 1;

  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);

  insert into group_origins (name, date) values ('Harness origin', v_d0) returning id into v_origin;
  select * into v_res from record_intake('Harness pup', v_d0, p_diet_id => v_diet, p_weight_kg => 5, p_group_origin_id => v_origin);
  v_id := v_res.id;

  -- Later records the correction must leave alone: a move at d0+7, a diet change at d0+5, a weighing at d0+3.
  insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id)
  values (v_id, 'ChangeEnclosure', (v_d0 + 7)::timestamptz + interval '12 hours', v_zone, v_enc);
  insert into resident_diets (resident_id, diet_id, start_date) values (v_id, v_diet, v_d0 + 5);
  insert into weight (resident_id, date, weight_kg) values (v_id, v_d0 + 3, 5.5);

  ---------------------------------------------------------------- 7. preview writes nothing
  perform correct_intake_date(v_id, v_d0 - 3, true);
  if (select intake_date from residents where id = v_id) <> v_d0 then raise exception '7 FAILED: preview moved the intake date'; end if;

  ---------------------------------------------------------------- 1, 2, 8. move earlier
  perform correct_intake_date(v_id, v_d0 - 3);
  select * into v_res from residents where id = v_id;
  if v_res.intake_date <> v_d0 - 3 then raise exception '1 FAILED: intake_date is %', v_res.intake_date; end if;
  if v_res.age_estimated_on <> v_d0 - 3 then raise exception '1 FAILED: age_estimated_on is %', v_res.age_estimated_on; end if;
  select start_date into v_ph_start from placement_history where resident_id = v_id and placement_type = 'Intake';
  if v_ph_start <> (v_d0 - 3)::timestamptz then raise exception '1 FAILED: Intake placement starts %', v_ph_start; end if;
  select count(*) into v_n from weight where resident_id = v_id and date = v_d0 - 3 and weight_kg = 5;
  if v_n <> 1 then raise exception '1 FAILED: the intake weight did not move'; end if;
  select count(*) into v_n from resident_diets where resident_id = v_id and start_date = v_d0 - 3;
  if v_n <> 1 then raise exception '1 FAILED: the intake diet did not move'; end if;
  select count(*) into v_n from resident_diets where resident_id = v_id and start_date = v_d0 + 5;
  if v_n <> 1 then raise exception '2 FAILED: the later diet change was touched'; end if;
  select count(*) into v_n from weight where resident_id = v_id and date = v_d0 + 3 and weight_kg = 5.5;
  if v_n <> 1 then raise exception '2 FAILED: the later weighing was touched'; end if;
  select count(*) into v_n from placement_history where resident_id = v_id and placement_type = 'ChangeEnclosure'
     and start_date = (v_d0 + 7)::timestamptz + interval '12 hours';
  if v_n <> 1 then raise exception '2 FAILED: the later move was touched'; end if;
  if (select date from group_origins where id = v_origin) <> v_d0 then raise exception '8 FAILED: group_origins.date moved'; end if;

  ---------------------------------------------------------------- 3. refused: past a later diet
  begin
    perform correct_intake_date(v_id, v_d0 + 6);
    raise exception '3 FAILED: moving past a later diet was allowed';
  exception when others then
    get stacked diagnostics v_msg = message_text;
    if v_msg like '3 FAILED%' then raise; end if;
    if v_msg not like '%a move to%' and v_msg not like '%a diet that starts on%' and v_msg not like '%a weight recorded on%' then
      raise exception '3 FAILED: refusal does not name a record: %', v_msg;
    end if;
  end;

  ---------------------------------------------------------------- 3, 4, 5. each record named when it alone is in the way
  begin
    perform correct_intake_date(v_id, v_d0 + 4);   -- after the weighing at d0+3 only
    raise exception '5 FAILED: moving past a later weight was allowed';
  exception when others then
    get stacked diagnostics v_msg = message_text;
    if v_msg like '5 FAILED%' then raise; end if;
    if v_msg not like '%a weight recorded on%' then raise exception '5 FAILED: expected the weight to be named, got: %', v_msg; end if;
  end;
  delete from weight where resident_id = v_id and date = v_d0 + 3;
  begin
    perform correct_intake_date(v_id, v_d0 + 6);   -- after the diet at d0+5 only
    raise exception '3 FAILED: moving past a later diet was allowed';
  exception when others then
    get stacked diagnostics v_msg = message_text;
    if v_msg like '3 FAILED%' then raise; end if;
    if v_msg not like '%a diet that starts on%' then raise exception '3 FAILED: expected the diet to be named, got: %', v_msg; end if;
  end;
  delete from resident_diets where resident_id = v_id and start_date = v_d0 + 5;
  begin
    perform correct_intake_date(v_id, v_d0 + 8);   -- after the move at d0+7 only
    raise exception '4 FAILED: moving past a later move was allowed';
  exception when others then
    get stacked diagnostics v_msg = message_text;
    if v_msg like '4 FAILED%' then raise; end if;
    if v_msg not like '%a move to%' then raise exception '4 FAILED: expected the move to be named, got: %', v_msg; end if;
  end;

  ---------------------------------------------------------------- 6. a refusal changed nothing
  if (select intake_date from residents where id = v_id) <> v_d0 - 3 then raise exception '6 FAILED: a refused correction changed the intake date'; end if;

  ---------------------------------------------------------------- 10. future date
  begin
    perform correct_intake_date(v_id, current_date + 5);
    raise exception '10 FAILED: a future date was allowed';
  exception when others then
    get stacked diagnostics v_msg = message_text;
    if v_msg like '10 FAILED%' then raise; end if;
    if v_msg not like '%future%' then raise exception '10 FAILED: wrong refusal: %', v_msg; end if;
  end;

  ---------------------------------------------------------------- 9. no permission
  perform set_config('request.jwt.claims', json_build_object('sub', v_nobody, 'role', 'authenticated')::text, true);
  begin
    perform correct_intake_date(v_id, v_d0 - 4);
    raise exception '9 FAILED: a login without the activity was allowed';
  exception when insufficient_privilege then
    null;
  end;

  raise notice 'ALL PROOFS PASSED. Nothing is kept: the transaction is rolled back.';
end
$$;

rollback;
`;

try {
  await query(harness);
  console.log(`intake-date-correction proofs: all passed against ${envName} (project ${ref}), nothing kept.`);
  console.log("A pass is the absence of a raised exception; a failed proof arrives as an error naming its number.");
  await exitWith(0);
} catch (err) {
  console.error(`intake-date-correction proofs FAILED against ${envName} (project ${ref}):`);
  console.error(`  ${err.message}`);
  await exitWith(1);
}
