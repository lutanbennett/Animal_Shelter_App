// Loads the card catalogue (cards.ts, catalogue.ts, English dictionary) into plain node, for the card walkthrough
// scripts. The .ts files import "./jobs" and "@/…" without extensions, as Next allows; plain node needs a resolver hook
// (the same one check-cards-count.mjs and check-card-grants.mjs register).
import { join } from "node:path";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

export async function loadCards(root = process.cwd()) {
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
  const at = (p) => import(pathToFileURL(join(root, p)).href);
  const cards = await at("src/lib/permissions/cards.ts");
  const catalogue = await at("src/lib/permissions/catalogue.ts");
  const en = (await at("src/lib/i18n/dictionaries/en.ts")).default;
  return { ...cards, ACTIVITIES: catalogue.ACTIVITIES, en };
}
