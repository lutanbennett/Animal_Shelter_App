# Card re-run: `view_medical` and `book_clinic_visits`, driven (2026-10-27)

`view_medical` had never been driven. `book_clinic_visits` was driven 2026-10-25 (`card-report-medical`), before `0268`. Both were in scope
on both counts: a migration (`0268`, `0269`) and the app half (#972, #973). Nothing was fixed and no card proposed.

**How:** `node scripts/dev-signin.mjs --cards <card> --port 3008`, one login per card, aal1, code at `d63670ef`, dev schema 271 applied.

## The two questions, per step

| card / step | enough to finish the job? | nothing more than the label? |
|---|---|---|
| `view_medical` 0, 1 | yes: tile; `/residents` loads, 91 residents | yes |
| `view_medical` 2 to 9 | yes: Clinic Visits, Procedures, Blood Tests, Prescriptions, Immunizations, Weight, Diet and `/clinics` all open and read | **no, in two places:** "Attach files" on Procedures and Blood tests (upload refused), and Book / Open / Edit on visits (all refused) |
| `view_medical` 10 | refused: `/medical/photos` to `/no-access` | yes |
| `book_clinic_visits` 0, 1 | yes: tile; `/upcoming-visits` loads, clinic named on each row | yes |
| `book_clinic_visits` 2 | **yes, now**: form lists 9 clinics; saved; visit on the resident's tab and in the shelter list | yes |
| `book_clinic_visits` 3 | `TODO` in the walkthrough; what I drove: edit opens and saves, Completed shows | **a judgement:** it can edit and complete, and is offered a Cost box |
| `book_clinic_visits` 4 | refused: `/medical/photos` to `/no-access` | yes |

## What 0268 changed, confirmed by driving

The three 2026-10-25 rows for `book_clinic_visits` (empty clinic list, cannot edit, clinic shown as "—") are **all contradicted**:
the clinic list is populated, the visit opens and edits, and the clinic is named on every row. Marked in place in
`docs/card-access-faults.md`, none deleted. The "two doors" row was not re-established.

## New this pass (nine rows, `## Added 2026-10-27 by claude/card-rerun-view-medical`)

Offered-then-refused controls on `view_medical` (two rows) and `book_clinic_visits` (one row), the Appointments dead end, an Operations
entry not opened, edit and cost on a "book" card, the spreadsheet, two things not driven, and the unanswered walkthrough step 3.

## Not done, said plainly

Operations and Appointments as `book_clinic_visits`, the calendar views, the Cost box, and the visit page's content.
The `check-*` scripts were not touched (owned by `harness-sweep-batch-5`). Backlog item not ticked: it covers 14 cards and this closes two.
