# Part 5's release-order guard (#ujqr5)

**Chosen:** `scripts/check-release-order.mjs`, called from `docs/release-procedure.md` §5 before the apply. It reads which migrations the environment has not applied, and for a migration in `scripts/lib/release-order.mjs` (today `0392`) it exits 1 unless `--worker-deployed <sha>` names a commit where `worker/shelter.mjs` and `worker/index.mjs` are identical to `origin/main`. It also refuses when it cannot ask the database.

**The `-- consumer:` question:** the header cannot carry this. `0392` is applied to dev and is never edited (its `consumer: none` stands), and the mechanism only warns. The registry in `release-order.mjs` is the declaration instead.

**Why a named commit and not a probe:** nothing reports what the Worker runs. `/api/version` answers for the Pi's build. So the proof is the commit the release manager deploys from, which the check compares to main. It is an assertion made explicit and checked, not an observation; that is the limit.

**False reassurance fixed:** `consumerReport()` no longer says "that is the safe direction - nothing is blocked"; it says it blocks nothing and names the refusing check.

**Rejected:** a block inside `apply-migrations.mjs` (about a release, not a file), and a scheduled workflow (`.github/workflows/` is another stream's this batch).

**Environments:** the Worker sends the header in code for all of them (`worker/index.mjs` calls `withShelter` on every request). Whether the production Worker runs that code today is not confirmable from a worktree; `#v0302` records it deployed on 2026-11-16, unmeasured here.
