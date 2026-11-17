# The stream-usage chain: what was established, what was not (#3qmzt)

## Mechanism A (no comment at all): not a stream forgetting, in the two cases that can be read

- **#1625** (`tenancy-part2-done-when`): its PR body says *"Gates, test plan and merge-on-green are NOT done yet"* and hands over. That is the large-session stop rule working: the stream opened the PR and stopped, and a later session merged it. No finishing sequence ran, so no comment was ever due from it.
- **#1637** (`deploy-cf-token`): its body says *"this session is the release manager"*. A release-side PR is not a feature stream, and CLAUDE.md scopes the comment to feature streams. Nothing was dropped.
- **#1636** (`worktree-done-husk`) and **#1647** (`tenancy-part7-filters`): **not established.** Both PR bodies are complete, gates reported, merged within 6 and 8 minutes of the last commit, no comment. #1647 is a fourth occurrence, found today. Their sessions are no longer in `list_sessions`, and `search_session_transcripts` finds nothing for either slug (the only hits for `worktree-done-husk` are the Planner's and Release Manager's own notes). **Finding: once a stream's session is cleared the transcript is gone, so the cause of an old A cannot be read afterwards.** The next occurrence must be read the same day, while the session is still listed.
- **#1639**'s PR is the only A/B boundary case; see B.

No brief was reworded: the evidence does not show a dropped deliverable in any readable case, and rewording has already failed twice.

## Mechanism B (figures read `unmeasured`): not reproduced

From this session, `get_usage` (no argument needed) returned `context.tokensUsed` 118065 and a Messages category, and `get_session` with `session_id: "self"` returned model, effort and `createdAt`. Today's #1644, #1645 and #1648 carry fully measured comments. **So the call works now; #1639's failure is transient or was a different state of the harness on 2026-11-16, and the cause is not established.** `get_usage` reports `context.session: "self"`, which is the check that the figure is this session's window rather than a neighbour's.

## The fix, and where it went

`CLAUDE.md`, merge train, usage-comment paragraph: a call that errored or returned nothing is written **`toolfailed`** in the same field (e.g. `tokens=toolfailed`), distinct from `unmeasured` (field absent from a good reply). A distinct value in the same field, not a new field, because the line is read by eye and a new field would make every old comment look incomplete. This does not cure B; it makes the next B distinguishable from A in the planner's reading.

## Not fixable here / for the planner

- A's cause for #1636 and #1647 cannot be recovered. A merge by someone other than the stream skips "immediately before `gh pr merge`" by construction; whether that happened is unknown.
- The band table is untouched.
