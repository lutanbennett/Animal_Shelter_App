# 2026-09-28 — A clinic's doctor list: seen and corrected under Management, suggested from on the forms

- **The page is a Management page, not a section of the clinic hub.**
  `/management/vets/[id]/doctors`, reached from a new Doctors column on
  Management → Vets and from "Manage the doctor list" on the hub. Every
  booking role may write `vet_doctors` under RLS (0102: a visit can add a
  name), but a rename or merge rewrites past visits, including deceased
  residents' under 0102's scoped bypass, so the page is `requireManagementUser`
  and every action `assertManagementRole`. The hub (every shelter role) gets
  the list read-only: active doctors busiest-first for the chosen period,
  plus a count of those who have left. A vet account never reaches either
  (`/vets` is `isShelterRole`; 0105 is untouched).
- **Reach is stated before it happens.** Renaming a doctor with visits shows
  "Saving changes the doctor on N recorded visits" under the field and asks
  with the count; merging asks with the count and "can't be undone". A
  rename onto a name already on the list (the unique key, `23505`) is refused
  with "use Merge… instead", because that rename is a merge by another name.
- **Look-alike spellings are pointed out, not merged.** `doctorNameCore`
  (`src/lib/vets/doctors.ts`) drops punctuation and a leading title — Dr,
  Doctor, หมอ, น.สพ., สพ.ญ., คุณ, Thai ones also when written without a space
  — and names with the same remainder are marked "Possibly the same person
  as …", with Merge… starting on the one match. 0102 kept titles out of the
  database's key on purpose; this is a hint on one page, so a false match
  costs a glance, and the merge stays someone's decision. It does not match
  across scripts ("Ploy" / "พลอย").
- **Mark as left, not delete.** A doctor on any visit can't be deleted (the
  foreign key), and the page says so; Delete is for a mistaken entry with no
  visits. Left doctors sit in their own group at the foot of the list and
  drop out of suggestions, but a typed name still links to them — the
  trigger matches by key regardless of `active`, which is right for
  back-dated visits.
- **Suggestions come from the list.** `loadDoctorNamesByVet` keeps its name
  and shape but reads active `vet_doctors` rather than harvesting
  `doctor_name`, so a merged typo stops being offered and a doctor added by
  hand is offered before their first visit.
- **Booking is one call.** `bookVetVisit` passes `p_doctor_name` to
  `schedule_bulk_appointments` (0102) and the 2026-09-24 second write is
  gone, with its "booked but the doctor wasn't saved" message in both
  dictionaries. The assistant's call passes nothing and resolves to the same
  function through the parameter's default.
- **The page's actions return their errors rather than throw them.** Next's
  error-handling guide asks for expected errors as return values; a thrown
  message can be replaced with a generic one in a production build, which
  would lose the rename clash's pointer to Merge. The older Management
  tables still throw; that is not changed here.
