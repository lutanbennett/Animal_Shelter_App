# 2026-10-02 — A doctor works at several clinics; a vet login's clinics come from its doctor

**Context.** Lutan, 2026-10-01 (backlog, "A doctor can work at more than one clinic"):
both the roster doctor and the vet login need to allow several clinics, and a vet
login is linked to its own doctor entry. This is the schema half (`0125`); the
forms, Settings → Security and the "same person as…" page are the feature half.

**What was decided, and why.**

1. **The doctor is the person; a link table says where they work.**
   `vet_doctors` keeps one row per person and gains `user_id` (nullable, unique).
   `vet_doctor_clinics (vet_id, doctor_id)` is the link, with `active` and a
   denormalised `name_key`. The name-key uniqueness stays *per clinic* as a plain
   unique index on `(vet_id, name_key)`; a trigger keeps `name_key` equal to
   `vet_doctor_key(name)` and a rename re-keys the links. Denormalised because an
   index cannot span two tables, and a check trigger would race.

2. **The clinic guarantee moved to the link table; it was not dropped.**
   `vet_appointments (vet_id, doctor_id)` is now a composite foreign key onto
   `vet_doctor_clinics (vet_id, doctor_id)`. The database still refuses a visit
   whose doctor has no link to the visit's clinic, for every writer, with no
   trigger to forget. Proved in `scripts/check-doctor-multi-clinic.mjs` (A, D):
   insert, update-the-clinic, update-the-doctor, and under a vet's own JWT.
   "A doctor removed from a clinic keeps their past visits there" is why leaving
   is `vet_doctor_clinics.active = false` and not a delete: the used link cannot be
   deleted (no action), by construction.

3. **One source of truth for a vet's clinics: no `user_vet_clinics`.** A vet login's
   clinics are the active clinics of the doctor it is linked to
   (`current_user_vet_ids()`). Two tables that had to agree about which clinics a
   vet works at would eventually disagree, and what breaks is 0108's resident
   scoping, so a vet seeing what they should not, or not what they should.
   *Transition:* `user_roles.vet_id` (0102) is still what Settings → Security writes
   and some live vet logins rely on it, so until the feature half retires it
   `current_user_vet_ids()` is the doctor's clinics **union** `user_roles.vet_id`.
   No existing vet gains or loses a clinic when this lands. Nothing new writes the
   column; the feature half backfills a doctor per such login and drops it.

4. **`current_user_vet_id()` was kept, and every SQL caller replaced in the same PR.**
   The callers were `current_vet_resident_ids`, `vet_owns_visit` (the 0124 versions,
   not 0108/0110's) and five policies (`vet_{insert,update,delete}_vet_appointments`,
   `vet_write_bulk_appointments`, `vet_write_vet_doctors`), checked against the dev
   catalogue (functions, policies, views). The brief counted 18 places in
   0102/0108/0110; `0124` had added more. None remains in SQL. The singular function
   still answers (the TypeScript in `src/lib/vets/scope.ts` reads `user_roles.vet_id`
   directly) and is for the feature half to remove.

5. **A roster edit must not widen a vet's reach, so some writes are admin-only.**
   Clinics now come from a roster row, so whoever can edit the roster could grant a
   vet a clinic, which used to need an admin at aal2. Hence: `user_id` is set or
   cleared only by an admin at aal2 (trigger; service role and the SQL editor have
   no `auth.uid()` and pass); management and staff cannot add or remove links of a
   doctor who has a login; a vet writes links only for their own clinics and only
   for a doctor whose every clinic is theirs; a vet may add a new doctor only at one
   of their own clinics. Alternatives rejected: column privileges on `user_id`
   (does not stop link edits) and an RPC only an admin could call (the same trigger
   with more moving parts).

6. **Existing duplicates are not merged here.** One person already listed at two
   clinics stays two rows; nothing is guessed by name. `merge_vet_doctors` is
   generalised for the feature half's "same person as…" merge: the survivor takes
   every clinic the loser worked at, the visits, and the login; two logins never
   merge; a doctor with a login is merged by an admin only. (0102 refused a
   cross-clinic merge; that refusal is now the feature, so `check-vet-doctors.mjs`
   asserts the new behaviour.)

7. **`vet_doctors.vet_id` stays, nullable and deprecated** ("first listed at"), so
   the clinic pages and the visit trigger keep working untouched; a doctor inserted
   with a `vet_id` gets its link by trigger. Its foreign key is now
   `on delete set null`: deleting a clinic must not take a doctor who works
   elsewhere with it. The feature half reads the link and drops the column.
   `vet_doctors.active` stays as the legacy person-level flag; `vet_doctor_clinics.active`
   is the per-clinic switch and the one that removes a clinic from a vet's scope.

**Two bugs the harness found before they shipped.** (a) Renaming a doctor
rewrites the visits' `doctor_name`, which re-runs the visit trigger; with the links
still carrying the old key it listed the doctor *again* under the new name. The
key-sync trigger is named to fire before the propagate trigger. (b) Merging two
rows with the same name collided on `(vet_id, name_key)` when the survivor
took the loser's clinic; the loser's links are re-keyed first.

**Harness scripts.** `check-vet-doctors`, `check-vet-resident-scope` and
`check-vet-own-clinic-writes` replayed 0102 / 0108 / 0110, which 0125 redefines, so
under `2026-10-02-replay-or-assert-live.md` rule 1 they now assert the live schema.
Their legacy-login fixtures (`user_roles.vet_id`) double as the proof that the union
leaves existing vets as they were.
