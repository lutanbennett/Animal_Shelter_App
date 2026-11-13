// The code half of the cards check, with no database: cards.ts has exactly the twenty-eight agreed cards (the 26th, My tasks, asked for by Lutan 2026-10-20), every
// card's bundle names an activity the catalogue has, and every card it includes is a card. It reads only cards.ts and catalogue.ts, so CI can run it.
// Its database half, check-cards-schema.mjs, was retired with 0257 (docs/decisions/2026-10-24-cards-grants-app.md): check-card-grants.mjs now proves
// the database against cards.ts (docs/decisions/2026-10-16-cards-count-in-ci.md).
//
//   node scripts/check-cards-count.mjs
import { exitWith } from "./lib/exit.mjs";
import { join } from "node:path";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

const root = process.cwd();
// cards.ts imports "./jobs" and "@/…" without extensions, as Next allows; plain node needs a resolver hook (as check-cards-schema.mjs).
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
const { ACTIVITIES } = await import(pathToFileURL(join(root, "src/lib/permissions/catalogue.ts")).href);

let failed = 0;
const fail = (m) => { failed++; console.log(`FAIL ${m}`); };

const known = new Set(ACTIVITIES.map((a) => a.key));
for (const k of CARD_KEYS) {
  for (const e of CARDS[k].bundle) if (!known.has(e.activity)) fail(`card ${k} names an activity the catalogue lacks: ${e.activity}`);
  for (const i of CARDS[k].includes) if (!CARDS[i]) fail(`card ${k} includes ${i}, which is not a card`);
}
if (CARD_KEYS.length !== 59) fail(`the agreed set is fifty-nine cards (View foundation papers, 0368, makes fifty-nine; Foundation papers and Board ID copies, 0362, make fifty-eight; Approve public text, 0345, makes fifty-six; Set up diets, 0340, makes fifty-five; Manage suppliers, 0338, makes fifty-four; Reels library, Add and change reels, and Browse reels, 0329, make fifty-three; Utility and general bills folded into Bills, 0327, makes fifty; Add and change memes, and Browse memes, 0326, make fifty-two; Look after project folders, 0323, makes fifty; View expenses, 0317, makes forty-nine; Propose and Approve website changes, 0315, make forty-eight; Run fundraising events, 0312, makes forty-six; Utility, general and bill-places cards, 0305, make forty-five; Correct an intake date, 0302, makes forty-two;thirty-nine after record_death was folded into Manage medical, 0282; Manage shop page, 0285, makes forty; add_while_recording retired, 0287, makes thirty-nine again; Propose a Thai label, 0296, makes forty; See the Thai queue, 0298, makes forty-one); cards.ts has ${CARD_KEYS.length}`);
else if (!failed) console.log("ok   cards.ts has the fifty-nine agreed cards, all naming real activities (this is THE card count; sync-home-icons.mjs counts pages, which differ: one icon per page, shared by several cards, plus registry pages no card opens)");

await exitWith(failed ? 1 : 0);
