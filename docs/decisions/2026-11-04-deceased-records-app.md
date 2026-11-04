# Deceased records: the database half (backlog #314hq, part 1, schema PR)

Stream `deceased-records-app`, 2026-11-04. **This file covers the SCHEMA half only** (migration `0310`). The brief and
`CLAUDE.md` make a feature that needs a migration two streams in sequence, so the app half (part 1's controls, part 3's
undo page and re-record, the Bills inbox wording, manuals, release note) is the NEXT stream, branched from `main` after this
merges. Nothing here is a card, and nothing is keyed by a role.

## Step zero: not already built
`isDeceased` still blanket-blocks in the app: `src/app/clinic-visits/[id]/page.tsx:130` (`writable = canEdit && !isDeceased`),
`ResidentHub.tsx:360,365`, the section pages under `src/app/residents/[id]/[section]/sections/` and
`src/app/diets/new|[id]/edit/page.tsx`. No decision file or commit opens them. #1258 moved the visit page but left line 130.

## Deliverable 2: what the database side actually is (read, not assumed)
- `enforce_deceased_lock()` (`0026:162`, last redefined `0307`) is a BEFORE INSERT/UPDATE/DELETE trigger on residents,
  placement_history, vet_appointments (now **clinic_visits**: `0172` renamed the table and the trigger travelled with it),
  prescriptions, immunization_records, weight, procedures, blood_tests and resident_diets (`0026:247-285`, `0051:203`).
  It refuses when the resident's Lifecycle placement is open. It has openings only for residents bio columns (0052) and the
  intake-date correction (0307).
- **Bill photos are NOT locked.** They are `attachments` rows with `owner_type = 'clinic_visit'`;
  `attachment_resident_id()` (`0032:10-24`) knows resident, blood_test and procedure but not clinic_visit, so it returns
  null and `enforce_deceased_lock_attachment()` lets the row through. The refusal for the photo was the page only.
- **A bill's cost IS locked.** `clinic_visits.cost` is an UPDATE of a locked table, written by the visit edit
  (`src/app/clinic-visits/[id]/edit/actions.ts`) and by the `/bills` match (`src/app/bills/actions.ts:132-133`).
- Rehearsed on dev before this file was written: on a deceased resident's real visit, before 0310 the cost update was
  refused; after it, cost and notes update, and `status`/`reason` UPDATE and `DELETE` are still refused
  (`begin`-less `do $$` that ends in `raise exception`, so nothing was kept).

## What 0310 changes, and why it is narrow
One opening in `enforce_deceased_lock()`: an UPDATE on `clinic_visits` where only `cost` and `notes` differ (compared by
stripping those two keys from both rows, the 0052/0307 pattern). Everything else, INSERT, DELETE, status, date, clinic,
doctor, reason, is refused as before. The `medical.visits` card check is unchanged and still applies. Admin is given
nothing. Chosen over a bypass flag because no new function is needed and the exemption sits beside the rule it relaxes.
Other BEFORE triggers on the table (`calendar_dirty`, `link_doctor`, `tidy_doctor_name`) only touch other columns for a
cost/notes-only change, and the rehearsal passed with them in place.

## Deliverable 4: the Bills inbox
`src/app/bills/page.tsx:64-66` offers clinic visits with `cost is null` and does not filter on deceased, so a dead
resident's visit IS offered; before 0310 matching it failed at the cost UPDATE with the lock's message. After 0310 the match
works. The `/bills` code needs no change for this.

## Left arguable, NOT opened here (report, do not decide quietly)
- **Blood test results arriving late** (blood_tests INSERT/UPDATE, and files on blood tests and procedures): still locked.
  Opening them means choosing columns and whether an INSERT counts as "correcting a past record". Lutan's call.
- **Notes on placements, weight, prescriptions, immunizations, procedures**: still locked, same reason.
- Prescribing, moving, booking, feeding (diets) stay closed on purpose.

## For the next stream (app half)
Controls on the visit page are drawn by `writable`; split it so Edit/bill/report controls follow `medical.visits`
(and the attachments' own activity, read from the action), and keep blood/rx/weight/procedure links closed for the dead.
Part 3 and `UndoDeathForm` are untouched by this PR. No release note here: no user can see a change until the app half
ships and `0310` is applied to production (Lutan's command).
