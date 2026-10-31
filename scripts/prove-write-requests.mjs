#!/usr/bin/env node
/**
 * Proves 0292_write_requests.sql does what it claims, against REAL rows, keeping nothing.
 *
 *   node scripts/prove-write-requests.mjs              # test (dev) project
 *   node scripts/prove-write-requests.mjs --env uat
 *
 * Everything runs inside one `begin … rollback`, so no row survives. Each claim is a `raise exception`
 * inside a `do $$ … $$` block, which the Management API surfaces as an error — the CLAUDE.md harness
 * shape for exercising a migration against real data.
 *
 * WHY A SCRIPT AND NOT A ONE-OFF: stream (C) builds the wrapper on top of these two functions, and the
 * invariant it must not break ("a write can never be applied twice") is asserted here rather than
 * described. Re-run it after any change to the functions, and before a production release that carries
 * 0292.
 *
 * WHAT IT PROVES
 *   1  a fresh request id is claimed, and the claim is told apart from a replay
 *   2  the same (login, request id) cannot be recorded twice — the primary key refuses it
 *   3  a replay returns the FIRST result verbatim, not a bare "yes this happened"
 *   4  a claim that committed without a result reads as in_flight, never as a success
 *   5  the same id against a different action is refused rather than answered with the other result
 *   6  finishing twice, or finishing a claim that was never made, is refused
 *   7  a second login claiming the SAME request id gets its own row and never the first login's result
 *   8  an aborted write leaves no claim behind, so the retry is not blocked
 *   9  retention deletes a row older than 7 days and leaves a fresh one
 *  10  the table is closed: RLS on, no policies, no rights for anon or authenticated; the functions are
 *      executable by authenticated and not by anon, and the purge by neither
 *
 * WHAT IT DOES NOT PROVE: the Management API runs as the database owner, so the grants in (10) are read
 * from the catalogue rather than exercised as `authenticated`. auth.uid() is set with request.jwt.claims,
 * which is how the functions read it in production, but the SQL role is not switched — so (10) is the
 * statement about the grants and the rest is the statement about the logic.
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
      /* not JSON — keep the raw body */
    }
    throw new Error(message);
  }
  return text ? JSON.parse(text) : [];
}

// One transaction, rolled back whatever happens. The notices the block raises are the record of what ran.
const harness = `
begin;

do $$
declare
  v_user_a uuid;
  v_user_b uuid;
  v_id1    uuid := gen_random_uuid();
  v_id2    uuid := gen_random_uuid();
  v_id3    uuid := gen_random_uuid();
  v_id4    uuid := gen_random_uuid();
  v_out    jsonb;
  v_n      integer;
  v_caught boolean;
  v_cand   uuid;
begin
  -- Two real logins that are in the app (holds_app_role() true: Admin, or a role holding at least one
  -- cell). Picked from live rows rather than invented, so the gate is exercised and not stubbed.
  for v_cand in
    select distinct ur.user_id
      from user_roles ur
      join roles r on r.id = ur.role_id
     where ur.archived_at is null
     order by ur.user_id
  loop
    perform set_config('request.jwt.claims', json_build_object('sub', v_cand, 'role', 'authenticated')::text, true);
    if holds_app_role() then
      if v_user_a is null then v_user_a := v_cand;
      elsif v_cand <> v_user_a then v_user_b := v_cand; exit;
      end if;
    end if;
  end loop;
  if v_user_a is null then
    raise exception 'PROOF SETUP: no login in this database is in the app, so the gate cannot be exercised';
  end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
  if auth.uid() <> v_user_a then
    raise exception 'PROOF SETUP: auth.uid() is % and should be %', auth.uid(), v_user_a;
  end if;

  ---------------------------------------------------------------- 1. a fresh id is claimed
  v_out := claim_write_request(v_id1, 'proof.action');
  if v_out->>'status' <> 'claimed' then
    raise exception '1 FAILED: a fresh request id returned % and should have returned claimed', v_out;
  end if;
  raise notice '1 ok   a fresh request id is claimed';

  ---------------------------------------------------------------- 2. it cannot be recorded twice
  v_caught := false;
  begin
    insert into write_requests (user_id, request_id, action) values (v_user_a, v_id1, 'proof.action');
  exception when unique_violation then
    v_caught := true;
  end;
  if not v_caught then
    raise exception '2 FAILED: the same (login, request id) was recorded twice. The invariant is broken.';
  end if;
  select count(*) into v_n from write_requests where user_id = v_user_a and request_id = v_id1;
  if v_n <> 1 then
    raise exception '2 FAILED: % rows for one request id, expected exactly 1', v_n;
  end if;
  raise notice '2 ok   the same request id cannot be recorded twice (primary key refuses it)';

  ---------------------------------------------------------------- 4. unfinished reads as in_flight
  v_out := claim_write_request(v_id1, 'proof.action');
  if v_out->>'status' <> 'in_flight' then
    raise exception '4 FAILED: a claim with no result returned % and should have returned in_flight', v_out;
  end if;
  raise notice '4 ok   a claim that committed without a result reads as in_flight, not as a success';

  ---------------------------------------------------------------- 3. a replay returns the first result
  perform finish_write_request(v_id1, jsonb_build_object('residentId', 'first-answer', 'ok', true));
  v_out := claim_write_request(v_id1, 'proof.action');
  if v_out->>'status' <> 'replay' then
    raise exception '3 FAILED: a replay returned % and should have returned replay', v_out;
  end if;
  if v_out->'result'->>'residentId' <> 'first-answer' then
    raise exception '3 FAILED: the replay carried % instead of the first result', v_out->'result';
  end if;
  raise notice '3 ok   a replay returns the FIRST result verbatim, and is told apart from a first attempt';

  ---------------------------------------------------------------- 5. a different action is refused
  v_caught := false;
  begin
    v_out := claim_write_request(v_id1, 'proof.other_action');
  exception when others then
    v_caught := true;
  end;
  if not v_caught then
    raise exception '5 FAILED: the same id against a different action was answered with %', v_out;
  end if;
  raise notice '5 ok   the same id against a different action is refused, not answered';

  ---------------------------------------------------------------- 6. finishing twice, and with no claim
  v_caught := false;
  begin
    perform finish_write_request(v_id1, jsonb_build_object('ok', 'second'));
  exception when others then
    v_caught := true;
  end;
  if not v_caught then
    raise exception '6 FAILED: a finished claim was overwritten by a second result';
  end if;
  if (claim_write_request(v_id1, 'proof.action')->'result'->>'residentId') <> 'first-answer' then
    raise exception '6 FAILED: the stored first result changed';
  end if;
  v_caught := false;
  begin
    perform finish_write_request(v_id3, jsonb_build_object('ok', true));
  exception when others then
    v_caught := true;
  end;
  if not v_caught then
    raise exception '6 FAILED: a result was recorded against a claim that was never made';
  end if;
  raise notice '6 ok   finishing twice, and finishing a claim never made, are both refused';

  ---------------------------------------------------------------- 7. a second login is a separate row
  if v_user_b is null then
    raise notice '7 SKIPPED  only one login in this database is in the app, so cross-login scoping was not exercised';
  else
    perform set_config('request.jwt.claims', json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);
    v_out := claim_write_request(v_id1, 'proof.action');
    if v_out->>'status' <> 'claimed' then
      raise exception '7 FAILED: a second login reusing the id got % — it must get its own row', v_out;
    end if;
    select count(*) into v_n from write_requests where request_id = v_id1;
    if v_n <> 2 then
      raise exception '7 FAILED: % rows for the shared id across two logins, expected 2', v_n;
    end if;
    perform set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
    raise notice '7 ok   a second login claiming the same id gets its own row and never the first login''s result';
  end if;

  ---------------------------------------------------------------- 8. an aborted write leaves no claim
  begin
    v_out := claim_write_request(v_id4, 'proof.aborted');
    raise exception 'the write failed';
  exception when others then
    null;
  end;
  select count(*) into v_n from write_requests where user_id = v_user_a and request_id = v_id4;
  if v_n <> 0 then
    raise exception '8 FAILED: an aborted write left % claim(s) behind, so its retry would be blocked', v_n;
  end if;
  v_out := claim_write_request(v_id4, 'proof.aborted');
  if v_out->>'status' <> 'claimed' then
    raise exception '8 FAILED: the retry after an aborted write got % instead of claimed', v_out;
  end if;
  raise notice '8 ok   an aborted write leaves no claim, so the retry is free to proceed';

  ---------------------------------------------------------------- 9. retention
  insert into write_requests (user_id, request_id, action, result, created_at, completed_at)
  values (v_user_a, v_id2, 'proof.old', jsonb_build_object('ok', true), now() - interval '8 days', now() - interval '8 days');
  select purge_write_requests() into v_n;
  if v_n < 1 then
    raise exception '9 FAILED: the purge deleted % rows and should have deleted the 8-day-old one', v_n;
  end if;
  if exists (select 1 from write_requests where user_id = v_user_a and request_id = v_id2) then
    raise exception '9 FAILED: an 8-day-old row survived the purge';
  end if;
  if not exists (select 1 from write_requests where user_id = v_user_a and request_id = v_id1) then
    raise exception '9 FAILED: the purge took a row inside the 7-day window';
  end if;
  raise notice '9 ok   retention deletes a row older than 7 days and leaves a fresh one';

  ---------------------------------------------------------------- 10. the table is closed
  if not (select relrowsecurity from pg_class where oid = 'public.write_requests'::regclass) then
    raise exception '10 FAILED: row level security is not enabled on write_requests';
  end if;
  select count(*) into v_n from pg_policies where schemaname = 'public' and tablename = 'write_requests';
  if v_n <> 0 then
    raise exception '10 FAILED: write_requests has % policy/policies. It must have none: the functions are the only door, and a policy here would have to ask a card for plumbing that grants nothing.', v_n;
  end if;
  if has_table_privilege('authenticated', 'public.write_requests', 'select')
     or has_table_privilege('authenticated', 'public.write_requests', 'insert')
     or has_table_privilege('anon', 'public.write_requests', 'select') then
    raise exception '10 FAILED: anon or authenticated holds table rights on write_requests';
  end if;
  if not has_function_privilege('authenticated', 'public.claim_write_request(uuid, text)', 'execute')
     or not has_function_privilege('authenticated', 'public.finish_write_request(uuid, jsonb)', 'execute') then
    raise exception '10 FAILED: authenticated cannot execute the two functions, so no write could claim an id';
  end if;
  if has_function_privilege('anon', 'public.claim_write_request(uuid, text)', 'execute')
     or has_function_privilege('anon', 'public.finish_write_request(uuid, jsonb)', 'execute') then
    raise exception '10 FAILED: anon can execute a write_requests function through /rest/v1/rpc/';
  end if;
  if has_function_privilege('authenticated', 'public.purge_write_requests()', 'execute')
     or has_function_privilege('anon', 'public.purge_write_requests()', 'execute') then
    raise exception '10 FAILED: a login can run the purge';
  end if;
  if not exists (select 1 from cron.job where jobname = 'purge-write-requests') then
    raise exception '10 FAILED: the daily purge is not scheduled, so the table would grow for ever';
  end if;
  raise notice '10 ok  RLS on, no policies, no table rights for anon or authenticated, functions executable by authenticated only, purge by neither, cron job scheduled';

  raise notice 'ALL PROOFS PASSED. Nothing is kept: the transaction is rolled back.';
end
$$;

rollback;
`;

try {
  await query(harness);
  console.log(`write_requests proofs: all passed against ${envName} (project ${ref}), nothing kept.`);
  console.log("The Management API does not return notices, so a pass is the absence of a raised exception;");
  console.log("any failed proof arrives as an error naming its number. See the header for what each one is.");
  await exitWith(0);
} catch (err) {
  console.error(`write_requests proofs FAILED against ${envName} (project ${ref}):`);
  console.error(`  ${err.message}`);
  await exitWith(1);
}
