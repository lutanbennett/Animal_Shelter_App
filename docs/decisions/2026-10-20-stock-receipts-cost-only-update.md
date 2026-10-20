# A delivery can change its cost and nothing else (0235)

**Found by** `check-2ic-role` on 2026-10-19: `update stock_receipts set note = …` succeeded for admin,
management, the 2IC and the delivery lead, though the harness (0145 C8) says a delivery is never edited —
a wrong one is deleted and recorded again, so the history shows the correction.

**The conflict.** `0191` added the update policy on purpose: the bills inbox writes a bill's cost onto an
existing delivery (`src/app/bills/actions.ts`, `matchBill`). The policy is whole-row, so it also let
quantity, item, supplier, date and note be rewritten in place.

**Ruling: the design is right, the policy was too wide.** 0235 keeps the 0191 policy (RLS still has to allow
the update) and adds a before-update trigger, `stock_receipts_cost_only`, that refuses any update changing a
column other than `cost` (error 42501, "delete it and record it again"). The arrival figures can no longer
change at all. Cost edits are the one exception; they are still recorded by `audit_stock_receipts` (0195).
Chosen over dropping the policy because that breaks the bills inbox.

Residual: a cost can still be corrected in place, with the audit row as its only trace. Accepted: a bill
arriving after the delivery is the normal case, not a correction of arrival figures.

## The other three findings: the expectation was stale, not the policy

None is an over-grant. Each was checked against the policy that grants it.

- **`attachments` readable by the delivery lead (`dl`).** 0189 `bill_owner_can`: owner type `stock_receipt`
  needs `stock.delivery`, so the lead sees a delivery's bill photos. Scoped to that owner type; resident,
  blood-test, procedure and maintenance attachments stay refused. Harness expectation updated.
- **`attachments` readable by the doctor.** 0220 `doctor_read_visit_reports`: a clinic login reads
  `purpose = 'report'` attachments on visits at its own clinic. Written after the harness line. Updated.
- **`resident_who_and_where` readable by admin and management.** 0192 deliberately widened the view's filter
  to `on_volunteer_floor() or sees_all_residents()`; its columns are a subset of what those roles already read
  in `residents`. Updated in both harnesses.

The `change a delivery` expectation is **unchanged** (nobody), and a new probe asserts the cost write is
allowed for the stock.delivery holders.

## Reported, not fixed (out of scope)

`check-maintenance-role` still fails two checks: `translations of anything else` (Head of Maintenance reaches
1 row) and `mark another's recurring task done as doctor` (allowed, expected refused). The second may be a
real over-grant and deserves its own item.
