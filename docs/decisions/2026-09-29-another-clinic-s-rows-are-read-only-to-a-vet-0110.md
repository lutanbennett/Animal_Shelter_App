# 2026-09-29 — Another clinic's rows are read-only to a vet (0110)

- **Decision: read-only.** 0108 lets a vet see a visible resident's whole
  history, other clinics' visits included; nothing about treating needs a
  vet to rewrite or delete what another clinic recorded, so seeing and
  writing split. `vet_appointments` insert/update/delete require
  `vet_id = current_user_vet_id()` in both `using` and `with check`
  (so no booking at another clinic, no visit with no clinic, no moving a
  visit out of the clinic). Prescriptions, procedures and blood tests are
  writable when their visit is at the vet's clinic; a blood test's or
  procedure's files follow it (`vet_can_write_attachment`, and
  `record_attachment`, the one definer function a vet reaches).
- **The "keep the clinic a visit already has" case goes away for vets**,
  because a vet can no longer save another clinic's visit at all. The edit
  page now says the visit is read-only instead of offering a form that could
  only fail. `scopeAllowsVet`'s `keep` argument is still used for
  staff-side paths and is left alone. Admin, management and staff can still
  rebook visits freely (checked in the harness).
- **Visit-less records stay writable by a vet.** A prescription, procedure
  or blood test with no visit belongs to no clinic (0108), and the forms let
  a vet record one without a visit, so refusing would break that flow. The
  cost: a vet can edit any visit-less record on a resident they can see. It
  cannot be another clinic's. Tighten it if visit-less records turn out to
  matter.
- **Went beyond the four tables named**, because the same hole was there:
  `vet_doctors` (a vet could rename or delete any clinic's doctors) and
  `bulk_appointments` (a vet could log a bulk booking for any clinic) now
  write only the vet's own clinic; `schedule_bulk_appointments` is
  security invoker, so the visit policy constrains it.
- **Security-definer audit.** Of the 53, only `record_attachment` writes
  these tables' files as a vet can reach it. `handle_deceased_placement`,
  `undo_deceased_placement` and `record_deceased_archive` write visits and
  prescriptions past RLS but a vet cannot trigger them. `merge_vet_doctors`,
  `vet_appointments_link_doctor` and `vet_doctors_propagate_name` are
  invoker, so the new policies bind them.
- Unchanged: weight, immunization records and diets carry no clinic.
- Proof: `scripts/check-vet-own-clinic-writes.mjs`, driven as a vet's JWT.
