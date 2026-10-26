// card-grants (0257): a role's access is exactly the union of what its cards require, derived and applied by the database.
// Against DEV only. Part 1 reads; part 2 is one transaction that always rolls back.
//
//   node scripts/check-card-grants.mjs
//
//   1  the live rows: card_grants and card_includes equal cards.ts cell for cell (the seed was not edited), and for every
//      role the union of its cards' grants (includes and all, worked out here, not by the database) is EXACTLY its
//      role_permissions. Admin and the public viewer hold no cards and no cells.
//   2  the triggers, on throwaway roles: a card given by a DIRECT insert into role_cards grants its access; a card taken away by
//      a direct delete removes it; adding or deleting a card_grants row changes every holder at once
//      count; a card that includes another gives that one's access too; the fixed roles' cells do not move and Admin still has a
//      login; and the two photo-approver refusals of set_role_cards (0221/0222/0224) still refuse, with their messages.
import { join } from "node:path";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { exitWith } from "./lib/exit.mjs";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);
// cards.ts imports "./jobs" and "@/…" without extensions, as Next allows; plain node needs a resolver hook (as check-cards-count.mjs).
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
const { CARDS, CARD_KEYS } = await import(pathToFileURL(join(root, "src/lib/permissions/cards.ts")).href);

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

// ---- 1a. the seed is cards.ts, unedited
const grants = await sql(`select card, activity, level from card_grants`);
const includes = await sql(`select card, included_card from card_includes`);
const want = new Set();
const wantInc = new Set();
for (const k of CARD_KEYS) {
  for (const e of CARDS[k].bundle) want.add(`${k}|${e.activity}|${(e.level ?? "edit") === "edit" ? 2 : 1}`);
  for (const i of CARDS[k].includes) wantInc.add(`${k}|${i}`);
}
const have = new Set(grants.map((g) => `${g.card}|${g.activity}|${g.level}`));
const haveInc = new Set(includes.map((g) => `${g.card}|${g.included_card}`));
const diff = (a, b) => [...a].filter((x) => !b.has(x));
if (diff(want, have).length || diff(have, want).length) {
  fail(`card_grants differs from cards.ts: missing ${diff(want, have).join(", ") || "none"}; extra ${diff(have, want).join(", ") || "none"}`);
} else pass(`card_grants holds cards.ts exactly (${have.size} rows)`);
if (diff(wantInc, haveInc).length || diff(haveInc, wantInc).length) fail("card_includes differs from cards.ts");
else pass(`card_includes holds cards.ts exactly (${haveInc.size} edges)`);

// ---- 1b. every role is the union of its cards' grants, worked out here
const roles = await sql(`select id, key, kind from roles order by key`);
const cards = await sql(`select r.key, c.card from role_cards c join roles r on r.id = c.role_id`);
const cells = await sql(`select r.key, p.activity, p.level from role_permissions p join roles r on r.id = p.role_id`);
const closure = (start) => {
  const seen = new Set();
  const walk = (c) => { if (seen.has(c)) return; seen.add(c); for (const i of includes) if (i.card === c) walk(i.included_card); };
  start.forEach(walk);
  return seen;
};
for (const role of roles) {
  const mine = cards.filter((c) => c.key === role.key).map((c) => c.card);
  const got = new Map(cells.filter((c) => c.key === role.key).map((c) => [c.activity, c.level]));
  if (role.kind === "fixed") {
    if (mine.length || got.size) fail(`${role.key} is fixed and must hold no cards or cells`);
    continue;
  }
  const exp = new Map();
  for (const c of closure(mine)) for (const g of grants.filter((x) => x.card === c)) exp.set(g.activity, Math.max(exp.get(g.activity) ?? 0, g.level));
  const bad = [];
  for (const [a, l] of exp) if (got.get(a) !== l) bad.push(`${a} wants ${l} has ${got.get(a) ?? "none"}`);
  for (const [a, l] of got) if (!exp.has(a)) bad.push(`${a} (${l}) is held but no card requires it`);
  if (bad.length) fail(`${role.key}: ${bad.join("; ")}`);
}
if (!failed) pass(`all ${roles.filter((r) => r.kind !== "fixed").length} roles hold exactly what their cards require`);

// ---- 2. the triggers and the guards, in a transaction that always rolls back
const r = (n) => `insert into roles (key, name, kind, home_path)
  values ('harness_${n}', 'Harness ${n}', 'custom', '/home') returning id`;
const block = `
begin;
do $h$
declare
  a uuid; b uuid; c uuid;
  v_n int; v_lvl smallint; v_msg text;
  v_fixed_before bigint;
  function_marker int;
begin
  select count(*) into v_fixed_before from role_permissions p join roles r on r.id = p.role_id where r.kind = 'fixed';
  if v_fixed_before <> 0 then raise exception 'ASSERT fixed roles hold % cells before', v_fixed_before; end if;
  if not exists (select 1 from user_roles ur join roles r on r.id = ur.role_id where r.key = 'admin') then
    raise exception 'ASSERT nobody holds the Admin role: nobody could edit Who does what';
  end if;

  ${r("a").replace("returning id", "returning id into a")};
  ${r("b").replace("returning id", "returning id into b")};
  ${r("c").replace("returning id", "returning id into c")};

  -- a card given by a DIRECT insert grants its access (the 0251 route)
  insert into role_cards (role_id, card, position) values (a, 'my_tasks', 1);
  select count(*) into v_n from role_permissions where role_id = a;
  if v_n <> 1 or not exists (select 1 from role_permissions where role_id = a and activity = 'recurring.do_own' and level = 2) then
    raise exception 'ASSERT direct insert of my_tasks gave % cells, not exactly recurring.do_own', v_n;
  end if;

  -- an included card flows: residents includes view_residents; the higher level wins
  insert into role_cards (role_id, card, position) values (a, 'residents', 2);
  select level into v_lvl from role_permissions where role_id = a and activity = 'resident.record';
  if v_lvl is distinct from 2 then raise exception 'ASSERT resident.record should be edit via residents, got %', v_lvl; end if;
  insert into role_cards (role_id, card, position) values (b, 'medical_records', 1);
  select level into v_lvl from role_permissions where role_id = b and activity = 'resident.record';
  if v_lvl is distinct from 1 then raise exception 'ASSERT medical_records should bring resident.record at read via view_residents, got %', v_lvl; end if;

  -- changing what a card requires updates every holder at once (community.outings: held by no card these roles hold; facility.enclosures was used until 0265 gave it to view_residents)
  insert into role_cards (role_id, card, position) values (c, 'my_tasks', 1);
  insert into card_grants (card, activity, level) values ('my_tasks', 'community.outings', 1);
  if (select count(*) from role_permissions where activity = 'community.outings' and role_id in (a, c)) <> 2 then
    raise exception 'ASSERT adding a card_grants row did not reach both holders';
  end if;
  update card_grants set level = 2 where card = 'my_tasks' and activity = 'community.outings';
  if (select count(*) from role_permissions where activity = 'community.outings' and level = 2 and role_id in (a, c)) <> 2 then
    raise exception 'ASSERT raising a card_grants level did not reach both holders';
  end if;
  delete from card_grants where card = 'my_tasks' and activity = 'community.outings';
  if exists (select 1 from role_permissions where activity = 'community.outings' and role_id in (a, c)) then
    raise exception 'ASSERT deleting a card_grants row left the access behind';
  end if;

  -- a card taken away by a direct delete takes its access with it
  delete from role_cards where role_id = a and card = 'residents';
  if exists (select 1 from role_permissions where role_id = a and activity = 'placement.move') then
    raise exception 'ASSERT removing the residents card left placement.move behind';
  end if;
  select count(*) into v_n from role_permissions where role_id = a;
  if v_n <> 1 then raise exception 'ASSERT after removing residents, % cells remain, not just my_tasks'' one', v_n; end if;

  -- the photo-approver guards. Nobody else approves in this transaction (rolled back): remove the cell from every other role.
  delete from role_permissions where activity = 'photos.approve';
  delete from role_cards where role_id in (a, b, c);

  begin
    perform set_role_cards(a, array['add_photos']);
    raise exception 'ASSERT add_photos was given while nobody approves';
  exception when check_violation then
    get stacked diagnostics v_msg = message_text;
    if v_msg not like 'Give a role the Approve photos card first%' then raise exception 'ASSERT wrong refusal: %', v_msg; end if;
  end;

  -- approve + add together is allowed (this role approves after the call), and a second role may then add photos
  perform set_role_cards(a, array['approve_photos', 'add_photos']);
  if not exists (select 1 from role_permissions where role_id = a and activity = 'photos.approve') then
    raise exception 'ASSERT approve_photos did not give photos.approve';
  end if;
  perform set_role_cards(b, array['add_photos']);

  begin
    perform set_role_cards(a, array[]::text[]);
    raise exception 'ASSERT the last approver was taken away while roles still add photos';
  exception when check_violation then
    get stacked diagnostics v_msg = message_text;
    if v_msg not like 'This is the last role that can approve photos%' then raise exception 'ASSERT wrong refusal: %', v_msg; end if;
  end;

  -- a retired role does not count as an approver
  update roles set archived_at = now() where id = a;
  begin
    perform set_role_cards(c, array['add_photos']);
    raise exception 'ASSERT a retired role was counted as an approver';
  exception when check_violation then
    null;
  end;
  update roles set archived_at = null where id = a;

  select count(*) into v_n from role_permissions p join roles r on r.id = p.role_id where r.kind = 'fixed';
  if v_n <> 0 then raise exception 'ASSERT fixed roles hold % cells after', v_n; end if;
end
$h$;
rollback;
`.replace("  function_marker int;\n", "");

try {
  await sql(block);
  pass("direct insert grants; direct delete removes; card_grants changes reach every holder; includes flow");
  pass("the photo-approver guards still refuse (no approver; last approver; retired role), and Admin is untouched and has a login");
} catch (e) {
  fail(String(e.message ?? e).split("\n")[0]);
  try { await sql("rollback"); } catch {}
}

console.log(failed ? `\n${failed} FAILED` : "\nAll card-grants checks passed.");
await exitWith(failed ? 1 : 0);
