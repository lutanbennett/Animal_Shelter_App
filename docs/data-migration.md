# Migrating the AppSheet data

How the shelter's records move from the legacy AppSheet / Google Sheets
system into this app. Two scripts do the work; this page records what
they do to the data and why, and the runbook for cutover.

## Source

The AppSheet app's backing store is the Google Sheet **"Database"** (id
`1rNLUsZtQQmod_fGWjU9qMefxzQHa452gNRs4pOodiK8`, owned by the shelter's
Google account). Its files — resident photos, blood-test scans, project
photos — sit in the same Drive account, in a tree relative to the sheet's
own folder. That folder **is** the app's `GOOGLE_DRIVE_ROOT_FOLDER_ID`, so
nothing needs copying between accounts: the migration links the rows to
the files that are already there.

Size on 2026-09-22: 76 residents, 162 placements, 141 attachments, 55
blood tests, 75 vet appointments, 64 prescriptions, 18 weights, 18
immunizations, 12 procedures, 22 project folders, 26 project photos.
Maintenance, bulk uploads and bulk appointments were empty.

## Scripts

```bash
node scripts/appsheet-export.mjs --out appsheet-export/latest
```

Snapshots every tab the import reads as CSV (gitignored, real records),
checking each tab's header row so a restructured sheet fails here. Uses
the app's Drive OAuth token — Sheets' `gviz` CSV endpoint accepts it, one
tab at a time, no extra scope.

```bash
node scripts/import-appsheet.mjs --report              # what would load, and every anomaly
node scripts/import-appsheet.mjs --dry-run             # the whole load, rolled back
node scripts/import-appsheet.mjs --replace             # dev/test: wipe scratch rows, load
node scripts/import-appsheet.mjs --env production      # production: must be empty
```

Reads the snapshot, cleans it, resolves every file path against Drive,
then sends the load as **one SQL transaction** through the Management API
(as `apply-migrations.mjs` does). Assertions at the end — exactly one
open placement per resident, the expected number of deceased, no
placement ending before it starts — abort the transaction, so a failed
run leaves nothing behind. Only after the commit are the legacy Drive
folders renamed. UUIDs derive from the AppSheet ids, so re-running the
same snapshot yields the same rows.

## Mapping

| AppSheet | App | Notes |
|---|---|---|
| `Residents` | `residents` | `R-nnnn` codes assigned in intake order; the sequence is bumped past them. |
| `Breed = "Cat"` or name ending "(Cat)" | `species` | The sheet had no species column; everything else is a dog. "Cat" is cleared from `breed`. |
| `Date of birth` (`Jan-2020`) | `estimated_age_years` + `age_estimated_on` | Rounded to half a year, anchored to the export date (the app never stores a DOB, 0011). |
| `Spayed` | `is_desexed` | Only `TRUE` / `FALSE` are meaningful; blank → unknown. |
| `Blood Test Priority` (Yearly / Quarterly / Monthly) | `blood_test_interval_months` (12 / 3 / 1) | New column, 0064. |
| `Thai Name`, `Other Names`, `BIO`, `Ready for Adoption`, `Origin ID` | same-named columns | Ready-for-adoption also sets `is_public_visible`, as intake does; forced off for the deceased. |
| `Profile Image` (an Attachments id) | `profile_photo_drive_file_id` | Via the resolved attachment. |
| `Zones` | `zones` | `Int-Ex = LCA` → `internal`; "orange" title-cased. Carers / Hospital / Deceased / Unassigned are not created — they are the seeded `Lifecycle` zone. |
| `Enclosures` | `enclosures` | `Maximum Residents` → `capacity`, `Description` → `notes`. Fostered / Adopted / Hospital / Deceased / Unassigned map to the seeded Lifecycle pseudo-enclosures. |
| `Placement_History` | `placement_history` | `Fostered` → `Foster`, `Adopted` → `Adopt` (the enum's spellings). Loaded chronologically per resident with the close-prior trigger live, so each row ends where the next starts; same-day moves get successive seconds so `end_date > start_date` holds. The Deceased row runs the app's own cascade. |
| `Contacts` | `contacts` | `Supplier` → `Vendor`; `Watsapp ID` → `whatsapp`, `Messenger ID` → `messenger_id`, map link → `address`. |
| `Vets` | `vets` | Phone / LINE / map link folded into `contact_info`. |
| `Vet Appointments` | `vet_appointments` | All in the past → `completed`, 09:00 local. |
| `Weight` | `weight` | With the appointment link (0028). |
| `Procedures` | `procedures` + `procedure_types` | Type by name (`X-Ray` → `X-ray`, `Teeth Clean` → `Teeth cleaning`); `Outcome` → `notes`; one row with no procedure name is dropped. |
| `Blood Tests` | `blood_tests` + `blood_test_types` + `attachments` | Type by name (`Urinalysis` → `Urinary Analysis`, new ones added). The 27 CBC value columns, normal result, treatment plan and next-test note are folded into `results` as labelled lines. `File` becomes a `blood_test` attachment. |
| `Prescriptions` | `prescriptions` | `# Tablets` → `dose_quantity`; `Frequency` × `Times per frequency` → the 0027/0044 label (Daily×2 → "Twice daily", Weekly, Monthly). |
| `Medication` | `medication` | Merged by name into the seeded rows. |
| `Immunization Types` | `immunization_types` | `FrequencyValue (Months)` → `interval_months`; `Parvovirtus` → `Parvovirus`. |
| `Immunization History` | `immunization_records` | The per-dose rows. `Immunization Records` is the bulk fan-out parent and is not migrated — this closes open question 2 in `decisions.md`. Duplicates on (resident, type, date) are dropped rather than tripping the unique constraint. |
| `Attachments` | `attachments` | `Resident Photo` → `owner_type = resident` with `Sub_Folder` as the category (blank → Shelter); `Procedure Image` → `owner_type = procedure`. `Tag` → `caption`. |
| `Project_Folders` / `Project_Photos` | `project_folders` / `attachments (project)` | Under the seeded category roots; the legacy `Enclosure Maintenance` subtree is skipped (test folders only). |

Everything migrated is `created_by` the first active admin.

### Dropped

- Rows whose resident is missing from the Residents tab (placements,
  attachments): test residents deleted from AppSheet, confirmed 2026-09-22.
- Attachments whose file cannot be found in Drive (listed by the report).
- `Details`, `Medical`, `Print Profile Counter` on residents (empty or
  AppSheet-only), the `Buttons`, `Maintenance_Filter`, `_Per User
  Settings`, bulk-upload and bulk-appointment tabs (AppSheet mechanics).

## Drive

A resident's legacy folder is `Residents/<Name> (<8-hex AppSheet id>)/`
(or under `Residents/Deceased/`). The import finds it by that suffix,
stores its id in `residents.drive_folder_id`, and after the commit
renames it to the app's `<Name> (R-nnnn)` so staff browsing Drive see
one convention. Sub-paths (`Photos/<Category>/<YYMM>/`, `Blood
Tests/<YYMMDD>/`, `Procedures/<Type> <YYMMDD>/`) are walked literally
to find each file's id. Residents who never had an upload have no
folder; the app creates one on first use.

Deceased residents come across with `deceased_archived_at` null even
though their folder is already under `Deceased/`: the hub's **Retry
archive** then writes the summary PDF and offline index into the
existing folder (the move step recognises it is already there).

The report lists folders under `Residents/` that belong to no migrated
resident — dev scratch folders — for cleanup by hand.

## Runbook

1. `node scripts/appsheet-export.mjs --out appsheet-export/latest`
2. `node scripts/import-appsheet.mjs --report` — read every note.
3. Rehearse: `--dry-run`, then `--replace` against dev; check Test on a
   phone: resident list, a few hubs, the deceased, `/adopt`, photos.
4. Cutover: make the AppSheet app read-only; export again; `--env
   production`; verify as in 3; click Retry archive on each deceased
   resident's hub.
5. Parallel run per the requirements doc §9; reprint QR / RFID at the
   end of it; then retire the AppSheet app and its Apps Script triggers.
