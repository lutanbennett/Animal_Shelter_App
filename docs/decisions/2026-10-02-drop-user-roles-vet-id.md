# 2026-10-02 — Dropping `user_roles.vet_id` and `current_user_vet_id()` (0127)

**Context.** `0125` made a vet login's clinics the active clinics of the doctor it
is linked to, and kept `user_roles.vet_id` as a transition source unioned into
`current_user_vet_ids()`. The feature PR (#289) moved Settings → Security onto the
doctor link. This closes the arc: the column, its check, its trigger and the
singular function go.

**What was found, and how it was handled.**

1. **Legacy logins on dev: 2.** Vet logins with `user_roles.vet_id` and no linked
   doctor: Lutan's own test vet account and a leftover `scope-vet-…@example.test`,
   both at the same clinic. Dropping the column would have left both seeing no
   residents with no error anywhere (`0108`'s scoping). The migration back-fills
   instead: for each live vet login with the column set it creates a doctor named
   from the login (full name, else email), links `vet_doctors.user_id` and links the
   doctor to that clinic (an existing doctor of that login is just put at the clinic).
   After applying, both dev logins are linked, each with an active link at its clinic.
   The name is a label an admin can correct on the clinic's Doctors page.
   **Production was not read.** The count there is unknown; the same back-fill runs
   for whatever is found, so the drop is safe either way, and the production release
   record should note how many it created.
2. **No SQL caller of the singular function was left.** Checked against the dev
   catalogue (function bodies, policies, views, triggers) and the migration history:
   `0108`, `0110` and `0124` called it, and `0125` had already moved all of them onto
   `current_user_vet_ids()`. The check harness now asserts zero catalogue references
   rather than relying on this note.
3. **What now guarantees what `user_roles_vet_id_only_for_vets` enforced.** The check
   existed so a non-vet row could not carry a clinic. A clinic is now reached only
   through a doctor linked to the login, and `current_user_vet_ids()` returns the empty
   set unless the login is a live `vet` account, so a link on a non-vet login grants
   nothing. Who can set the link is the `0125` trigger: an admin at aal2 only. The
   check is redundant, not simply removed.

**Code in the same PR.** The brief said `src/` no longer read the column. It did, in
one place: Security's page and actions, to show "Clinic set the old way" and to carry
that clinic across when linking. Dropping the column without removing those reads
would have broken the page, so they went in this PR, with the manual sentence and the
two dictionary strings for it. Deploy order for production: this migration and this
code go together; release 0.13.0, live today, still selects the column.

**Harnesses.** `check-doctor-multi-clinic.mjs` now runs 0127 and re-adds the column
inside its rollback transaction, so the back-fill is exercised before and after the
real apply. Six other harnesses built vet fixtures with the column; they now link a
doctor. `check-medical-soft-delete.mjs` no longer replays `0124`, whose function
bodies called the dropped function (and had been superseded by `0125`); it asserts the
live definitions, as the `0108` and `0110` harnesses already did.
