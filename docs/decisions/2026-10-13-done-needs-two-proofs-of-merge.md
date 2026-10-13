# `worktree.mjs done` needs two proofs a branch is in `main`, never PR state alone

2026-10-13. `done` asked only "is the branch an ancestor of `origin/main`", which a squash merge makes
false by construction, so finished streams were refused and `--force` was becoming routine. And the
`/clean-streams` skill called every refused branch "probably squash-merged", which invited `--force` on
`claude/bills-inbox`: its schema PR (#569) had merged, but eight feature commits were built on the same
branch afterwards and existed nowhere else.

**Rule (`mergeProof` in `scripts/worktree.mjs`).** A branch is disposable only if one of these holds:

1. its tip is an ancestor of `origin/main` (merge commit, fast-forward); or
2. GitHub reports a merged PR from the branch **and** that PR's head commit **is the branch tip** **and**
   its merge commit is an ancestor of `origin/main` (squash or rebase merge).

"The PR is merged" is never enough on its own. If a PR merged but the tip is not that PR's head, the
branch holds **unmerged work**: `done` refuses, `--force` does **not** override it (same standing as the
unpushed-commits refusal), and `list` prints `UNMERGED WORK` in the state column. If `gh` cannot be
reached the answer is "no proof", not "assume fine".

**`--force`** keeps its old meaning (discard a branch with no merged PR, or a dirty tree) but is no longer
the way to clear a squash-merged stream.

**Also:** worktrees under `.claude/worktrees/` (the desktop app's spare checkouts) are skipped by
`list`/`done`. Stale registry entries (folder gone) stay reported as `STALE`, and the skill runs
`git worktree prune` for them, which only forgets entries whose folder is missing.

**Tested** against a scratch repo with a faked GitHub answer (`WORKTREE_TEST_PRS`): squash cleared
without `--force`; merged PR plus a later commit refused with and without `--force`; a merged PR whose
merge commit is not in `main` refused; no PR refused.
