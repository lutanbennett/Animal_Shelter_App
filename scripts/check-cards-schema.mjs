// role-cards (0194): the cards a role has, the extras it keeps, and the recompute of role_permissions as their union.
// Against DEV only. Part 1 reads; part 2 is one transaction that always rolls back.
//
//   node scripts/check-cards-schema.mjs
//
//   1  the live rows agree with the code: for every role, the union of the bundles of its role_cards (cards.ts, includes
//      and all) plus its role_extras is EXACTLY its role_permissions, cell for cell; every card named exists in cards.ts;
//      every extra says why; Admin and the public viewer have none.
//   2  the functions, on a throwaway role and real JWTs:
//        the first card gives its cells; a higher card that includes it adds and keeps; removing a card keeps whatever
//        another card still gives; an extra survives every recompute and is raised, never lowered, by a card; a recompute that
//        changes nothing writes nothing (so Recent changes shows only real changes); a fixed role takes no cards; a card
//        given twice is refused; and who may write: Admin at 2-step yes, Admin at 1-step, a volunteer and a role with no
//        login no.
import { join } from "node:path";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { exitWith } from "./lib/exit.mjs";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);
// cards.ts imports "./jobs" and "@/…" without extensions, as Next allows; plain node needs a resolver hook (as check-multi-role-build.mjs).
const srcUrl = pathToFileURL(join(root, "src") + "/").href;
register(
  "data:text/javascript," +
    encodeURIComponent(`
      export async function resolve(spec, ctx, next) {
        if (spec.startsWith("@/")) return next(${JSON.stringify(srcUrl)} + spec.slice(2) + ".ts", ctx);
        if (spec.startsWith(".") && !/\\.[a-z]+$/.test(spec)) return next(spec + ".ts", ctx);
        return next(spec, ctx);
      }`),
);
const { CARDS, CARD_KEYS, bundleOfCards, bundleJson } = await import(pathToFileURL(join(root, "src/lib/permissions/cards.ts")).href);
const { ACTIVITIES } = await import(pathToFileURL(join(root, "src/lib/permissions/catalogue.ts")).href);

async function sql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error((() => { try { return JSON.parse(text).message ?? text; } catch { return text; } })());
  return text ? JSON.parse(text) : [];
}

let failed = 0;
const fail = (m) => { failed++; console.log(`FAIL ${m}`); };
const pass = (m) => console.log(`ok   ${m}`);

// ---- 0. the code itself
const known = new Set(ACTIVITIES.map((a) => a.key));
for (const k of CARD_KEYS) {
  for (const e of CARDS[k].bundle) if (!known.has(e.activity)) fail(`card ${k} names an activity the catalogue lacks: ${e.activity}`);
  for (const i of CARDS[k].includes) if (!CARDS[i]) fail(`card ${k} includes ${i}, which is not a card`);
}
if (CARD_KEYS.length !== 23) fail(`the agreed set is twenty-three cards; cards.ts has ${CARD_KEYS.length}`);
else pass("cards.ts has the twenty-three agreed cards, all naming real activities");

// ---- 1. live rows vs code
const roles = await sql(`select id, key, kind from roles order by key`);
const cards = await sql(`select r.key, c.card, c.position from role_cards c join roles r on r.id = c.role_id order by r.key, c.position`);
const extras = await sql(`select r.key, e.activity, e.level, e.why from role_extras e join roles r on r.id = e.role_id`);
const cells = await sql(`select r.key, p.activity, p.level from role_permissions p join roles r on r.id = p.role_id`);
for (const role of roles) {
  const mine = cards.filter((c) => c.key === role.key);
  const ex = extras.filter((e) => e.key === role.key);
  const have = new Map(cells.filter((c) => c.key === role.key).map((c) => [c.activity, c.level]));
  if (role.kind === "fixed") {
    if (mine.length || ex.length || have.size) fail(`${role.key} is fixed and must hold no cards, extras or cells`);
    continue;
  }
  const unknown = mine.filter((c) => !CARDS[c.card]);
  if (unknown.length) { fail(`${role.key} holds cards cards.ts does not define: ${unknown.map((c) => c.card).join(", ")}`); continue; }
  const want = new Map([...bundleOfCards(mine.map((c) => c.card))].map(([a, l]) => [a, l === "edit" ? 2 : 1]));
  for (const e of ex) want.set(e.activity, Math.max(want.get(e.activity) ?? 0, e.level));
  const diff = [];
  for (const a of new Set([...want.keys(), ...have.keys()])) if (want.get(a) !== have.get(a)) diff.push(`${a} (cards+extras ${want.get(a) ?? "none"}, role_permissions ${have.get(a) ?? "none"})`);
  if (diff.length) fail(`${role.key}: role_permissions is not the union of its cards and extras: ${diff.join("; ")}`);
  else pass(`${role.key}: ${mine.length} card(s) + ${ex.length} extra(s) = its ${have.size} cells exactly`);
  if (ex.some((e) => !e.why?.trim())) fail(`${role.key} has an extra with no reason`);
}

// ---- 2. the functions, one rolled-back transaction
const P = ["admin1", "admin2", "volunteer", "norole"];
const U = Object.fromEntries(P.map((p) => [p, randomUUID()]));
const lit = (id) => `'${id}'::uuid`;
const bj = (keys) => JSON.stringify(bundleJson(keys)).replace(/'/g, "''");
const harness = `
do $h$
declare
  v_role uuid; v_admin uuid; n bigint; a bigint; b bigint; lvl smallint; msg text;
  function_ok boolean;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'harness-cards-' || u.who || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()
    from (values ${P.map((p) => `('${p}', ${lit(U[p])})`).join(",")}) as u(who, id);
  insert into user_roles (user_id, role_id) select ${lit(U.admin1)}, id from roles where key = 'admin';
  insert into user_roles (user_id, role_id) select ${lit(U.admin2)}, id from roles where key = 'admin';
  insert into user_roles (user_id, role_id) select ${lit(U.volunteer)}, id from roles where key = 'volunteer';
  insert into roles (key, name, kind, opens_app, home_path, scope_residents, scope_clinical, scope_contacts, scope_photos, sees_login_emails)
    values ('harness_cards', 'Harness cards', 'custom', true, '/home', 'who_and_where', 'any', 'name_type', 'medical_only', false)
    returning id into v_role;
  select id into v_admin from roles where key = 'admin';

  -- the first card: View residents is resident.record at Read and nothing else
  perform set_role_cards(v_role, array['view_residents'], '${bj(["view_residents"])}'::jsonb);
  select count(*), min(level) into n, lvl from role_permissions where role_id = v_role;
  if n <> 1 or lvl <> 1 then raise exception 'FAIL view_residents should give exactly resident.record at Read, got % cells', n; end if;

  -- an extra the cards do not give, then a higher card that includes the first and adds to it
  insert into role_extras (role_id, activity, level, why) values (v_role, 'maintenance.delete', 2, 'harness');
  perform set_role_cards(v_role, array['residents'], '${bj(["residents"])}'::jsonb);
  select level into lvl from role_permissions where role_id = v_role and activity = 'resident.record';
  if lvl is distinct from 2 then raise exception 'FAIL Residents should lift resident.record to Edit, got %', lvl; end if;
  if not exists (select 1 from role_permissions where role_id = v_role and activity = 'photos.resident_add') then raise exception 'FAIL Residents should bring photo upload'; end if;
  if not exists (select 1 from role_permissions where role_id = v_role and activity = 'maintenance.delete' and level = 2) then raise exception 'FAIL the extra must survive a recompute'; end if;
  if exists (select 1 from role_permissions where role_id = v_role and activity = 'placement.death_withdraw') then raise exception 'FAIL Residents must not give death withdrawal'; end if;

  -- levels flow down: Residents -> View residents. Swap Residents for the lower card: the edit and the photos go, the read stays
  perform set_role_cards(v_role, array['view_residents'], '${bj(["view_residents"])}'::jsonb);
  select level into lvl from role_permissions where role_id = v_role and activity = 'resident.record';
  if lvl is distinct from 1 then raise exception 'FAIL swapping Residents for View residents should drop resident.record to Read, got %', lvl; end if;
  if exists (select 1 from role_permissions where role_id = v_role and activity = 'photos.resident_add') then raise exception 'FAIL photo upload should go with the Residents card'; end if;
  if not exists (select 1 from role_permissions where role_id = v_role and activity = 'maintenance.delete') then raise exception 'FAIL the extra must survive removing a card'; end if;

  -- a card removed while another still covers its activity: Medical records and Book clinic visits both read medical.visits
  perform set_role_cards(v_role, array['medical_records', 'book_clinic_visits'], '${bj(["medical_records", "book_clinic_visits"])}'::jsonb);
  perform set_role_cards(v_role, array['book_clinic_visits'], '${bj(["book_clinic_visits"])}'::jsonb);
  select level into lvl from role_permissions where role_id = v_role and activity = 'medical.visits';
  if lvl is distinct from 1 then raise exception 'FAIL removing Medical records should leave medical.visits at the Read Book clinic visits gives, got %', lvl; end if;
  if not exists (select 1 from role_permissions where role_id = v_role and activity = 'visit.book') then raise exception 'FAIL Book clinic visits keeps visit.book'; end if;
  if exists (select 1 from role_permissions where role_id = v_role and activity = 'medical.prescriptions') then raise exception 'FAIL removing Medical records should take its other cells'; end if;
  -- an extra raised by a card is not lowered when the card goes
  update role_extras set level = 2, activity = 'medical.visits' where role_id = v_role and activity = 'maintenance.delete';
  perform set_role_cards(v_role, array['book_clinic_visits'], '${bj(["book_clinic_visits"])}'::jsonb);
  select level into lvl from role_permissions where role_id = v_role and activity = 'medical.visits';
  if lvl is distinct from 2 then raise exception 'FAIL an extra held at Edit must beat a card giving Read, got %', lvl; end if;
  delete from role_extras where role_id = v_role;

  -- a recompute that changes nothing writes nothing
  perform recompute_role_permissions(v_role, '${bj(["book_clinic_visits"])}'::jsonb);
  select count(*) into a from audit_log where table_name = 'role_permissions';
  perform set_role_cards(v_role, array['book_clinic_visits'], '${bj(["book_clinic_visits"])}'::jsonb);
  select count(*) into b from audit_log where table_name = 'role_permissions';
  if a <> b then raise exception 'FAIL a recompute that changes nothing wrote % audit row(s)', b - a; end if;

  -- a real change is audited as the cells it moved
  perform set_role_cards(v_role, array['view_residents'], '${bj(["view_residents"])}'::jsonb);
  select count(*) into b from audit_log where table_name = 'role_permissions';
  if b = a then raise exception 'FAIL a card change must show in the audit log as cell changes'; end if;

  -- refusals
  begin perform set_role_cards(v_admin, array['view_residents'], '${bj(["view_residents"])}'::jsonb); raise exception 'FAIL a fixed role took a card';
  exception when check_violation then null; end;
  begin perform set_role_cards(v_role, array['view_residents', 'view_residents'], '[]'::jsonb); raise exception 'FAIL a card was given twice';
  exception when unique_violation then null; end;

  -- who may write
  perform set_config('request.jwt.claims', json_build_object('sub', ${lit(U.admin2)}, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
  perform set_role_cards(v_role, array['view_residents', 'enclosures'], '${bj(["view_residents", "enclosures"])}'::jsonb);
  reset role;
  if not exists (select 1 from role_permissions where role_id = v_role and activity = 'facility.enclosures' and level = 1) then raise exception 'FAIL Admin at 2-step could not set cards'; end if;

  foreach msg in array array['admin1:aal1', 'volunteer:aal2', 'norole:aal2'] loop
    function_ok := true;
    begin
      perform set_config('request.jwt.claims', json_build_object('sub', case split_part(msg, ':', 1) when 'admin1' then ${lit(U.admin1)} when 'volunteer' then ${lit(U.volunteer)} else ${lit(U.norole)} end,
        'role', 'authenticated', 'aal', split_part(msg, ':', 2))::text, true);
      set local role authenticated;
      perform set_role_cards(v_role, array['view_residents'], '${bj(["view_residents"])}'::jsonb);
      reset role;
      -- RLS filters a delete silently; the insert is what must refuse. If the cell for enclosures is gone, the write got through.
      if not exists (select 1 from role_permissions where role_id = v_role and activity = 'facility.enclosures') then
        raise exception 'FAIL % changed a role''s cards', msg;
      end if;
    exception when insufficient_privilege or others then
      reset role;
      if sqlerrm like 'FAIL%' then raise; end if;
    end;
  end loop;
  if not exists (select 1 from role_permissions where role_id = v_role and activity = 'facility.enclosures') then raise exception 'FAIL a refused caller changed cells'; end if;

  -- photo-approver guard (0221). Start from "nobody approves": clear that cell everywhere in this rolled-back transaction.
  delete from role_permissions where activity = 'photos.resident_publish';
  declare
    v_mgmt uuid; v_third uuid; v_vol uuid;
  begin
    insert into roles (key, name, kind, opens_app, home_path, scope_residents, scope_clinical, scope_contacts, scope_photos, sees_login_emails)
      values ('harness_mgmt', 'Harness mgmt', 'custom', true, '/home', 'who_and_where', 'any', 'name_type', 'medical_only', false) returning id into v_mgmt;
    insert into roles (key, name, kind, opens_app, home_path, scope_residents, scope_clinical, scope_contacts, scope_photos, sees_login_emails)
      values ('harness_third', 'Harness third', 'custom', true, '/home', 'who_and_where', 'any', 'name_type', 'medical_only', false) returning id into v_third;
    insert into roles (key, name, kind, opens_app, home_path, scope_residents, scope_clinical, scope_contacts, scope_photos, sees_login_emails)
      values ('harness_vol', 'Harness vol', 'custom', true, '/home', 'who_and_where', 'any', 'name_type', 'medical_only', false) returning id into v_vol;

    -- 1 no approver (Admin holds no cells, so it cannot count): Add resident photos is refused, plain message, nothing written
    begin
      perform set_role_cards(v_vol, array['add_photos'], '${bj(["add_photos"])}'::jsonb);
      raise exception 'FAIL add_photos was given with no approver';
    exception when check_violation then
      if sqlerrm <> 'Give a role the Approve photos card first, so someone can approve these photos.' then raise exception 'FAIL wrong refusal message: %', sqlerrm; end if;
    end;
    if exists (select 1 from role_cards where role_id = v_vol) then raise exception 'FAIL the refused call wrote a card'; end if;
    -- a role given Residents and Add resident photos in one call approves for itself, so that is allowed
    perform set_role_cards(v_third, array['residents', 'add_photos'], '${bj(["residents", "add_photos"])}'::jsonb);
    perform set_role_cards(v_third, array[]::text[], '[]'::jsonb);
    delete from role_permissions where activity = 'photos.resident_publish';

    -- 2 permissive: Residents (the Management case) counts as an approver; Add resident photos then goes on silently
    perform set_role_cards(v_mgmt, array['residents'], '${bj(["residents"])}'::jsonb);
    perform set_role_cards(v_vol, array['add_photos'], '${bj(["add_photos"])}'::jsonb);
    if not exists (select 1 from role_cards where role_id = v_vol and card = 'add_photos') then raise exception 'FAIL add_photos not given though Residents approves'; end if;
    perform set_role_cards(v_vol, array['add_photos', 'view_residents'], '${bj(["add_photos", "view_residents"])}'::jsonb);

    -- 3 last approver: taking Residents off the only approver is refused while Harness vol holds Add resident photos, naming it
    begin
      perform set_role_cards(v_mgmt, array[]::text[], '[]'::jsonb);
      raise exception 'FAIL the last approver was removed';
    exception when check_violation then
      if sqlerrm not like '%Harness vol%' then raise exception 'FAIL the refusal did not name the holding role: %', sqlerrm; end if;
    end;
    if not exists (select 1 from role_permissions where role_id = v_mgmt and activity = 'photos.resident_publish') then raise exception 'FAIL the refused removal changed cells'; end if;
    -- an unrelated change on the approver stays silent
    perform set_role_cards(v_mgmt, array['residents', 'enclosures'], '${bj(["residents", "enclosures"])}'::jsonb);

    -- 4 a second approver (an extra counts) frees the first to go
    insert into role_extras (role_id, activity, level, why) values (v_third, 'photos.resident_publish', 2, 'harness');
    perform recompute_role_permissions(v_third, '[]'::jsonb);
    perform set_role_cards(v_mgmt, array[]::text[], '[]'::jsonb);
    if exists (select 1 from role_cards where role_id = v_mgmt) then raise exception 'FAIL Residents could not be removed though an extra approves'; end if;

    -- 5 taking Add resident photos away is always allowed, even with no approver left
    delete from role_extras where role_id = v_third;
    delete from role_permissions where activity = 'photos.resident_publish';
    perform set_role_cards(v_vol, array[]::text[], '[]'::jsonb);

    -- 6 a RETIRED role (roles.archived_at set) holding the activity is not an approver (0222, Lutan 2026-10-18).
    --   Only the flag decides: this role is named nothing like staff.
    declare v_old uuid;
    begin
      insert into roles (key, name, kind, opens_app, home_path, scope_residents, scope_clinical, scope_contacts, scope_photos, sees_login_emails)
        values ('harness_old', 'Harness old', 'custom', true, '/home', 'who_and_where', 'any', 'name_type', 'medical_only', false) returning id into v_old;
      perform set_role_cards(v_old, array['residents'], '${bj(["residents"])}'::jsonb);
      -- live and holding it: it approves, so Add resident photos can be given out
      perform set_role_cards(v_vol, array['add_photos'], '${bj(["add_photos"])}'::jsonb);
      perform set_role_cards(v_vol, array[]::text[], '[]'::jsonb);
      -- retire it: the cell is still there, but it no longer counts
      update roles set archived_at = now() where id = v_old;
      if not exists (select 1 from role_permissions where role_id = v_old and activity = 'photos.resident_publish') then raise exception 'FAIL the retired role lost its cell (the harness premise)'; end if;
      begin
        perform set_role_cards(v_vol, array['add_photos'], '${bj(["add_photos"])}'::jsonb);
        raise exception 'FAIL a retired role was counted as the approver';
      exception when check_violation then
        if sqlerrm <> 'Give a role the Approve photos card first, so someone can approve these photos.' then raise exception 'FAIL wrong refusal message: %', sqlerrm; end if;
      end;
      -- a live approver alongside it satisfies the guard again, and the last LIVE one is protected
      perform set_role_cards(v_mgmt, array['residents'], '${bj(["residents"])}'::jsonb);
      perform set_role_cards(v_vol, array['add_photos'], '${bj(["add_photos"])}'::jsonb);
      begin
        perform set_role_cards(v_mgmt, array[]::text[], '[]'::jsonb);
        raise exception 'FAIL the last live approver was removed because a retired role still holds the cell';
      exception when check_violation then
        if sqlerrm not like '%Harness vol%' then raise exception 'FAIL the refusal did not name the holding role: %', sqlerrm; end if;
      end;
    end;
  end;

  raise exception 'cards-harness-ok';
end $h$;
`;
try {
  await sql(harness);
  fail("the harness did not finish");
} catch (e) {
  if (String(e.message).includes("cards-harness-ok")) pass("functions: cards add, include, remove and keep what another card gives; extras survive; no-op writes nothing; refusals hold; the photo-approver guard refuses both ways and stays silent otherwise");
  else fail(`harness: ${e.message}`);
}

console.log(failed ? `\n${failed} FAILED` : "\nAll checks passed.");
await exitWith(failed ? 1 : 0);
