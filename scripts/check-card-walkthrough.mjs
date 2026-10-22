// The card walkthrough (docs/card-walkthrough.md) is generated from cards.ts, and this fails when it is not trustworthy:
//   - a card has no steps beyond the boilerplate (open the page) — a card whose steps read "open it and check it works" is worth nothing;
//   - docs/card-walkthrough.md differs from what scripts/gen-card-walkthrough.mjs would write now (a card was added or changed);
//   - READBACK names an activity the catalogue lacks, or a non-card tile points at a card that is gone or opens another page.
// Reads only the repo, no database, so CI can run it (docs/decisions/2026-10-22-card-walkthrough-generated.md).
//
//   node scripts/check-card-walkthrough.mjs
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NON_CARD_TILES, READBACK, buildWalkthrough, stepsFor } from "./gen-card-walkthrough.mjs";
import { loadCards } from "./lib/load-cards.mjs";

const root = process.cwd();
let failed = 0;
const fail = (m) => { failed++; console.log(`FAIL ${m}`); };

const cat = await loadCards(root);
const { CARDS, CARD_KEYS, ACTIVITIES, cardOpens } = cat;
cat.labels = {};

const known = new Set(ACTIVITIES.map((a) => a.key));
for (const k of Object.keys(READBACK)) if (!known.has(k)) fail(`READBACK names ${k}, which the catalogue lacks`);
for (const t of NON_CARD_TILES) {
  const c = CARDS[t.coveredBy];
  if (!c) fail(`the ${t.label} tile points at card ${t.coveredBy}, which is gone`);
  else if (cardOpens(c, "own_clinic") !== t.href) fail(`the ${t.label} tile opens ${t.href}, but card ${t.coveredBy} opens ${cardOpens(c, "own_clinic")}`);
}
for (const k of CARD_KEYS) {
  if (stepsFor(CARDS[k], cat).length === 0) fail(`card ${k} has no steps: its bundle is empty and no other card's page exists to refuse`);
}

const fresh = await buildWalkthrough(root);
let onDisk = "";
try { onDisk = readFileSync(join(root, "docs/card-walkthrough.md"), "utf8"); } catch { /* reported below */ }
if (onDisk.replace(/\r\n/g, "\n") !== fresh.replace(/\r\n/g, "\n")) fail("docs/card-walkthrough.md is out of date with cards.ts: run node scripts/gen-card-walkthrough.mjs and commit it");

if (!failed) console.log(`ok   all ${CARD_KEYS.length} cards have steps and docs/card-walkthrough.md is current`);
process.exit(failed ? 1 : 0);
