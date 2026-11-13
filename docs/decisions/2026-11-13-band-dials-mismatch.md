# A figure from different dials is not an overrun (`#md4rq`)

**Date:** 2026-11-13 · **Stream:** `band-dials-mismatch` (sonnet-5-5 / low, matching its brief)

## Choice: (a) + (c) + the band in the `stream-usage:` comment

- **(a)** The brief header's band carries its dials: `band=120-160k@sonnet-5-5/low`. `worktree.mjs streams`
  already shows the suffix intact, so no script changed. Old headers without it still parse.
- **(c)** The rule is written where bands are set (`SKILL.md`, Bands): a figure whose model or effort did
  not match its brief is not evidence about estimating, in either direction; print "band does not apply",
  never a variance, and keep it out of every revision. A reading rule, never a limit.
- **Third option:** `CLAUDE.md`'s `stream-usage:` form gains `band=<lo-hi>k@<model>/<effort>`, copied from
  the brief header. The PR comment is permanent and the brief is gitignored, so the comment is the only
  artifact that can describe itself. **A comment without `band=` is the old form and is not a fault.**

## Rejected
- **(b) `/plan-day` compares against the brief.** Briefs die with their worktrees; with the band in the
  comment, (b) becomes a one-line reading of the comment, which the rule in (c) already is.
- **(c) alone.** Its case rested on "first mismatch recorded"; it is now the sixth in two days, five in one set.
- **A check or CI job.** The brief is gitignored, so CI can never see what was asked for.

## Evidence
See `.claude/skills/plan-day/reference.md` §4 (nine-row table, mean 1.73×, 4.1× above floor on the
smallest row, floor 35 tokens apart across the model change). Read from `stream-usage:` comments, 2026-11-13.

## Step 8 wording
`SKILL.md` step 8 said "Then stop" straight after the next-batch line, and a planner read it as a reason to
ask Lutan before setting up batch 2. Not already correct. Reworded: once the batch has merged, set up the next
without asking; what ends a turn is handing the list back; a fresh conversation resuming a plan it did not
write still presents the batch first (2026-11-08). Never-nine-worktrees is a reason to wait for the merge,
never to ask.
