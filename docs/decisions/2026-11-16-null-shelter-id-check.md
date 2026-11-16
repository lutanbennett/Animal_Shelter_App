# A check for null `shelter_id` (#stmp5, step 4 of four)

**Built: `scripts/check-null-shelter-id.mjs`, with a planted-violation test. Not wired into CI, and why. `#stmp5` stays open: step 3 (`NOT NULL`) is outstanding.**

## Why neither existing instrument answers the question

`check-tenancy-catalogue.mjs` lints ownership of views, security-definer functions and tables (`definer_all`); it never reads a row. `check-tenancy-canary.mjs` plants a second shelter's rows and diffs what `anon` reads; it proves nothing leaks, not that every row has an owner. Neither counts nulls.

## How the table list is derived

The service role reads PostgREST's OpenAPI document and takes every exposed object with a `shelter_id` property. No hard-coded list, so a table that gains the column later is checked without anyone editing the script. Views exposing `shelter_id` are counted as well (a null there is a null underneath). This avoids the 21/8/9 "ambiguous vs not tenant" question entirely: a table with no `shelter_id` column cannot hold a null one, so nothing needs deciding. It also means a tenant table that never got the column is **not** reported here; that is the catalogue lint's business.

## Where it runs, and why not CI yet

It needs only `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, which the CI job "Check the public tier" already holds, so it *could* run there with no new secret. It is **not wired**, because **dev reads red today**: 5 `audit_log` rows and 1 `user_roles` row carry a null `shelter_id`, all written by a disposable `dev-signin` login (the service role sends no `x-shelter-id`, so the `current_shelter_id()` default is null). A blocking step would turn every PR red, and `dev-signin` will keep making more. Wiring waits for the planner: either `dev-signin` stamps its rows, or Part 7 gives trusted callers a shelter. No workflow was touched.

## What it deliberately does not cover

`NOT NULL` (step 3, waits for Part 7), whether a non-null value is the *right* shelter, rows reached only by the service role's own writes after the check ran, and tables lacking the column.

## Proof

`scripts/check-null-shelter-id.test.mjs` runs the script against a stub PostgREST: clean gives exit 0 and one summary line; a planted null gives exit 1 naming that table only. Against real dev it exits 1 naming `audit_log` and `user_roles`. It took about 28 seconds for 95 objects (one request each), so it is slow for a per-PR step.
