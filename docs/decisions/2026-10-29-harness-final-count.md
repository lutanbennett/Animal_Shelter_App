# One fair full count of the harnesses — 2026-10-29

**Database: dev (`qxkmhwybjggxvsfxsxbd`), 2026-10-29, one dev server up on :3001.** 183 of the 184 `scripts/check-*.mjs`
(`check-phone-width` excluded by name, per the brief), each under `timeout 60`, name echoed first, run in the background.

## How the count was taken, and one mistake in it

The first pass gave every check `--port 3001`. About twenty read that as a file name and crashed (`ENOENT ...\--port`), so the first
43 reds were mostly mine. The 36 non-argument reds were rerun with no arguments. **Only the rerun is the reading.** Two further
checks (`admin-by-flag`, `home-screens-live`) timed out at 60 s in the first pass while four other jobs ran at once, and passed on the rerun.

## Result: 168 green, 15 not green, 2 repaired in this PR, 4 genuine faults left

| Check | Bucket | Note |
|---|---|---|
| `drive-token`, `schema-drift`, `test-plan`, `migration-numbers`, `new-policy-role-names`, `production` | needs args or env | usage / env message, exit 1–2 |
| `resident-sections` | snapshot tool | needs `--out` or `--compare`; ~6% noisy |
| `menu-coverage` | red on purpose | 24 pages no single card opens and reaches, unaccepted |
| `doctor-clinic-scope`, `doctor-multi-clinic`, `doctor-own-clinic-writes`, `doctor-report-schema`, `doctor-resident-scope`, `doctors`, `clinics-readonly`, `clinic-allow-lists` | red on purpose | Doctor's cards are being tested one at a time; not touched |
| `public-views` (72 s), `residents-sort` (68 s), `access-requests-card` (140 s) | not run to completion at 60 s | all three **pass** given time; they are slow (browser or many logins), not broken |
| `can-see-drive-file` | not run to completion, **repaired here** | see (2) below |
| `daily-count` | genuine data fault, **tolerated here** | see (3) below |
| `diets-servings-app`, `map-markers` | **genuine fault** | every assertion prints ok, then `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING) ... async.c` and exit 127: a Windows teardown crash turns a pass into a red |
| `security-role-picker` | **genuine fault** | 62 s; the Thai-label checks pass, then clicking the create form's submit button times out: a fixed full-screen overlay (`fixed inset-0 z-40 ... bg-black/60`) intercepts pointer events. App or harness not established |
| `who-does-what` | **genuine fault, not diagnosed** | exits 1 after listing SHARED / INERT cells; the cause was not read to the bottom |

## (2) `can-see-drive-file`: environment grew, app fine

It does one login per `roles.key` and, per login, runs the function over every Drive id, and it evaluated `new_see` three times and
`old_see` once per id. Measured: the function costs ~4 ms a call (400 ids, one login: 1.6 s). What grew was the login count: **46 of the
54 role keys on dev are disposable `dev_signin_cards_*` roles** that `dev-signin --cards` leaves behind, so the run went to ~7x and hit
the database statement timeout. Fixed twice over, not by a longer budget: those roles are skipped (they read cards, not keys, so add no coverage) and each function
is now evaluated once per id. 65 s with the skip alone, **31 s** with both; all 13 principals agree.

## (3) `daily-count`: dev row left, check narrowed

The row (`placement_history` `4b50d202…`, resident `853951b2…`, Foster 2026-05-31 to 2026-09-06, enclosure Unassigned not Fostered) cannot be fixed:
`enforce_placement_history_immutability()` allows only `notes` and `end_date` to change, and dropping that guard on a shared database for one
imported row is the wrong trade. The check now excludes that one id, by id and nothing wider, with the reason in the file. A new placement of that shape still fails it.
(The other live stream was told before the attempted update; the update was refused, so no dev row changed.)

## (4) The `scope_residents` claim

`2026-10-29-harness-q-rows.md` said the column "still decides which resident rows a login reads". It does not: `0264` dropped
`may_open_resident_record()`, `roles.scope_residents` and the clinic-scoped `doctor_read_residents` policy; the registry already says so. **What governs a resident row now:**
`residents_select_perm` asks only `has_permission('resident.record','read')`, a card with no clinic narrowing, so "a doctor outside the
treating clinic" has no behaviour left to assert. The principal stays out of `check-card-taps`, now for that reason, written in the check. The Found, not fixed bullet is marked
SUPERSEDED in place.

## Is the sweep item ticked? No.

Four genuine faults survive (`diets-servings-app`, `map-markers`, `security-role-picker`, `who-does-what`), so the item stays open and is rewritten to name exactly those. Not
repaired here: the brief forbids a repair campaign.
