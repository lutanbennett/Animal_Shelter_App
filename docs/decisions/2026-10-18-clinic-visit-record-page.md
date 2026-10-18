# Clinic visit record page and the doctor's report (app half of `0220`)

2026-10-18, `claude/clinic-visit-record`. Closes two backlog items: *a clinic visit has no page to read* and *attach the doctor's written report to a clinic visit* (app half; the schema was #710).

## What was built

- `/clinic-visits/<id>`: a read-only record of one visit (resident, clinic, doctor, Bangkok date and time, status, reason, notes, cost, bill photos, the doctor's report, and what was logged at it), then labelled buttons for whatever the person may do.
- The visit card on the resident's Clinic visits list is one link (a stretched `::after` on the reason; the small actions sit above it at `z-10`, so they stay separately tappable). The card also says how many report pages the visit has.
- An **Open** button beside Edit on Appointments, Upcoming visits (list; the calendar chips now open the record) and a clinic's page. These were one-line link changes each.
- Reports: `POST /api/clinic-visits/<id>/report` writes through `record_attachment(..., p_purpose => 'report')` with `sub_folder = 'Medical'`; the file goes to the resident's `Photos/Medical/<YYMM>` Drive folder (the folder the app already treats as Medical, which no public view and no appeal reads), named `<date> Doctor report - <name>[ (n)].<ext>`. The report date goes in `date_taken`, the optional note in `caption`. Remove is a server action that deletes only a `purpose = 'report'` row on that visit, then trashes the Drive file.

## Settled here

- **Multi-resident:** followed the schema decision, not the backlog's wording. One booking for two residents is two visit rows, so there is no "which residents" question: the report is added to each visit. A copy-to-sibling shortcut was not built.
- **`loadBillPhotos()` stays bill-only** and is untouched. The record page reads reports with its own query. A clinic (doctor) login is shown no bill section at all and is never offered one.
- **Permissions are not widened except as intended.** The page needs `medical.visits` Read (`requirePermission`), and opens for a deceased resident. Writes (Add report, Remove, bill add, action buttons) need `medical.visits` Edit and a living resident, and the database re-checks all of it. A doctor login is narrowed **on the server**: an unlinked login, or a visit at a clinic not among its current clinics, gets a sentence and no data (RLS alone would let it read its past patients' visits elsewhere).
- **`PhotoViewer.tsx` is used** for report page images. A PDF cannot be shown there, so it opens in its own tab. Bill photos on the page keep `BillPhotosSection`'s existing open-in-a-tab links; moving them onto the viewer is a separate change to a shared component and was left.
- **Records made at the visit** link to the resident's matching tab (blood tests, procedures, prescriptions, weight), because blood tests and procedures have no page of their own.

## Left open

- Browser checks (375 px tap behaviour, the role matrix, a real upload) were not driven by this session: the browser pane had no signed-in session and the test password is not for Claude to read. They are listed in the test plan under Left for manual verification.
- Part (5), reading report text into the visit notes, is not built, as the brief said.

## Production

`0220` must be applied to production **before** this code deploys: `loadBillPhotos()` and the Bills inbox select on `purpose`.
