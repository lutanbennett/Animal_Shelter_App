# Each stream records its own usage as a PR comment at merge

**Decided 2026-10-28 (Lutan):** *"Can we get the individual stream to record their actual usage at
merge rather than relying on the planning stream to gather them."*

**Why.** `get_usage` needs the session's process alive. The planner read it afterwards, and
archive-on-merge killed the process first: eight figures lost across two rounds. A stream reading
itself (no `session_id`) has a live process by definition and cannot pick up the planner's window.

**Why a PR comment, not a commit.** A commit after green CI re-runs CI, and the `backlog` branch may
only touch `docs/backlog.md`. A comment costs no CI, stays tied to the PR, and holds nothing
sensitive (token counts; the repo is public).

**Form.** One line, `stream-usage: slug= tokens= messages= model= effort= started= merged=
compacted= rescoped= finished=`. `unmeasured` for anything unreadable, never a guess. `rescoped`
was added to the item's proposed shape because a figure spanning two scopes bands neither (the
fourth worthless-figure case in the skill). The stream reports; the planner still judges.

**Scope.** Feature streams only. Release and handover PRs post none. `/plan-day` reads the comment
first and falls back to `get_usage` only when none exists, noting the source.

Also corrected in the skill: the floor read 98,063 on 2026-10-28 (was ~95k / ~85k); re-measure.
