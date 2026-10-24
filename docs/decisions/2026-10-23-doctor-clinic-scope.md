# A doctor login could write outside its own clinic: 0253 (2026-10-23)

Backlog item from `check-scripts-doctor-triage` (#890, `2026-10-23-doctor-harness-triage.md`), which proved the fault with real queries through RLS. This is the fix. Policies only; no `src/`.

## The two policy families

1. `bulk_appointments_{select,insert,update,delete}_perm` (0147) asked only `has_permission('visit.book')`.
2. `attachments_{select,insert,update,delete}_perm` (0189) sent `clinic_visit` owners to `bill_owner_can()`, which asks only `medical.visits`. Every attachment on every clinic visit, bills included, was reachable.

Policies OR together, so the clinic-scoped doctor policies (`vet_write_bulk_appointments`, `doctor_*_visit_reports`) never got to refuse.

## Why 0230 opened it

`0230` (Lutan's ruling of 2026-10-19, `2026-10-20-doctor-medical-cells.md`) gave `doctor` `visit.book` and `medical.visits` at level 2 and said "scope kept by the existing policies". True for tables 0182 clamped (`clinic_visits_insert_perm` is `visit.book AND sees_all_clinical()`); false for these two.

## Intent

Not deliberate. The ruling authorised the cells, not writing at another clinic, and `0220`'s header says a doctor "never writes or reads a BILL". That line settles it.

## The fix, and where

Add `and (select sees_all_clinical())` in the 0182 shape: to the four bulk policies, and to a new `clinic_visit` arm in the four attachments policies.

**Chose the attachments policies, not `bill_owner_can`.** `bill_owner_can` is also asked by `record_attachment()` (0190/0217/0220), which already bounds clinic logins itself, and mirrored by `src/lib/bills/upload.ts`. Changing it would widen the blast radius for no gain. The doctor keeps own-clinic reports through `doctor_*_visit_reports`, which admit `purpose = 'report'` at own-clinic visits only.

## Who still passes

Admin and Management hold `sees_all_clinical()` and are asserted to still read and write. **Head of Medical was named in the brief as a role to keep; she holds neither `visit.book` nor `medical.visits` on dev (9 cells, read live), so she never passed these policies and 0253 cannot change her access.** A doctor still reads other clinics' bulk rows, read-only by design (0110); the new harness asserts that is unchanged.

## Consumer header

`-- consumer: none`: RLS policies are not columns, views or functions read by app code (`2026-10-02-migration-consumer-header.md`).

## Production

**Production was affected** (252 applied, `0230` among them, read 2026-10-23 16:00). **Merging this PR does not fix production: `0253` must be applied to production, which is Lutan's step.**

## Not done, on purpose

Other `_perm` policies may share the unscoped shape. They were not audited here; a permissions sweep is its own programme and only one migration may be in flight.

Verification: `check-doctor-own-clinic-writes`, `check-doctor-report-schema`, `check-doctor-multi-clinic` and the new `check-doctor-clinic-scope` all HARNESS-OK; `check-medical-role` 88/88. No harness assertions were changed.
