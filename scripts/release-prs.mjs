// Lists the PRs in a release, and refuses to answer when its sources disagree.
//
//   node scripts/release-prs.mjs <since-sha> [<until-ref>=HEAD]
//
// <since-sha> is the previous release's deployed SHA (its docs/releases/ record).
//
// Why this exists: the pre-deploy check in docs/release-smoke-test.md is "every
// PR in this release has a completed test plan", done by hand, against a list of
// PRs. That list used to come from `git log --first-parent`, which cannot see a
// PR whose commits reached main without their own merge commit on the
// first-parent line (a `Merge remote-tracking branch 'origin/main'` that was
// then fast-forwarded, a squash or rebase merge, or a branch that carried
// another's commits). #213 was invisible that way in 0.9.1 — its release was
// nearly recorded as eight PRs, not nine. A hand check against an incomplete
// list passes silently, which is worse than no check.
//
// Two sources, and the second is the one that cannot silently pass:
//   1. Every merge commit in the range whose subject is `Merge pull request
//      #N from owner/branch` — first-parent or not, so a PR merged onto a side
//      line is still found.
//   2. Cross-check: every file ADDED under supabase/migrations/ or
//      docs/test-plans/ in the range must have been introduced by a commit that
//      belongs to one of those PRs (reachable from a PR merge's second parent).
//      An artifact with no PR is a PR the list cannot see. No network, no `gh`.
//
// Exit 0: the list and the artifacts agree. Exit 1: they do not — the message
// names each orphan, and the list must not be pasted into a cut plan until it
// is resolved (find the PR on GitHub and add it by hand, saying so).
// Exit 2: usage or git error.
//
// A squash or rebase merge leaves no merge commit, so a commit that source 2
// finds no PR for is then looked up on GitHub (`gh api repos/{owner}/{repo}/
// commits/<sha>/pulls`) and, if a MERGED PR comes back, added to the list and
// labelled "github" instead of "git". This is the only network call and it is
// best-effort: with `gh` missing, unauthenticated or offline it simply
// resolves nothing, and the script behaves exactly as it did when it was git-only
// (the orphan stays an orphan and the exit is 1). It never makes a cut depend on
// the network, and an orphan GitHub cannot resolve is still a refusal.

import { spawnSync } from "node:child_process";

function git(...args) {
  const r = spawnSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) {
    console.error(`git ${args.join(" ")} failed:\n${r.stderr}`);
    process.exit(2);
  }
  return r.stdout;
}

const [since, until = "HEAD"] = process.argv.slice(2);
if (!since || since.startsWith("-")) {
  console.error("usage: node scripts/release-prs.mjs <since-sha> [<until-ref>=HEAD]");
  process.exit(2);
}
const range = `${since}..${until}`;

// 1. PR merge commits anywhere in the range.
const prs = new Map(); // number -> { number, branch, merge, source }
const MERGE = /^Merge pull request #(\d+) from [^/\s]+\/(\S+)/;
for (const line of git("log", "--merges", "--format=%H%x09%s", range).split("\n")) {
  const [sha, subject] = line.split("\t");
  const m = subject && MERGE.exec(subject);
  if (m) prs.set(Number(m[1]), { number: Number(m[1]), branch: m[2], merge: sha, source: "git" });
}

// A PR owns the commits its merge brought in: reachable from the merge's second
// parent but not its first. Reachability from the second parent alone is too
// loose — a branch that merged origin/main carries every earlier PR's commits
// too, so a missing PR would still look owned by the one that carried it.
const isAncestor = (a, b) =>
  spawnSync("git", ["merge-base", "--is-ancestor", a, b]).status === 0;
function owner(commit) {
  for (const pr of prs.values()) {
    if (isAncestor(commit, `${pr.merge}^2`) && !isAncestor(commit, `${pr.merge}^1`)) return pr;
  }
  return null;
}

// 2. Artifacts added in the range, and who introduced them.
let orphans = [];
let artifacts = 0;
const added = git("log", "--diff-filter=A", "--name-only", "--format=%x00%H", range, "--",
  "supabase/migrations", "docs/test-plans");
for (const block of added.split("\0").slice(1)) {
  const [sha, ...files] = block.split("\n").filter(Boolean);
  for (const file of files) {
    artifacts++;
    if (!owner(sha)) orphans.push({ file, sha });
  }
}

// 3. Ask GitHub about each orphan commit (squash/rebase merges). Best-effort.
function ghPullsFor(sha) {
  const r = spawnSync("gh", ["api", `repos/{owner}/{repo}/commits/${sha}/pulls`], {
    encoding: "utf8", maxBuffer: 16 * 1024 * 1024,
  });
  if (r.error || r.status !== 0) return null; // gh missing, signed out or offline
  try {
    return JSON.parse(r.stdout).filter((p) => p.merged_at);
  } catch {
    return null;
  }
}
if (orphans.length) {
  const bySha = new Map();
  for (const o of orphans) {
    if (!bySha.has(o.sha)) bySha.set(o.sha, ghPullsFor(o.sha));
    const found = bySha.get(o.sha);
    if (found && found.length) {
      const p = found[0];
      if (!prs.has(p.number)) {
        prs.set(p.number, { number: p.number, branch: p.head.ref, merge: o.sha, source: "github" });
      }
      o.resolved = true;
    }
  }
  orphans = orphans.filter((o) => !o.resolved);
}

const list = [...prs.values()].sort((a, b) => a.number - b.number);
const firstParent = git("log", "--first-parent", "--merges", "--format=%s", range)
  .split("\n").filter((s) => MERGE.test(s)).length;

console.log(`Release range ${since}..${until}`);
console.log(`PRs in this release: ${list.length}\n`);
for (const p of list) console.log(`- #${p.number}  ${p.branch}  (${p.merge.slice(0, 7)})  [from ${p.source}]`);
const fromGithub = list.filter((p) => p.source === "github").length;
if (fromGithub) {
  console.log(`
${fromGithub} PR(s) resolved from GitHub (squash/rebase merge, no merge commit in git); the rest from git.`);
}
if (list.length - fromGithub !== firstParent) {
  console.log(`\n(git log --first-parent shows only ${firstParent}; ${list.length - fromGithub - firstParent} more found off the first-parent line.)`);
}
console.log(`\nChecked ${artifacts} added migration/test-plan file(s) against the list.`);

if (orphans.length) {
  console.error(`\nDISAGREEMENT — ${orphans.length} file(s) added in this range belong to no PR above:`);
  for (const o of orphans) console.error(`  ${o.file}  (introduced in ${o.sha.slice(0, 7)})`);
  console.error(
    "\nA PR is missing from the list (squash/rebase merge, or a merge with no PR subject),\n" +
    "or the file was committed straight to main. Find the PR on GitHub, add it by hand and\n" +
    "say so in the release record. Do not tick the pre-deploy test-plan item against this list.");
  process.exit(1);
}
