# `release-prs.mjs` defaults its range start to the newest release record (2026-11-27, `#rpsha`)

**Problem.** Run bare, `node scripts/release-prs.mjs` exited 2 with a usage line, in the middle of a
release, and the release manager had to find the previous deployed SHA by hand. That happened in at
least two consecutive releases (0.49.2, 0.49.3).

**Where the answer lives.** The backlog item said `src/lib/releases.ts` names the previous release. It
does not: that file holds the release notes. The deployed SHA is in the release **record**,
`docs/releases/<date>-<version>.md`, on its `**Shipped** … **Commit** \`<sha>\`.` line.

**What was built.**

- `scripts/lib/release-records.mjs` lists the versioned records (the logic `check-release-handover.mjs`
  had inline, now shared by both) and `resolveSince()` picks the range start: an explicit argument
  always wins; otherwise the newest record's `**Commit**` line.
- The script prints `Range start: <sha>, release <version>, from <file>` before the list. A silent default
  would be worse than the exit 2: a wrong range gives a plausible list nobody questions.
- **No guessing.** No record, or a newest record with no `**Commit**` line, is still exit 2, naming what it
  looked for. There is no fallback to an older record or to `git describe`; this script exists to refuse
  when its sources disagree.

**The open question: running it after the in-flight release has its own record.** Then the newest record
is the current release, and the default range is the commits *since* it, not the release's own PRs.
**Decided: the operator's responsibility, not detected.** There is no reliable signal to detect it: at
step 2 of the procedure `package.json`'s version already equals the newest record's (the cut has not
bumped it), so "record version equals package version" is the normal case, not the wrong one. Instead the
printed line names the version it chose, and `docs/release-procedure.md` step 2 says to check it is the
previous release and to pass the SHA explicitly otherwise. Cheap, and visible on the first line.
