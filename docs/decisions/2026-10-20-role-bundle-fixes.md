# Head of Maintenance and Head of Medical keep their extra cells

Lutan ruled on 2026-10-19 (all three questions answered "Yes"). Here the database was right and the code
(or the harness's expected list) was short, so the code changed and no cell did.

- **Head of Maintenance keeps `assistant.ask` and `maintenance.photos`.** Added to `do_maintenance` in
  `src/lib/permissions/jobs.ts`. She works entirely on a phone: photographing what she found is most of what
  the maintenance board is for, and the assistant is how someone with no keyboard asks a question. The 2IC
  also holds `do_maintenance`, so her bundle gains the same two cells in code.
- **Head of Medical keeps `facility.enclosures`, `recurring.do_own` and `stock.count`.** Listed in `AHEAD` in
  `scripts/check-medical-jobs.mjs`, not in jobs.ts, because none of her job tiles opens a page that needs
  them. Counting what is left is part of the medication rounds, ticking off her own repeating jobs is how
  rounds are recorded, and seeing the enclosures is how she finds the animal.

These are ruled, not assumed, which is what separates them from "copying today's behaviour into the
expectation". Not touched: the `stock_receipts` over-permission, `check-2ic-role`, and the other reds in
`check-maintenance-role` (translations, `resident_who_and_where`, attachments, another's recurring task).
No migration.
