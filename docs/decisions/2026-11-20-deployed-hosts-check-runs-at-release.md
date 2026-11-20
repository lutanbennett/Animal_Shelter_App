# 2026-11-20 — `check-deployed-hosts` runs at release, not in CI (`#hostx`)

**The fault:** `test.lannacare.org` was deployed but had no `shelter_hosts` row on dev, so the Worker sent no shelter,
`0392`'s policies answered nothing, and every login was told its own account had no access.

**What was built:** `scripts/check-deployed-hosts.mjs --env <test|uat|production>` reads `APP_HOST` and `PUBLIC_HOST`
for that environment from `wrangler.jsonc`, reads that environment's `shelter_hosts` (a read-only select through the
Management API, project from `NEXT_PUBLIC_SUPABASE_URL`, the way `apply-migrations.mjs` resolves it via
`scripts/lib/env.mjs`), and exits 1 naming every host with no row. Pure logic in `scripts/lib/deployed-hosts.mjs`, tested.

**`PLATFORM_HOST` is listed but not required.** It serves the operator console, which needs no shelter (and maps to none
on purpose, `2026-11-19-operator-console-on-the-platform-host.md`). Requiring it would fail production for the design.

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
