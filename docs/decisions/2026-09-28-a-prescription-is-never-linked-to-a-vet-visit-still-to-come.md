# 2026-09-28 — A prescription is never linked to a vet visit still to come, held by triggers (`0107`)

- **Form and database, following 0106.** The prescription form's
  linked-visit list now comes from `loadLinkableVisits(…, { notInFuture,
  keep })` (the helper #190 wrote with this item in mind), and 0107 adds the
  guarantee, because a second tab or a stale page never sees the list.
- **Triggers, not a check constraint or a denormalised column.** The rule
  crosses two tables and depends on today. A CHECK can read neither another
  table nor the clock (it must be immutable, and it is re-evaluated on every
  later update of the row and on a restore — "not in the future whenever the
  row is next touched" is always true once the visit has passed). A copied
  visit date on `prescriptions` would bring the date across but not "today",
  and would need a trigger to stay in step anyway. What the rule is about is
  the moment of *linking*, so that is when it is checked:
  `prescriptions_visit_not_in_future` on insert, and on update only when
  `vet_appointment_id` changes. Editing a dose never re-litigates an old
  link.
- **The other door is shut too.** Moving a visit that already has
  prescriptions to a day after today would make the same record from the
  visit's side; `vet_appointments_linked_rx_not_future` refuses it while any
  prescription links to the visit. Moving it to another past day, or moving
  a visit with no prescriptions, is untouched.
- **"Today" and the visit's day are the shelter's (Bangkok), on both sides.**
  The trigger uses `shelter_date()` / `shelter_today()` (0073).
  `visitDate()` in `src/lib/vets/linkable.ts` used to take the leading date
  of the stored UTC timestamp; it now takes the shelter day, so the picker
  never lists a visit at 00:00–07:00 Bangkok tomorrow that the database then
  refuses. This also moves the weight form's default date for such a visit
  to the right day. The blood-test, procedure and hospital forms still
  slice the UTC date for their defaults — a follow-up on the backlog, not
  part of this change.
- **Existing rows counted first: none.** Dev: 61 prescriptions, 55 linked,
  none to a visit after today, none to a visit dated after the day the
  prescription was written. AppSheet snapshot (2026-09-21): 64
  prescriptions, 57 linked to a visit the export has, none after today; its
  latest visit is 2020-12-11. Production was not read from the workstream.
  The importer unlinks (with a note) any prescription whose visit is after
  the import day, so a later snapshot cannot fail the whole import.
- **Hidden rather than disabled.** A visit still to come has no Add
  prescription link on the Vet Appointments tab, as it already had no Log
  weight link. A `/prescriptions/new?vetAppointmentId=` URL naming a future
  visit opens the form unlinked rather than preselecting a value the list
  doesn't offer.
- `scripts/check-prescription-visit-not-future.mjs` asserts all of this in
  one rolled-back transaction, writing as a signed-in staff user straight to
  the tables — the case a form-only test would pass.
