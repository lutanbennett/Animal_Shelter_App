# `--env test` refuses stale migration files

`apply-migrations.mjs` now checks `--env test` applies/dry-runs with a narrower
guard than `uat`/`production`: a file in the checkout that is **not** on
`origin/main` is refused if it is already in the merge-base with `origin/main`
(a merged migration since renamed or removed on main, i.e. a stale worktree).
Files new on the branch still apply, so schema-first work on dev is unchanged.

Why not full guarding: dev is where migrations are applied before merge.
Closes part (1) of the backlog item on the unguarded `--env test`; the
cleanup migration for the phantom `0201` ledger row is still separate.
