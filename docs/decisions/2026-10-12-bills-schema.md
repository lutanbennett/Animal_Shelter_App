# 2026-10-12 — Bills schema: four owner types, an inbox, per-job bills, a job-cost view

`bills-schema`. Migrations `0188` (enum values) and `0189` (everything that uses them), one PR for two
backlog items (photos of receipts for purchases and clinic visits; bills on maintenance jobs) because
only one migration branch may be in flight. Schema only: the `bills-inbox` and `maintenance-bills`
streams build the screens. "Bills" on screen, never "receipts" (donation receipts are `0168`).

## 1. One owner value per thing, not a single `bill` owner

`attachment_owner_type` gains `clinic_visit`, `stock_receipt`, `bill_inbox`, `maintenance_bill`.
A single `bill` owner would make `owner_id` ambiguous (visit? delivery? job?), so every policy would
have to look the parent up to learn which activity applies. With one value per parent, the policy
reads the activity from `owner_type` alone, exactly as the existing cases do, and a fourth thing a
bill can be for is one more value. It is also what makes "a 2IC who records deliveries but not clinic
visits sees only delivery bills" true in the database. `maintenance` already exists but is the
before/after photo strip (`maintenance.photos`), so bills use their own `maintenance_bill` owner:
that keeps them apart from the work photos, as the brief asked, with no sub-folder trick.

## 2. Maintenance amounts live in their own table

`maintenance_bills` (job, amount, date, note, who). The amount cannot live on the attachment row (it
has no such column, and a bill with two pages is two photos and one amount). A table keeps the sum
honest and Cashflow can read real maintenance spend later. The photo is an attachment owned by
`('maintenance_bill', bill id)`. Delivery and clinic-visit bills need no table of their own: the
amount goes into the existing `stock_receipts.cost` / `clinic_visits.cost`.

## 3. The inbox is a table plus attachments; matching moves the photo

`bills_inbox` holds who/when/date/amount/note; each photo is an attachment owned by
`('bill_inbox', card id)`. Matching updates the photo's owner to the visit, delivery or job and
deletes the card (so the unmatched count is `count(*)`). The update policy's `with check` asks the
new owner's activity as well as the old one's, so nobody can move a photo onto something they may
not write. Anyone holding `stock.delivery`, `medical.visits` or `maintenance.bills` may use the inbox
(an unmatched card has no destination yet); once matched, the destination's own activity governs.

## 4. The job's cost is computed in the database

View `maintenance_job_cost`: the sum of the job's bills once it has any, otherwise the typed
`actual_cost`, plus `from_bills`, `bill_count`, `bills_total` and `typed_actual_cost` so the page can
show both and say which is used. A view rather than a generated column (a generated column cannot
sum another table, and storing the sum could drift). `security_invoker`: a login without
`maintenance.bills` sees no bills and gets the typed number. Note the typed `maintenance.actual_cost`
column itself is still readable by whoever reads the job; hiding amounts from the Heads is the
`maintenance-bills` stream's job in the app, and out of scope here.

## 5. The activity `maintenance.bills`

Both: a row in `catalogue.ts` and a migration inserting it into `permission_activities` (the lint
check requires the pair). Yes/no, area maintenance, sort 62, granted to Management (Admin needs no
cell). Lutan, 2026-10-12: Management only for now; the Who does what grid shows it so it can be widened
without a release. Labels in both dictionaries; row in `docs/roles-and-permissions.md`.

## Not done, on purpose

- `record_attachment()` (definer, 0178) is not changed: it refuses any owner type it does not list, so
  the new values fail closed through it until the screen streams add their cases. The new policies
  already allow direct inserts for the right holders.
- Drive folder (`Bills/<year>/<month>/`) is the app's concern. Bill photos are never public: the
  public-photo proxy and `is_public_drive_file` only know resident and project photos.
- `stock.purchasing` can read a delivery's cost but not (yet) its bill photo; widen if wanted.
- Reading the amount off the photo (OCR) is a future build.
- Applying to dev: waits for the merge, then the planner or release manager applies from the main
  checkout.
