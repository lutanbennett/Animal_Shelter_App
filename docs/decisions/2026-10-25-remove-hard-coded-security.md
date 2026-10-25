# Removing the role-keyed security from the app (2026-10-25)

Branch `claude/remove-hidden-security-invisible-failures`. Lutan, 2026-10-25: *"REMOVE all hard coded security NOW."* and *"I want it all gone right now."*
The rule is in `CLAUDE.md` ("Hard-coded security is forbidden"). This records what was removed, what was found not to be a breach, and what the database half still holds.

## What went, and what replaced it

| # | was | now |
|---|---|---|
| 1 | `roles.opens_app` (30 places) | `entersApp(perms)` in `can.ts`: Admin, or a login that holds at least one cell. A role with no cards is not in the app. `/residents` asks `resident.record` at read, which the `view_residents` card gives. |
| 2 | `canUseBills` refusing a clinic login | the clause is gone; three card-derived checks remain. Same clause removed from `mayFileBill` (`bills/upload.ts`), `matchBillToJob`, `maintenance/bills-actions.ts` and `maintenance/[id]/page.tsx`, which repeated it. |
| 3 | `cardOpens()` / `opensAny` | deleted. A card opens one page. `book_clinic_visits` opens `/upcoming-visits`. |
| 4 | `route.scope` and the clinical test in `canOpen` | deleted, with the same test on the seven pages' own guards (`/appointments`, `/upcoming-visits`, `/medical/diets`, `/medical/photos`, `/medical/weight`, `/operations/feeding-list`, `/operations/medication-list`), so a page and its tile cannot disagree. |
| 5 | `scope_residents` / `scope_contacts` / `scope_photos` (and `scope_clinical`) in the app | the four scopes are gone from `Permissions`. `contactRelation()` asks `contacts.browse` only. `loadClinicScope()` asks the login's own clinic links, not a role column. The photo "mark as posted" buttons ask the activity only. |
| 6 | `OUTSIDE_REGISTRY` | all six pages obey the rule. `/assistant` and `/my` untouched. |
| 7 | `JOBS_OF_ROLE` | deleted with `jobsOfRole`/`bundleOfRole`. `bundleOfJobs(keys)` is kept for the card/job equivalence test. Jobs are cards by being in `JOBS`; which a role holds is data (`role_cards`). |
| 8 | `CURATED_HOME` / `managementDay` | deleted. Management is drawn from its cards like every role. |
| 9 | the silent drop in `cardTile()` | `cardTile()` still draws no tile for a page the role cannot open (a tile would invent access), but `cardsWithoutTile()` names each such card and `/home` says so in plain words: "Cards that open no page for you". Reuses `tileBlock()`, the same function Who does what shows. |

The roles' home for a role with **no cards** is the derived home from its cells. The job-based home the Head of Medical, Head of Maintenance and 2IC had without cards is gone.

## `page-rules` and `opens-any-in` were never breaches

The registry listed 45 page rules and called them the big one. A page rule says "this page needs activity X at level L". Whether a role holds X is `can()` over `role_permissions`, which since `0257` the database computes from `card_grants` alone. The only test in `routes.ts` that was *not* card-derived was `route.scope`, now removed. `opensAnyIn` inherits `canOpen`. So no new cards were needed, and the registry now says so. I agree with the planner's reading and checked it: every remaining `canOpen` path ends in `can()`.

## Choice made on #9

Surface the held-but-unopenable card on the person's own home, in plain words, rather than draw a tile that leads to a refusal. Who does what already shows the same cause per card through `tileBlock()`.

## Admin

Recorded in `CLAUDE.md` and as `outsideTheCardSystem` in the registry; `can.ts:67` and the 41 `isAdmin` references are untouched. See Lutan's ruling there.

## What the database still holds (scope of the follow-on schema PR; not touched here)

Functions and policies that read a role column: `sees_all_residents()` (`scope_residents`; 0144, 0179, 0196), `on_volunteer_floor()` (0179, 0180) and `may_open_resident_record()` (0249), `sees_all_clinical()` and `is_clinic_login()` (`scope_clinical`; 0135, 0136, 0140, 0167, 0230), `sees_all_contacts()` and the `volunteer_contacts` / `doctor_contacts` views (`scope_contacts`; 0126, 0147, 0155), `private.has_app_access()` (`opens_app`; 0132), `can_use_bills_inbox()` (0189, 0240) and `record_attachment()` (0174, 0190), `sees_all_translations()`, and the photo views (`scope_photos`; 0152). Each refusal that results is a row in `docs/card-access-faults.md`. Also still role-keyed in the app and **not** in the brief's list: `Permissions.scopes.seesLoginEmails` (`roles.sees_login_emails`). Named for the schema PR.

## Test fixtures

`scripts/lib/test-role-jobs.mjs` holds the three roles' job lists for the live-database checks only. It is a fixture copied from `role_cards`, not application code.
