# 2026-10-02 — `apply-migrations.mjs` warns from a declared `-- consumer:` header, not an inferred one

**Context.** `deploy.mjs` refuses code whose schema is not applied (#254). The
mirror is applying a migration whose reader is not live yet: the safe direction,
but the moment someone chooses whether to deploy now. Nothing in the repo said
which code reads which migration.

**Decision.** A migration may carry `-- consumer: <path>[, <path>]` (or
`-- consumer: none`) in its leading comment block. When `apply-migrations.mjs`
is about to apply or dry-run a pending file, it compares each declared path at
the assumed-live release with `origin/main`. Identical → silent. Missing at the
release, missing on main, or different → a `WARNING` line. **It prints and never
refuses; what gets applied is unchanged.** Code: `scripts/lib/migration-consumers.mjs`,
checked by `scripts/check-migration-consumers.mjs`.

**Why not inference.** It would parse SQL to find what a file adds, then search
`src/` for the name. A dynamic select, a view column, a function or an RLS change
is missed and reads as "nothing reads this" — false confidence, worse than silence.

**Limitations, stated in the output as well:**
- Only files with a header are checked. The 126 existing migrations are not
  backfilled (applied files are never edited). A file without one is counted as
  "declares no consumer", which is not "nothing reads it".
- "Differs from the release" can be an unrelated edit to the consumer file; it is
  worded "may or may not already read this", never as missing. Identical is the
  only silent state.
- **"Live" is an assumption**: the commit that set `package.json`'s version on
  `origin/main`, i.e. the newest cut release. Git tags stopped at `v0.3.0` so they
  are no use, and nothing can ask the serving origin its version without signing
  in (`/api/releases/current` is answered by the Worker first). A cut that has not
  been deployed counts as live, so the check can miss, but not over-claim.
- Paths are repo-relative; a consumer that is renamed later reads as missing.

**Follow-up.** An unauthenticated version endpoint served by the app (not the
Worker) would make "live" exact; filed on the backlog branch.
