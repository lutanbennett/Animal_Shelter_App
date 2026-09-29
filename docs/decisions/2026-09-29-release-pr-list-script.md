# A release's PR list comes from `scripts/release-prs.mjs`, which cross-checks itself

2026-09-29. Backlog item: a release's PR list built from `git log --first-parent`
cannot see every PR (#213 in `0.9.1`).

**Built:** fix options (b) and (c) from the backlog item.

- (b) The list reads every merge commit in the range, not just the first-parent
  line, and takes PRs from `Merge pull request #N from owner/branch` subjects.
  This alone finds #213, whose PR merge commit sits off the first-parent line.
- (c) leads, because it is the part that cannot silently pass. Every file added
  under `supabase/migrations/` or `docs/test-plans/` in the range must have been
  introduced by a commit a listed PR brought in (reachable from the merge's
  second parent, not its first). An orphan means a PR the list cannot see; the
  script names it and exits 1. Reachability from the second parent alone is
  *not* enough — a branch that merged `origin/main` carries earlier PRs' commits,
  so a missing PR looked owned by whichever PR carried it. Checked by dropping
  #213 from the list: the assertion then fires on `0112` and #213's plan.

**Not built:** (a) enumerating from `gh pr list --state merged`. It needs network
and auth and fails closed on a blip, and a check people stop running is worse
than a slightly weaker one. It remains the way to resolve an orphan by hand.
A PR that leaves no migration or test plan and no PR-named merge commit is still
invisible, but every PR must carry a test plan (CLAUDE.md), so that is a PR
already breaking the rule.

`docs/release-smoke-test.md`'s pre-deploy item now says to run the script, never
to use `--first-parent`, and what to do on a non-zero exit.
