# Control listing sweep 6: the status move, the route handlers, two visit pages driven (2026-11-03)

Stream `control-listing-sweep-6`. Rule: `CLAUDE.md` "a button is shown only if the login's cards let it do that action".
Stated by activity and card; Admin untouched. **No code changed. No server or database check was touched.**

## 1. `setMaintenanceStatus`, read to the line
- The action (`src/app/maintenance/actions.ts:268-297`) makes **no `can(...)` call of its own**: it validates the status then
  does `update({ status })` as the caller under row security.
- The activity is asked by the database: trigger `maintenance_before_write()`
  (`supabase/migrations/0182_perm_policy_cleanup.sql:70-79`) refuses a status change unless `has_permission('maintenance.progress')`
  (error 42501, "Moving a job on needs the Move a job on permission"). The row's update policy (`maintenance_update_perm`, `0141`) is
  a separate, wider check and does not matter to the status move.
- Controls that trigger it, and what each asks: board drag (`MaintenanceBoard.tsx`, `canMove` from `can(perms,"maintenance.progress")`,
  `maintenance/page.tsx:80`); job-page status buttons (`MaintenanceJobView.tsx:217`, `canMove`, `[id]/page.tsx:37`); task list
  (`MyTaskList.tsx:290`, `canEditMaintenance`, `my/page.tsx:79`). **All three ask `maintenance.progress`: control and server agree.**

## 2. `/api` and photo-upload route handlers
These are **the server check, not controls**: they gate the request, so the narrowing the item feared does not apply. Read, by activity:
- `blood-tests/[id]/attachments` `medical.blood_tests`; `procedures/[id]/attachments` `medical.procedures`;
  `medical/residents/[id]/photos` `photos.medical_add`; `residents/[id]/photos` `photos.resident_add`;
  `residents/[id]/videos/start|finish` `photos.resident_add` (+ `photos.resident_publish` for adoption updates and publish);
  `photos/shelter/[id]` `photos.shelter_add` and the folder; `photos/pending` `photos.shelter_add` or `photos.resident_publish`;
  `clinic-visits/[id]/report` `medical.visits` edit; `maintenance/[id]/attachments` `maintenance.photos`;
  `outreach/[id]/photos` `community.outings`; `projects/[id]/photos` `projects.photos`; `residents/tag-search` `resident.record` read;
  `facility-maps/[...path]` `facility.enclosures` read.
- Bills (`bills/new`, `bills/[kind]/[id]`) through `mayFileBill` (`src/lib/bills/upload.ts:27`): `stock.delivery`, `medical.visits` edit,
  `maintenance.bills`, any of those for the inbox; mirrors the database's `bill_owner_can`.
- Read by the database (no `can` in the handler, by design): `documents/[fileId]`, `photos/[fileId]`, `videos/[fileId]` via
  `can_see_drive_file` / `is_public_drive_file`.
- Not card-guarded, by design: `calendar/sweep`, `status/alerts` (bearer service key), `version` (public build stamp).
No handler needs a gate. Nothing crossed into stream 8's files.

## 3. Render-site trace of the whole-page group
Sweep 5's meaning is recoverable (confirm the page gate is applied where the page is rendered), but **I did not repeat it
file by file**: it was not worth a pass of ~95 files after five sweeps. What I did instead is drive two pages (section 4), which exercise
the whole-page gate for real and found the one fault below. The mechanical trace stays **not done**.

## 4. Folded: visit detail and visit edit, driven with one-card logins (dev, aal1)
Method: `dev-signin.mjs --cards …`, clicked through (`/my` → Appointments → visit), `requestAnimationFrame` was confirmed absent on the
direct-loaded `/my` and a screenshot woke the pane; the visit pages were reached by click.
- **Login holding only `view_medical` (+`view_residents`): `medical.visits` read.** The detail page refused with "You don't have access
  to this page". **FOUND, NOT FIXED:** `clinic-visits/[id]/page.tsx:43` and `[id]/edit/page.tsx:23` call `requirePermission("medical.visits")`,
  whose default level is **edit**; the detail page's own comment (`:35-39`) says read is enough to open it. And `upcoming-visits`
  (`VetVisitsView.tsx:137`) draws the "view" link to a read-level login who will be refused. Narrowing would widen who opens a page,
  so it is for the planner: detail page should likely ask `medical.visits` at **read**; the edit page stays at edit.
- **Login holding only `medical_records` (edit):** detail page drew the visit-edit link, bill-photo add, Add report, and the four add
  links (blood test, prescription, weight, procedure). Server asks: edit `medical.visits` (`edit/actions.ts:52`,
  `report-actions.ts:21`), report/bill route `medical.visits` edit; add links gated on `medical.blood_tests`, `medical.prescriptions`,
  `medical.weight`, `medical.procedures` (`page.tsx:145-148`). Consistent. Edit page drew the form, Save, bill-photo add; no add-doctor
  (`clinics.doctors`) or microchip (`resident.microchip`) control, correctly, as that card holds neither.
- `/appointments`: not touched, covered by the separate "not linked" item.
- Limit: Save and uploads were not pressed (shared dev database).

## 5. What remains / can the item be ticked
**Not ticked.** Open: the read-level fault in section 4 (planner to file) and the mechanical whole-page render-site trace (section 3).
Found, not fixed: the above only. Release note: `n/a`, nothing changed.
