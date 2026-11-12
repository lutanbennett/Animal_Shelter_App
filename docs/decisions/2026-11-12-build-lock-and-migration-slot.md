# Build lock tracks its child; the migration slot is not reservable (#9975c, #y1x2r)

## Part A — the tree lock (#9975c)
- `gates.mjs` now starts each gate with async `spawn` and writes the gate shell's pid into the lock as `child`
  (`recordTreeLockChild`, cleared between gates). The shell's tree holds `next build`, so `taskkill /T` on it ends everything.
- A lock is stale only if the recorded owner AND the child are dead. Owner dead, child alive: refused, and the message says
  "its owner has gone but its child, pid N, is still running" and prints `taskkill /PID N /T /F` with the CHILD pid.
- Reproduced? **No, not live.** I did not kill a real build. Built against a unit stand-in: a real live node process as `child`
  with a dead owner pid (`scripts/tree-lock.test.mjs`, both directions).
- #1514 deliverable 8 (can a leftover still block after the timeout?): **yes, still possible**, e.g. a hung build. Acceptable:
  the wait is bounded (600 s), then it refuses and names the exact kill command. Failing closed beats two readers of node_modules.
- Limit: a build started by a different route (not through `gates.mjs`) records no child; `deploy.mjs` is unchanged.

## Part B — migration slot (#y1x2r)
- `apply-migrations.mjs --is-applied <file>` (read-only, dev by default) prints `applied`/`not applied`. `check-migration-numbers.mjs`
  shells out to it (not in the pre-commit hook: no network there) and, for each misnumbered file, adds:
  - applied: `<file> is ALREADY APPLIED to dev. Do NOT renumber it: renaming leaves its old row behind as drift. Stop and report this to Lutan or the planner.`
  - not applied: `<file> is not applied to dev, so it is safe to renumber.`
  - unknown (CI, no credentials): tells the stream to run `--is-applied` itself before renaming.
- `/plan-day` step 5 rule 3 REPLACED (not appended). Removed: "At most one migration-carrying stream per batch. Two in one batch means one
  schema PR or one moves." and the provisional-slot sentence; now an expectation, not a reservation.
- `CLAUDE.md` "Database migrations" made the same claim ("two streams can never claim the same number"); corrected in the same way.
- Candidate (b) (`worktree.mjs new` claims a number in a shared file) not built; it is new shared mutable state. Not recommended.
