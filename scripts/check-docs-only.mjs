// Is this pull request's diff documents only? CI asks once, and the heavy jobs
// skip when the answer is yes.
//
//   node scripts/check-docs-only.mjs --base origin/main
//
// Why this exists. Until 0.38.0 every one of CI's eight jobs ran on every pull
// request, including one that changed two markdown files. That release's record
// PR paid ~7 minutes of CI for a documents diff and was then blocked *twice* by
// `public-views`, a check it could not possibly affect: first by a three-minute
// race (a view was live in shared dev before the branch proving who owned it was
// pushed), then by a stale allow-list once that branch merged and this one was 23
// commits behind. Neither failure was in anything the PR changed.
// docs/decisions/2026-10-20-release-paperwork-speedup.md
//
// A markdown file under docs/, or a markdown file at the repository root, cannot
// break a typecheck, a lint, a build, the card count, the script parse or the
// public tier. Nothing in src/, scripts/ or worker/ imports one.
//
// `test-plan` is deliberately NOT gated on this: a documents PR still carries a
// checklist, and that is the one check whose whole job is to judge a document.
//
// The rule errs towards running everything. Anything this cannot classify — no
// base, git failing, a path it does not recognise — counts as code. A false
// "docs-only" would skip real checks on real code, so the only safe direction to
// guess in is "run them".

import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

/** A path that no build, lint, test or database check can be affected by. */
export function isDocPath(path) {
  if (path.startsWith("docs/")) return true;
  // Root-level markdown only: README.md, CLAUDE.md, AGENTS.md. A nested one
  // (src/foo/notes.md) is left as code, because it may be imported as content.
  return /^[^/]+\.md$/.test(path);
}

/**
 * @returns {{ docsOnly: boolean, reason: string, paths: string[] }}
 */
export function classify(paths) {
  if (paths.length === 0) {
    return { docsOnly: false, reason: "no changed files could be read", paths };
  }
  const code = paths.filter((p) => !isDocPath(p));
  if (code.length > 0) {
    return { docsOnly: false, reason: `${code.length} non-document path(s)`, paths: code };
  }
  return { docsOnly: true, reason: `${paths.length} path(s), all documents`, paths };
}

function changedFiles(base) {
  // Against the merge base, never against the moving tip: comparing a two-file
  // docs branch to a moved origin/main shows someone else's feature as well
  // (docs/release-procedure.md, "main moves under you").
  const mergeBase = execFileSync("git", ["merge-base", "HEAD", base], { encoding: "utf8" }).trim();
  return execFileSync("git", ["diff", "--name-only", `${mergeBase}..HEAD`], { encoding: "utf8" })
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function main() {
  const argv = process.argv.slice(2);
  const baseArg = argv.indexOf("--base");
  const base = baseArg === -1 ? null : argv[baseArg + 1];

  let result;
  if (!base) {
    result = { docsOnly: false, reason: "no --base given (a push to main, or run by hand)", paths: [] };
  } else {
    try {
      result = classify(changedFiles(base));
    } catch (err) {
      result = { docsOnly: false, reason: `could not read the diff: ${err.message}`, paths: [] };
    }
  }

  console.log(`docs-only: ${result.docsOnly} — ${result.reason}`);
  for (const p of result.paths.slice(0, 20)) console.log(`  ${p}`);
  if (result.paths.length > 20) console.log(`  … and ${result.paths.length - 20} more`);
  if (!result.docsOnly) {
    console.log("Every CI job will run.");
  } else {
    console.log("The heavy jobs will skip; test-plan still runs.");
  }

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `docs-only=${result.docsOnly}\n`);
  }
}

// Importable for its own test without running.
if (process.argv[1] && process.argv[1].endsWith("check-docs-only.mjs")) main();
