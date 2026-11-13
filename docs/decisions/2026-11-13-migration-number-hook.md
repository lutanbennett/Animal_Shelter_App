# The pre-commit hook accepts a gap in migration numbers (#w8kq3)

**The contradiction.** On 2026-11-13 PRs #1546 and #1547 both numbered a migration `0366`.
CI said: *"open PR 1547 already adds 0366_..., the same number 0366 ... take the next free number — which
this check now works out for you"* (so `0367`). The hook, on that same change, said *"0367_...: it leaves a
gap: the next free number after origin/main's highest (0365...) is 0366"* and exited 3. Neither stream could move.

**Cause.** `.githooks/pre-commit` runs `check-migration-numbers.mjs --staged`, which never reads open PRs
(a GitHub call on every commit, in every worktree, is not acceptable). So the hook enforced strict
contiguity with `origin/main` while unable to know the next number was held.

**Chosen: (a).** `evaluate()` takes `{ allowGap }`, set only under `--staged`. In the hook a new file whose number
is above the next free one is accepted if main does not hold it and no other new file shares it. CI
(`allowGap` off, open PRs read) stays strict, so a real gap still fails there. This follows an existing pattern
in the same file: staged mode already exits 0 when its fetch is stale, i.e. the hook declines to refuse
when it cannot know. (b) adds state to keep in step; (c) needs a human with GitHub write every time.

**What a gap does downstream (read, not assumed).**
- `apply-migrations.mjs`: applies pending files by filename and records by filename; `--status`/`--drift`
  compare filename sets with `origin/main`. A gap changes none of that. (Its own comment at line 44 notes
  a past gap, 0069, as a drift bug of a different kind: a file missing, not a number.)
- `check-migration-grants.mjs`: selects files by number thresholds (`> LAST_EXEMPT`, `< n`), never by
  contiguity. Unaffected.
- `scripts/lib/migrations.mjs`: the rule's helpers (`numberOf`, duplicates, open-PR claims) do not assume
  contiguity. The change sits in `evaluate()` instead.
Existing precedent: the number a stream skips is simply held by the other PR, which merges first.

**What the hook still refuses** (proved with a temporary staged file, removed afterwards): a number main
already holds (exit 3); two new files sharing a number (exit 3). A one-past-highest number and a gap both pass.

**Manual unlock, for when it still goes wrong** (e.g. both PRs end on the same number and the hook was
bypassed): close one PR, let the other merge, then renumber the closed one's file to the next free number
on a fresh `worktree.mjs sync`. Rare now, not impossible. Never `--no-verify` to get past it.
