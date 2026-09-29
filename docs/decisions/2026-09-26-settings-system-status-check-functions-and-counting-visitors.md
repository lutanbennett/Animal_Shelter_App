# 2026-09-26 — Settings → System status: check functions, and counting visitors

- **Every tile is a small function with one shape.** `src/lib/status/health.ts`
  and `usage.ts` each export a plain async function per tile returning
  `{ state, error?, facts? }`; `runCheck` (`src/lib/status/run.ts`) adds the
  timing and a hard timeout, never throws, and scrubs every error through
  `redactSecrets` (the values of the known secret variables, bearer tokens and
  Google access tokens) before anything reaches a page. States are `ok` /
  `warn` / `fail` / `off`. `off` is grey, for something deliberately not in use
  here: release mail on the test Worker, the Pi before `ORIGIN_HOST` is set,
  backups of a database that isn't scheduled for them, visitors without a
  token. Without it those tiles would be permanently amber or red, and a
  later "alert me when a tile goes red" would have to learn which reds to
  ignore. It can call the same functions and alert on `fail` alone.
- **Timeouts race the work rather than cancel it** (5–8 s per check), and the
  whole report is cached as a promise for 60 s per server instance, so two
  admins in the same moment share one run. *Check now* clears it. A module
  cache, not Next's data cache: it behaves the same on the Worker, on the Pi
  and under `next dev`.
- **Migrations compare against the build, not against git.** A Worker has no
  checkout, so `next.config.ts` writes the migration file names into the build
  (`BUILD_MIGRATIONS`), and the tile compares them with `schema_migrations`
  through `migrationDrift` (`src/lib/migration-drift.ts`), the function
  `apply-migrations.mjs --status` / `--drift` now also uses. A deploy is
  built from main, so on a deployed site this *is* "in step with main"; on a
  workstream's dev server it is that branch, which is what that server's pages
  actually need. A file not applied is red (pages will fail); a row with no
  file is amber (normal on dev while a schema PR waits, wrong anywhere else).
- **Deploy time comes from the Worker's `version_metadata` binding**
  (`CF_VERSION_METADATA`, added to every env in `wrangler.jsonc`): its tag is
  the `v<version>` `deploy.mjs` sets, its timestamp the upload time. Amber if
  the tag doesn't match the bundled release, meaning someone deployed around
  `deploy.mjs`. Under `next dev` or on the Pi there is no binding, and the
  tile says so rather than guessing.
- **The backup tile needed no schema.** `backup.mjs` already names its uploads
  `Backups/lannacare-<env>-<timestamp>.dump`; the tile lists that folder for
  this environment's prefix, newest `createdTime` first. Amber after 8 days
  (a missed Sunday plus a day's grace), red after 15. Only production is on a
  schedule, so elsewhere "none yet" is grey.
- **Sign-ins are people, not events.** Supabase's per-sign-in audit log isn't
  reachable through the API; `auth.users.last_sign_in_at` is. The figure is
  accounts whose latest sign-in falls in the period, and the tile says so.
- **Visitors: Cloudflare's own zone totals, and the privacy page now says so.**
  `/privacy` promises "no advertising and no analytics tracking" and names
  Cloudflare's connection logs "to protect the site from abuse". The count
  comes from Cloudflare's GraphQL Analytics API (`httpRequests1dGroups`: daily
  page views and daily unique visitors, summed). No cookie, no script, nothing
  per visitor, so "no analytics tracking" still holds. But using those logs
  for totals is a second purpose the page didn't mention, so it now does, in
  both languages ("daily totals … numbers only, never who visited"), dated
  26 September. The figures cover the whole lannacare.org zone, test site and
  staff included, and the tile says that too. Cloudflare Web Analytics was
  the alternative, but it works by adding a script to every page, which is
  closer to what the promise rules out. The tile is grey until
  `CLOUDFLARE_ANALYTICS_TOKEN` and `CLOUDFLARE_ZONE_ID` are set; the query is
  unverified against the live API until then.
