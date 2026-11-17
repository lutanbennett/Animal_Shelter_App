# Check for the usage comment before clearing a batch's worktrees (2026-11-17)

**Rule.** At `/plan-day` step (e), as part of "clearing the finished worktrees", first read each
merged PR of the batch for a `stream-usage:` comment (`gh pr view <n> --json comments`). If one is
missing, read that session's transcript (`search_session_transcripts`, `list_events`) before the
worktree is cleared, or record it as already gone. `/clean-streams` carries the same line before it
proposes a merged leftover, because it also ends in `worktree.mjs done`.

**Where it sits, and why not earlier.** Inside (e), after the list. Clearing-after-the-list
(2026-11-11) and measurement-once-a-day (2026-11-11) are both unchanged: this is one cheap read, not a
new step, and not a reason to clear or measure sooner. It checks presence only; no figure is banded.

**Firings.** (1) By hand, morning of 2026-11-17: #1656, #1657, #1658 all carried the comment. (2) This
stream, #1659, #1660, #1661: all three carried one. **It has not yet caught anything**, so it remains
a hypothesis; mechanism A (`#3qmzt`) stays undiagnosed and has not recurred.

**Open question: how long does a transcript survive?** Not established. #1649 inferred that clearing a
session destroys it; whether the worktree removal, archiving, stopping or a retention window is the
cause was not tested (no missing-comment session was available to test against).

**Removed from SKILL.md:** nothing; the addition is one sentence inside (e).
**Release note:** n/a, the planner's own instrument.
