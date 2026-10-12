# 2026-10-13 — Two files are numbered `0191`; the number check cannot catch that, and should not try

`release-tooling-fixes`. Docs only. Closes the backlog item "Two migration files on `main` both
numbered `0191`".

## What happened

`0191_donation_channels.sql` (#572) and `0191_stock_receipts_update_policy.sql` (#574) are both on
`main` and both applied to dev (192 applied, 0 pending, no drift). **Nothing is broken.**
`schema_migrations` records each by its own filename, the two touch unrelated objects so their
order does not matter, and applied files are never edited. **Neither file is renamed.**

**A planner error, not a stream error.** `bills-inbox` merged `0190`; the planner read that as the
slot being free and gave it to `donate-channels`. `bills-inbox` then found that matching a bill to
a delivery has to UPDATE `stock_receipts`, and correctly opened a second schema PR.

## Can `scripts/check-migration-numbers.mjs` catch it? No.

It compares a PR's new files with its **base branch**. When each PR was written, `0191` was
genuinely free on `main`, so each passed. The collision exists only once both are merged, and by
then the check has nothing to compare (run on `main` today it says "no new migration files").

Two ways to widen it, both rejected:

- **Scan the whole directory for duplicate numbers on every run.** It would catch this, but only
  after the fact, and it would stay red on `main` for ever, because the files cannot be renamed.
  A check that is permanently red is one people stop reading.
- **Read open PRs through the GitHub API in CI.** It would catch the race in the act. It also adds
  a job that needs a token and the network, can only see PRs open at that moment (the second PR
  can open after the first merged, which is exactly what happened here), and races with merges.
  One collision in about 190 migrations does not pay for that.

**Recommendation: build nothing.** The cheap fix is already in `docs/planner-handover.md`: a
schema-then-app stream holds its migration slot until its **app** PR merges, because the app half
is where a second migration gets discovered. If it happens again, that rule is what failed, not
the check. Lutan can overrule and ask for the API version; it was not built.

## For the release manager

"0191" is ambiguous in conversation. Both files apply at that number; see `docs/release-handover.md`.
