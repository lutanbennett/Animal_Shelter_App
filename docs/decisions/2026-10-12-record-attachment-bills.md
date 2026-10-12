# 2026-10-12 — record_attachment() learns the four bill owner types

`bills-inbox` PR 1, migration `0190`. `record_attachment()` (0178) refused any owner type it did not list, so
no bill photo could be filed through the app's normal path. Four `when` arms added, nothing else changed.

- **All four at once, including `maintenance_bill`.** The last is for the batch-3 `maintenance-bills` stream;
  adding it here saves that stream opening a second migration branch for one `case` arm.
- **Each arm asks `bill_owner_can(owner, true)` (0189)** rather than repeating the activities: `stock.delivery`
  for a delivery, `medical.visits` (edit) for a clinic visit, `maintenance.bills` for a maintenance bill, any of
  the three for an inbox card. The table policies and this definer function therefore cannot disagree.
- **Clinic-doctor fences untouched.** The clinic list of owner types still names only resident, blood_test and
  procedure, and `doctor_can_write_attachment()` (0174) returns false for any other type, so a visiting
  doctor who somehow held `medical.visits` is still refused a bill photo by the second fence.
