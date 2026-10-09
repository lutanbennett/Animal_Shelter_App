# Clinics and doctors: "Vet" leaves the system, and what a doctor login sees

2026-10-09. Migration `0172_clinics_and_doctors.sql`; the app rename follows in the next PR.

## The model

Confirmed by the Director in writing on 2026-10-08 ("Above is correct"):

1. **A clinic is the place** a resident is taken to and a visit is booked with. It is what the system called a "Vet".
2. **A doctor is a person who works at a clinic.** A doctor may work at more than one clinic (many-to-many,
   `doctor_clinics`).
3. **A doctor may or may not have a login.** At most one login per doctor and one doctor per login
   (`doctors.user_id`, unique). Most doctors never have one. The login's role is `doctor`.

"Vet" goes from the data, the screens and both languages so the word cannot mean two things. People still *type*
"vet" and "หมอ", so the assistant keeps understanding them.

Two rules carried from 2026-10-03, both load-bearing:

- **A mobile doctor's business is a clinic**, entered like any other but with no address. So every clinic field
  but the name is optional, and nothing renders for a missing one.
- **A visit's doctor is optional, always.** Nothing may make it required.

## The rename

`vets` → `clinics`, `vet_doctors` → `doctors`, `vet_doctor_clinics` → `doctor_clinics`, `vet_appointments` →
`clinic_visits` (Lutan chose "clinic visit" for the screen label too), every `vet_id` → `clinic_id`, every
`vet_appointment_id` → `clinic_visit_id`, `app_role` value `vet` → `doctor`. Done in place with `alter … rename`, so
rows, policies, foreign keys and triggers follow by OID; only function bodies, which are text, were rewritten.

- `vets.name` and `vets.clinic_name` folded into `name`. A row where both were filled in and **differed** stops the
  file rather than guessing: on dev the only two were disposable test rows (`[roster] Test Clinic`, `ZZ Width …`),
  cleared by hand before applying. Production was not read from the building session; the guard is what protects it.
- `doctors.vet_id` (deprecated "first-listed clinic", 0125) dropped. A doctor's clinics are its links.
- **Compatibility views** under the four old table names, read-only and `security_invoker`, for one release: for
  anything outside the repo that reads them. App code must not use them. Drop them in the release after next.
- `private.has_app_access()` named `'vet'` as text. Left alone, the enum rename would have made it raise for
  **every** signed-in caller and closed the app. That is the failure a dry run cannot show (nothing calls it), which
  is why `check-doctor-resident-scope.mjs` now scans every function body and view for the old names and calls
  `has_app_access()` as each role.
- `audit_log` rows written before 0172 keep `table_name = 'vet_appointments'` (it is append-only). The app reads
  both names as clinic visits. Likewise a death recorded before 0172 keeps its cascade under `vet_appointments`;
  `undo_deceased_placement()` reads either key.

## What a doctor login sees: option (c), the union

Lutan, 2026-10-09, choosing between three options put to him:

- (a) **clinic-scoped**, as built since 0108: every resident with a live clinical record at a clinic the doctor
  currently works at, whoever the doctor on it was;
- (b) **doctor-scoped**: residents on visits where this doctor was the doctor, at any clinic, ones they have left
  included;
- (c) **both**.

He chose (c). Why not the others:

- (a) alone hides a doctor's own patients the day they stop working at a clinic. Lutan expected a doctor to see
  "every resident that doctor has cared for, whichever clinic it was at".
- (b) alone hides every patient a colleague saw at the same clinic (the reason 0108 chose clinic level: a colleague
  covering a shift sees the same list), **and every visit with no doctor recorded**, which is allowed always. A
  visit with no doctor would be visible to no doctor login at all.

**Writes did not move** (Lutan, same day): a doctor may still add or change records only at the clinics it works at
now (0110). So a resident seen at a clinic the doctor has left is read-only to it.

How it is held: the old function keeps its body under a new name, `current_clinic_resident_ids()` (the write scope),
and every insert, update and delete policy keeps calling it. A new `current_doctor_resident_ids()` is the write scope
plus residents on live visits whose `doctor_id` is the login's doctor; only SELECT policies, and the five read views
that carried the same test (`resident_current_state`, `current_placement`, `immunization_compliance`,
`immunization_duplicate_check`, `translation_queue`), moved to it. `weight` and `immunization_records` had one FOR ALL
policy each; it stays on the write scope and a SELECT policy beside it adds the wider reads.

If this is ever revisited, `scripts/check-doctor-resident-scope.mjs` asserts every case: a visit with no doctor, a
colleague's patient, a cancelled visit, a resident seen at two clinics, the doctor's own patient at a clinic it has
left (seen, and refused for weight, visit, update, attachment and microchip), and a doctor login with no doctor record
(sees nothing).

## Not done, on purpose

- **A cross-clinic Doctors list for staff** (Management → Doctors). Lutan, 2026-10-09: each clinic's own Doctors list
  is enough for now; it can be added later.
- Dictionary keys (`t.vets.*`, `t.vetVisits.*`) and the manual's topic ids keep their names: they are never shown,
  and renaming them would break manual links and screenshot names for no visible gain.
