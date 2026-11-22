# Test gets an optional `.env.deploy.test` (`#tstok`, option 2)

**Date:** 2026-11-22. Extends `2026-11-16-deploy-cloudflare-api-token.md`; contradicts none of it.

**The asymmetry.** Production and UAT each had `.env.deploy.<env>` and so could hold their own
`CLOUDFLARE_API_TOKEN`; `envFile("test")` was hard-wired to `.env.local`, which that decision forbids
for a token (`worktree.mjs` copies it into every worktree). So test alone depended on wrangler's
browser login, which expired during the `0.47.10` release and cannot be retried non-interactively.

**What changed.** `scripts/lib/env.mjs`: `envFile("test")` is now `.env.deploy.test`; `loadLayers()`
and `loadEnv()` read it like any other environment. `.gitignore` already covered `.env.deploy.*`;
`worktree.mjs`'s copy list is untouched, so the token is not copied per worktree.

**The decision: test's overlay is OPTIONAL, and a missing file is silent.** `loadEnv()` exits 2 for a
missing or empty overlay on uat/production; test is exempt (`OPTIONAL_OVERLAY`) and falls back to
`.env.local` alone with no warning. Had it been required, `--env test` (the default for most scripts)
would break for every developer and fresh worktree on merge. A warning was rejected: scripts run
constantly and would print it every time to people who have nothing to fix. `deploy.mjs` already
prints which credential is in use (`wrangler auth: …`), which is where the absence shows when it matters.

**Proved without a real token** (`scripts/env-test-overlay.test.mjs`, dummy values in a temp dir):
`envFile("test")`, fallback with no file (no exit), and the file beating the shell for the account
keys. Also run: `deploy.mjs --env test --plan` with a temporary dummy `.env.deploy.test` printed
`API token from .env.deploy.test`; without it, the OAuth-login line. The temporary file was deleted.

**The token is Lutan's to create.** Same three permissions as in the 2026-11-16 decision. They are
account-level (`Workers Scripts → Edit` cannot be narrowed to one Worker), so a test token can deploy
production too; that is why it is one token, not three, and why this file is one more copy on disk.
**Proof owed:** he creates it, pastes it into `.env.deploy.test`, and one `--env test` deploy is run.
