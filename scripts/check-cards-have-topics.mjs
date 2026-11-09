// Does any card open no manual topic? (Lutan, 2026-11-09: the Volunteer manual had no Reels topic, and 15 of 56 cards
// opened nothing at all.) This is the reverse of scripts/acceptance-matrix.mjs, which fails when a topic names an
// activity no card grants. A card is "opened" by a topic when cardsOfTopic() lists it, so a topic that names the
// card's activity, or names the card, covers it. A topic tagged `everyone` or left `unassigned` opens no card.
//
// A card may be left without a topic only by a dated record in docs/cards-without-topic.json that says why it needs
// none. A record for a card that has since gained a topic, or no longer exists, fails too, so the file cannot rot.
// The check names cards only: it asks nothing about roles. Reads files only; needs no database. Run in `npm run lint`.
//
//   node scripts/check-cards-have-topics.mjs
import { readFileSync } from "node:fs";
import path from "node:path";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

const repo = process.cwd();
const load = (p) => import(pathToFileURL(path.join(repo, p)).href);
const srcUrl = pathToFileURL(path.join(repo, "src") + "/").href;
register(
  "data:text/javascript," +
    encodeURIComponent(`
      export async function resolve(spec, ctx, next) {
        if (spec.startsWith("@/")) return next(${JSON.stringify(srcUrl)} + spec.slice(2) + ".ts", ctx);
        if (spec.startsWith(".") && !/\\.[a-z]+$/.test(spec)) return next(spec + ".ts", ctx);
        return next(spec, ctx);
      }`),
);
const { default: manual } = await load("src/lib/manual/en.ts");
const { cardsOfTopic } = await load("src/lib/manual/for-topic.ts");
const { CARD_KEYS } = await load("src/lib/permissions/cards.ts");

const opened = new Map(CARD_KEYS.map((k) => [k, []]));
for (const section of manual.sections) {
  for (const topic of section.topics) {
    const own = cardsOfTopic(topic);
    if (own.kind === "cards") for (const k of own.cards) opened.get(k)?.push(topic.id);
  }
}

const records = JSON.parse(readFileSync(path.join(repo, "docs/cards-without-topic.json"), "utf8")).cards ?? {};
const problems = [];
const noTopic = [];
for (const [card, topics] of opened) {
  if (topics.length) continue;
  const rec = records[card];
  if (!rec) problems.push(`${card}: opens no manual topic and has no record saying why it needs none.`);
  else if (!rec.date || !rec.reason?.trim()) problems.push(`${card}: its record in docs/cards-without-topic.json needs a date and a reason.`);
  else noTopic.push(card);
}
for (const card of Object.keys(records)) {
  if (!opened.has(card)) problems.push(`docs/cards-without-topic.json records "${card}", which is not a card. Delete the record.`);
  else if (opened.get(card).length) problems.push(`docs/cards-without-topic.json records "${card}", but ${opened.get(card).join(", ")} now opens it. Delete the record.`);
}

if (problems.length) {
  console.log(`NOT CLEAN: ${problems.length} card${problems.length === 1 ? "" : "s"} to put right.\n`);
  for (const p of problems) console.log(`  ${p}`);
  console.log(`\nWrite a topic for the card's activity in src/lib/manual/en.ts, or record in docs/cards-without-topic.json why it needs none.`);
  process.exit(1);
}
console.log(`every card opens a manual topic (${CARD_KEYS.length - noTopic.length} of ${CARD_KEYS.length}); ${noTopic.length} recorded as needing none`);
