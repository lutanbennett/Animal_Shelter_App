#!/usr/bin/env node
/**
 * An unticked item filed below `## Completed` is invisible.
 *
 * Every session reads the backlog the same way — open items are the `- [ ]`
 * lines *above* the `## Completed` heading — so an item that lands below it is
 * not deprioritised, it is gone. Nothing errors, nothing looks wrong, and the
 * item simply never gets scheduled again.
 *
 * Four escaped this way in two days (2026-10-03 and 2026-10-04), including a
 * quick win that had been passed over once and was then assumed dropped, and a
 * live breakage on the Pi. Each was found by someone happening to look. This is
 * that look, done by CI instead.
 *
 * What it does NOT check, deliberately: a ticked item *above* the heading.
 * 133 of them live there, because items are ticked in place in their own
 * section and only some are ever moved down. That is the house style, not a
 * fault, and a check that failed on it would be wrong 133 times.
 *
 *   node scripts/check-backlog-sections.mjs [path-to-backlog.md]
 */
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";

// An explicit path is for exercising the failure modes (see the test plan);
// `npm run lint` calls it with none.
const file = process.argv[2] ?? fileURLToPath(new URL("../docs/backlog.md", import.meta.url));
const lines = readFileSync(file, "utf8").split(/\r?\n/);

const problems = [];

// The heading the whole convention turns on. Without exactly one, the question
// "is this item above or below it?" has no answer, so say that rather than
// guessing at the first match.
const headings = lines.reduce((a, l, i) => (/^## Completed\s*$/.test(l) ? [...a, i] : a), []);
if (headings.length !== 1) {
  problems.push(
    headings.length === 0
      ? "no `## Completed` heading — every item reads as open, and nothing can be filed as done"
      : `${headings.length} \`## Completed\` headings (lines ${headings.map((i) => i + 1).join(", ")}) — ` +
        "which one divides open from done is then a guess",
  );
}

if (headings.length === 1) {
  const completedAt = headings[0];

  // The section an item is sitting in, for a message that says where it went
  // rather than only that it is wrong.
  const sectionAt = (i) => {
    for (let j = i; j >= 0; j--) if (/^## /.test(lines[j])) return lines[j].replace(/^## /, "");
    return "(before the first heading)";
  };

  const title = (l) => {
    const m = l.match(/\*\*(.+?)\*\*/);
    return m ? m[1] : l.replace(/^\s*- \[ \]\s*/, "").slice(0, 80);
  };

  for (let i = completedAt + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^- \[ \] /.test(l)) {
      problems.push(
        `line ${i + 1}: open item below \`## Completed\`, so nothing will ever read it — ` +
          `"${title(l)}". Move it up into the section it belongs to, text unchanged.`,
      );
    } else if (/^\s+- \[ \] /.test(l)) {
      // A sub-item under a parent that has been ticked and moved down. Less
      // clear-cut than a top-level one — the parent may genuinely be finished
      // with loose ends — but it is just as unreadable, so it is worth saying.
      problems.push(
        `line ${i + 1}: open sub-item below \`## Completed\`, under a finished parent in ` +
          `"${sectionAt(i)}" — "${title(l)}". Either it is done too, or it belongs above as its own item.`,
      );
    }
  }
}

// A typo in the box is the same failure wearing a different hat: `- [X]`,
// `- []` and `- [  ]` all read as neither open nor done to anything matching
// the two exact forms.
lines.forEach((l, i) => {
  if (/^\s*- \[/.test(l) && !/^\s*- \[[ x]\] /.test(l)) {
    problems.push(`line ${i + 1}: checkbox is neither \`- [ ]\` nor \`- [x]\` — ${l.trim().slice(0, 60)}`);
  }
});

if (problems.length) {
  console.error(`check-backlog-sections: ${problems.length} problem(s) in ${relative(process.cwd(), file) || file}\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error(
    "\nThe convention: open items are the `- [ ]` lines above `## Completed`. " +
      "Anything below it is invisible to every session and to /plan-day.",
  );
  process.exit(1);
}

const open = lines.slice(0, lines.findIndex((l) => /^## Completed\s*$/.test(l))).filter((l) => /^- \[ \] /.test(l)).length;
console.log(`check-backlog-sections: ok — ${open} open items, all above \`## Completed\``);
