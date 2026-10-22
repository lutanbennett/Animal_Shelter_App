# Planner tooling: the release-note audience question, and `list` seeing unheld branches

2026-10-22, `claude/planner-tooling-fixes`. Two small tooling changes, one file
because they share a theme: a gap that two people had each worked around by hand.

## The template now asks who a release note is for

The release cut tagged an admin-only note with `roles` two releases running
(`0.38.2`, `0.39.0`; see `2026-10-21-release-0-39-0-admin-tags-and-silent-number-risk.md`).
§7 of `docs/test-plan-template.md` asked only whether a shelter user would notice,
so an honest author never considered the audience. §7 now adds the question and
the `{ text, roles: [...] }` form.

`scripts/check-test-plan.mjs` also **warns** when a *new* `unreleased` note is a
plain string and names an admin-only place (`Settings →`, `/admin`, "Admin-only",
"only admins"). It is a **warning, never a failure**: a wrong tag hides a note from
the people it is for, which is the worse error, and a keyword match is a guess.
It prints on every exit path that already prints the release notes, and changes no
exit code, so a correct-but-unsigned plan still exits 0 and `test-plan` stays
advisory. Notes already tagged with `roles` are never flagged.

## `worktree.mjs list` reports what it could not see

Two new sections, both report-only (`list` never deletes):

- **Branches with no worktree**: every `claude/*` branch, local or on `origin`,
  that no worktree holds. A branch whose tip is in `main`, or whose PR squash-merged
  at exactly that tip, reads *safe to clear*; anything else reads *DO NOT TOUCH,
  unsubmitted work* (or *UNMERGED WORK* when a PR merged but commits are extra).
  It reuses `mergeProof`, the same proof `done` relies on.
- **Folder name does not match its branch**: the condition behind the 2026-10-21
  husk (the `267` folder reused for `claude/record-0-38-2`, so cleanup by name
  missed it, and `done` then could not delete the folder because `.next` held a
  Windows file handle).
