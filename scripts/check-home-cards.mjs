// The home screen is the role's cards (stream 3 of the cards work). Against DEV only, read-only.
//
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-home-cards.mjs
//
//   For every role that holds cards, in English and Thai:
//     1  every tile on its home is the tile of a card the role holds (nothing else draws a tile)
//     2  every card it holds has a tile, or is the included card of a held card that opens the same page
//        (View residents under Residents); a card with neither is a card the person cannot open, and fails
//     3  the tiles come out in the order role_cards keeps
//     4  extras give no tile
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
const { CARDS, includedCards, isCardKey } = await imp("src/lib/permissions/cards.ts");
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

const roles = await sql(`select id, key, name, kind, opens_app, home_path, scope_residents, scope_clinical, scope_contacts, scope_photos, sees_login_emails from roles where archived_at is null order by key`);
const cards = await sql(`select r.key, c.card, c.position from role_cards c join roles r on r.id = c.role_id order by r.key, c.position`);
const cells = await sql(`select r.key, p.activity, p.level from role_permissions p join roles r on r.id = p.role_id order by r.key, p.activity`);

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
