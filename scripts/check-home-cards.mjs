// The home screen is the role's cards (stream 3 of the cards work). Against DEV only, read-only.
//
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-home-cards.mjs
//
//   For every role that holds cards, in English and Thai:
//     1  every tile on its home is the tile of a card the role holds (nothing else draws a tile)
//     2  every card it holds has a tile, or is the included card of a held card that opens the same page
//        (View residents under Residents); a card with neither is a card the person cannot open, and fails
//     3  the tiles come out in the order role_cards keeps
//   4  extras give no tile
//   5  for EACH clinical scope (any, own_clinic): a card whose page is gated by a scope must name a page that
//      scope can open. A card is given to a role by a bundle, so the check builds a role holding exactly that
//      card's bundle at each scope and requires its tile to be drawn and to open a page the role can open.
//      This is the guard against a card that works for one kind of role and silently draws nothing for another.
//   And prints a hash of role_permissions per role, to be compared before and after (this script writes nothing).
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { register } from "node:module";
import { createHash } from "node:crypto";

const root = process.cwd();
const src = pathToFileURL(join(root, "src") + "/").href;
register(
  "data:text/javascript," +
    encodeURIComponent(`
      export async function resolve(spec, ctx, next) {
        if (spec.startsWith("@/")) return next(${JSON.stringify(src)} + spec.slice(2) + ".ts", ctx);
        if (spec.startsWith(".") && !/\\.[a-z]+$/.test(spec)) return next(spec + ".ts", ctx);
        return next(spec, ctx);
      }`),
);
const imp = (p) => import(pathToFileURL(join(root, p)).href);
const { loadEnv, projectRef } = await imp("scripts/lib/env.mjs");
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);
const { cardTilesFor } = await imp("src/lib/home/tiles.ts");
const { CARDS, CARD_KEYS, bundleOfCards, cardOpens, includedCards, isCardKey } = await imp("src/lib/permissions/cards.ts");
const { routeFor, canOpen } = await imp("src/lib/permissions/routes.ts");
const { parsePermissions } = await imp("src/lib/permissions/can.ts");
const en = (await imp("src/lib/i18n/dictionaries/en.ts")).default;
const th = (await imp("src/lib/i18n/dictionaries/th.ts")).default;

async function sql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return text ? JSON.parse(text) : [];
}

let failed = 0;
const fail = (m) => { failed++; console.log(`FAIL ${m}`); };
const ok = (m) => console.log(`ok   ${m}`);

// 5: every card, at every clinical scope (needs no database row: the bundle is the card's own).
const synthetic = (key, clinical) =>
  parsePermissions({
    role: { key: "check_" + key, name: key, name_th: null, kind: "custom", opens_app: true, home_path: null },
    is_admin: false,
    scopes: { residents: "all", clinical, contacts: "all", photos: "all", sees_login_emails: false },
    permissions: Object.fromEntries([...bundleOfCards([key])].map(([a, l]) => [a, l === "edit" ? 2 : 1])),
  });
// A card whose page the shelter's own staff run (a medical job) is checked at "any" only; one that opens a clinic
// login's page (/appointments) is for a clinic login too, so it is checked at both. Nothing else can be refused by scope.
for (const clinical of ["any", "own_clinic"]) {
  for (const key of CARD_KEYS) {
    const page = cardOpens(CARDS[key], clinical);
    const route = routeFor(page);
    const serves = routeFor(CARDS[key].opens)?.scope?.clinical === "own_clinic" ? ["any", "own_clinic"] : ["any"];
    if (!serves.includes(clinical) || (!route?.scope && !CARDS[key].opensAny)) continue;
    const perms = synthetic(key, clinical);
    const tile = cardTilesFor([key], perms, en, 0)[0];
    if (!canOpen(perms, route) || !tile) fail(`card ${key} at clinical scope "${clinical}": its tile opens ${page}, which a role holding the card cannot open (add or fix its opensAny)`);
    else ok(`card ${key} at clinical scope "${clinical}": opens ${page}`);
  }
}

const roles = await sql(`select id, key, name, kind, opens_app, home_path, scope_residents, scope_clinical, scope_contacts, scope_photos, sees_login_emails from roles where archived_at is null order by key`);
const cards = await sql(`select r.key, c.card, c.position from role_cards c join roles r on r.id = c.role_id order by r.key, c.position`);
const cells = await sql(`select r.key, p.activity, p.level from role_permissions p join roles r on r.id = p.role_id order by r.key, p.activity`);

// 6: who approves photos. The Who does what screen (approverNames) must give the very answer the database guard gives
//    (0222): a live, non-Admin role holding photos.resident_publish. A retired role (archived_at set) holding it must NOT be
//    listed, so the + on Add resident photos is disabled for exactly the states the database would refuse.
{
  const { approverNames, needsApprover, APPROVE_ACTIVITY } = await imp("src/lib/permissions/approvers.ts");
  const holders = await sql(`select r.key, r.name, (r.archived_at is not null) as archived, p.activity, p.level from role_permissions p join roles r on r.id = p.role_id where p.activity = 'photos.resident_publish'`);
  const db = await sql(`select name from roles r where r.archived_at is null and r.key <> 'admin' and exists (select 1 from role_permissions p where p.role_id = r.id and p.activity = 'photos.resident_publish' and p.level >= 1) order by r.name`);
  const screen = approverNames(holders.map((h) => ({ roleKey: h.key, roleName: h.name, archived: h.archived, activity: h.activity, level: h.level })));
  if (JSON.stringify([...screen].sort()) !== JSON.stringify(db.map((x) => x.name).sort())) fail(`approvers: the screen says [${screen}] but the database guard counts [${db.map((x) => x.name)}]`);
  else ok(`approvers: screen and database agree (${screen.length ? screen.join(", ") : "none"})`);
  const retired = holders.filter((h) => h.archived);
  if (retired.some((h) => screen.includes(h.name))) fail("approvers: a retired role is listed as an approver");
  else ok(`approvers: ${retired.length} retired role(s) hold ${APPROVE_ACTIVITY} and are not listed`);
  if (!needsApprover("add_photos") || needsApprover("approve_photos")) fail("approvers: only Add resident photos should wait on an approver");
  else ok("approvers: Add resident photos waits on an approver; Approve photos does not");
  // the card grants exactly three cells
  const grant = [...bundleOfCards(["approve_photos"])].map(([a, l]) => `${a}=${l}`).sort().join(",");
  if (grant !== "photos.resident_manage=edit,photos.resident_publish=edit,resident.record=read") fail(`approve_photos grants ${grant}`);
  else ok("approve_photos grants exactly publish, manage and the who-and-where read");
}

for (const role of roles) {
  const rolesCells = cells.filter((c) => c.key === role.key);
  const hash = createHash("sha256").update(rolesCells.map((c) => `${c.activity}=${c.level}`).join("|")).digest("hex").slice(0, 12);
  console.log(`hash ${role.key.padEnd(24)} ${hash} (${rolesCells.length} cells)`);
  const held = cards.filter((c) => c.key === role.key).map((c) => c.card).filter(isCardKey);
  if (held.length === 0) continue;
  const perms = parsePermissions({
    role: { key: role.key, name: role.name, name_th: null, kind: role.kind, opens_app: role.opens_app, home_path: role.home_path },
    is_admin: false,
    scopes: { residents: role.scope_residents, clinical: role.scope_clinical, contacts: role.scope_contacts, photos: role.scope_photos, sees_login_emails: role.sees_login_emails },
    permissions: Object.fromEntries(rolesCells.map((c) => [c.activity, c.level])),
  });
  for (const [lang, t] of [["en", en], ["th", th]]) {
    const tiles = cardTilesFor(held, perms, t, 3);
    const want = held.filter((k) => !held.some((o) => o !== k && CARDS[o].opens === CARDS[k].opens && includedCards(o).includes(k)));
    const labels = tiles.map((x) => x.label);
    const wantLabels = want.map((k) => CARDS[k].label(t));
    const missing = wantLabels.filter((l) => !labels.includes(l));
    const stray = labels.filter((l) => !wantLabels.includes(l));
    if (missing.length) fail(`${role.key} (${lang}): holds card(s) with no tile, so the person cannot open them: ${missing.join(", ")}`);
    else if (stray.length) fail(`${role.key} (${lang}): tile(s) with no card: ${stray.join(", ")}`);
    else if (JSON.stringify(labels) !== JSON.stringify(wantLabels)) fail(`${role.key} (${lang}): tiles out of role_cards order`);
    else ok(`${role.key} (${lang}): ${tiles.length} tile(s) = its ${held.length} card(s), in order`);
  }
}
if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log("\nall ok");
