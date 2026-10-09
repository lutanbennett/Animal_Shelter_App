# A clinic login's access is an allow-list, never "everything except"

**Date:** 2026-10-09 · **Stream:** `close-the-remaining-over-grants` · **Migration:** `0174_close_the_remaining_over_grants.sql`
**Decided by:** Lutan, 2026-10-09 (both questions, raised by `close-the-over-grants`)

## What was wrong

The last two findings of the dynamic security assessment
(`docs/security/security-assessment-2026-10-09-dynamic.md`) had the same shape: a rule for the doctor
(clinic) login written as **"everything except the residents case"**.

- The four `doctor_*_attachments` policies (`0110`, carried by `0167`, renamed by `0172`) let a clinic login
  through when `owner_type <> all ('resident', 'blood_test', 'procedure')`, intending "the other types are
  someone else's policy". `doctor_can_write_attachment()` likewise ended `else true`. So **project and
  maintenance** photo records, which nobody had thought about for a clinic, fell through: a doctor's JWT read,
  renamed and deleted all 146 on dev and inserted new ones, including through `record_attachment()`.
- `doctor_read_translations` was `table_name <> 'residents' or <resident in scope>`: the doctor read the Thai
  text of maintenance jobs, recurring jobs, project folders, Shelter Friends and site pages.
- `private.app_users` blanked a clinic login's view of emails, but not names, roles or `archived_at`, so an
  outside clinic listed all 64 logins and who is Admin.

## What we decided

1. **Clinical records only.** The policies name `resident`, `blood_test` and `procedure` and nothing else;
   `doctor_can_write_attachment()` ends `else false` and checks the resident's write scope itself. A
   translation is readable by a doctor only when it is a resident's, for a resident in the doctor's read scope.
   Project photos are the public website's pictures; a clinic has no business with them.
2. **A clinic login lists itself and its current clinics' doctors.** Everyone else's view of `app_users` is
   unchanged; in particular **volunteers** keep the full list, because the recurring-jobs pickers read it.
   The narrowing asks `is_clinic_login()` (a role scoped to its own clinic), not the legacy enum, so it does not
   touch any role that merely borrows `volunteer` as its legacy role.

## Why an allow-list, when it looks like needless strictness

A future reader will see `owner_type in ('resident', 'blood_test', 'procedure')` and `else false` and may
think the old form was equivalent and friendlier. **It was not**: a deny-list grants everything nobody listed,
including anything added later. The `else true` was written when the enum had three values; `project` and
`maintenance` arrived afterwards and were granted to every clinic login silently, with no screen ever showing
it. An allow-list makes a new owner type, a new translated table or a new kind of login fail **closed**: the
worst case is a doctor missing something they need, which someone notices and asks for, instead of having
something they should not, which nobody notices.

**Rule for the next policy written for a narrowed login (doctor, volunteer, public viewer): name what it may
reach; never write "unless it is X".**

## Proof

`scripts/check-clinic-allow-lists.mjs` (rollback harness under real JWTs, asserts the live schema): 9 of 18
failed before `0174`, exactly the over-grants above; 18 of 18 after. `scripts/probe-role-surface.mjs`, before
and after: the doctor's `attachments` read 160 → 14, update and delete 158 → 12, `translations` 46 → 0,
`app_users` 64 → 1; every other principal and relation unchanged apart from sample-row noise (test plan).

## Not done here

`app_users` still exposes the `role` enum column; dropping the enum is `perm-drop-enum`'s, and `0172`
established the value stays until then.
