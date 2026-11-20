# 2026-11-20 — `check-deployed-hosts` runs at release, not in CI (`#hostx`)

**The fault:** `test.lannacare.org` was deployed but had no `shelter_hosts` row on dev, so the Worker sent no shelter,
`0392`'s policies answered nothing, and every login was told its own account had no access.

**What was built:** `scripts/check-deployed-hosts.mjs --env <test|uat|production>` takes the addresses the environment answers on
from `wrangler.jsonc` through `siteHosts()` (`src/lib/site-hosts.ts`), reads that environment's `shelter_hosts` (a read-only select
through the Management API, project resolved by `scripts/lib/env.mjs` as `apply-migrations.mjs` does), and exits 1 naming every
address with no row. **`siteHosts()`, not the raw vars,** because it adds the `www.` form of each host and `worker/shelter.mjs`
looks a host up literally, so each www form needs its own row (planner's correction, measured on dev: `www.test.lannacare.org` and
`www.lannacareforanimals.org` have none). Exported for `#aucbk` to loop over a second time: `addressesAnsweredOn(vars)` in
`scripts/lib/deployed-hosts.mjs`. The platform host is included. The rows are not added here.

**Where it runs: a numbered release step, not CI.** CI's env holds `placeholder` Supabase values and no
`SUPABASE_ACCESS_TOKEN`, so it cannot read any real database; wiring it for dev would need a dev token in CI secrets,
which the repo does not otherwise hold, and a CI job for UAT or production is out of the question. It sits in
`docs/release-procedure.md` before the deploys, beside the other bare per-environment proofs.

**The refusal now tells the truth.** No shelter on the request (the Worker's header, or `DEV_SHELTER_ID` on `next dev`)
is distinguishable from a real no-role login with `actingShelterId()`, no database change. Password sign-in, the
Google callback and the proxy now say the site is not set up (`login.errors.siteNotSetUp`, `?error=no_site`); a real
no-role login keeps its wording.

**How the dev row got there:** the backlog item records a one-off service-role script that repeated
`product_admin_map_host()`'s checks (0414). Nothing in the repo adds or reads `shelter_hosts` except the Worker, so
there is still no Settings screen or allow-listed script for it.
