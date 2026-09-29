# 2026-09-24 — A sign-off PR's release-notes tick is checked against the PR that introduced the plan

`check-test-plan.mjs` held the §7 **Release notes.** tick to the current PR's
diff, so a follow-up that only records a post-merge check (the shape of #80,
recording #77's phone pass) failed. The only way through was to reword the
feature's permanent record as `n/a`. The checker now makes an exception when
**every** path the PR touches, including uncommitted files, is under
`docs/test-plans/` and the plan already existed at the merge-base. In that
case a tick is held to the merge that introduced the plan: the commit that
added the file (`git log --diff-filter=A`), then the oldest first-parent
commit on the base that contains it, whose `unreleased` must have gained a line
over its first parent. The claim is still checked, only against the PR it was
made about. A PR that touches a plan and any other file gets no exception.
Shallow history is reported as a problem, not guessed at (CI already fetches
with `fetch-depth: 0`). All of this was run against the real #77/#80 commits and
#78 (gates-command, which added no line).

Chosen over (b), accepting a tick when `unreleased` or a cut release contains a
line the plan quotes. That would need plans to quote their line exactly, and it
would pass a plan that quotes someone else's line. Also chosen over (c), a
`release line: #77` marker, which is new syntax to learn and something the
feature author has to remember. (a) needs nothing from the author.

Restoring #80's ticked wording on `intake-capacity-warning.md` cannot happen in
the same PR as the checker change. That PR touches a script, so it is not a
sign-off PR, and a tick with no new line fails against it, which is correct.
It follows as its own plan-only PR, the new path's first real run.
