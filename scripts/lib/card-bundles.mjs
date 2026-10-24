// What each card requires, read from src/lib/permissions/cards.ts at load. The database holds no copy of a bundle
// (that is the fault role-cards-coverage looks for), so a check that must ask "does this role's access cover its
// cards" carries the expected grants into its SQL as a literal built here.
//
// TEMPORARY SHAPE: claude/cards-grants-schema adds a card_grants table; once it is applied the checks should join
// that table and this file goes (docs/decisions/2026-10-24-role-cards-coverage-check.md).
//
// Nothing here reaches the database or argv: the literal is built only from cards.ts, and every value is a card key,
// an activity key (both [a-z0-9_.]) and 1 or 2, which is re-checked below before it can enter SQL.
import { readFileSync } from "node:fs";
import ts from "typescript";

const root = new URL("../../src/lib/permissions/", import.meta.url);

function load(file, requires) {
  const out = ts.transpileModule(readFileSync(new URL(file, root), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  new Function("module", "exports", "require", out)(mod, mod.exports, (id) => {
    if (id in requires) return requires[id];
    throw new Error(`cards.ts imports ${id}, which card-bundles.mjs does not know how to load`);
  });
  return mod.exports;
}

const jobs = load("jobs.ts", {});
const cards = load("cards.ts", { "./jobs": jobs });

/** [{card, activity, level}] with every card's own bundle plus the cards it includes; level 1 read, 2 edit/yes. */
export function expectedGrants() {
  const rows = [];
  for (const key of Object.keys(cards.CARDS)) {
    const union = cards.bundleOfCards([key]);
    for (const [activity, level] of union) rows.push({ card: key, activity, level: level === "edit" ? 2 : 1 });
  }
  return rows;
}

/** The grants as a SQL `values` list. Throws on anything that is not a plain key, so no text from elsewhere can ride in. */
export function expectedGrantsSql() {
  const rows = expectedGrants();
  for (const r of rows) {
    if (!/^[a-z][a-z0-9_]*$/.test(r.card) || !/^[a-z][a-z0-9_.]*$/.test(r.activity) || ![1, 2].includes(r.level)) {
      throw new Error(`card-bundles: refusing to put ${JSON.stringify(r)} into SQL`);
    }
  }
  return rows.map((r) => `('${r.card}','${r.activity}',${r.level})`).join(",");
}
