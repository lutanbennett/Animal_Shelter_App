# Deploys require every migration in the deployed commit to be applied (2026-10-01)

`scripts/deploy.mjs` now asks the target database, for `uat` and `production`
only, which migrations it has applied, and refuses (exit 2) if any file in the
commit being deployed is missing, listing the filenames and
`node scripts/apply-migrations.mjs --env <env>`. `test` is not asked: running
ahead of, or behind, the code there is normal.

**The rule is "every migration file in the deployed commit is applied", not "the
database matches origin/main".** Rows in `schema_migrations` with no file in the
commit are fine. Schema ahead of code is the direction this project deliberately
uses, and a migration for the next release can already sit on `main`: `0118`
(PR #236) was on `main` but unapplied during `0.10.1`, and correctly so. An
equality check would have refused that deploy over a file it did not need.

Today the two readings give the same answer, because the existing guard already
requires `HEAD` to equal `origin/main`. They are written as different things
(`missingFromDatabase(deployedMigrations(HEAD), applied)`, with no reference to
`origin/main`) so the check keeps working the first time someone deploys a tag
or a hotfix branch.

**Could not ask warns and continues; behind refuses.** A timeout, a missing
`SUPABASE_ACCESS_TOKEN` or an API error prints two `WARNING` lines (with the
reason and the `--drift` command to run by hand) and the deploy goes on. A deploy
already needs the network, but a Supabase blip must not be able to stop a
release, and failing closed is what `release-prs.mjs` had to walk back. A
missing `schema_migrations` table is an answer (nothing applied), not a failure.

Why it exists: on `0.10.1` the public adoption profile selected `is_microchipped`
for about an hour before `0117` was applied (`docs/releases/2026-09-30.md`).

The logic lives in `scripts/lib/deploy-schema.mjs`. It does not use
`apply-migrations.mjs --drift`, which compares against `origin/main` in both
directions and exits 1 on any difference, so it would reject legitimate extra
rows.

**Not built:** the reverse warning from `apply-migrations.mjs` when it applies a
file whose consumer is not yet deployed. It needs a map from migration to
consumer that the repo does not hold, so it is filed separately.
