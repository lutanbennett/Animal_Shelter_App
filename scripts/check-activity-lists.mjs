// Forbids a hard-coded list of activities in an activity-based control (Lutan, 2026-10-23;
// docs/decisions/2026-10-24-activity-lists-from-cards-only.md). A power comes from a card, and
// src/lib/permissions/cards.ts is the one place that says which. A screen, check or test that
// writes out its own list of activity keys to stand for "what this role/card can do" goes stale
// the moment a card is edited on the roles screen.
//
// A violation: one [...] or new Set([...]) literal naming TWO OR MORE distinct catalogue activity keys,
// in a file that is not on ALLOWED below. Asking can(perms, "x") for a single activity is not a list.
// Reads files only; needs no database. Run in `npm run lint`.
//
//   node scripts/check-activity-lists.mjs
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.cwd();
const keys = [...readFileSync(join(root, "src/lib/permissions/catalogue.ts"), "utf8").matchAll(/key: "([a-z_.]+)"/g)].map((m) => m[1]);
if (keys.length < 50) { console.log(`FAIL read only ${keys.length} activity keys from catalogue.ts`); process.exit(1); }
const keySet = new Set(keys);

// The places that DEFINE or MIRROR the list, each with why. Anything else needs a card, not a list.
const ALLOWED = new Map([
  ["src/lib/permissions/catalogue.ts", "the catalogue itself"],
  ["src/lib/permissions/cards.ts", "the one place a card's bundle is written"],
  ["src/lib/permissions/jobs.ts", "the eight jobs, which cards.ts reads"],
  ["src/lib/permissions/routes.ts", "which activity opens which page"],
  ["src/lib/permissions/fixed-for-now.ts", "activities deliberately outside the cards, each with its reason"],
  ["src/lib/permissions/prerequisites.ts", "an activity's prerequisites (catalogue data)"],
  ["src/lib/i18n/dictionaries/en.ts", "labels, not controls"],
  ["src/lib/i18n/dictionaries/th.ts", "labels, not controls"],
  ["src/lib/manual/en.ts", "prose"],
  ["scripts/lib/permission-probes.mjs", "one probe per activity, owned by the parity check"],
  ["scripts/lib/acceptance-matrix-entries.mjs", "the acceptance matrix, generated per activity"],
  ["scripts/lib/menu-coverage-declared.mjs", "declared menu coverage"],
  ["scripts/check-permission-catalogue.mjs", "compares catalogue.ts to the database"],
  ["scripts/gen-card-walkthrough.mjs", "describes cards by activity"],
  ["src/app/photos/add/page.tsx", "the activities that open this page (requireAnyPermission), as routes.ts gates it"],
  ["src/app/management/translations/page.tsx", "the activities that open this page (requireAnyPermission), as routes.ts gates it"],
  ["src/lib/home/add-photos-card.test.mjs", "pins what cards.ts gives this card"],
  ["src/lib/home/approve-photos-card.test.mjs", "pins what cards.ts gives (and withholds from) this card"],
  ["scripts/check-activity-lists.mjs", "this file"],
]);
for (const f of process.argv.slice(2).filter((a) => a.startsWith("--allow="))) ALLOWED.set(f.slice(8), "argument");

const files = [];
(function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (["node_modules", ".next", ".open-next", ".git", "supabase"].includes(e.name)) continue;
    const f = join(d, e.name);
    if (e.isDirectory()) walk(f);
    else if (/\.(ts|tsx|mjs)$/.test(e.name)) files.push(f);
  }
})(join(root, "src"));
(function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const f = join(d, e.name);
    if (e.isDirectory()) walk(f);
    else if (/\.mjs$/.test(e.name)) files.push(f);
  }
})(join(root, "scripts"));

let failed = 0;
for (const file of files) {
  const rel = relative(root, file).split(sep).join("/");
  if (ALLOWED.has(rel)) continue;
  const text = readFileSync(file, "utf8");
  // Innermost bracket pairs: a [...] with no [ or ] inside it.
  for (const m of text.matchAll(/\[([^\[\]]*)\]/g)) {
    // Only bare string elements count: [{ open: can(p, "a") }, ...] asks about one activity per entry, which is a gate.
    const named = new Set(m[1].split(",").map((e) => /^\s*["'`]([a-z_]+\.[a-z_]+)["'`]\s*$/.exec(e)?.[1]).filter((k) => k && keySet.has(k)));
    if (named.size < 2) continue;
    const line = text.slice(0, m.index).split("\n").length;
    failed++;
    console.log(`FAIL ${rel}:${line} lists ${named.size} activities (${[...named].join(", ")}). Read them from the card in cards.ts instead.`);
  }
}
if (failed) { console.log(`\n${failed} hard-coded activity list(s). A power comes from a card; cards.ts is the one place that says which.`); process.exit(1); }
console.log(`ok   no hard-coded activity lists in ${files.length} files (${ALLOWED.size} allowed definers)`);
