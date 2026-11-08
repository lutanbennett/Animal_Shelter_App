# UAT is a release target, and its guard had to be made real before it could be one

**2026-11-08.** Lutan, the same day UAT went live: *"UAT is complete and is now part of the
standard release process."*

## What was true before this

UAT existed as a thing to finish, not a thing to ship. `docs/uat-finalisation.md` was an
eight-part build list; `docs/release-procedure.md` mentioned UAT twice in 1,069 lines, neither
time as a step. A release deployed test and production.

## What this changes

`docs/release-procedure.md` now names UAT in steps 1, 5, 6 and 7, in the *Who does what* table,
and in a new section at the top saying what UAT still needs once. The order is **test,
production, UAT** — UAT last, because all three Worker deploys run `next build` in the one main
checkout and are therefore strictly sequential, and the build that must never be killed is
Lutan's.

`docs/uat-finalisation.md` is relabelled: done, all eight parts, and now the **rebuild** list
rather than a to-do list. Following its Part 6 for a routine release would push secrets a
release has no business pushing.

## The part that was not documentation

**UAT's release guard did not work, and a guard that cannot check looks exactly like one that
passed.** UAT's Supabase access token cannot read UAT's own database:
`apply-migrations.mjs --env uat` in any mode dies with
`Missing required permission(s): database_read`. So every UAT deploy printed *could not ask uat
which migrations it has applied … continuing WITHOUT the schema check*, and
`assert-schema.mjs --env uat` refused outright. Standardising a release step in that state would
have standardised shipping code to UAT with nothing checking its database could run it.

So `appliedMigrations()` (`scripts/lib/deploy-schema.mjs`) now has **two routes**: the Management
API as before, and, when that cannot answer, **the database itself over PostgREST** with the env
file's `SUPABASE_SERVICE_ROLE_KEY` — reading one table, `schema_migrations`. Measured the same
day: UAT holds every migration its deployed commit carries, which nothing could establish an
hour earlier.

Three details are deliberate:

- **The fallback refuses if `NEXT_PUBLIC_SUPABASE_URL` does not name the project it was asked
  about.** Answering about dev's database while the caller believes it asked UAT's is the one way
  a working guard becomes a lying one, which is worse than the blind guard this replaces.
- **It applies to any environment, not just UAT.** The condition is "the Management API could not
  answer", which is also true of a Supabase blip. Production and test still answer by the first
  route, so nothing about them changes.
- **The pass message names which route answered.** `asked the database directly` is how you know
  the token is still the limited one, rather than discovering it on a release that needs to apply
  a migration.

**It does not fix applying.** DDL cannot go through PostgREST, and the repo has no Postgres
client, so `SUPABASE_DB_PASSWORD` is not an alternative. A release that adds a migration still
cannot ship UAT until the token is fixed — and now it *refuses* rather than warning, which is the
correct behaviour and the reason this is a smaller problem than it was.

## UAT will not mail, and not because somebody remembered a flag

UAT's Worker carries `RELEASE_MAIL_ENV: "UAT"` and a mail binding, and **UAT's database holds a
copy of production's real people**. So before today, a major release deployed to UAT with
`--no-mail` forgotten would have emailed every real admin from a test site. `docs/uat-finalisation.md`
knew this and said *"`--no-mail` matters"* — which is a flag you must remember, and the wrong
shape for a failure that cannot be taken back.

`deploy.mjs` now mails from UAT only when `--mail` is given in words. `--mail` means nothing on
any other environment, `--no-mail` is still written in the runbook as belt-and-braces, and
`--plan` now prints what it would do about mail so the decision is readable **before** the deploy
rather than in a line that scrolls past after it.

## Two things that were quietly wrong, found by measuring rather than reading

- **`purge-cache.mjs --env uat` purged `lannacare.org`,** which since today 301s to production.
  It would have purged a redirect, reported success, and left UAT's cache standing. It now purges
  `uat.lannacare.org`. (`.env.deploy.uat` has no purge token yet, so the script refuses either
  way — but it would have been wrong the moment one was added.)
- **The Pi caveat in step 6 told the reader to confirm a failed deploy against
  `https://lannacare.org/api/version`.** That now answers about production.

## What is left, and whose it is

Three one-time jobs, all Lutan's, none per-release, and none blocking production:

1. `database_read` on UAT's Supabase access token — the only one that stops a release.
2. `lanna-care-uat` in `/etc/sudoers.d/lanna-care-restart` on the Pi, so the UAT Pi build does not
   stop at `sudo systemctl restart` for a password. Per *Who does what*, a `sudo` password is
   **damage to fix, not a handover to add**.
3. `CLOUDFLARE_PURGE_TOKEN` in `.env.deploy.uat`.

## Not done, on purpose

**A direct-Postgres apply path for UAT.** It would mean a new dependency and a second way to run
migrations, to work around a permission that takes two minutes to grant. The token is the fix.

**Deploying UAT *before* production.** UAT's guard refuses code whose notes are not cut, so UAT
cannot be an acceptance gate ahead of a release — it is a mirror that follows one. Making it lead
production would be a change to what UAT is, and that is Lutan's call, not a runbook edit.
