# Resetting the test system is a script, not a one-off (2026-11-07)

Lutan: *"Can we clear the test system please, it is so full of test data it is hard to actually
test"*, then *"Please also delete files / photos as well"*, then *"Core system file scan stay like
admin etc but photos, videos, medical records can go"*.

Asked how clean, he chose **back to a bare shelter**: keep the setup, clear the content.

## Why a script and not a hand-written delete

The test system fills up again — that is what it is for. Six weeks of streams had left 118
residents (76 of them the 2026-09-21 load, 42 obvious test rows), 11,126 audit-log entries, 215
throwaway logins and **80 disposable `dev_signin_cards_*` roles**, which is what made Settings →
Who does what unreadable. Clearing it by hand would have had to be re-derived next time, and the
hard part is not the deleting but knowing what to keep.

## What it keeps, and the rule

`scripts/reset-test-data.mjs` holds a KEEP set — the card system, the real logins, the physical
setup, the reference lists, translations, the website's pages and the config singletons — and
clears **everything else**, by listing the keeps rather than the clears. That default is the right
way round: a content table added next month is cleared without anyone remembering to add it, and a
new *setup* table shows up in the dry run's "CLEARED" list, where it is obvious.

## Three guards, and the one that mattered

1. `--env test` and the dev project ref. UAT and production are refused by name; there is no flag.
2. The Drive root must be the **Test bucket**. Production's and UAT's bucket ids are hard-coded
   here purely so they can be refused.
3. No table in the KEEP set may hold a foreign key into a table being cleared.

The second guard exists because of a fault fixed only hours earlier. Until 2026-11-07 all three
environments wrote into **one** Drive folder through one token, and 220 files were named by both
the production and the dev database — so a tester deleting a photo deleted the shelter's
(`2026-11-07-drive-buckets.md`). Had this request come a day earlier, "delete the test photos"
would have destroyed production's. Before trashing anything, each environment's
`GOOGLE_DRIVE_ROOT_FOLDER_ID` was fingerprinted and checked against the three bucket ids: dev's is
the Test bucket, and production's and UAT's are different folders. **Verified, not assumed from
the decision file saying the split had been done.**

The third guard earned itself immediately: `site_content` and `shop_links` were both in the KEEP
set and both hold foreign keys into cleared tables, so `truncate … cascade` would have emptied
them silently. They are now cleared deliberately instead — `site_content` names a featured
resident and `shop_links` a shelter friend, so keeping them would leave the public site pointing
at records that no longer exist. The truncate also dropped `cascade` altogether: every referencing
table is in the list, so a plain truncate succeeds, and a missing one is **named by Postgres**
rather than quietly emptied.

## The audit log, which refuses to be truncated

`audit_log` is append-only by trigger (`0121`) and is the **only** truncate guard in the schema —
checked against the live catalogue, not just the migration files. There is no sanctioned bypass,
deliberately. That guard exists to stop the app and its users rewriting history; an administrator
resetting the test environment is a different act, so the trigger is disabled for exactly one
statement, re-enabled **inside the same transaction**, and asserted enabled at the end of every
run, dry or not. It is named in the script's own comments rather than left to be discovered from
an error.

It is also truncated **last**. Emptying it earlier left 662 rows behind, because the deletes that
follow are themselves audited.

## Two things the dry run caught that reading could not

- **`user_roles` was in the clear list.** Clearing it would have stripped every kept login of its
  role, Lutan's Admin included, leaving no way into the one screen that could give it back. It is
  kept now; only rows belonging to a throwaway login or a disposable role go.
- **`impact_baselines.set_by` cannot be nulled.** Its stamp trigger restores the old value on any
  update that changes no baseline figure — correct behaviour, and it meant the "null the reference,
  then delete the login" approach failed with a bare foreign-key error. The table's three rows were
  themselves set by a dry-run login, so it is cleared with the content. A pre-flight now rehearses
  every null-out in a rolled-back transaction and names any column that still points at a throwaway
  login, so the next case of this reports itself instead of failing on a constraint.

`information_schema` is not good enough for either check: its views only show constraints whose
tables the caller owns, which is exactly how that foreign key stayed hidden. The script reads
`pg_constraint`.

## Looking at the page is a different check from reading the list

After the first pass the database was clean by every count the script printed — and the Residents
page still offered **"Dryrun Zone 1018"** and two **"ZZ Width …"** zones as filters. `zones` was in
the KEEP set and had never been curated.

So the remaining test rows were found by **sweeping every text column of every surviving table**
for test markers and reading the hits, rather than one page at a time. That turned up seven more
tables (`premises`, `bill_accounts`, `bill_kinds`, `diets`, `frequency`, `immunization_types`,
`procedure_types`). The marker list is not in the script: the hits were read and the rows written
out **by name**, because a loose pattern over reference lists takes real rows with it — "Heartworm
Test" is a blood test type and `medical.blood_tests` is a card grant.

`label_sources` and `translations` got a general rule instead, because they are keyed to rows
elsewhere and 69 of `label_sources`' rows describe enclosures that stay: **a translation of a row
that no longer exists is an orphan.** 135 translations and 11 label sources went; the rest were
untouched.

## Drive files are trashed, not erased

`files.update {trashed: true}` — the same call the app makes when someone deletes a photo, and what
every app lookup filters out with `trashed = false`. So the app sees them gone and they are
restorable for 30 days. 462 files under 11 top-level entries. Emptying the bin is Lutan's, in Drive.

Supabase storage was **not** cleared: its one bucket is `facility-maps` (12 objects), and the
facility map is setup.

## What is not reversible

The database half. `pg_dump` is not installed on this machine, so `scripts/backup.mjs` could not
take a dump of dev first and no snapshot was taken. Accepted deliberately: the choice was made
knowing the 76 residents went with it, and dev data is disposable by standing rule. Worth knowing
for next time — **if a dev snapshot is ever wanted before a reset, PostgreSQL's command-line tools
have to be installed first.**
