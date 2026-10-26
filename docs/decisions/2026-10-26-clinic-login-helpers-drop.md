# Two of the four clinic-login helpers dropped; the check that said all four were uncalled was broken (2026-10-26)

**Migration 0266 drops `doctor_can_write_attachment(attachment_owner_type, uuid)` and then `clinic_login_owns_visit(uuid)`.** It changes no access: nothing called the first, and the second was called only by the first.

**The brief's premise was wrong, and the cause was in the evidence tool.** `node scripts/check-production.mjs clinic-login-helpers` matched whole words with `'\m' || f.fn || '\M'` written inside a JavaScript template literal, where `\m` and `\M` become plain `m` and `M`. The pattern could never match, so every function read "called by nothing", on production and dev alike. Fixed here (`\m`, `\M`). Read again on both databases, the corrected check finds:

| Function | Called by |
|---|---|
| `doctor_can_write_attachment` | nothing — dropped |
| `clinic_login_owns_visit` | only `doctor_can_write_attachment` — dropped after it |
| `clinic_login_may_edit_doctor` | policies `doctors.doctor_update_doctors` and `doctors.doctor_delete_doctors` — **kept** |
| `current_clinic_resident_ids` | `current_doctor_resident_ids` (kept) and `doctor_can_write_attachment` — **kept** |

Dropping `clinic_login_may_edit_doctor` failed on the dependency, which is how this surfaced; no `cascade` was used.

**What is left, and is not decided here:** the two `doctors` policies grant access through a function and not through a card (`clinic_login_may_edit_doctor` is the clinic-login rule). Whether they are dead, need a card, or are removed is a card-system decision, filed on the backlog. `current_doctor_resident_ids` and `current_user_clinic_ids` were not in scope.

Harnesses: `check-doctor-own-clinic-writes` used the existence of `clinic_login_owns_visit` as its "already applied" marker; it is now a constant `true`. `check-perm-functions` and `check-medical-soft-delete` still name functions that stay, so they are unchanged except a comment.
