#!/usr/bin/env node
/**
 * Give every backlog item a permanent id, and never change one that exists.
 *
 * WHY: an item's identity used to be its TITLE — the page derived an anchor by
 * slugifying it, and the Customer priorities panel stored those anchors as
 * Lutan's picks. But this project rewrites titles constantly by rule (a title
 * must say what is still open, read alone), so every grooming round detached
 * his priorities from the items they pointed at. On 2026-11-03 seven of his
 * nine picks came loose in a single day's grooming. Two items also collided on
 * the same 60-character slug, and the second silently lost its star.
 *
 * An id is five base36 characters in an HTML comment, which GitHub and every
 * markdown reader render as nothing:
 *
 *   - [ ] <!--#a7f3k--> **THE TITLE** the body…
 *
 * It sits AFTER the checkbox and BEFORE the `**`, so everything that reads this
 * file keeps working untouched: `check-backlog-sections.mjs` tests the `- [ ] `
 * prefix and reads the title from `**…**`, and `check-stale-titles.mjs` does
 * the same. Both were checked, not assumed.
 *
 * Ids are RANDOM, not sequential: the backlog branch is committed to by several
 * sessions at once, and two of them picking "the next number" would collide.
 *
 * Run: node .local/backlog-ids.mjs <path to backlog.md> [--dry-run]
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILE = process.argv[2];
const DRY = process.argv.includes("--dry-run");
if (!FILE) {
  console.error("usage: node backlog-ids.mjs <path to backlog.md> [--dry-run]");
  process.exit(2);
}

const ID_RE = /<!--#([a-z0-9]{5})-->/;
// `[\s\S]` rather than `.`, because a lone CR inside an item line is not
// hypothetical: one sat mid-sentence in a completed item on 2026-11-03 and a
// `.`-based pattern skipped that item silently — exactly the class of quiet
// miss this whole change exists to stop. Such a line is reported below.
const ITEM_RE = /^(- \[[ x]\] )([\s\S]*)$/;

const text = readFileSync(FILE, "utf8");
const lines = text.split("\n");

// Every id already in the file, so a re-run never reissues one and an id is
// never reused after an item is deleted.
const used = new Set();
for (const l of lines) {
  const m = l.match(ID_RE);
  if (m) used.add(m[1]);
}
const before = used.size;

function mint() {
  for (;;) {
    const id = Math.random().toString(36).slice(2, 7).padEnd(5, "0");
    if (/^[a-z0-9]{5}$/.test(id) && !used.has(id)) {
      used.add(id);
      return id;
    }
  }
}

let added = 0;
let items = 0;
const out = lines.map((l) => {
  const m = l.match(ITEM_RE);
  if (!m) return l;
  items++;
  if (ID_RE.test(l)) return l;
  added++;
  return `${m[1]}<!--#${mint()}--> ${m[2]}`;
});

if (added && !DRY) writeFileSync(FILE, out.join("\n"));

// Counting the checkboxes before and after is the proof that this only ever
// inserts a comment: a line that stopped being an item would show up here.
const openBefore = lines.filter((l) => l.startsWith("- [ ] ")).length;
const openAfter = out.filter((l) => l.startsWith("- [ ] ")).length;
const doneBefore = lines.filter((l) => l.startsWith("- [x] ")).length;
const doneAfter = out.filter((l) => l.startsWith("- [x] ")).length;
if (openBefore !== openAfter || doneBefore !== doneAfter) {
  console.error(
    `REFUSED: item counts changed (open ${openBefore}->${openAfter}, done ${doneBefore}->${doneAfter})`
  );
  process.exit(1);
}

console.log(
  `${FILE}: ${items} items, ${before} already had an id, ${added} ${DRY ? "would be" : "were"} given one` +
    ` — ${used.size} ids, all unique. Open ${openAfter}, done ${doneAfter}, unchanged.`
);

// Reported, never silently repaired: a control character in the middle of a
// line is a defect in the file, and whoever put it there should see it.
const BAD = new Set([13, 11, 12, 133, 8232, 8233]);
// A line read from a CRLF file keeps a trailing CR. That is the file's line
// ending, not a defect; only a control character INSIDE the line is one.
const CR = String.fromCharCode(13);
const body = (l) => (l.endsWith(CR) ? l.slice(0, -1) : l);
const hasStray = (l) => [...body(l)].some((c) => BAD.has(c.charCodeAt(0)));
const stray = out.map((l, i) => (hasStray(l) ? i + 1 : 0)).filter(Boolean);
if (stray.length) {
  console.log(
    `NOTE: a stray control character sits inside ${stray.length} line(s): ${stray.join(", ")}. ` +
      `They are read correctly here, but a pattern built on a dot will skip them.`
  );
}
