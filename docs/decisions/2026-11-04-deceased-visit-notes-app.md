# Deceased records: the app half (backlog #314hq, part 1 app half and part 3)

Stream `deceased-visit-notes-app`, 2026-11-04. Builds on `2026-11-04-deceased-records-app.md` (the `0310` schema half).
No migration, no card, nothing keyed by a role.

## Deliverable 2: is more schema needed? No.
Read: `0310_deceased_visit_cost_notes.sql` opens `enforce_deceased_lock()` for a `clinic_visits` UPDATE that differs only in
`cost`/`notes`. Bill photos are `attachments` rows with `owner_type='clinic_visit'`; `attachment_resident_id()` (`0032:10-24`)
returns null for that type, so the lock lets them through; `record_attachment()` asks `medical.visits` (comment in
`clinic-visits/[id]/edit/page.tsx`, 0190). Part 3 needs no schema (see below).

## Part 1 (app)
`writable` on the visit page is split: `canCorrect` (= `can(perms,"medical.visits","edit")`) draws the bill photo control and a
*Correct cost and notes* link for a dead resident; `writable` (not deceased) keeps Edit, the doctor's report and the
blood/prescription/weight/procedure links. The edit page, for a deceased resident, draws only cost and notes
(`costNotesOnly`), and the action then sends only `{notes, cost}` and skips the calendar sync, so the database never sees a
column it refuses. The doctor's report upload stays closed: `0310` does not name it and Lutan has not asked for it.

## Part 3: decided, option B
No *Re-record death*. With cost, notes and bill open on the record, nothing a correct death needs requires undoing it, and
re-recording would add a second path that rewrites `placement_history` (guarded since `0049`). The undo page now says
*"Undo is only for a death recorded in error. To add a bill or a note, open the record."* (both dictionaries, manual undo topic).
The Thai is unreviewed.

## Every `isDeceased` site (re-grepped)
Opened: `clinic-visits/[id]/page.tsx` (bill, cost, notes link) and `clinic-visits/[id]/edit` (cost/notes only).
Left closed, because `0310` permits nothing there: `ResidentHub.tsx` 309/350/360/365/546/568/578/636/794 (booking, placement,
medical and microchip actions, record death), `sections/{weight,procedures,prescriptions,immunizations,diet,blood-tests}.tsx`
and `clinic-visits.tsx:146,224` (adding entries; blood tests and procedures stay read-only), `[section]/page.tsx:106,195`
(archive and microchip), `diets/new` and `diets/[id]/edit` (feeding a dead animal), `residents/[id]/edit` (bio and photos
only, as 0052). Display-only uses (`housing.tsx`, `diet.tsx:42`, `ResidentHub` 223/423/613-626, `photos/route.ts`) are not
controls. **Lutan's question, not settled here:** late blood results and notes on placements, weight, prescriptions,
immunizations and procedures. Opening them is a second migration and stream.

## Bills path (deliverable 5)
`grep -n "deceased\|isDeceased" src/app/bills/**` still returns nothing, so `/bills` does not filter dead residents and, with
`0310`, a match of a dead resident's visit writes only cost: allowed. `/bills` was not edited. Not driven end to end in the
browser in this session.

## Found, not fixed
None new on the pages touched; the new link and bill control are gated by `medical.visits` edit, the activity both the
update and `record_attachment()` ask.
