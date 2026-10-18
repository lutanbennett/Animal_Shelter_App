# Doctor's written report on a clinic visit: the schema half (`0220`)

2026-10-18. Schema half of *"Attach the doctor's written report to a clinic visit"*. **The feature is not usable when this merges.** Nobody can add, see or remove a report yet: the section, upload, Drive filing and the resident's list are the app half (`clinic-visit-record`). The backlog item is **not** ticked.

## Choice: a `purpose` column, not a new owner type

`attachments.purpose text not null default 'bill'`, allowed values `'bill'` and `'report'`; `'report'` is allowed on `owner_type = 'clinic_visit'` only (check constraint).

Why not `owner_type = 'clinic_visit_report'`: it is two migration files (enum rule), it forks every policy and every `case owner_type` in the codebase for one distinction, and it puts a second dimension into a column that means *what this hangs on*. A `purpose` generalises if another owner ever needs the split.

## The quiet-breakage guard (the centre of this PR)

- **Back-fill cannot miss a row.** `ADD COLUMN ... NOT NULL DEFAULT 'bill'` fills every existing row in the same statement; there is no separate `update` to forget a row. Dev before: 2 `clinic_visit`, 1 `stock_receipt`, 2 `maintenance_bill` attachments. After: the same five, all `bill`; 350 rows total, 0 null.
- **The default protects unknown writers.** Any code that does not say `report` still writes a bill, so a forgotten call site fails toward "shows as a bill" (visible) rather than "vanishes".
- **Two readers changed, both now filter `purpose = 'bill'`:** `loadBillPhotos()` in `src/lib/bills/photos.ts` (bill photos on visits and deliveries) and the Bills inbox "already has a bill" query in `src/app/bills/page.tsx` (without it a visit with only a report would silently drop off the suggestions list).
- **Gate:** `node scripts/check-doctor-report-schema.mjs` (dev, rolled back) asserts both filters exist in source, a bill and a report on one visit read apart, and the permissions below. Run it before any release touching attachments.

## Permissions (no broader than bill photos)

- **Staff:** the existing `attachments_*_perm` policies, via `bill_owner_can('clinic_visit', …)` = **`medical.visits`**: read to see, edit to add/remove. Unchanged; reports inherit it.
- **Doctor (clinic login):** `doctor_can_write_attachment()` now answers for `clinic_visit` with `clinic_login_owns_visit(visit)` (visit at one of its current clinics). It cannot see `purpose`, so four new policies (`doctor_{read,write,update,delete}_visit_reports`) and `record_attachment()` additionally require `purpose = 'report'`. **A doctor can never add or read a bill**, even at their own clinic. Another clinic's visit: refused.
- A role without `medical.visits` (volunteer in the harness) sees none and cannot add.

## What the app half must do

- **Write:** `attachments.purpose = 'report'`, `owner_type = 'clinic_visit'`, `owner_id = <visit id>`. Allowed values exactly `'bill'` | `'report'`. Go through `record_attachment(p_owner_type, p_owner_id, p_drive_file_id, p_file_name, p_sub_folder, p_date_taken, p_adoption_update_id, p_purpose)`; **pass `p_purpose => 'report'`** (default is `'bill'`; the old 7-argument form was dropped, named/positional 7-arg callers still work). The report's date goes in `date_taken`. There is no note column: add one (`caption` exists on attachments, from 0034) or a new migration if a note is wanted.
- **Read/attach points (verified on `main`):** `src/app/clinic-visits/[id]/edit/page.tsx` (~94, ~149, `BillPhotosSection`) shows bills via `loadBillPhotos()`; add a sibling **Doctor's report** section that queries `attachments` with `.eq("owner_type","clinic_visit").eq("purpose","report")`, ordered by `uploaded_at`, and reads `error`. Resident side: `src/app/residents/[id]/[section]/sections/clinic-visits.tsx`. `loadBillPhotos()` must **stay** bill-only; do not loosen it to share code.
- **Permission conditions:** read `medical.visits` (read); write `medical.visits` (edit); doctor: `doctor_can_write_attachment('clinic_visit', visit_id)` AND `purpose = 'report'` (named function, enforced in policy and `record_attachment()`). A doctor's page must check own-clinic server-side the same way.
- **Multi-resident:** `clinic_visits.resident_id` is a single resident, so one booking for two residents is **two visit rows**, and the schema is **one report row per file per visit**. To file for several residents the app creates one attachment row per visit (same Drive file id is fine, or a copy). There is no resident list on the attachment; none was added because the visit already names the resident.
- **Drive filing:** not constrained by the schema. Resident's own folder under **Medical**, named like `2026-10-20 Novel report - Blackie.pdf`. Use `sub_folder = 'Medical'` as other clinical files do. Reports are private: they are `owner_type = 'clinic_visit'`, which no public view reads, and appeals read resident photos only.
- **Mind the deceased lock:** attachment writes on a dead resident's visit go through the lock (0026); `attachment_resident_id()` returns null for `clinic_visit`, which is why the doctor policies key on the visit, not the resident.

## What I deliberately did not do

- No UI, no note column, no `report_resident_ids` array (see multi-resident), no stub of the section.
- Did not change `bill_owner_can()` or the staff policies: they already give exactly the permission the item asks for.
- Did not touch `attachment_resident_id()`; widening it would reach the doctor/clinic resident-scope policies for every owner type.
- Did not add a trigger blocking changing `purpose` on update: staff can already re-own a bill (inbox matching moves rows), and a bill re-filed as a report is a deliberate act under `medical.visits` edit.

## Production

Apply `0220` with the release, **before** the app half deploys. `loadBillPhotos()` and the inbox now select on `purpose`, so this PR's code **requires** the migration: apply before the Worker/Pi code deploy, or the Bills inbox and visit bill photos error.
