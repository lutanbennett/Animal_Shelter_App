# 2026-11-06: the cutover commit, as built

Item `#ki6cx`. Runbook: `docs/domain-checklist.md` section E. This is the commit that section calls P5.
**Merging it deploys nothing.** It is the release manager's, on the day, after the Thursday steps.

## What it changes

- `wrangler.jsonc`: production routes, `APP_HOST`/`PUBLIC_HOST`, release-mail and status-alert addresses move to `lannacareforanimals.org`; `RELEASE_MAIL_ENV` becomes `Production`; **`PUBLIC_SITE: "locked"` STAYS on production** (Lutan, 2026-11-05: the lock stays on; the public launch is a separate decision). The first draft of this commit removed it on the runbook's say-so, which was not his call to assume, and was corrected the same day. The `uat` block takes the `lannacare.org` and `www` routes.
- `scripts/pi/cloudflared-config.yml`: `pi.lannacare.org` presents `lannacareforanimals.org`. `scripts/pi/deploy-pi.sh`: `HOST=` follows.
- `scripts/purge-cache.mjs`: production purges the `lannacareforanimals.org` zone (`CLOUDFLARE_ZONE_ID_LANNACAREFORANIMALS`, now required for production); UAT purges `lannacare.org`.
- `src/app/releases/page.tsx`: production is labelled `Production`.
- **UAT on the dev project** (decision `2026-11-05-uat-shares-the-dev-database.md`): `src/lib/app-env.ts` gains `appEnvFor(url, pin)` and `getAppEnv()` honours `NEXT_PUBLIC_APP_ENV=uat`, but only on a build whose project is the dev project, so it cannot relabel production. `scripts/deploy.mjs` sets the pin for the UAT build only (empty for every other environment) and expects the dev project for `--env uat`. `appEnvForSupabaseUrl` is unchanged on purpose: the correction scripts rely on it calling the dev project `dev`.
- `scripts/check-site-hosts.mjs`: its self-proof now spoils the cutover state instead of applying the cutover to the old one.

## The deploy guard was removed because of that decision

`lockedPublicSiteProblem` (`scripts/lib/wrangler.mjs`, called by `scripts/deploy.mjs` and by `scripts/lib/site-hosts-problems.mjs`) refused a production deploy whose block was off UAT's host and still locked, "with no flag past it" (2026-09-27). It existed to stop the lock being left behind by accident at the cutover. With the lock now deliberately kept, it would block the production deploy, so the function, its two call sites and the matching self-proof in `check-site-hosts.mjs` are deleted. **The cost:** nothing now stops a locked production block being deployed by mistake at the day the public site is launched; that launch step is "remove `PUBLIC_SITE` from the production block", written in `wrangler.jsonc` beside the var.

## Not done, and why

- `.env.deploy.uat` (dev values) and any Cloudflare, Supabase or Google step: not in the repo, Lutan's.
- Whether UAT should send release mail or status alerts against dev data: left as the `uat` block has it.
- Nothing was deployed, so `lannacareforanimals.org` and the UAT badge are unproven until the runbook's smoke test.
