#!/usr/bin/env node
/**
 * A commit on the `backlog` branch must NAME every backlog item it changes.
 *
 * WHY: the backlog worktree is the one place any session may edit at any time,
 * so two sessions hold uncommitted edits to the SAME file (docs/backlog.md) at
 * once. Whichever commits first carries both sets of changes under a message
 * that describes only its own: `d2498e87` and `afcadff7` (2026-11-09). Refusing
 * `-a` cannot catch that — the branch only ever touches one file, so a path-
 * limited commit sweeps the same bytes — and git gives a hook no view of whose
 * edit a hunk is. What the hook CAN see is which items the staged diff touches
 * and what the message says. A sweep is exactly the case where the diff touches
 * an item the message never mentions.
 *
 * Usage (commit-msg hook): check-backlog-commit-names.mjs <message-file>
 * Exit 0 ok / not applicable, 1 crash (hook fails open), 3 refusal.
 * Escape for a deliberate bulk edit: BACKLOG_COMMIT_ALLOW_UNNAMED=1.
 * Decision: docs/decisions/2026-11-09-backlog-commit-names-items.md
 */
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const FILE = "docs/backlog.md";
const run = (c) => execSync(c, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });

try {
  const msgFile = process.argv[2];
  if (!msgFile) throw new Error("no message file given");
  let branch = "";
  try { branch = run("git symbolic-ref --short -q HEAD").trim(); } catch {}
  if (branch !== "backlog") process.exit(0);
  if (process.env.BACKLOG_COMMIT_ALLOW_UNNAMED === "1") process.exit(0);
  const gitDir = run("git rev-parse --git-dir").trim();
  if (existsSync(`${gitDir}/MERGE_HEAD`)) process.exit(0);

  const diff = run(`git diff --cached -U0 --no-renames -- ${FILE}`);
  if (!diff.trim()) process.exit(0);

  // owner[i] = id of the item that line i (1-based) belongs to, or null.
  const owners = (text) => {
    const out = [null];
    let cur = null;
    for (const raw of text.split("\n")) {
      const line = raw.replace(/\r$/, "");
      if (/^#{1,6} /.test(line)) cur = null;
      else {
        const m = /^- \[[ x]\] (?:<!--#([a-z0-9]{5})--> )?/.exec(line);
        if (m) cur = m[1] ?? null;
      }
      out.push(cur);
    }
    return out;
  };
  const oldOwn = owners(run(`git show HEAD:${FILE}`));
  const newOwn = owners(run(`git show :${FILE}`));

  const changed = new Set();
  let o = 0, n = 0;
  for (const line of diff.split("\n")) {
    const h = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (h) { o = +h[1]; n = +h[2]; continue; }
    if (line.startsWith("---") || line.startsWith("+++")) continue;
    if (line.startsWith("-")) { if (oldOwn[o]) changed.add(oldOwn[o]); o++; }
    else if (line.startsWith("+")) { if (newOwn[n]) changed.add(newOwn[n]); n++; }
  }

  const msg = readFileSync(msgFile, "utf8").split("\n").filter((l) => !/^# /.test(l) && l !== "#").join("\n");
  const named = new Set([...msg.matchAll(/#([a-z0-9]{5})\b/g)].map((m) => m[1]));
  const unnamed = [...changed].filter((id) => !named.has(id));
  if (!unnamed.length) process.exit(0);

  console.error("commit-msg: refused. This commit changes backlog items its message does not name:");
  for (const id of unnamed) console.error(`  #${id}`);
  console.error("The backlog worktree is shared. If those edits are yours, name them in the message (e.g. \"Backlog: tick #abcde\").");
  console.error("If they are NOT yours, another session's uncommitted edit is in the file: stage only your own hunks (git add -p docs/backlog.md),");
  console.error("or commit it as a separate commit. For a deliberate bulk edit: BACKLOG_COMMIT_ALLOW_UNNAMED=1 git commit ...");
  process.exit(3);
} catch (err) {
  console.error(`check-backlog-commit-names: ${err.message}`);
  process.exit(1);
}
