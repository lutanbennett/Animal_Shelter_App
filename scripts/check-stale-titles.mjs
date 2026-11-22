#!/usr/bin/env node
/**
 * An open backlog item whose body records an answer while its title still says
 * a decision is pending is almost certainly stale. Anything that skims the
 * backlog reads the title, so a false "waiting" parks buildable work silently
 * (assistant-retention sat blocked nine days that way, 2026-10-10 to 10-19).
 *
 * A HEURISTIC, not a gate: the 2026-10-19 scan had three false positives out
 * of six hits. It always exits 0 and prints candidates for a person to read.
 * `/plan-day` runs it; it is deliberately not in CI (a check that cries wolf
 * gets filtered out).
 *
 *   node scripts/check-stale-titles.mjs [path-to-backlog.md]
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const file = process.argv[2] ?? fileURLToPath(new URL("../docs/backlog.md", import.meta.url));
const lines = readFileSync(file, "utf8").split(/\r?\n/);
const end = lines.findIndex((l) => /^## Completed\s*$/.test(l));
const open = end === -1 ? lines : lines.slice(0, end);

const ANSWERED = /\b(ANSWERED|DECIDED|CONFIRMED)\b/;
const PENDING = /decide|decision first|settle|waiting/i;

let hits = 0;
open.forEach((l, i) => {
  if (!l.startsWith("- [ ]")) return;
  const title = (l.match(/\*\*(.+?)\*\*/) ?? [, l.slice(6, 120)])[1];
  if (ANSWERED.test(l) && PENDING.test(title)) {
    hits++;
    console.log(`line ${i + 1}: ${title.slice(0, 110)}`);
  }
});
// Second listing (#tg5vh): items in the "built, proof owed" middle state. Lists
// only; it never asserts an item is done, because that error costs more.
const MARKED = [];
const UNMARKED = [];
open.forEach((l, i) => {
  if (!l.startsWith("- [ ]")) return;
  const title = (l.match(/\*\*(.+?)\*\*/) ?? [, l.slice(6, 120)])[1];
  if (/^PROOF OWED:/.test(title)) MARKED.push(`line ${i + 1}: ${title.slice(0, 110)}`);
  else if (/ONLY A HUMAN PRESS REMAINS|PRESS REMAINS|ONLY A PRESS/i.test(l))
    UNMARKED.push(`line ${i + 1}: ${title.slice(0, 110)}`);
});
console.log(`
PROOF OWED (built, a person's proof left): ${MARKED.length}`);
MARKED.forEach((m) => console.log("  " + m));
if (UNMARKED.length) {
  console.log(`Body says a press remains but the title is not marked (read it; add the prefix if the code is right): ${UNMARKED.length}`);
  UNMARKED.forEach((m) => console.log("  " + m));
}
console.log(
  hits
    ? `\n${hits} possibly stale title(s). Read each: if the answer is in the body, rewrite the title (CLAUDE.md, "Answering a decision").`
    : "No open item pairs an answer in its body with a pending title.",
);
