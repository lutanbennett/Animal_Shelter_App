# 2026-11-05: at the cutover, UAT shares the dev database; production keeps its own project

Lutan, 2026-11-05, in chat. Item `#ki6cx`. Runbook: `docs/domain-checklist.md` section E.

## What was decided

- **Production stays on `dbkodyyxxhtygxcxmfcu`.** There is no new production project and no dump-and-restore. This closes `#ki6cx` step 2, P1 and the day's "final copy" step.
- **UAT (`lannacare.org` after the cutover) uses the dev project `qxkmhwybjggxvsfxsxbd`**, the same one the test site uses. Reason, in his words: *"I don't have a free slot so this will be the only option for now"*. The free Supabase plan allows two projects, both in use, and a paid plan is ruled out.

## What follows (all written into the runbook)

- Production's `SUPABASE_URL` and Google sign-in redirect do not change. Only `https://lannacareforanimals.org/auth/callback` is added to the production project's Redirect URLs, and the origin to the Google client.
- Rollback is safer: one production database throughout, so no data is lost at any point.
- UAT holds dev's disposable data, not production's, so P7 and step 6a (the Drive copy and remap) are skipped until UAT has a project of its own.
- **A code change belongs in the cutover commit:** `appEnvForSupabaseUrl` (`src/lib/app-env.ts`) answers `"dev"` for the dev ref first, so UAT would never wear its badge, and `scripts/deploy.mjs` and `scripts/lib/env.mjs` refuse `--env uat` while `UAT_PROJECT_REF` is empty. UAT needs its own signal. `UAT_PROJECT_REF` must not be set to the dev ref, which would label the test site UAT too. **Not written here**: the runbook says what is needed and the release manager makes it with the cutover diff.

## Not established

Whether UAT should send release mail or status alerts against dev's data. The `uat` block is left as it is.

## When it ends

A third Supabase project exists: create it, restore production into it, set `UAT_PROJECT_REF`, run P7 and 6a, and remove the stopgap signal.

**2026-11-06:** UAT now has its own project; see `2026-11-06-uat-own-database.md`. This stopgap ends when that data half lands.
