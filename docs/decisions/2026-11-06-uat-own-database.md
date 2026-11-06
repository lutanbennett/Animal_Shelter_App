# UAT gets its own database (code half)

**Date:** 2026-11-06 · **Backlog:** `#u7d3b` (left open) · supersedes the "stopgap" in
`2026-11-05-uat-shares-the-dev-database.md` once the data half is done.

Lutan built a third Supabase project, **Lanna Care For Animals - UAT**, ref `fsjagxmxjosauwmxwype`,
in a **second Supabase account** (`lutan.bennett1@gmail.com`). That is how three projects exist on the
free plan, so the zero-ongoing-cost rule holds.

## What changed in code

- `UAT_PROJECT_REF` is set. The project alone now tells UAT from dev and production
  (`appEnvForSupabaseUrl`); an unknown project still renders as production, never badged.
- The `NEXT_PUBLIC_APP_ENV` pin, `appEnvFor()` and its registry record are **deleted**: a build can no
  longer be relabelled by a variable. `deploy.mjs` now expects `uat` for `--env uat`.
- `deploy.mjs --secrets --env uat` refuses any Supabase secret found only in `.env.local` (dev's), and
  `--allow-dev-fallthrough` does not override that. The flag still covers the Drive set until `#rqv5c`.

## `.env.deploy.uat` (gitignored, Lutan fills it in)

Keys UAT needs: `NEXT_PUBLIC_SUPABASE_URL` (`https://fsjagxmxjosauwmxwype.supabase.co`),
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD`,
`SUPABASE_ACCESS_TOKEN` (from the `bennett1` account), `GOOGLE_SIGNIN_CLIENT_SECRET`,
`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`, plus the existing `CLOUDFLARE_ZONE_ID`.
Not needed: production's backup, calendar, `ORIGIN_KEY` (UAT is not served by the Pi) and analytics keys.

## Not done: the data half

Needs values only Lutan can read. The token trap: `loadEnv()` lets `process.env` win over both files, so
a shell exporting `SUPABASE_ACCESS_TOKEN` would aim UAT's migrations at the wrong account. Before any
apply, confirm the shell does not export it and that the ref the runner prints is
`fsjagxmxjosauwmxwype`. A production data copy also carries production's Drive file ids; `#rqv5c`
stays open. Until UAT is redeployed with its own values, `lannacare.org` still runs the previous build
against dev.
