#!/usr/bin/env node
/**
 * Proves 0295_assistant_record_card.sql does what it claims, against REAL rows, keeping nothing.
 *
 *   node scripts/prove-assistant-record-card.mjs              # test (dev) project
 *   node scripts/prove-assistant-record-card.mjs --env uat
 *
 * Everything runs inside one `begin … rollback`, so no row survives. Each claim is a `raise exception`
 * inside a `do $$ … $$` block, which the Management API surfaces as an error — the CLAUDE.md harness
 * shape for exercising a migration against real data. Same shape as scripts/prove-write-requests.mjs
 * and scripts/prove-label-drafts.mjs.
 *
 * WHY A SCRIPT AND NOT A ONE-OFF. 0268 deleted this grant on a reading of the card that was true the day
 * it was written and wrong six streams later, and nothing noticed for five days: the activity existed, the
 * policies read it, the app checked it, and no card granted it, so every assistant write was refused for
 * everyone but Admin. What makes that silent is that each half is individually correct. This asserts the
 * JOIN — a login holding the card, and only the card, really writes — so the next card review has to make
 * the assertion fail before it can delete the grant again. Re-run it after any change to card_grants, to
 * the assistant card's bundle, or to the assistant_actions policies.
 *
 * EVERY FIXTURE IS A CARD, never a role key: the logins below hold throwaway roles built from cards, which
 * is the only thing that grants anything (CLAUDE.md). Admin is the one exception in the system and is
 * asserted here only to the extent of staying OUT of it.
 *
 * WHAT IT PROVES
 *   1  the grant is in card_grants: the assistant card requires assistant.record at level 2 (edit/yes)
 *   2  a login holding EXACTLY the assistant card passes has_permission('assistant.record'), and a login
 *      holding no card at all does not — the grant is what makes the difference and nothing else
 *   3  the same login really inserts a 'confirmed' row into assistant_actions as `authenticated`, under the
 *      live 0150/0214 policies. This is the thing #1129 could not do as anyone but Admin
 *   4  and really reads its own row back, which the select policy of 0150 also gates on assistant.record
 *   5  the user_id = auth.uid() clause still bites in BOTH directions: the card does not let that login
 *      write a row in someone else's name, nor read someone else's row
 *   6  a login holding a card that grants the ask and NOT the record (do_maintenance) still cannot write a
 *      'confirmed' row, and still may write its own 'refused' one — 0214's policy is untouched by 0295.
 *      This is also the fixture property that scripts/check-public-stories-schema.mjs and
 *      scripts/check-assistant-refused-client.mjs now depend on, asserted here rather than assumed there
 *   7  0257's triggers apply it like any other grant: taking the card away by a direct delete from
 *      role_cards removes the cell and the write is refused again; giving it back restores both
 *   8  the card does nothing nowhere: every non-fixed role holding the assistant card holds the cell at the
 *      level the card requires. That is the role-cards-coverage question asked by card, which is how
 *      CLAUDE.md says to ask it
 *   9  Admin is untouched and stays outside the card system: no card named admin exists in card_grants, the
 *      fixed roles hold no cards and no cells, and somebody still holds the Admin role
 *
 * WHAT IT DOES NOT PROVE: that src/lib/permissions/cards.ts mirrors the row (scripts/check-card-grants.mjs
 * part 1a is what asserts that, and it needs the repo as well as the database); and that the assistant's own
 * server action and UI do the right thing with the permission once it is there, which is the browser drive
 * in the test plan. auth.uid() is set with request.jwt.claims, exactly as the policies read it in production,
 * and the SQL role IS switched to `authenticated` for (3)-(6), so those are exercised rather than read from
 * the catalogue. It has only run against dev: a worktree cannot read production.
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

// One transaction, rolled back whatever happens.
const harness = `
begin;

do $$
declare
  u_card    uuid;   -- a login holding exactly the assistant card
  u_none    uuid;   -- a login holding a role with no cards at all
  r_card    uuid;
  r_none    uuid;
  r_ask     uuid;
  v_lvl     smallint;
  v_n       integer;
  v_caught  boolean;
  v_text    text := 'PROOF 0295 record a weight';
  r         record;
begin
  ------------------------------------------------------------------ fixtures
  -- Two real logins, so every gate below is exercised and not stubbed. Their own roles are removed inside
  -- the transaction and come back on rollback.
  select user_id into u_card from user_roles where archived_at is null order by user_id limit 1;
  select user_id into u_none from user_roles where archived_at is null and user_id <> u_card order by user_id limit 1;
  if u_card is null or u_none is null then
    raise exception 'PROOF SETUP: this database needs two logins with roles, and has fewer';
  end if;
  delete from user_roles where user_id in (u_card, u_none);

  insert into roles (key, name, kind, home_path)
    values ('proof_0295_card', 'Proof 0295: assistant card', 'custom', '/home') returning id into r_card;
  insert into roles (key, name, kind, home_path)
    values ('proof_0295_none', 'Proof 0295: no cards', 'custom', '/home') returning id into r_none;
  insert into roles (key, name, kind, home_path)
    values ('proof_0295_ask', 'Proof 0295: ask only', 'custom', '/home') returning id into r_ask;
  insert into role_cards (role_id, card, position) values (r_card, 'assistant', 1);
  insert into role_cards (role_id, card, position) values (r_ask, 'do_maintenance', 1);
  insert into user_roles (user_id, role_id) values (u_card, r_card);
  insert into user_roles (user_id, role_id) values (u_none, r_none);

  ------------------------------------------------------------------ 1. the grant is there
  select level into v_lvl from card_grants where card = 'assistant' and activity = 'assistant.record';
  if v_lvl is null then
    raise exception '1 FAILED: the assistant card does not require assistant.record. 0295 is what adds it, and 0268 deleted it.';
  end if;
  if v_lvl <> 2 then
    raise exception '1 FAILED: the assistant card requires assistant.record at level %, and a yesno activity has to be 2', v_lvl;
  end if;
  raise notice '1 ok   card_grants: the assistant card requires assistant.record at edit/yes';

  ------------------------------------------------------------------ 2. the grant is the whole difference
  perform set_config('request.jwt.claims', json_build_object('sub', u_card, 'role', 'authenticated')::text, true);
  if not has_permission('assistant.record') then
    raise exception '2 FAILED: a login holding exactly the assistant card does not pass has_permission(assistant.record)';
  end if;
  if not has_permission('assistant.ask') then
    raise exception '2 FAILED: the assistant card no longer carries the ask, so 0295 has taken something away';
  end if;
  perform set_config('request.jwt.claims', json_build_object('sub', u_none, 'role', 'authenticated')::text, true);
  if has_permission('assistant.record') then
    raise exception '2 FAILED: a login holding NO card passes has_permission(assistant.record), so something other than a card is granting it';
  end if;
  raise notice '2 ok   the card is the difference: the card holder passes, a login with no card does not';

  ------------------------------------------------------------------ 3, 4, 5. the real write, as authenticated
  perform set_config('request.jwt.claims', json_build_object('sub', u_card, 'role', 'authenticated')::text, true);
  set local role authenticated;

  insert into assistant_actions (user_id, request_text, status) values (u_card, v_text, 'confirmed');
  raise notice '3 ok   a login holding exactly the assistant card really inserts a confirmed row under the live policies';

  select count(*) into v_n from assistant_actions where request_text = v_text;
  if v_n <> 1 then
    raise exception '4 FAILED: the card holder reads back % of its own rows, expected 1', v_n;
  end if;
  raise notice '4 ok   and reads its own row back, which the select policy gates on the same activity';

  v_caught := false;
  begin
    insert into assistant_actions (user_id, request_text, status) values (u_none, v_text || ' for someone else', 'confirmed');
  exception when insufficient_privilege then
    v_caught := true;
  end;
  if not v_caught then
    raise exception '5 FAILED: the card let a login write an assistant row in someone elses name';
  end if;
  reset role;
  insert into assistant_actions (user_id, request_text, status) values (u_none, v_text || ' belonging to the other login', 'confirmed');
  perform set_config('request.jwt.claims', json_build_object('sub', u_card, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into v_n from assistant_actions where request_text = v_text || ' belonging to the other login';
  if v_n <> 0 then
    raise exception '5 FAILED: the card holder reads % row(s) belonging to another login', v_n;
  end if;
  reset role;
  raise notice '5 ok   user_id = auth.uid() still bites both ways: no writing and no reading of another logins row';

  ------------------------------------------------------------------ 6. the ask alone still cannot record
  -- user_roles_one_main allows a login one main role, so the no-card role goes before the ask-only one arrives.
  delete from user_roles where user_id = u_none and role_id = r_none;
  insert into user_roles (user_id, role_id) values (u_none, r_ask);
  perform set_config('request.jwt.claims', json_build_object('sub', u_none, 'role', 'authenticated')::text, true);
  if has_permission('assistant.record') then
    raise exception '6 FAILED: do_maintenance now grants assistant.record, so it is no longer an ask-only fixture and two other harnesses are proving nothing';
  end if;
  if not has_permission('assistant.ask') then
    raise exception '6 FAILED: do_maintenance no longer grants assistant.ask, so it is not an ask-only fixture at all';
  end if;
  set local role authenticated;
  v_caught := false;
  begin
    insert into assistant_actions (user_id, request_text, status) values (u_none, 'PROOF 0295 ask only confirmed', 'confirmed');
  exception when insufficient_privilege then
    v_caught := true;
  end;
  if not v_caught then
    raise exception '6 FAILED: a login holding the ask and not the record wrote a confirmed row';
  end if;
  insert into assistant_actions (user_id, request_text, status) values (u_none, 'PROOF 0295 ask only refused', 'refused');
  reset role;
  raise notice '6 ok   the ask alone still records only a refusal, and only its own: 0214 is untouched by 0295';

  ------------------------------------------------------------------ 7. the triggers apply and unapply it
  delete from role_cards where role_id = r_card and card = 'assistant';
  select level into v_lvl from role_permissions where role_id = r_card and activity = 'assistant.record';
  if v_lvl is not null then
    raise exception '7 FAILED: taking the card away left assistant.record at level % on the role', v_lvl;
  end if;
  perform set_config('request.jwt.claims', json_build_object('sub', u_card, 'role', 'authenticated')::text, true);
  set local role authenticated;
  v_caught := false;
  begin
    insert into assistant_actions (user_id, request_text, status) values (u_card, 'PROOF 0295 after the card went', 'confirmed');
  exception when insufficient_privilege then
    v_caught := true;
  end;
  if not v_caught then
    raise exception '7 FAILED: the write still went through after the card was taken away, so something other than the card is granting it';
  end if;
  reset role;
  insert into role_cards (role_id, card, position) values (r_card, 'assistant', 1);
  select level into v_lvl from role_permissions where role_id = r_card and activity = 'assistant.record';
  if v_lvl is distinct from 2 then
    raise exception '7 FAILED: giving the card back left assistant.record at %, expected 2', coalesce(v_lvl::text, 'none');
  end if;
  raise notice '7 ok   0257s triggers apply and unapply the grant with the card, however the card is given';

  ------------------------------------------------------------------ 8. the card does nothing nowhere
  for r in
    select ro.key as role_key, coalesce(rp.level, 0) as have
      from role_cards rc
      join roles ro on ro.id = rc.role_id
      left join role_permissions rp on rp.role_id = ro.id and rp.activity = 'assistant.record'
     where rc.card = 'assistant' and ro.kind <> 'fixed'
  loop
    if r.have < 2 then
      raise exception '8 FAILED: something holding the assistant card has assistant.record at level %, so the card does nothing there', r.have;
    end if;
  end loop;
  select count(*) into v_n from role_cards rc join roles ro on ro.id = rc.role_id
   where rc.card = 'assistant' and ro.kind <> 'fixed';
  raise notice '8 ok   all % holder(s) of the assistant card hold assistant.record at edit/yes', v_n;

  ------------------------------------------------------------------ 9. Admin stays outside the card system
  if exists (select 1 from card_grants where card = 'admin') then
    raise exception '9 FAILED: a card called admin has appeared in card_grants. Admin sits outside the card system and is never given cards.';
  end if;
  select count(*) into v_n from role_cards rc join roles ro on ro.id = rc.role_id where ro.kind = 'fixed';
  if v_n <> 0 then
    raise exception '9 FAILED: a fixed role holds % card(s)', v_n;
  end if;
  select count(*) into v_n from role_permissions rp join roles ro on ro.id = rp.role_id where ro.kind = 'fixed';
  if v_n <> 0 then
    raise exception '9 FAILED: a fixed role holds % permission cell(s)', v_n;
  end if;
  if not exists (select 1 from user_roles ur join roles ro on ro.id = ur.role_id where ro.key = 'admin') then
    raise exception '9 FAILED: nobody holds the Admin role, so nobody could open Settings and Who does what';
  end if;
  raise notice '9 ok   Admin is untouched and outside the card system: no admin card, fixed roles hold nothing, somebody is still Admin';

  raise notice 'ALL PROOFS PASSED. Nothing is kept: the transaction is rolled back.';
end
$$;

rollback;
`;

try {
  await query(harness);
  console.log(`assistant-record-card proofs: all passed against ${envName} (project ${ref}), nothing kept.`);
  console.log("The Management API does not return notices, so a pass is the absence of a raised exception;");
  console.log("any failed proof arrives as an error naming its number. See the header for what each one is.");
  await exitWith(0);
} catch (err) {
  console.error(`assistant-record-card proofs FAILED against ${envName} (project ${ref}):`);
  console.error(`  ${err.message}`);
  await exitWith(1);
}
