# 2026-09-27 — One weight per vet visit and one per resident per day, held by the database (`0106`)

- **Two unique indexes, because they are two rules.** `weight_one_per_visit`
  on `vet_appointment_id`, *partial* (`where vet_appointment_id is not
  null`) — unpartial, every unlinked reading would collide with every other.
  `weight_one_per_day` on `(resident_id, date)` (Lutan, 2026-09-27, added to
  the item the same day). The per-day rule is the stricter: two readings on
  one day where only one is linked pass the first and fail the second. The
  form's picker filter is the pleasant half; the indexes are what hold for a
  second tab, the assistant and an import.
- **Existing duplicates were counted before deciding what to do with them:
  none.** Dev: 23 readings, no visit with two, no resident-day with two. The
  AppSheet snapshot the production import is built from: 18 readings, no
  same-day pair; its one pair sharing a visit id (`79e45e85`, 7 and 9 July)
  names a visit absent from `Vet_Appointments.csv`, so the importer loads
  both unlinked and they collide with neither rule. Production itself was
  not read from the workstream.
- **What the file does with any it meets anyway differs by rule, on purpose.**
  Per visit: every reading but the newest is unlinked. Lossless — the
  readings stay, on their dates — and "which reading does the visit own" is
  a fair thing for a migration to settle. Per day: the file refuses, naming
  resident and date. Keeping one of two different weights is deciding which
  was right; that is a person's call, not something to do silently in DDL.
- **Intake.** `record_intake` (0029 onwards) writes a reading dated the
  intake day. A brand-new resident has no other readings, so intake itself
  cannot collide. The collision the per-day rule does meet is a vet weighing
  the animal on its intake day; the answer is to *correct* the intake
  reading — new kg, linked to the visit — rather than refuse or add a
  second. The harness asserts that update is allowed; the form that offers
  it is the feature PR's.
- `scripts/check-weight-one-per-day.mjs` asserts all of the above in one
  rolled-back transaction, including that the file refuses when a same-day
  duplicate is present at apply time.
