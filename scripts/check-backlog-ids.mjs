#!/usr/bin/env node
/**
 * Every backlog item carries a permanent, unique id.
 *
 * WHY THIS IS A CHECK AND NOT A CONVENTION: an item's identity used to be its
 * TITLE. The backlog page derived each anchor by slugifying the title, and the
 * Customer priorities panel stored those anchors as Lutan's picks — so every
 * grooming round, whose whole job is rewriting titles, silently detached the
 * priorities from the items they named. On 2026-11-03 seven of his nine picks
 * came loose in a single day. Two items had also been retitled to the same
 * opening words, collided on the same 60-character slug, and the second
 * silently lost its star and could not be picked at all.
 *
 * Ids fixed that (`- [ ] <!--#a7f3k--> **TITLE**`). This check is what stops it
 * coming back one item at a time: an item filed without an id falls back to the
 * old title-derived anchor, works perfectly, and is fragile again — which is
 * exactly the kind of quiet regression nobody notices until a priority
 * disappears weeks later.
 *
 * `node scripts/backlog-ids.mjs docs/backlog.md` fixes every failure this
 * reports, and never changes an id that already exists.
 *
 * Exit 0 clean, 1 on a crash, 3 on a real finding (the shape the pre-commit
 * hook reads, matching check-backlog-sections.mjs).
 */
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const STAGED = process.argv.includes("--staged");
const FILE = process.argv.find((a) => a.endsWith(".md")) ?? "docs/backlog.md";

let text;
try {
  // --staged reads what is about to be committed, not the working tree, so the
  // hook cannot pass on a file the commit does not contain.
  text = STAGED
    ? execSync(`git show :${FILE}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
    : readFileSync(FILE, "utf8");
} catch (err) {
  console.error(`check-backlog-ids: could not read ${FILE} — ${err.message}`);
  process.exit(1);
}

// `[\s\S]` and not `.`: a lone CR inside an item line made one item invisible
// to a dot-based pattern on 2026-11-03, which is how that stray byte was found.
const ITEM = /^- \[[ x]\] (?:<!--#([a-z0-9]{5})--> )?([\s\S]*)$/;

const missing = [];
const seen = new Map();
const duplicate = [];
let items = 0;

text.split("\n").forEach((raw, i) => {
  const line = raw.replace(/\r$/, "");
  const m = line.match(ITEM);
  if (!m) return;
  items++;
  const [, id, rest] = m;
  if (!id) {
    missing.push({ line: i + 1, text: rest.slice(0, 70) });
    return;
  }
  if (seen.has(id)) duplicate.push({ line: i + 1, id, first: seen.get(id) });
  else seen.set(id, i + 1);
});

if (!items) {
  console.error(`check-backlog-ids: no items found in ${FILE} — that cannot be right`);
  process.exit(1);
}

const problems = [];
for (const m of missing) problems.push(`line ${m.line}: no id — ${m.text}`);
for (const d of duplicate) problems.push(`line ${d.line}: id ${d.id} is already used on line ${d.first}`);

if (problems.length) {
  console.error(`check-backlog-ids: ${problems.length} problem(s) in ${FILE}\n`);
  for (const p of problems.slice(0, 20)) console.error(`  ${p}`);
  if (problems.length > 20) console.error(`  … and ${problems.length - 20} more`);
  console.error(
    `\nEvery backlog item carries a permanent id so that renaming it does not detach` +
      `\nLutan's Customer priorities from it. Fix them all with:` +
      `\n\n  node scripts/backlog-ids.mjs ${FILE}\n`
  );
  process.exit(3);
}

console.log(`check-backlog-ids: ok — ${items} items, ${seen.size} ids, all present and unique`);
