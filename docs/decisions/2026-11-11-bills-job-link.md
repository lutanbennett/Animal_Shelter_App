# Bills attaches a bill to a job without getting the job board (#n9z65, 0355)

Lutan, 2026-11-11: *"I think bills should be able to associate a bill with a job but not access the job board."* and, of the shape,
*"In effect it's the same pattern as residents who and where."*

## What changed
- `0355_maintenance_job_picker_view.sql`: view `maintenance_job_picker` (`id, job_code, title, status, updated_at`), gated by
  `has_permission('maintenance.job_picker')`, select granted to `authenticated, service_role`.
- New activity **`maintenance.job_picker`** (yes/no, sort 89; registered in `catalogue.ts` and `permission_activities`). Named for what it
  lets a card do (list jobs to attach a bill to), not for who holds it.
- The `bills` card holds `maintenance.job_picker` instead of `maintenance.jobs` read (`cards.ts`, `card_grants`). No other card holds it.
- `src/app/bills/page.tsx` reads the view, never the table.

## What still asks `maintenance.jobs`
The board, `/maintenance`, `/maintenance/[id]`, new, edit, the enclosure filter, the `/my` tile and the `maintenance` table's own select
policy (`0141`). Untouched. The dashboard and Do maintenance cards still hold `maintenance.jobs` read.

## Proof (dev, a login holding only the `bills` card)
- (a) Still attaches: the picker's own query (`maintenance_job_picker`, the five columns) returns jobs for that login; the attach writes
  `maintenance_bills`, which asks `maintenance.bills` (the card still holds it). The page opened under that login. No bill was waiting on
  dev, so the attach press itself was not driven.
- (b) Kept off the board by BOTH: the Home menu shows Bills only (no Maintenance link; page gate on `maintenance.jobs`), and the rows:
  `select … from maintenance` returns 0 rows for the login, and the view has no wider column.

## Why widening `maintenance_select_perm` to accept `maintenance.bills` was rejected
It would let a Bills login read every column of every job through any query, with only page gates between it and the board. Hiding is the
courtesy, never the security. The view hands over five columns and nothing else.

## Manual
`maintenance-board` (read) now teaches only what a read holder can do; moving, editing, costing, photographing and deleting moved to the new
`maintenance-board-edit` topic (`maintenance.jobs` at edit), with its acceptance-matrix entries. The manual has no Thai file in the tree, so
no Thai was written. `#566lo` is a different fault (a topic's list of examples) and is not closed by this.
