# A stream's finish line is an open PR, and the fix for missing it is the brief, not the dials

2026-10-13. Process rule; no code, no migration. Changes `.claude/skills/plan-day/SKILL.md` only.

## What happened

Two streams in two days looked finished and were not.

**`bills-inbox` (2026-10-12).** Briefed as a schema PR then an app PR from one worktree. The schema
PR merged as #569. The session then built the **entire** app half — the Bills page and inbox, bill
photos on Record a delivery and on the clinic visit, the `Bills/<year>/<month>` Drive folder, the
home tile, both dictionaries, the manual, a role harness: **8 commits, 31 files, 1,414 lines** — and
committed and pushed all of it **without opening a PR**. The session was archived that evening. The
next morning the branch sat 8 ahead and 21 behind with no PR, looking exactly like abandoned
scratch; the planner's own notes from the day before had recorded it as "in flight, session live".
It merged as #580 after a sync, a read-through and a test plan, for 129,178 tokens.

**`donate-channels` (2026-10-12).** Merged its schema PR (#572: the `donation_channels` table, the
public view, a checker) and stopped there, because its brief drew the line there. The half a
supporter can see — the Settings page and the buttons on `/donate` — was never built. It was
replanned as `donate-buttons` on 2026-10-13.

**Both were invisible in the usual view.** `gh pr list` shows **nothing** for a branch whose PR was
never opened, so an unsubmitted stream and a finished one look identical. The only place it showed
was the `ahead` column of `scripts/worktree.mjs list`.

## The question that was asked, and the answer

**Lutan: "Should we consider increasing the effort / model for some streams to try to address these
misses?"** It is the obvious move and it is the wrong one.

**Decided: no. The dials stay at `claude-sonnet-5-5` / `low`, and the fix goes in the brief.**

Why, miss by miss:

| the miss | would more thinking have caught it? |
|---|---|
| A feature built, no PR opened | **No.** The session stopped after committing. Effort buys care *within* a turn; it cannot make a stopped session open a PR. |
| The donate buttons never built | **No.** The stream did exactly what its brief said and stopped where it said to stop. The brief was wrong, not the thinking. |
| Three token actuals lost | **No.** Those sessions were archived. No model setting reaches that. |
| The duplicate `0191` | **No.** A planner rule gap, written down on 2026-10-12. |
| Six test-plan format commits (batches 94–95) | **No, and already proved.** The pre-push block fixed it: six format commits before it, **zero** after. A brief change, not a dial. |

**Every miss in the two days happened at a handoff** — in the gap between a stream's work and its
PR, or between a stream and the planner — not inside a stream's reasoning.

**The counter-evidence also matters:** 31 consecutive streams on Sonnet at `low`, none over band,
including a dozen carrying migrations or permission changes; the three measured on 2026-10-13 came
in at 127,677 · 129,178 · 136,307 against bands of 130–240k. Nothing there looks like a model
struggling. And raising **effort** *raises* the figure — it is more thinking per turn, never a
saving — which mattered with the weekly all-models window at 78% and a day to run.

This is the skill's own rule applied to itself: *"a stream that must discover its own scope → fix
the brief, not the dials."*

## Decided, concretely

**Every `.brief.md` now OPENS with a "where your finish line is" block**, verbatim in
`.claude/skills/plan-day/SKILL.md` beside the pre-push test-plan block. It says: you are finished
when the PR is **open**, not when the code works; commit and push as you go, because a commit is the
only checkpoint that survives a session stopping; if you must stop early, **stop with words** saying
what is and is not built; never end a turn with a built branch and no PR; "the code is written" is
not a report of completion.

**It goes at the top, not the bottom.** The finish line has to be read before the work.

**A stream that is two PRs gets one extra line:** this applies **twice**, because merging the schema
PR is not finishing. That is precisely the trap `donate-channels` fell into.

**The planner's half, in step 2 of the skill:** read `worktree.mjs list`'s `ahead` column against
the open PRs every run. **Ahead with no PR is unsubmitted work, not a leftover** — `done`ing it
destroys a day's build. **Ahead with a merged PR is a leftover**, because a squash-merged branch
stays ahead for ever. Both halves of that are needed; the first rule alone would have stopped
`release-tooling-fixes` (5 ahead, #579 merged) being cleared, for no reason.

## Not done, on purpose

- **No change to model or effort on any stream**, including the one with real silent-failure risk
  (`resident-picker-floor`, which widens who can read resident records). Its brief names the proof
  required instead — the three logins that must still refuse, and Admin and Management matching the
  2IC's row count exactly rather than merely being non-empty. **Naming the hazard in the brief has
  worked before**: `backup-daily` was writing code that deletes the shelter's only copy of its data,
  stayed at `low`, and got it right.
- **No tooling change.** A checker cannot tell a branch that is *meant* to be unsubmitted from one
  that was forgotten, and a CI job cannot run on a PR that does not exist. This one needs a human
  or a planner to look, which is why it is a brief rule and a step-2 check rather than a script.
- **The `0191` duplicate is not revisited.** Applied files are never edited; that decision stands.
