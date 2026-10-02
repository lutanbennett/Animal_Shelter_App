# 2026-10-02 — A doctor at several clinics: the feature half

**Context.** `0125` made a doctor a person with a link table of clinics, and a vet
login's clinics the clinics of the doctor it is linked to (decision
`2026-10-02-doctor-multi-clinic-schema.md`). This is the half that consumes it:
the visit forms, the clinic's Doctors page, Settings → Security and the "same
person as…" merge. Lutan's rules, 2026-10-01, are the spec.

**What was decided, and why.**

1. **A linked vet's Doctor field is themselves, locked, and the server says so.**
   When a vet records a visit the Doctor is their own entry: shown, not editable,
   and set again in the action (`vet-visits/new/actions.ts`) so a posted form cannot
   name someone else. Staff and admins still choose any doctor at the clinic. A vet
   login with clinics but no doctor entry yet (an older account that still carries
   `user_roles.vet_id`) keeps a free-text field — nothing to lock it to.
   *On edit* the lock is gentler: a vet editing a visit keeps the doctor already on
   it (a colleague's visit is not reassigned to them by fixing its status), and a
   visit with no doctor becomes the vet's own. Not in the item; chosen because the
   alternative silently rewrites a medical record on a status change.

2. **Adding a doctor needs a name and a clinic, nothing else.** No email, account
   or invitation, from the clinic page *or* by typing a new name on a visit (the
   database's `vet_appointments_link_doctor`, unchanged). A doctor is a name on a
   roster, not a user; most never use the system. A login is linked afterwards, in
   Security, only if one is ever given.

3. **Security links a login to a doctor; it no longer sets a clinic.** The Clinic
   dropdown is gone. A vet row offers *link to an existing doctor* or *create a
   doctor from this login* (name prefilled from the email, clinics ticked), and
   shows the resulting clinics read-only with a pointer to the clinic page, where
   they are edited. One place says where a vet works. Unlinking leaves the doctor
   and every visit alone; archiving the login does too (it already left the doctor
   untouched, and `current_user_vet_ids()` ignores an archived login).
   *Legacy logins:* a login that still has `user_roles.vet_id` and no doctor shows
   that clinic until an admin links or creates a doctor, which puts the doctor at
   that clinic and then clears the column — no vet gains or loses a clinic in the
   move, which is the backfill `0125` left to this half, done in the action rather
   than a migration.

4. **"Left" is the link's flag, not the person's.** Mark as left on a clinic's page
   sets `vet_doctor_clinics.active = false` for that clinic only. The person-level
   `vet_doctors.active` is no longer written; the roster, the hub and the visit-form
   suggestions all read the link. A doctor who left one clinic is still suggested at
   the others, and a vet login linked to them loses that clinic only.

5. **Delete removes the link, and the person only if nothing else holds them.** A
   link a visit uses cannot go (the composite key), so the page refuses with the
   visit count as before. Otherwise the link goes, and the doctor row with it only
   when they work nowhere else and have no login.

6. **The "same person as…" merge is the existing Merge, with the whole roster to
   choose from.** The merge target list is every other doctor, here or at another
   clinic, labelled with where they work; it calls `merge_vet_doctors`. The
   "possibly the same person" hint now looks across clinics too, but is only a hint
   — nothing is merged by name anywhere, which is the rule the schema half set.
   Refusals (a doctor with a login merged by non-admin; two logins) come back from
   the function and are shown as written; link edits that row-level security
   filters silently (an update that matches no rows) are caught by checking the row
   count and reported as "admin only", with the buttons disabled for non-admins.

7. **`current_user_vet_id()` is not dropped here.** `scope.ts` now reads
   `current_user_vet_ids()` and nothing in `src/` or any SQL calls the singular
   function. Dropping it, and `user_roles.vet_id` with it, is a migration; the brief
   for this stream said none, and the repo allows one in-flight migration, so it goes
   as its own small schema PR (backlog). Until then the column is read but never
   written by the app, and `check-doctor-multi-clinic.mjs` section H still asserts the
   function answers.

**Proof.** `scripts/check-doctor-multi-clinic.mjs` (the schema half's harness) ran
`HARNESS-OK` against dev with this branch's code unchanged under it: a vet login on
two clinics sees both clinics' residents and no others (C), writes at either and is
refused at a third (D), nobody widens a vet's reach by editing the roster (F), and
the cross-clinic merge moves links, visits and login (G).
