#!/usr/bin/env node
// exit-ok: every child process is a *Sync call and nothing opens a socket, so no handle is open at process.exit
// Lists, for the release about to be cut, every PR whose test plan answered the release-notes
// line `n/a:` — so the cutter sees which notes may now be owed, whether or not `unreleased` is
// empty. docs/release-procedure.md step 4; docs/decisions/2026-10-28-release-note-guard.md.
//
//   node scripts/check-deferred-notes.mjs [--since <ref>] [--head <ref>] [--self-test]
//
// Range: the commit that added the newest release in src/lib/releases.ts (or --since) up to --head
// (default HEAD). Prints; exits 0. Not the last "Cut x.y.z" commit by message: 0.49.1's was worded
// "Cut release 0.49.1", so the grep skipped it (docs/decisions/2026-11-26-instrument-accuracy.md).
// It cannot know whether a step has closed, so it only shows. cut-release.mjs is what refuses.
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scanPlans, short, releaseNoteAnswer } from "./lib/deferred-notes.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const git = (...a) => execFileSync("git", ["-C", repo, ...a], { encoding: "utf8", maxBuffer: 64 << 20 });

/** The commit that added the newest release recorded in src/lib/releases.ts at `head`. */
export function lastCut(head = "HEAD") {
  const src = git("show", `${head}:src/lib/releases.ts`);
  const v = /\bversion:\s*"(\d+\.\d+\.\d+)"/.exec(src)?.[1];
  if (!v) throw new Error("no release found in src/lib/releases.ts; pass --since <ref>");
  const out = git("log", "-1", "--format=%H", "-S", `version: "${v}"`, head, "--", "src/lib/releases.ts").trim();
  if (!out) throw new Error(`no commit adds release ${v} to src/lib/releases.ts; pass --since <ref>`);
  return out;
}

export function scanRange(since, head = "HEAD") {
  const files = git("diff", "--name-only", "--diff-filter=AM", `${since}..${head}`, "--", "docs/test-plans")
    .split("\n").map((s) => s.trim()).filter((f) => f.endsWith(".md"));
  const plans = files.map((file) => ({ file, text: git("show", `${head}:${file}`) }));
  return { files: files.length, ...scanPlans(plans) };
}

export function report({ files, candidates, others }, since, head = "HEAD") {
  const L = [`Release-notes line answered n/a, ${since.slice(0, 8)}..${head} (${files} test plans changed):`, ""];
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
    // 0.49.2's two false positives: a ticked line whose template prose says "every `n/a` was right…".
    const prose = "Answering only for shelter users is how `0.47.5` shipped: every `n/a` was right about shelter users and wrong about Admin. A change only Admin sees gets a note too, written `{ text: \"…\", admin: true }`. If not, `n/a: <why nobody would notice>`: a refactor. Write `n/a: <the outstanding step>` and put the note in the PR that closes the step";
    t("a ticked line with the template's admin prose is not an n/a", releaseNoteAnswer(`- [x] **Release notes.** ${prose}`) === null);
    t("an unticked line reads the answer, not the template's prose", releaseNoteAnswer(line(`${prose} n/a: developer tooling only`))?.reason === "developer tooling only");
    t("an unticked line with only template prose yields nothing", releaseNoteAnswer(line(prose)) === null);
    t("the range starts at the newest release's cut commit", /^[0-9a-f]{40}$/.test(lastCut()));
    process.exit(bad ? 1 : 0);
  }
  const head = opt("head") ?? "HEAD";
  const since = opt("since") ?? lastCut(head);
  console.log(report(scanRange(since, head), since, head));
}
