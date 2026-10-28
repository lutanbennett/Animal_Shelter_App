# Harness sweep, batch 7: triage after the role columns were dropped (2026-10-28)

**Run:** every `scripts/check-*.mjs` (192 files) once, six at a time, no dev server, against the
**dev** database (`qxkmhwybjggxvsfxsxbd`), at `379902dd` plus this branch's edits. 90 s timeout each.

**Count at the start: 113 green, 77 red, 2 timed out.** (Batch 6, at `244a1731`: 105 / 76 / 15.) After this
PR's fixes: **116 green** (`view-write-grants`, `chip-scan`, `resident-id-search`).

**Fairness of the count.** The 18 fetch-based harnesses need a dev server and were run without one,
so they are *not fairly counted*; they are marked S below. Six at a time on one shared database can
also deadlock (`dead-schema-drop`) or abort Node (exit 3221226505 is a crash after the error was
already printed, not a separate fault). Nothing below was re-run serially except the five named as fixed
or improved.

## Things the brief asked about, answered

- **`check-perm-convert-residents` no longer exists.** `1cb85ccb` deleted it (eight harnesses testing the
  removed role-cell mechanism). So "2 policies do not ask `sees_all_residents()`" cannot be reproduced.
  What it pointed at, read on dev with one query over `pg_policies` for `residents`, `placement_history`
  and `adoption_updates`: the write policies that grant on one bare permission with no row narrowing are
  `residents_update_perm` and `placement_history_update_perm` (both `has_permission('resident.record')`
  at edit, in USING and WITH CHECK, nothing else). The original "two" is not recoverable, so this is the
  best match, not proof. **Filed as a question for the card review, not fixed:** is "edit
  `resident.record`" meant to cover every resident's row and placement history? (The select policies are
  bare by design.)
- **The three `record_intake` seeders:** no `check-*` script of that name exists. #1054 covers them; not
  re-verified here and not touched.
- **`check-hard-coded-security`:** prints `no coded security outside the Admin bypass`.
- **`doctor-cells`** is not a `check-*.mjs` file; not touched.

## Fixed in this PR

| shared cause | cleared |
|---|---|
| **B1: `roles.archived_at` was dropped by `0272`** (role archiving removed); three queries still filtered on it | `view-write-grants` now GREEN. `who-does-what` no longer crashes reading roles (it is red on purpose and still red; its first-line failure was this crash, not its design). |
| **B2: the retired `staff` role** was handed to throwaway logins (`no role with key staff`) | `chip-scan` and `resident-id-search` GREEN. New helper `giveCards()` in `scripts/lib/user-role.mjs` gives a login exactly some cards through a throwaway role with a random key, and removes the role afterwards (dev-signin's leftovers are what produced the 88 orphans). `offsite-chip` now runs to the end but still has one failing expectation (table). |

## The table (every red or timed-out harness)

A = tests a removed mechanism, B = shared cause (fixed above), C = genuine app fault, D = harness wrong,
**S** = needs a running server, not fairly counted, **E** = needs arguments or environment, not a fault,
**?** = classified from the first error line only; body not read. Nothing in a `?` row is a finding.

| harness | bucket | why (dev, first error) |
|---|---|---|
| view-write-grants | B1 fixed | `roles.archived_at` |
| who-does-what | B1 fixed, red on purpose | now runs; doctor cells diverge by design |
| chip-scan, resident-id-search | B2 fixed | `staff` role |
| offsite-chip | B2 then ? | one expectation: `/residents?zone=offsite` omits the off-site resident; unexplained (paging or visibility not checked) |
| medical-card-reads-record | A | calls `sees_all_residents()`, dropped in `0259`/`0264` |
| contact-visibility | A | relation `doctor_contacts` no longer exists |
| volunteer-narrowing | A | relation `volunteer_contacts` no longer exists |
| diets-app, diets-recipes-schema, medical-jobs, medication-rounds, order-and-units, price-free-pickers | A, one cause | diet columns dropped by `0243`/`0260` (`daily_qty_small`, `is_standard`, `qty_*`) and `resident_diets.diet_type_id`; six harnesses, a diet-model rewrite is its own batch |
| diets-servings-app | ?, C or D | forecast delta 1181.25 g vs hand calculation 1531.25 g; arithmetic may be right and fixture stale: read before deciding |
| dead-schema-drop | A, concurrency | asserts a drop already done; deadlocked beside others |
| unit-conversions | A, data | unique index `item_unit_conversions_diet_type_purchase_key` cannot be built: dev holds a duplicate |
| permission-tables, role-can, permission-parity, role-write-policies, maintenance-role, medical-role, perm-convert-photos, perm-convert-admin | A, probable | assert per-role cell answers that no longer define access; restate per card or retire. `perm-convert-admin` also compares against a live audit row count (5548 of 5549), which is D |
| card-grants | D? | `card_grants` has rows `cards.ts` lacks (photo cards, `0279`) |
| features-schema | D | hard-coded "28 cards"; `cards.ts` has 36 and `who_does_what` has no feature row |
| home-cards | D? | `approve_photos` bundle grew (`facility.enclosures`, `photos.resident_manage`): expectation stale |
| card-taps, daily-count, hidden-public-pages-schema, public-stories-schema, photo-approval, appeals-schema, residents-status-chips, two-step-session | ? | stale expectations or live-data drift on dev (series 83 vs count 84; `42P16` re-creating a view); not read |
| doctor-clinic-scope, doctor-multi-clinic, doctor-own-clinic-writes, doctor-report-schema, doctor-resident-scope, doctors, clinics-readonly, clinic-allow-lists | **expected** | all depend on the Doctor test login holding its cards (`current_user_clinic_ids` is `{}`); red while Lutan tests one card at a time. Not faults, not to fix |
| medical-archive-roles, stocktake, placement-guards, prescription-visit-not-future, resident-microchip, donation-receipts-schema, adoption-updates, audit-log, assistant-refused-client | ?, likely A | each logs in on a named role and the RLS refusal suggests that login's cards no longer carry the activity; the card-shaped question is "is a login holding card X refused?". Not read |
| menu-coverage | red on purpose | per-card table prints; left alone |
| access-requests-card, contact-address-fields, donate-buttons, facility-map-editor, map-details, maintenance-bills-page, home-screens-live, medical-jobs-app, page-guards-live, place-order-roles, residents-sort, upcoming-visits-page, user-theme, who-does-what-page, phone-width, residents-export, residents-select-all, security-role-picker | **S** | `ECONNREFUSED` / "nothing is answering"; re-run with the dev server up |
| drive-token, resident-sections, schema-drift, test-plan | E | need env, `--out`, `--against`; `test-plan` is red until this PR's plan exists |
| can-see-drive-file, community-dogs-schema | timeout | over 90 s; not established |
| map-markers | ? | prints "84 markers checked, 0 failures" then exits 3221226505: crash after a passing result |

## What is left for the next batch

- About 25 rows are A or probable A (the diet model and the role-named fixtures are the bulk), about 17 are `?`.
- Re-run the 18 S harnesses with a server up for a fair count.
- **The instruments are role-shaped:** `permission-parity`, `role-can`, `permission-tables`,
  `maintenance-role`, `medical-role` and the `medical-archive-roles` family ask per-role questions.
  Restating them card-shaped is the same work as bucket A.
- `giveCards()` exists now; use it in place of `giveRole()` for any fixture.
