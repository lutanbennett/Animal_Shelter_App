# 2026-10-13 — Bills on maintenance jobs

`maintenance-bills`. The screens for `0189`/`0190`: no migration.

## Where it lives

On the job page (`/maintenance/[id]`), under the Before and After photos. Both the desk board and the
phone list open that same page, so there is one place to add a bill, not two. The board cards are
untouched: Heads see the board, and a card total would put an amount on a screen they share.

## Who sees amounts: nothing is read, not just hidden

The page asks `maintenance.bills` first. Without it the bills and the job-cost view are **never
queried**, the Bills section is not rendered, and no bill amount is in the page's data. Proved in the
database too: `scripts/check-bills-roles.mjs` now probes reading a bill's amount, the total from
`maintenance_job_cost`, adding a bill and reading its photo as all six principals. Management and
Admin are allowed; the 2IC, Head of Maintenance, doctor and volunteer are refused every one (96
checks).

What a Head still sees is what they always saw: the job's typed Estimated and Actual cost (`0033`).
Those are not bills. The brief's "no amounts" is read as no bill amounts and no bill-derived total;
removing the typed numbers from the Heads would be a separate decision and a regression nobody asked for.

## Two costs, one named

`maintenance_job_cost` already encodes the rule, so the page reads it rather than re-deriving it.
With bills, Actual shows their sum and the Bills section says "the total of the bills is used". If a
cost was also typed by hand it is shown beside it as "not used while the job has bills". Nothing the
person typed is overwritten: deleting the last bill brings the typed number back.

## Matching from the inbox

A card matched to a job becomes a `maintenance_bills` row (amount required, since the job's cost is
a sum), then its photos change owner from `bill_inbox` to `maintenance_bill`. The bill is made first
and deleted again if the photos fail to move, so the card is never lost. The suggestion list offers
jobs that are open or touched in the last 14 days, newest first, only to holders of `maintenance.bills`.

## Left alone

A bill photo's Drive file stays when a bill is deleted, as for an inbox card. The Director's home tile
and nav are not touched.
