// role_home_tiles (0225) is seeded from today's homes, so landing it changes nothing. Against DEV only, read-only.
//
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-role-home-tiles.mjs
//
//   1  the card -> page map copied into the migration equals src/lib/permissions/cards.ts, for both clinical scopes
//   2  Admin and the public viewer have no rows
//   3  every role that holds cards: its rows, in position order, are exactly the hrefs homeTilesForRoles() draws for it
//      today (English and Thai), so no one loses or gains a page the morning this lands
//   4  a role with no cards has no rows (it keeps the derived home)
//   5  positions run 0..n-1 with no gap
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { register } from "node:module";

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
const { homeTilesForRoles } = await imp("src/lib/home/tiles.ts");
const { CARDS, CARD_KEYS, cardOpens, isCardKey } = await imp("src/lib/permissions/cards.ts");
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

// 1: the map in the migration
{
  const file = readFileSync(join(root, "supabase/migrations/0225_role_home_tiles.sql"), "utf8");
  const map = new Map([...file.matchAll(/\('([a-z_]+)',\s+'(\/[^']*)',\s+'(\/[^']*)'\)/g)].map((m) => [m[1], { own: m[2], any: m[3] }]));
  let bad = 0;
  for (const key of CARD_KEYS) {
    const got = map.get(key);
    const want = { own: cardOpens(CARDS[key], "own_clinic"), any: cardOpens(CARDS[key], "any") };
    if (!got || got.own !== want.own || got.any !== want.any) { bad++; fail(`migration map for card ${key} is ${JSON.stringify(got)}, cards.ts says ${JSON.stringify(want)}`); }
  }
  for (const k of map.keys()) if (!CARD_KEYS.includes(k)) { bad++; fail(`migration map names card ${k}, which cards.ts does not have`); }
  if (!bad) ok(`card -> page map: ${CARD_KEYS.length} cards agree with cards.ts at both clinical scopes`);
}

const roles = await sql(`select id, key, name, kind, opens_app, home_path, scope_residents, scope_clinical, scope_contacts, scope_photos, sees_login_emails from roles where archived_at is null order by key`);
const cardRows = await sql(`select r.key, c.card, c.position from role_cards c join roles r on r.id = c.role_id order by r.key, c.position`);
const cells = await sql(`select r.key, p.activity, p.level from role_permissions p join roles r on r.id = p.role_id`);
const tileRows = await sql(`select r.key, t.path, t.position from role_home_tiles t join roles r on r.id = t.role_id order by r.key, t.position`);

for (const role of roles) {
  const rows = tileRows.filter((x) => x.key === role.key);
  const held = cardRows.filter((c) => c.key === role.key).map((c) => c.card).filter(isCardKey);
  if (role.kind === "fixed") {
    rows.length ? fail(`${role.key}: a fixed role has ${rows.length} tile row(s)`) : ok(`${role.key}: no rows`);
    continue;
  }
  if (held.length === 0) {
    rows.length ? fail(`${role.key}: no cards but ${rows.length} tile row(s)`) : ok(`${role.key}: no cards, no rows (keeps the derived home)`);
    continue;
  }
  if (!rows.every((r, i) => r.position === i)) fail(`${role.key}: positions are not 0..${rows.length - 1}`);
  const perms = parsePermissions({
    role: { key: role.key, name: role.name, name_th: null, kind: role.kind, opens_app: role.opens_app, home_path: role.home_path },
    is_admin: false,
    scopes: { residents: role.scope_residents, clinical: role.scope_clinical, contacts: role.scope_contacts, photos: role.scope_photos, sees_login_emails: role.sees_login_emails },
    permissions: Object.fromEntries(cells.filter((c) => c.key === role.key).map((c) => [c.activity, c.level])),
  });
  const seeded = rows.map((r) => r.path);
  for (const [lang, t] of [["en", en], ["th", th]]) {
    const drawn = homeTilesForRoles(perms, t, undefined, { [role.key]: held }).map((x) => x.href);
    JSON.stringify(drawn) === JSON.stringify(seeded)
      ? ok(`${role.key} (${lang}): ${seeded.length} seeded tile(s) = what the home draws today`)
      : fail(`${role.key} (${lang}): seeded [${seeded}] but the home draws [${drawn}]`);
  }
  // The home now READS the rows (0225 app half): drawn from the saved paths it must be the same home, and reordering the
  // rows must reorder the tiles.
  const fromRows = homeTilesForRoles(perms, en, undefined, {}, undefined, { [role.key]: seeded }).map((x) => x.href);
  JSON.stringify(fromRows) === JSON.stringify(seeded) ? ok(`${role.key}: drawn from the saved rows = the seeded home`) : fail(`${role.key}: rows [${seeded}] draw [${fromRows}]`);
  const flipped = homeTilesForRoles(perms, en, undefined, {}, undefined, { [role.key]: [...seeded].reverse() }).map((x) => x.href);
  JSON.stringify(flipped) === JSON.stringify([...seeded].reverse()) ? ok(`${role.key}: reversing the rows reverses the home`) : fail(`${role.key}: reversed rows draw [${flipped}]`);
}
if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log("\nall ok");
