# A dev-only step-up to aal2 for a scripted login (#dvaal)

Lutan, 2026-11-19, offered three options, chose a dev-only step-up path.

## How aal2 is decided here (read, not assumed)

- The `aal` claim in the access token is minted by Supabase Auth (GoTrue) only, and only after a TOTP code for a factor
  the login owns is verified (`mfa.challengeAndVerify`). A password gives `aal1`. Nothing in this repo can write the claim.
- The app asks it two ways: `0411`/`0100` restrictive policies read `auth.jwt() ->> 'aal' = 'aal2'` in the database, and
  `src/lib/auth/two-step.ts` `getAssuranceLevel()` verifies the token with GoTrue and also requires the login to have a
  *trusted* factor: `app_metadata.two_step_factor` equal to the factor id (or a factor from before 2026-10-01).
- `/admin/security/verify` (`confirmTwoStep`) is the screen a person uses: it checks a 6-digit code against the login's
  own factor. A first enrolment needs a window opened from outside the session (`two_step_setup_until`, service role only).

## Answer to the brief's open question (deliverable 10)

A real TOTP factor is needed, but not a human's authenticator: a script can enrol a factor on a throwaway dev login,
compute the RFC 6238 code from the secret GoTrue returns, and verify it. That is exactly what an authenticator app does
(`check-two-step-session.mjs` already did it for a measurement). Nothing was invented around the gate; GoTrue still mints the claim.

## What changed

- `scripts/lib/dev-aal2.mjs`: the helper (TOTP, `stepUpToAal2`, guards).
- `scripts/dev-signin.mjs --aal2`: signs in as before, then steps up. Works with a role or `--cards`. A fresh factor each run.
- `scripts/check-dev-aal2-absent.mjs`: the proof. `docs/release-procedure.md` runs it before any deploy; `CLAUDE.md`'s dev sign-in step mentions the flag.
- No `src/` change, no migration.

## What was NOT loosened

`0411`'s and `0100`'s policies, `two-step.ts`, `confirmTwoStep`, the setup-window rule, and cards and roles. The `--aal2`
login is given no role or card by this; to press the product-admin screen it still has to be placed on the list
(`scripts/add-product-admin.mjs`).

## How dev-only is enforced, and why it is proof not intent

There is no deployed code path to switch on: the helper is a script, imported by `dev-signin.mjs` alone, and `src/`, `worker/`
and the config never mention it. A flag or env var in the app would have been rejected: production's behaviour would then depend on
a value that could be set anywhere. Inside the script, `assertDevProject` (pinned ref) and `assertDevLogin`
(`dev-signin-*@example.invalid`) run before any factor is touched. `check-dev-aal2-absent.mjs` proves each of these, and with
`--env production|uat` reads the live project for any dev-signin login. It was shown to fail on a planted stray mention and on a
planted migration that drops an aal2 policy.

## Not in `hard-coded-security-registry.json`

It grants and denies nothing in the app or database, and no scanned file contains it, so there is no rule to record. Adding
an entry would make a script look like access control. The check script is the record.

## Production and UAT proof: not done from a worktree

Planner or Lutan runs, from the main checkout: `node scripts/check-dev-aal2-absent.mjs --env production` and `--env uat`.

## The waiting `pending:` lines (not edited; drivable now)

The four plans #1723 names: `docs/test-plans/shelter-management-app.md`, `shelter-management-schema.md`, `shelter-write-app.md`, `shelter-admin-role-app.md`; the release plans `cut-release-0-47-3.md` and `cut-release-0-47-4.md`
(and `record-0-47-4.md`, which repeats 0.47.4's). Drive with `node scripts/dev-signin.mjs <role> --aal2 --port <port>`.
Three further #1729 findings (no screen sets `display_name`/`short_name`, `product_admin_set_shelter_receipts` has no caller,
no way to create a first login) are screen work, for the planner.
