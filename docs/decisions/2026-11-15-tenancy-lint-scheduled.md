# The tenancy catalogue lint runs nightly against dev (`#x5tbv`)

**Lutan's answer, 2026-11-14:** a scheduled run against the dev project, not per PR and not only by hand at release.

**Wired:** `.github/workflows/tenancy-catalogue.yml`, daily 05:43 UTC (clear of `advisories.yml` at 06:17) plus `workflow_dispatch`. It runs `node scripts/check-tenancy-catalogue.mjs --strict --tenant-role rls_definer` with `SUPABASE_ACCESS_TOKEN` and `NEXT_PUBLIC_SUPABASE_URL` (from `TEST_SUPABASE_URL`). Like `advisories.yml` it is allowed to fail: nobody sees a red scheduled run unless it can email someone, and it cannot turn any PR red.

**Strict, not report-only.** Measured 2026-11-15 on dev: with `--tenant-role rls_definer` (the flags `docs/release-procedure.md` section 5 uses) the lint reads 62 views, 205 functions, 120 of 120 tables with RLS, 0 flagged, exit 0. Red-on-a-finding is proven by the same script run without `--tenant-role`, which flags 105 and exits 1. The tenant role has to be passed explicitly: the script's default is none, and without it every object is flagged.

**The token.** Lutan scoped it to the one dev project, permission `Database: Read`, every other permission at No access, no organisation scope. It cannot change anything and cannot see production. This answers the item's own objection (a token in CI that "can read and change the dev project's schema"): the token that was actually made can only read.

**`read_only` question: it did not arise.** The script sends no `read_only: true`, and the Read-scoped token was accepted anyway in a real run (run 43664530867, success, on commit d52c84d, via a temporary push trigger because `workflow_dispatch` only works once a workflow is on `main`). The script was not changed.

**Release step kept.** Section 5 of `docs/release-procedure.md` stays: a release deploys a known commit and the apply changes the schema, while the nightly run judges dev. They overlap only partly; any merging of the two is the planner's to weigh.

Not on the PR path, on purpose: a token in every run of a public repository.
