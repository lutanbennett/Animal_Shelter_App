#!/usr/bin/env node
// exit-ok: every child process is a *Sync call and nothing opens a socket, so no handle is open at process.exit
/**
 * An OPEN backlog item's title must stay readable: short, and free of its own history.
 *
 * WHY: Lutan twice said he could not read what an item was about. Nothing measured titles,
 * so each grooming round appended what had just been done and they grew (#b4cmn reached 854
 * characters on 2026-11-17). History belongs in the item's body, marked `SUPERSEDED` there.
 *
 * Scope, and the two false positives it must not produce:
 *  - OPEN items only (`- [ ]`). A ticked item's title legitimately opens `DONE <date>` and
 *    carries `WAS:`; that is the record of what closed.
 *  - The TITLE only: the first `**...**` pair on the line. `SUPERSEDED` in a body is required
 *    by the backlog's answering-a-decision rule.
 *
 * Fails: a title over MAX characters, or containing `WAS:` or `SUPERSEDED`.
 * Exit 0 clean, 1 on a crash, 3 on a real finding (what .githooks/pre-commit reads).
 * CANNOT catch: whether a title is comprehensible. It measures length and two words, a proxy.
 */
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const MAX = 320;
const STAGED = process.argv.includes("--staged");
const FILE = process.argv.find((a) => a.endsWith(".md")) ?? "docs/backlog.md";

let text;
try {
  text = STAGED
    ? execSync(`git show :${FILE}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
    : readFileSync(FILE, "utf8");
} catch (err) {
  console.error(`check-backlog-titles: could not read ${FILE} — ${err.message}`);
  process.exit(1);
}

const OPEN = /^- \[ \] (?:<!--#([a-z0-9]{5})--> )?\*\*([\s\S]*?)\*\*/;
const problems = [];
let open = 0;

text.split("\n").forEach((raw, i) => {
  const m = raw.replace(/\r$/, "").match(OPEN);
  if (!m) return;
  open++;
  const [, id, title] = m;
  const who = `line ${i + 1}${id ? ` (#${id})` : ""}`;
  if (title.length > MAX) problems.push(`${who}: title is ${title.length} characters, limit ${MAX}`);
  if (/WAS:|SUPERSEDED/.test(title)) problems.push(`${who}: title carries its own history (WAS:/SUPERSEDED) — move it to the body`);
});

if (!open) {
  console.error(`check-backlog-titles: no open items found in ${FILE} — that cannot be right`);
  process.exit(1);
}

if (problems.length) {
  console.error(`check-backlog-titles: ${problems.length} problem(s) in ${FILE}\n`);
  for (const p of problems.slice(0, 20)) console.error(`  ${p}`);
  console.error(
    `\nA title says what is still open and nothing else. What was decided or done goes in` +
      `\nthe body, with the superseded passage marked in place.\n`
  );
  process.exit(3);
}

console.log(`check-backlog-titles: ok — ${open} open items, every title within ${MAX} characters and free of history`);
