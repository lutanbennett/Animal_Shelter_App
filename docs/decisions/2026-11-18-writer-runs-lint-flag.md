# 2026-11-18 — definer_all on scheduled_writer_runs (#swrun)

**What rule 3 asserts** (`scripts/check-tenancy-catalogue.mjs`, line 43): every public table with RLS on must carry a `definer_all` policy for `rls_definer`. There is no carve-out for service-role-only tables.

**Why 0408 did not satisfy it:** 0408 created `scheduled_writer_runs` with RLS on and service_role grants, but no policy. 0375 gave `definer_all` to the tables that existed then and nothing gives a later table one. Same cause as 0388 (donation_tax_ids, retention_runs).

**Oversight or on purpose?** Oversight. "Nothing but the service role reaches it" is coherent, but the rule is stated for every RLS table, and the policy costs nothing: it is `to rls_definer` only, and the revokes from anon/authenticated stay. A carve-out in the check would be a new exception to maintain; the policy is the established shape.

**Branch taken: (a).** `0413` adds one policy on one table, re-runnable. `-- consumer: none`: the Worker writes the table as service_role, which already holds the grants, and a policy for a different role changes nothing it does.

**Before** (dev, `--strict --tenant-role rls_definer`): `FLAG rule 3  table:public.scheduled_writer_runs  owner=postgres` / `1 flagged (0 views, 0 functions, 1 tables missing definer_all), 2 allowed by name, 0 stale.`
**After** (0413 applied to dev): `0 flagged (0 views, 0 functions, 0 tables missing definer_all), 2 allowed by name, 0 stale.` exit 0.

**Not exercised:** the Worker writers (`worker/index.mjs`, `worker/translations.mjs`) cannot be run here. By reasoning only: `record_scheduled_writer_run` is security invoker and runs as service_role, which bypasses/ignores a policy scoped to another role. `check-scheduled-writers.mjs` ran on dev and still classified as before.

**Production:** 0413 goes with the next release. No ordering constraint against 0411/0412 (nothing reads either). The production apply is the release manager's.

**Backlog:** `#swrun` exists only on the `backlog` branch, not in `main`'s `docs/backlog.md`, so it cannot be ticked on this branch. For the planner to tick once `backlog` merges: done by PR for this branch. The strict lint should now read `0 flagged`; briefs no longer need the exception.
