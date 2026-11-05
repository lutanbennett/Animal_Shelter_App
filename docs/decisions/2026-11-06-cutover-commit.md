# 2026-11-06: the cutover commit, as built

Item `#ki6cx`. Runbook: `docs/domain-checklist.md` section E. This is the commit that section calls P5.
**Merging it deploys nothing.** It is the release manager's, on the day, after the Thursday steps.

## What it changes

- `wrangler.jsonc`: production routes, `APP_HOST`/`PUBLIC_HOST`, release-mail and status-alert addresses move to `lannacareforanimals.org`; `RELEASE_MAIL_ENV` becomes `Production`; **`PUBLIC_SITE: "locked"` is removed from production**, so the public website is open (the production deploy guard refuses a locked production block that is off UAT's host). The `uat` block takes the `lannacare.org` and `www` routes.
- `scripts/pi/cloudflared-config.yml`: `pi.lannacare.org` presents `lannacareforanimals.org`. `scripts/pi/deploy-pi.sh`: `HOST=` follows.
- `scripts/purge-cache.mjs`: production purges the `lannacareforanimals.org` zone (`CLOUDFLARE_ZONE_ID_LANNACAREFORANIMALS`, now required for production); UAT purges `lannacare.org`.
- `src/app/releases/page.tsx`: production is labelled `Production`.
- **UAT on the dev project** (decision `2026-11-05-uat-shares-the-dev-database.md`): `src/lib/app-env.ts` gains `appEnvFor(url, pin)` and `getAppEnv()` honours `NEXT_PUBLIC_APP_ENV=uat`, but only on a build whose project is the dev project, so it cannot relabel production. `scripts/deploy.mjs` sets the pin for the UAT build only (empty for every other environment) and expects the dev project for `--env uat`. `appEnvForSupabaseUrl` is unchanged on purpose: the correction scripts rely on it calling the dev project `dev`.
- `scripts/check-site-hosts.mjs`: its self-proof now spoils the cutover state instead of applying the cutover to the old one.

## Decided here, not asked

- Dropping `PUBLIC_SITE` follows the runbook (step 5: "the home page is the public site, not a sign-in page"). If the public site should stay locked on day one, restore that line in the production block before the deploy.

## Not done, and why

- `.env.deploy.uat` (dev values) and any Cloudflare, Supabase or Google step: not in the repo, Lutan's.
- Whether UAT should send release mail or status alerts against dev data: left as the `uat` block has it.
- Nothing was deployed, so `lannacareforanimals.org` and the UAT badge are unproven until the runbook's smoke test.
