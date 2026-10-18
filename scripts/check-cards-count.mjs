// The code half of check-cards-schema.mjs, with no database: cards.ts has exactly the twenty-three agreed cards, every
// card's bundle names an activity the catalogue has, and every card it includes is a card. check-cards-schema.mjs needs the
// dev token, so CI cannot run it and nobody learns the set has drifted; this reads only cards.ts and catalogue.ts.
// The same assertion stays, unrelaxed, in check-cards-schema.mjs (docs/decisions/2026-10-16-cards-count-in-ci.md).
//
//   node scripts/check-cards-count.mjs
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
if (CARD_KEYS.length !== 23) fail(`the agreed set is twenty-three cards; cards.ts has ${CARD_KEYS.length}`);
else if (!failed) console.log("ok   cards.ts has the twenty-three agreed cards, all naming real activities");

process.exit(failed ? 1 : 0);
