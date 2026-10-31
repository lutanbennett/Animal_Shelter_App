#!/usr/bin/env node
/**
 * Proves 0293_label_drafts_and_unlisted_labels.sql does what it claims, against REAL rows, keeping nothing.
 *
 *   node scripts/prove-label-drafts.mjs              # test (dev) project
 *   node scripts/prove-label-drafts.mjs --env uat
 *
 * Everything runs inside one `begin … rollback`, so no row survives. Each claim is a `raise exception`
 * inside a `do $$ … $$` block, which the Management API surfaces as an error — the CLAUDE.md harness
 * shape for exercising a migration against real data. Same shape as scripts/prove-write-requests.mjs.
 *
 * WHY A SCRIPT AND NOT A ONE-OFF: the app half is built on the promise that a PROPOSAL CANNOT PUBLISH.
 * That promise is what let Lutan say yes to a waiting step at all, and it is asserted here rather than
 * described. Re-run it after any change to the four functions, and before a production release carrying 0293.
 *
 * WHAT IT PROVES
 *   1  the eleven newly registered labels are in translatable_labels with the group and optional flag 0293 states
 *   2  all eleven are reported by label_translations() once their English is filled in — the twelve columns the
 *      screen could not see are now reachable from it
 *   3  rounds.name_th is still NOT registered, because its Thai ships with its seed (0166 says so)
 *   4  a proposed label is NOT the live Thai: the row's _th column is untouched and the screen reads "proposed"
 *   5  approving publishes it, clears the draft, and the status becomes current
 *   6  approve_label_th() publishes the DRAFT's text, never a caller's argument — there is no argument to pass
 *   7  approving with nothing waiting is refused, not silently treated as a no-op
 *   8  a second proposal replaces the first rather than queueing
 *   9  proposing an empty text, and discard_label_draft(), both throw the proposal away and leave the row alone
 *  10  an unregistered label is refused by both paths, and a proposal for a row that does not exist writes nothing
 *  11  Thai published by any other path (set_label_th, or a direct edit on the list's own screen) clears a spent
 *      draft, so no proposal is left waiting for Thai that is already live
 *  12  deleting the row takes its draft with it
 *  13  a proposal on a label that ALREADY has Thai leaves the live status alone and still shows the proposal
 *  14  label_drafts is closed: RLS on, its one policy resolves through has_permission(), no rights for anon, and
 *      the three functions are executable by authenticated and not by anon
 *
 * WHAT IT DOES NOT PROVE: the Management API runs as the database owner, so the grants in (14) are read from
 * the catalogue rather than exercised as `authenticated`. auth.uid() is set with request.jwt.claims, which is
 * how the functions read it in production, but the SQL role is not switched — so (14) is the statement about
 * the grants and the rest is the statement about the logic. It has only run against dev: a worktree cannot
 * read production.
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
  v_user     uuid;
  v_cand     uuid;
  v_role     uuid;
  v_diet     uuid;
  v_unit     uuid;
  v_feature  uuid;
  v_group    uuid;
  v_meme     uuid;
  v_n        integer;
  v_caught   boolean;
  v_text     text;
  v_status   text;
  v_live     text;
  r          record;
begin
  -- A real login that may translate. Picked from live rows rather than invented, so every gate below is
  -- exercised and not stubbed.
  for v_cand in
    select distinct ur.user_id from user_roles ur where ur.archived_at is null order by ur.user_id
  loop
    perform set_config('request.jwt.claims', json_build_object('sub', v_cand, 'role', 'authenticated')::text, true);
    if has_permission('translations.manage') then v_user := v_cand; exit; end if;
  end loop;
  if v_user is null then
    raise exception 'PROOF SETUP: no login in this database holds translations.manage, so the gates cannot be exercised';
  end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);

  ---------------------------------------------------------------- 1. the eleven are registered as stated
  for r in
    select * from (values
      ('site_content', 'contact_address', 'contact_address_th', 'website', false),
      ('site_content', 'registration_text', 'registration_text_th', 'website', false),
      ('site_content', 'about_photo_alt', 'about_photo_alt_th', 'website', false),
      ('site_content', 'donate_photo_alt', 'donate_photo_alt_th', 'website', false),
      ('site_content', 'foster_photo_alt', 'foster_photo_alt_th', 'website', false),
      ('site_content', 'volunteer_photo_alt', 'volunteer_photo_alt_th', 'website', false),
      ('diets', 'name', 'name_th', 'diets', false),
      ('units', 'name', 'name_th', 'units', false),
      ('features', 'name', 'name_th', 'home', false),
      ('role_groups', 'name', 'name_th', 'home', false),
      ('memes', 'caption_en', 'caption_th', 'social', true)
    ) as x(t, c, th, g, opt)
  loop
    if not exists (select 1 from translatable_labels l
                    where l.table_name = r.t and l.column_name = r.c and l.th_column = r.th
                      and l.label_group = r.g and l.optional = r.opt) then
      raise exception '1 FAILED: %.% is not registered as (%, %, optional %)', r.t, r.c, r.th, r.g, r.opt;
    end if;
  end loop;
  raise notice '1 ok   the eleven newly registered labels are in translatable_labels exactly as 0293 states';

  ---------------------------------------------------------------- 3. rounds stays out
  if exists (select 1 from translatable_labels where table_name = 'rounds') then
    raise exception '3 FAILED: rounds is registered. 0166 keeps it out on purpose: its Thai ships with its seed.';
  end if;
  raise notice '3 ok   rounds.name_th is still not registered';

  ---------------------------------------------------------------- setup: real English for each of the eleven
  -- label_translations() lists a label only where the English is filled in, so give each pair one real row to
  -- be counted. All of it is rolled back.
  update site_content
     set contact_address     = coalesce(nullif(btrim(contact_address), ''), 'PROOF address'),
         registration_text   = coalesce(nullif(btrim(registration_text), ''), 'PROOF registration'),
         about_photo_alt     = coalesce(nullif(btrim(about_photo_alt), ''), 'PROOF about photo'),
         donate_photo_alt    = coalesce(nullif(btrim(donate_photo_alt), ''), 'PROOF donate photo'),
         foster_photo_alt    = coalesce(nullif(btrim(foster_photo_alt), ''), 'PROOF foster photo'),
         volunteer_photo_alt = coalesce(nullif(btrim(volunteer_photo_alt), ''), 'PROOF volunteer photo');

  insert into diets (name, is_standard) values ('PROOF diet 0293', false) returning id into v_diet;
  insert into units (name, for_ingredients, for_medicines) values ('PROOF unit 0293', true, false) returning id into v_unit;
  insert into features (key, name) values ('zzz_proof_0293', 'PROOF feature 0293') returning id into v_feature;
  -- A role that is not 'fixed': role_groups hangs off role_cards' guard (0194), which refuses a fixed role.
  -- kind is structural, not a role name, and nothing here depends on which role comes back.
  select id into v_role from roles where kind <> 'fixed' order by id limit 1;
  if v_role is null then
    raise exception 'PROOF SETUP: every role in this database is fixed, so no role_groups row can be made';
  end if;
  insert into role_groups (role_id, name, name_th, icon)
    values (v_role, 'PROOF group 0293', 'PROOF group 0293 TH', 'proof') returning id into v_group;
  insert into memes (drive_file_id, title, caption_en)
    values ('proof-0293-' || gen_random_uuid()::text, 'PROOF meme 0293', 'PROOF caption') returning id into v_meme;

  ---------------------------------------------------------------- 2. all eleven reach label_translations()
  for r in
    select * from (values
      ('site_content', 'contact_address'), ('site_content', 'registration_text'),
      ('site_content', 'about_photo_alt'), ('site_content', 'donate_photo_alt'),
      ('site_content', 'foster_photo_alt'), ('site_content', 'volunteer_photo_alt'),
      ('diets', 'name'), ('units', 'name'), ('features', 'name'), ('role_groups', 'name'),
      ('memes', 'caption_en')
    ) as x(t, c)
  loop
    if not exists (select 1 from label_translations() lt
                    where lt.table_name = r.t and lt.column_name = r.c) then
      raise exception '2 FAILED: %.% has English but label_translations() does not list it, so the screen still cannot reach it', r.t, r.c;
    end if;
  end loop;
  raise notice '2 ok   all eleven are reported by label_translations(), so the screen can reach them';

  ---------------------------------------------------------------- 4. a proposal is NOT the live Thai
  if not propose_label_th('diets', v_diet::text, 'name', 'ข้อเสนอ 0293') then
    raise exception '4 FAILED: propose_label_th() returned false for a row that exists';
  end if;
  select name_th into v_live from diets where id = v_diet;
  if v_live is not null then
    raise exception '4 FAILED: proposing wrote % onto the row. A proposal must never publish.', v_live;
  end if;
  select lt.status, lt.text_th, lt.draft_text_th into v_status, v_live, v_text
    from label_translations() lt where lt.table_name = 'diets' and lt.row_id = v_diet::text;
  if v_status <> 'proposed' then
    raise exception '4 FAILED: the screen reads % and should read proposed', v_status;
  end if;
  if v_live is not null then
    raise exception '4 FAILED: label_translations() reports the live Thai as %, so the proposal is being shown as live', v_live;
  end if;
  if v_text <> 'ข้อเสนอ 0293' then
    raise exception '4 FAILED: the proposal is not carried to the screen (draft_text_th is %)', v_text;
  end if;
  raise notice '4 ok   a proposed label is not the live Thai: the row is untouched and the screen reads proposed';

  ---------------------------------------------------------------- 6 and 5. approving publishes the draft
  -- 6 first, because it is a statement about the signature: approve_label_th takes no text, so there is no way
  -- to approve anything other than what was proposed and reviewed.
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'approve_label_th' and p.pronargs <> 3) then
    raise exception '6 FAILED: approve_label_th() takes a fourth argument, so an approval could publish text nobody reviewed';
  end if;
  raise notice '6 ok   approve_label_th() takes no text, so what is published is what was proposed';

  if not approve_label_th('diets', v_diet::text, 'name') then
    raise exception '5 FAILED: approve_label_th() returned false for a row that exists';
  end if;
  select name_th into v_live from diets where id = v_diet;
  if v_live <> 'ข้อเสนอ 0293' then
    raise exception '5 FAILED: the row holds % after approval, expected the proposed Thai', coalesce(v_live, 'null');
  end if;
  if exists (select 1 from label_drafts where table_name = 'diets' and row_id = v_diet::text) then
    raise exception '5 FAILED: the draft survived approval, so it would sit on screen for Thai that is already live';
  end if;
  select lt.status into v_status from label_translations() lt
   where lt.table_name = 'diets' and lt.row_id = v_diet::text;
  if v_status <> 'current' then
    raise exception '5 FAILED: the approved label reads % and should read current', v_status;
  end if;
  raise notice '5 ok   approving publishes the proposal onto the row, clears the draft and reads current';

  ---------------------------------------------------------------- 7. approving nothing is refused
  v_caught := false;
  begin
    perform approve_label_th('diets', v_diet::text, 'name');
  exception when others then
    v_caught := true;
  end;
  if not v_caught then
    raise exception '7 FAILED: approving with no proposal waiting was accepted';
  end if;
  raise notice '7 ok   approving with nothing waiting is refused rather than treated as a no-op';

  ---------------------------------------------------------------- 8. a second proposal replaces the first
  perform propose_label_th('units', v_unit::text, 'name', 'หน่วยแรก');
  perform propose_label_th('units', v_unit::text, 'name', 'หน่วยที่สอง');
  select count(*) into v_n from label_drafts where table_name = 'units' and row_id = v_unit::text;
  if v_n <> 1 then
    raise exception '8 FAILED: % drafts for one label, expected exactly 1', v_n;
  end if;
  select text_th into v_text from label_drafts where table_name = 'units' and row_id = v_unit::text;
  if v_text <> 'หน่วยที่สอง' then
    raise exception '8 FAILED: the waiting proposal is % and should be the later one', v_text;
  end if;
  raise notice '8 ok   a second proposal replaces the first rather than queueing behind it';

  ---------------------------------------------------------------- 9. empty text and discard both throw it away
  perform propose_label_th('units', v_unit::text, 'name', '   ');
  if exists (select 1 from label_drafts where table_name = 'units' and row_id = v_unit::text) then
    raise exception '9 FAILED: proposing an empty text left the draft in place';
  end if;
  if (select name_th from units where id = v_unit) is not null then
    raise exception '9 FAILED: discarding by empty text touched the row';
  end if;
  perform propose_label_th('units', v_unit::text, 'name', 'หน่วย');
  if not discard_label_draft('units', v_unit::text, 'name') then
    raise exception '9 FAILED: discard_label_draft() returned false with a proposal waiting';
  end if;
  if exists (select 1 from label_drafts where table_name = 'units' and row_id = v_unit::text) then
    raise exception '9 FAILED: discard_label_draft() left the draft in place';
  end if;
  if (select name_th from units where id = v_unit) is not null then
    raise exception '9 FAILED: discard_label_draft() touched the row';
  end if;
  if discard_label_draft('units', v_unit::text, 'name') then
    raise exception '9 FAILED: discarding nothing returned true, so the screen cannot tell it from a real rejection';
  end if;
  raise notice '9 ok   an empty proposal and discard_label_draft() both throw the proposal away and leave the row alone';

  ---------------------------------------------------------------- 10. unregistered label, missing row
  v_caught := false;
  begin
    perform propose_label_th('rounds', gen_random_uuid()::text, 'name', 'ไม่ควรได้');
  exception when others then
    v_caught := true;
  end;
  if not v_caught then
    raise exception '10 FAILED: a proposal was accepted for rounds, which is deliberately not a translatable label';
  end if;
  v_caught := false;
  begin
    perform approve_label_th('rounds', gen_random_uuid()::text, 'name');
  exception when others then
    v_caught := true;
  end;
  if not v_caught then
    raise exception '10 FAILED: an approval was accepted for an unregistered label';
  end if;
  if propose_label_th('diets', gen_random_uuid()::text, 'name', 'แถว') then
    raise exception '10 FAILED: a proposal for a row that does not exist returned true';
  end if;
  select count(*) into v_n from label_drafts where table_name = 'diets' and column_name = 'name';
  if v_n <> 0 then
    raise exception '10 FAILED: a proposal for a row that does not exist wrote % draft(s)', v_n;
  end if;
  raise notice '10 ok  an unregistered label is refused by both paths, and a proposal for a missing row writes nothing';

  ---------------------------------------------------------------- 11. Thai published another way clears the draft
  perform propose_label_th('features', v_feature::text, 'name', 'คุณสมบัติ');
  perform set_label_th('features', v_feature::text, 'name', 'คุณสมบัติ');
  if exists (select 1 from label_drafts where table_name = 'features' and row_id = v_feature::text) then
    raise exception '11 FAILED: set_label_th() published the same Thai and the draft is still waiting';
  end if;
  update features set name_th = null where id = v_feature;
  perform propose_label_th('features', v_feature::text, 'name', 'คุณสมบัติสอง');
  update features set name_th = 'คุณสมบัติสอง' where id = v_feature;
  if exists (select 1 from label_drafts where table_name = 'features' and row_id = v_feature::text) then
    raise exception '11 FAILED: a direct edit on the list published the same Thai and the draft is still waiting';
  end if;
  raise notice '11 ok  Thai published by set_label_th or by a direct edit clears the spent draft';

  ---------------------------------------------------------------- 12. deleting the row takes its draft
  perform propose_label_th('memes', v_meme::text, 'caption_en', 'คำบรรยาย');
  if not exists (select 1 from label_drafts where table_name = 'memes' and row_id = v_meme::text) then
    raise exception '12 FAILED: the proposal was not recorded, so the delete proves nothing';
  end if;
  delete from memes where id = v_meme;
  if exists (select 1 from label_drafts where table_name = 'memes' and row_id = v_meme::text) then
    raise exception '12 FAILED: deleting the row left its draft behind as dead data';
  end if;
  raise notice '12 ok  deleting the row takes its draft with it';

  ---------------------------------------------------------------- 13. a proposal on a label that already has Thai
  -- role_groups.name_th is NOT NULL (0241), so this pair always has Thai and its live status must be unaffected.
  perform propose_label_th('role_groups', v_group::text, 'name', 'กลุ่มใหม่');
  select lt.status, lt.text_th, lt.draft_text_th into v_status, v_live, v_text
    from label_translations() lt where lt.table_name = 'role_groups' and lt.row_id = v_group::text;
  if v_status not in ('current', 'stale') then
    raise exception '13 FAILED: a label that already has Thai reads % once a change is proposed', v_status;
  end if;
  if v_live <> 'PROOF group 0293 TH' then
    raise exception '13 FAILED: the live Thai reads % — a proposal has replaced what readers see', v_live;
  end if;
  if v_text <> 'กลุ่มใหม่' then
    raise exception '13 FAILED: the proposal is not shown on a label that already has Thai';
  end if;
  raise notice '13 ok  a proposal on a label that already has Thai leaves the live value and status alone';

  ---------------------------------------------------------------- 14. label_drafts is closed
  if not (select relrowsecurity from pg_class where oid = 'public.label_drafts'::regclass) then
    raise exception '14 FAILED: row level security is not enabled on label_drafts';
  end if;
  select count(*) into v_n from pg_policies
   where schemaname = 'public' and tablename = 'label_drafts'
     and coalesce(qual, '') like '%has_permission%';
  if v_n <> 1 then
    raise exception '14 FAILED: label_drafts has % policy/policies resolving through has_permission(), expected exactly 1', v_n;
  end if;
  select count(*) into v_n from pg_policies where schemaname = 'public' and tablename = 'label_drafts';
  if v_n <> 1 then
    raise exception '14 FAILED: label_drafts has % policies in total, so one of them does not ask a card', v_n;
  end if;
  if has_table_privilege('anon', 'public.label_drafts', 'select')
     or has_table_privilege('authenticated', 'public.label_drafts', 'insert')
     or has_table_privilege('authenticated', 'public.label_drafts', 'update')
     or has_table_privilege('authenticated', 'public.label_drafts', 'delete') then
    raise exception '14 FAILED: a login can reach label_drafts other than through the three functions';
  end if;
  if not has_table_privilege('authenticated', 'public.label_drafts', 'select') then
    raise exception '14 FAILED: authenticated cannot select label_drafts, so the screen could not show a proposal';
  end if;
  if not has_function_privilege('authenticated', 'public.propose_label_th(text, text, text, text)', 'execute')
     or not has_function_privilege('authenticated', 'public.approve_label_th(text, text, text)', 'execute')
     or not has_function_privilege('authenticated', 'public.discard_label_draft(text, text, text)', 'execute') then
    raise exception '14 FAILED: authenticated cannot execute one of the three functions';
  end if;
  if has_function_privilege('anon', 'public.propose_label_th(text, text, text, text)', 'execute')
     or has_function_privilege('anon', 'public.approve_label_th(text, text, text)', 'execute')
     or has_function_privilege('anon', 'public.discard_label_draft(text, text, text)', 'execute') then
    raise exception '14 FAILED: anon can reach a label-draft function through /rest/v1/rpc/';
  end if;
  raise notice '14 ok  label_drafts is closed: RLS on, one card-derived policy, no write rights for a login, functions for authenticated only';

  raise notice 'ALL PROOFS PASSED. Nothing is kept: the transaction is rolled back.';
end
$$;

rollback;
`;

try {
  await query(harness);
  console.log(`label-drafts proofs: all passed against ${envName} (project ${ref}), nothing kept.`);
  console.log("The Management API does not return notices, so a pass is the absence of a raised exception;");
  console.log("any failed proof arrives as an error naming its number. See the header for what each one is.");
  await exitWith(0);
} catch (err) {
  console.error(`label-drafts proofs FAILED against ${envName} (project ${ref}):`);
  console.error(`  ${err.message}`);
  await exitWith(1);
}
