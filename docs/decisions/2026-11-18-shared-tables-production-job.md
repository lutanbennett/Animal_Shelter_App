# The nightly shared-tables check gets its production job, and what unblocked it was the apply

**2026-11-18.** `tenancy-shared-tables.yml` now runs twice a night, once per database. The job itself
was written and pushed on 2026-11-17 (commit `1d974727f`, branch `claude/shared-tables-production`)
and then deliberately left unmerged. This file records why it waited, what released it, and the one
proof that is **not** going to be repeated.

## Why it was parked rather than merged

The check reads the live `pg_catalog` and fails when a table carries no `shelter_id` and no record in
`docs/tenancy-shared-tables-registry.json`. On 2026-11-17 production was eleven tenancy migrations
behind, so the production job would have gone **red every night for a known reason** — and weeks of a
known red is how a check becomes one nobody reads. The branch was therefore held, with no PR, and the
backlog item `#shtci` said so.

## What released it, and the distinction that matters

**`0.47.2` shipped on 2026-11-18**, applying `0390`–`0407` to production. The handover of the day put
a clock on this: *"that reason expires with the APPLY, not with the cut."* The cut is a commit; the
apply and the deploy are separate events, and only the apply changes what the database contains.

Read before merging, rather than inferred from the release record:

- `node scripts/apply-migrations.mjs --status --env production` — **408 applied, 0 pending**, drift 0
  in both directions.
- `node scripts/check-tenancy-shared-tables.mjs --env production` — **113 scoped, 12 unscoped, 12
  recorded**, *every unscoped table is recorded*. `scripts/lib/env.mjs` layers `.env.deploy.production`
  over `.env.local` and that file's `NEXT_PUBLIC_SUPABASE_URL` is `dbkodyyxxhtygxcxmfcu`, so the run
  really did read production.

**Dev answers with the same three numbers, and that is the expected result rather than a sign the flag
did nothing:** the two databases are at 408 with 0 drift, so an identical catalogue is what they
should report. The figures that differ are the ones from 2026-11-17 (`105 scoped, 19 unscoped`), taken
before the tenancy migrations landed.

**One piece of local noise, named so nobody treats it as a failure:** on Windows the script prints
`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c` **after** its verdict
and leaves a junk exit code. It is a libuv teardown crash on this host, not a check result — the
verdict is already printed, and the dev job has run green on `ubuntu-latest` nightly since
2026-11-17.

## The proof that is not repeated, on purpose

`#shtci`'s *done when* asks for a planted unrecorded table to make the check fail, **proved by
planting one rather than by reading the code**. That was done in PR #1660, against **dev**, for this
same script and this same registry. It is **not** repeated here and should never be: planting an
unrecorded table in the live production database to watch an instrument go red is not a thing to do
to production. The dev plant proves the mechanism; the production job only points the proven
mechanism at a second database.

## Two jobs rather than one

Kept from the parked commit's own reasoning, because it is the right shape: a red run then says
**which** database grew an unrecorded table. Neither job passes `--env` — `scripts/lib/env.mjs` exits
2 when `.env.deploy.<env>` is missing, and that file is gitignored and exists only on the developer's
PC — so each job hands the script a URL and a token through the environment instead. Production's
token is the `SUPABASE_ACCESS_TOKEN_PROD` repository secret (created 2026-11-17, scoped to
`dbkodyyxxhtygxcxmfcu`, Database: Read); the production URL is not a secret and is already committed
in `wrangler.jsonc`.

## Where a failure goes

Unchanged by this PR: a scheduled run has no PR to stand on, so it cannot turn one red. GitHub emails
whoever last edited the cron line and shows a red run in the Actions tab
(`docs/decisions/2026-11-15-tenancy-lint-scheduled.md`). `#n4rpt`'s watchdog for red or stale
scheduled runs is what covers a red nobody opens, so nothing new was added for reporting here.

## A correction to the record, found in the parked job's own run

`#shtci` and the planner handover both explain the hold as *production is behind*. The branch's own
run of 2026-11-17 ([44079938155](https://github.com/lutanbennett/Animal_Shelter_App/actions/runs/44079938155))
shows that was only half of it: **both jobs failed.** Production answered `95 scoped, 29 unscoped,
19 recorded` with ten **UNRECORDED** tables, which is the behind-ness. But the **dev** job failed too,
on seven **STALE** records — `bill_kinds`, `blood_test_types`, `immunization_types`,
`procedure_types`, `frequency`, `units`, `group_origins` had each gained `shelter_id` while the
registry still recorded them as unscoped. **So the registry was stale at the same time**, and `main`
has since trimmed its 19 records to 12. Both halves are green today
([44216214331](https://github.com/lutanbennett/Animal_Shelter_App/actions/runs/44216214331)).

**Why that is worth a paragraph rather than a shrug:** the red was read as one cause, and a job held
for a reason that is only partly true is a job that gets merged the moment that reason expires —
while the other half is still broken. What made it safe here is running it before the merge rather
than after.
