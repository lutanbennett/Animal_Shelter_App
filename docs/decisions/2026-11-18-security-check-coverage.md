# Two instruments that did not watch what they claimed (#ccwnx, #srreg)

2026-11-18, stream `security-check-coverage`. Nothing here was Lutan's to decide; it records how the two gaps were closed and what was left out on purpose.

## #ccwnx: the card-catalogue write check now runs, nightly, on dev and production

`scripts/check-card-catalogue-writes.mjs` (PR #1676) passed and nothing ran it. Two jobs, `card-catalogue-writes` (dev) and `card-catalogue-writes-production`, were added to `.github/workflows/tenancy-shared-tables.yml`, beside the two existing nightly jobs and on the same cron line (07:31 UTC). They are separate **jobs** in an existing workflow rather than steps of the shared-tables jobs or a new file: a red one names the check that failed (the file's own warning about one job failing for two reasons), and it is not a fourth mechanism. As there, a failure is an email to whoever last edited the cron line and a red run in the Actions tab; the `#n4rpt` watchdog covers red or stale scheduled runs.

**Production is included, which the brief did not expect.** It said `0407` was not on production and a production run would go red for a known reason. By the time this was built, `0.47.2` had shipped: `docs/releases/2026-11-18-0-47-2.md` records 408 applied, 0 pending, drift 0/0, and `SUPABASE_ACCESS_TOKEN_PROD` already existed as a repository secret (the shared-tables production job uses it). So a production nightly is truthful: it reports a writable catalogue only if something has really regressed. No secret was requested.

**Proof the check can fail, not only that it passes.** The check's own three queries were run through a harness that wraps each in a `do $$ … $$` block which creates `zz_planted` (a permissive INSERT policy on `card_grants`), runs the query, and ends with `raise exception`, so the planted policy is rolled back by construction and was never committed. Planted: `FAIL card_grants has a permissive INSERT policy zz_planted`, exit 1. The same harness unplanted, and then the real unmodified check afterwards: all three `ok`, exit 0. The workflow was also dispatched by hand (`gh workflow run tenancy-shared-tables.yml`, run 44219577834): all four jobs `success`.

## #srreg: the registry states its scope, and `worker/` is recorded per function

Counted on 2026-11-18, before changing anything:

| Class | Count | Recorded before | Now |
|---|---|---|---|
| (a) `src/` `createAdminClient()` calls | 88 in 38 files | yes, per call | yes |
| (b) `worker/` functions reading `env.SUPABASE_SERVICE_ROLE_KEY` | 9 in 5 files | file level only (`hard-coded-security-registry.json` `serviceRoleSites` named the five files) | **per function, in `workerSites`** |
| (c) `scripts/` files reading `SUPABASE_SERVICE_ROLE_KEY` | 46 | no | **out of scope, stated** |
| (d) security-definer or trigger functions, plus `pg_cron` | 91 functions, 3 cron jobs (dev) | no | **out of scope, stated** |

The brief's premise needed a correction: `check-hard-coded-security.mjs` already scanned `worker/` for the key, but only to name the five files. What no instrument held was a record per writer with a reason.

**What changed.** `docs/service-role-sites-registry.json` gained a `scope` block (a status and a reason for each of the four classes, and a count for each class left out) and `workerSites`. `scripts/lib/service-role-sites.mjs` gained `findWorkerSites()`: a site is a function that reads `env.SUPABASE_SERVICE_ROLE_KEY` in code (comments, tests and a message that only names the variable do not count). `scripts/check-service-role-sites.mjs` fails on an unrecorded or stale worker site, a record with no reason, or a missing scope statement. `check-hard-coded-security.mjs` now reads the same `scope` (it fails if a class has no statement) and prints the out-of-scope classes and counts with every run, so a green run cannot be read as covering them. The boundary lives in the registry, not in either script.

**Why (c) and (d) are out and not recorded.** (c) is 46 developer and CI scripts against the dev project; recording them one by one is 46 records that rot and covers no path a shelter user can reach. (d) is already enumerated from the live catalogue by `scripts/check-scheduled-writers.mjs` (owned by `scheduled-writer-visibility`; read, not edited), which has a `--strict` gate. A static registry would duplicate it and go stale at every migration. Either can be brought in later; the registry says so on its face.

**One honest limit of (b).** Eight of the nine worker functions do not write by themselves: four pass the key as a bearer token to the app's own routes (which are recorded under `sites`), one compares it, one calls a lookup function, and two are the REST helper for the dictionary table. `runLabelDrafts` signs in as a label login and does not use the service key, so it is correctly not a site.
