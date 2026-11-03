# The doctor insert-as-caller fault: the assistant and the clinic change

**Backlog item:** "THE INSERT-AS-CALLER DOCTOR FAULT HAS THREE KNOWN SITES..." Ticked. No migration, no policy changed.

## Site (ii), the assistant: it DOES take a doctor name

- `src/lib/assistant/intents/clinic.ts:66` `parseDoctorName(text)` reads a name after a title ("Dr X", "หมอX"); `:113` puts it in the draft as `doctorName`.
- `src/lib/assistant/llm-tools.ts:105` lets the model fill `doctorName` too.
- `src/components/assistant/AssistantCards.tsx` (ClinicCard) pre-filled the free-text Doctor box with it and sent it to `assistantBookClinicVisit`, which passes it to `schedule_bulk_appointments` (`src/app/assistant/actions.ts:230`). That action asks `assistant.record`; the trigger inserts the doctor as the caller and `doctors_insert_perm` asks `clinics.doctors`. So the fault was real and reachable.

Fix: `AssistantContext.canAddDoctor` (= `can(perms, "clinics.doctors")`, false in the empty context) flows into `CardContext.canAddDoctor` (optional, absent reads as no). Without it the clinic card shows a chooser of the chosen clinic's existing doctors, and a name the clinic does not list is not carried into the card; the name actually sent is also filtered to the roster, so changing the clinic on the card cannot leave a stale name behind.

## Site (iii), a visit's clinic being changed

The edit form kept the visit's old doctor name as a choice whatever clinic was picked. Moving the visit re-resolved that name at the new clinic, found nothing, and inserted a doctor. `DoctorNameField` now takes `defaultClinicId`: the visit's own name stays a choice only while the clinic is unchanged (or the new clinic lists it), and the select resets when the clinic changes. The activity is `clinics.doctors` (database policy), as for the forms.

Not established: which harness section goes green. The `check-doctors.mjs` rls part was not re-run against this change (it inserts in SQL, bypassing forms; see `2026-11-03-doctor-name-follows-cards.md`).

## The `clinics.list` read refusal (deliverable 3): cannot bite today

Both cards carrying `visit.book` (`medical_records`, `book_clinic_visits` in `src/lib/permissions/cards.ts`) include `view_medical`, which holds `clinics.list` at read. A login holding `visit.book` through a card therefore always holds the read too. Theoretical only, unless a future card carries `visit.book` without `view_medical`. Nothing to file beyond that watch-point.

## Callers (deliverable 12)

`schedule_bulk_appointments`: `clinic-visits/new/actions.ts` and `assistant/actions.ts` only. Direct updates of `clinic_visits` with a doctor name: the edit action. Migrations define the trigger (0172) but no other function calls it. So three sites is the whole list.

## Controls touched, and what each action asks

- Assistant clinic card Doctor box: `clinics.doctors` (database policy `doctors_insert_perm`); the action itself asks `assistant.record`. 
- Edit form Doctor select: `clinics.doctors`; action asks `medical.visits`.

## Proof (dev, port 3003, one-card logins)

- `assistant` + `book_clinic_visits`: the sentence "...with Dr Zzqnewdoc" gave a select of the clinic's existing doctors, empty value, no free text.
- `assistant` + `book_clinic_visits` + `contacts` (`clinics.doctors`): free-text box pre-filled "Zzqnewdoc".
- Not driven: pressing Confirm, and the edit-form clinic change in the browser (typechecked only).

Dead `"clinics"`/`"unlinked"` branches in the visit forms were noticed and left (already a filed item). Thai: no new strings.
