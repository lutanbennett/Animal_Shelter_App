#!/usr/bin/env node
// Lists, for the release about to be cut, every PR whose test plan answered the release-notes
// line `n/a:` — so the cutter sees which notes may now be owed, whether or not `unreleased` is
// empty. docs/release-procedure.md step 4; docs/decisions/2026-10-28-release-note-guard.md.
//
//   node scripts/check-deferred-notes.mjs [--since <ref>] [--head <ref>] [--self-test]
//
// Range: the last "Cut x.y.z" commit (or --since) up to --head (default HEAD). Prints; exits 0.
// It cannot know whether a step has closed, so it only shows. cut-release.mjs is what refuses.
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scanPlans, short, releaseNoteAnswer } from "./lib/deferred-notes.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const git = (...a) => execFileSync("git", ["-C", repo, ...a], { encoding: "utf8", maxBuffer: 64 << 20 });

export function lastCut() {
  const out = git("log", "-1", "--format=%H", "-E", "--grep=^Cut [0-9]+\.[0-9]+\.[0-9]+").trim();
  if (!out) throw new Error("no earlier \"Cut x.y.z\" commit found; pass --since <ref>");
  return out;
}

export function scanRange(since, head = "HEAD") {
  const files = git("diff", "--name-only", "--diff-filter=AM", `${since}..${head}`, "--", "docs/test-plans")
    .split("\n").map((s) => s.trim()).filter((f) => f.endsWith(".md"));
  const plans = files.map((file) => ({ file, text: git("show", `${head}:${file}`) }));
  return { files: files.length, ...scanPlans(plans) };
}

export function report({ files, candidates, others }, since) {
  const L = [`Release-notes line answered n/a, ${since.slice(0, 8)}..HEAD (${files} test plans changed):`, ""];
  L.push(candidates.length
    ? `MAY OWE A NOTE — the reason points at a step still to happen (${candidates.length}). For each, is the step closed by this release? If so its note is owed here:`
    : "May owe a note: none.");
  for (const c of candidates) L.push(`  - ${c.file}\n      ${short(c.reason)}`);
  L.push("", `Other n/a answers (${others.length}), for a skim:`);
  for (const o of others) L.push(`  - ${o.file.replace("docs/test-plans/", "")}: ${short(o.reason, 110)}`);
  return L.join("\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const argv = process.argv.slice(2);
  const opt = (n) => { const i = argv.indexOf(`--${n}`); return i < 0 ? null : argv[i + 1]; };
  if (argv.includes("--self-test")) {
    let bad = 0;
    const t = (name, ok) => { if (!ok) bad++; console.log(`${ok ? "ok  " : "FAIL"} ${name}`); };
    const line = (rest) => `- [ ] **Release notes.** ${rest}`;
    t("a ticked template line is not an n/a", releaseNoteAnswer("- [x] **Release notes.** Would a shelter user notice? If not, `n/a: <why nobody would notice>`: a refactor") === null);
    const d = releaseNoteAnswer(line("n/a: `0276` is not on production yet; the note goes in the PR that applies it"));
    t("a reason naming an open step is a candidate", d?.deferred === true);
    const o = releaseNoteAnswer(line("n/a: developer tooling only, no user-visible surface"));
    t("a plain tooling reason is not a candidate, but is listed", o && o.deferred === false);
    t("the dash-after-label form is read", releaseNoteAnswer(line("— n/a: a dependency bump, no shelter user sees it"))?.reason.startsWith("a dependency"));
    t("a plan with no such line yields nothing", releaseNoteAnswer("# plan\n- [x] other") === null);
    const s = scanPlans([{ file: "docs/test-plans/cut-release-1.md", text: line("n/a: until the deploy") }, { file: "docs/test-plans/a.md", text: line("n/a: until the deploy") }]);
    t("a cut's own plan is skipped", s.candidates.length === 1 && s.candidates[0].file.endsWith("a.md"));
    process.exit(bad ? 1 : 0);
  }
  const since = opt("since") ?? lastCut();
  console.log(report(scanRange(since, opt("head") ?? "HEAD"), since));
}
