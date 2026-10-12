# Archiving a medical record is guarded in the database (2026-10-12)

`0187` adds `medical_archive_guard()` as a before-update trigger on `weight`, `prescriptions`, `immunization_records`
and `clinic_visits`. A change to `archived_at` (archive or restore) is refused with `42501` unless the caller holds
`medical.archive`. A caller with no login (`auth.uid() is null`: the service role, the backup, the migration runner) is
let through, as in `maintenance_before_write` (`0182`).

**Defence in depth, not a live hole.** Every screen already asks `medical.archive` before showing Archive or Restore, so
no real user was ever governed wrongly. The gap was a hand-built request to the REST API, which needed only the table's
Edit.

**Nobody loses an archive button.** The trigger asks the same permission the screens ask, so whoever sees Archive today
still does: Admin, Management, the 2IC and the Head of Medical (the last two through their `medical.archive` box). A
doctor never had the button (`2026-10-02-medical-archive-roles.md`: the archive is one-way for them), so the only change
is that a doctor's hand-built request on their own clinic's rows is now refused too. `check-medical-archive-roles.mjs`
case B now asserts that (the trigger refuses, `-1`) instead of the old "database allows it".

**Count.** The backlog item said `medical.archive` appears at four places in `fixed-for-now.ts`; it does (lines 67, 125,
129, 130), but only three are `databaseWider`'s. Line 67 is the doctor's box in `clinicRule`, which is a different,
permanent entry and stays. The app half removes the three.

**Release order.** Nothing in the app reads `0187`, so it may reach production before or after any code. Searched for
anything that archives these rows outside the app: only the check harnesses (`check-audit-undo.mjs`,
`check-medical-soft-delete.mjs`, `check-medical-archive-roles.mjs`), which run with no login or as a role that holds the
permission. No script, migration or backfill on production does.
