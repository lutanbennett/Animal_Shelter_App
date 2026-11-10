# The hand-over list is a command; block G re-runs a slow check instead of filing it

2026-11-10, stream `brief-block-timeout`. **A hypothesis to check, not a settled fix.**

## 1. Block G (timeout)
Block G said a check tripping `timeout 60` is "a finding, never a reason to raise the timeout". Two checks are
simply slow: `check-migration-grants.mjs` (~3 min, replays migrations; `approval-flag-schema`, #1423, tripped it
twice) and `check-public-views.mjs` (over 60 s; `public-cards-gate`, #1442). Each stream filed a true statement as
a defect. `check-destination-activity.mjs` (#1445) takes 3 s, so the premise holds for most checks.

**Shape chosen: a rule, not a second named exception.** A third slow check will appear. The block now says: if a
check trips the limit, re-run it once without the limit and file only if it is still wrong. The limit keeps its job
(catching a hang). Both measured durations are named so a stream need not discover them. `gates.mjs` keeps its own
carve-out line, unchanged.

## 2. The hand-over list
Lutan asked for the list of streams (folder, port, model, effort) five times across 2026-11-08 and 2026-11-09
("It's a bit annoying having to keep asking for this."). The rule, the skill's step order and a memory all already
said to send it first.

**Cause: handing over is the only step with no artifact.** A worktree leaves a folder, a brief a file, a filing a
commit; the list is a sentence someone must choose to compose, and it loses to work that produces output.

**Fix: `node scripts/worktree.mjs streams`.** A separate command rather than a flag on `list`: `list` fetches origin
and probes processes (slow, noisy); `streams` is offline and instant, so running it costs nothing. It prints, per
`claude/*` worktree: folder, port (`.port`), branch, whether `.brief.md` exists, model, effort, band, and a note.
No brief gives a row with `no .brief.md`; a brief without metadata gives a row with blank dials and
`no metadata line`; a brief port that differs from `.port` is noted. With no `claude/*` worktrees it prints
`no claude/* worktrees`. `SKILL.md` THE ONE RULE now says to run it the moment the last brief is written.

**Metadata format** (first line of `.brief.md`, kept as the planner already wrote it; three briefs old):
`<!-- stream: slug=<slug> port=<port> model=<model> effort=<effort> band=<lo-hi>k migration=<none|n> -->`
Space-separated `key=value`, no spaces in values. `SKILL.md` step 2 now tells the planner to write it.

**Test of the hypothesis:** whether a sixth instance of "asked for the list" happens. If it does, the missing piece
is not the artifact.
