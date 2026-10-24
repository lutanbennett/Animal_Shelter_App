# Harness sweep, permissions first (2026-10-24)

Backlog item "The other 47 red database harnesses". Lutan ruled 2026-10-24: sweep a **bounded** batch, permissions first; scripts only.
This is the first batch: **ten harnesses triaged, nine fixed, one genuine fault filed (not fixed).** Nothing in CI, no migration, no `src/`.

## The list (the thing this stream was for)

Every `scripts/check-*.mjs` that names the dev project or its database API: 140 files, each run once on 2026-10-24 against dev
(4 at a time, 150 s limit, output kept). It is wider than the 2026-10-23 sweep's "109 runnable without a server" because it also
catches checks that need a dev server, and the checks already wired or triaged.

| Result | Count |
|---|---|
| Green (exit 0) | 65 |
| Not run: needs a dev server (connection refused) | 17 |
| Red or crashed | 58, of which **10 triaged here** and **48 remain** |

The five from #890 (`check-doctor-own-clinic-writes`, `-report-schema`, `-multi-clinic`, `check-worker-origin`, `check-backup-prune`) are green now.
Exit 127 in the table further down is Node dying on Windows (a `UV_HANDLE_CLOSING` assertion) *after* the harness had already failed; the line shown is the real error.

**Green:** `check-adoption-updates`, `check-app-access-gate`, `check-appeal-medical-photos`, `check-assistant-refused`, `check-assistant-retention`, `check-assistant-refused-client`, `check-audit-log`, `check-bills-roles`, `check-card-taps`, `check-bill-photos-listed`, `check-clinics-readonly`, `check-contact-map-url`, `check-contact-visibility`, `check-contacts-archive`, `check-cron-job`, `check-dead-schema-drop`, `check-doctor-clinic-scope`, `check-doctor-multi-clinic`, `check-doctor-name`, `check-doctor-report-schema`, `check-doctor-own-clinic-writes`, `check-doctors`, `check-env-leak`, `check-donation-channels-schema`, `check-donation-receipts-schema`, `check-facility-maps`, `check-fixed-outgoings`, `check-impact-baselines`, `check-lifecycle-guards`, `check-home-cards`, `check-map-markers`, `check-map-rooms`, `check-medical-card-reads-record`, `check-medical-photos`, `check-medical-role`, `check-multi-role-schema`, `check-pending-photos`, `check-perm-convert-people`, `check-perm-convert-settings`, `check-perm-convert-photos`, `check-perm-convert-work`, `check-photo-approval`, `check-placement-guards`, `check-prescription-visit-not-future`, `check-public-drive-file`, `check-public-enclosures`, `check-public-microchipped`, `check-public-story-drive-file`, `check-perm-functions`, `check-resident-microchip`, `check-restated-columns`, `check-role-write-policies`, `check-shelter-friends`, `check-shelter-today`, `check-social-urls`, `check-staff-retired`, `check-status-alert-test-requests`, `check-status-alerts`, `check-stocktake`, `check-units-schema`, `check-user-roles-aal2`, `check-view-write-grants`, `check-website-content-grant`, `check-two-step-session`, `check-volunteer-narrowing`.

**Needs a running dev server (not run, so no verdict):** `check-access-requests-card`, `check-contact-address-fields`, `check-donate-buttons`, `check-facility-map-editor`, `check-home-screens-live`, `check-maintenance-bills-page`, `check-map-details`, `check-medical-jobs-app`, `check-page-guards-live`, `check-phone-width`, `check-residents-export`, `check-residents-select-all`, `check-residents-sort`, `check-security-role-picker`, `check-user-theme`, `check-upcoming-visits-page`, `check-who-does-what-page`.

## The ten, and why these

Permissions-first: each asserts what a role, card or policy may read or write, or (`check-role-can`, `check-permission-parity`) that the permission
answers agree with each other. Picked from the reds by that rule alone, not by how bad the failure looked.

| Harness | Verdict | What it asserted, and what the app does now |
|---|---|---|
| `check-policy-role-names` | **deliberate change** (0253), harness fixed | Four attachments policies call `sees_all_clinical()` with no `has_permission()` beside it. The cell is inside `bill_owner_can()` (0189: `medical.visits`), which the scope walk cannot see; 0253 marked them "scope-fn: deliberate" for the static twin. Added to `SCOPE_DELIBERATE` with the reason. Every other arm is guarded directly. |
| `check-maintenance-role` | **deliberate change** (0253), harness fixed | A doctor was expected to read one attachment. That one was a visit attachment at *another* clinic, readable by any doctor until 0253 closed it. Now 0 (the harness doctor has no own-clinic visit). The old baseline of 1 was the leak. |
| `check-clinic-allow-lists` | **deliberate change** (0184), harness fixed | A doctor reads one translation outside `residents`: an approved `map_rooms` row, by design (0184: "to anyone map_rooms_read already admits"). The check now excludes exactly approved map-room rows; anything else must still be 0. |
| `check-cards-schema` | **stale harness (fixed) and one GENUINE fault (filed)** | Three failures. (1) The photo-approver cases assumed nobody holds Add resident photos; since the 2026-10-21 ruling four real roles do, so the 0221 guard refused the harness. Fixed by clearing `add_photos` inside its rolled-back transaction. (2) `dryrun_photo_viewer_d6b305`, a disposable role the acceptance dry run left on dev with a direct `resident.record` cell and no card: dev data, not the app; left alone. (3) **The Doctor holds 14 cells but only 3 cards and one extra** (0230 wrote the cells directly): see below. Still red on (2) and (3). |
| `check-permission-tables` | **deliberate change**, harness fixed | Management expected 57 cells and has 58, the Doctor 13 and has 14: both gained `photos.shelter_add` from the Add Shelter Photos card (ruled 2026-10-21, menu-orphans 6 of 6). The expected cells, the hard-coded counts and the doctor "known red" count follow. Passes. |
| `check-role-can` | **stale harness** | "600 answers" was a literal; the catalogue grew to 66 activities (660). Every individual parity answer already matched. The count is now derived from `permission_activities`. |
| `check-medical-archive-roles` | **deliberate change** (0248), harness fixed | `record_intake` now asks `has_permission('resident.register')`; the harness called it with no login. It now runs it as the Management login. **The same cause is likely behind `check-audit-undo`, `check-medical-soft-delete` and `check-diets-sheet`**, which also seed through `record_intake` (not verified). |
| `check-2ic-role` | **deliberate change** (0249, 0253) and stale, harness fixed | The 2IC reads a resident and the list view (0249: who_and_where plus a `medical.*` edit); the doctor-attachments baseline is the 0253 one; the cards were imported without the resolver hook so the script crashed; and her bundle check ignored her 13 `role_extras`. All fixed; 300 checks hold. |
| `check-doctor-resident-scope` | **stale harness** | "Names still saying vet" tripped on `site_content.gift_split_vet` (0237), the trust block's share of gifts spent on veterinary care, not the retired role name. Excluded by name, with the reason. |
| `check-permission-parity` | **stale harness** and deliberate change | Its fixture used `diet_types.daily_qty_*` and `resident_diets.diet_type_id`, both gone, so it died before asserting anything. Fixture and the `medical.diet` probe (`scripts/lib/permission-probes.mjs`) follow `diets` and `diet_id`. Then four mismatches, all `photos.shelter_add` for Management and the Doctor (the card again): expected. 1849 match, 0 mismatch. |

Nine are green; `check-cards-schema` stays red on a real fault and a data leftover.

## The genuine fault

**The Doctor's powers are not backed by its cards, so saving the Doctor's cards would silently strip them.** `set_role_cards` (0194, last
changed 0222) "recomputes role_permissions as the union of their bundles plus its extras". 0230 (Lutan's ruling 2026-10-19: the visiting vet may
change diets and prescriptions) wrote the Doctor's medical, photo and reference cells straight into `role_permissions`, bypassing `role_cards`
and `role_extras`. On dev the Doctor holds three cards (view_residents, book_clinic_visits, add_photos) and one extra (`resident.microchip`)
against 14 cells; ten of them (`medical.visits` at 2 against the cards' 1, adoption news, procedures, blood tests, prescriptions, immunizations,
weight, diet, resident photos, add-while-recording) have no card or extra behind them. Anyone changing a card for the Doctor on the roles
screen would recompute the cells and remove those ten. That is a loss of access, not a leak. **Not known to be live on production**: 0230 is
applied there and the roles screen is reachable, but production was not read (those guards stay). Filed in Security; not fixed.

## What remains

48 red or crashed harnesses not reached, plus 17 that need a dev server. The red ones, with their first failure line:

| Harness | Exit | First failure line (a hypothesis, not a diagnosis) |
|---|---|---|
| `check-appeals-schema` | 127 | 400 Failed to run sql query: ERROR:  42P16: cannot drop columns from view |
| `check-audit-undo` | 1 | Failed to run sql query: ERROR:  42501: You do not have permission to register a resident. |
| `check-chip-scan` | 1 | Node.js v24.19.0 |
| `check-daily-count` | 1 | To eliminate this warning, add "type": "module" to \\?\C:\Development\Animal_Shelter_harness-sweep-permissions\package.json. |
| `check-diets-app` | 127 | file:///C:/Development/Animal_Shelter_harness-sweep-permissions/scripts/check-diets-app.mjs:75 |
| `check-diets-per-serving-schema` | 127 | file:///C:/Development/Animal_Shelter_harness-sweep-permissions/scripts/check-diets-per-serving-schema.mjs:124 |
| `check-diets-proportion` | 1 | 8 line(s) need a ruling: keep the shape as it is, or correct the amounts. |
| `check-diets-recipes-schema` | 127 | file:///C:/Development/Animal_Shelter_harness-sweep-permissions/scripts/check-diets-recipes-schema.mjs:139 |
| `check-diets-servings-app` | 127 | Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 94 |
| `check-diets-sheet` | 127 | file:///C:/Development/Animal_Shelter_harness-sweep-permissions/scripts/check-diets-sheet.mjs:57 |
| `check-director-answers-schema` | 1 | FAIL  contacts_table as c_dir_all: allowed - got 0 |
| `check-can-see-drive-file` | 127 | 400 Failed to run sql query: ERROR:  57014: canceling statement due to statement timeout |
| `check-community-dogs-schema` | 127 | 400 Failed to run sql query: ERROR:  42P16: cannot drop columns from view |
| `check-medical-jobs` | 127 | To eliminate this warning, add "type": "module" to \\?\C:\Development\Animal_Shelter_harness-sweep-permissions\package.json. |
| `check-medication-label` | 1 | Failed to run sql query: ERROR:  42703: column "daily_qty_small" of relation "diet_types" does not exist |
| `check-medical-soft-delete` | 1 | Failed to run sql query: ERROR:  42501: You do not have permission to register a resident. |
| `check-medication-rounds` | 127 | file:///C:/Development/Animal_Shelter_harness-sweep-permissions/scripts/check-medication-rounds.mjs:212 |
| `check-offsite-chip` | 1 | Node.js v24.19.0 |
| `check-order-and-units` | 127 | file:///C:/Development/Animal_Shelter_harness-sweep-permissions/scripts/check-order-and-units.mjs:107 |
| `check-pack-sizes` | 1 | Failed to run sql query: ERROR:  42703: column "daily_qty_small" of relation "diet_types" does not exist |
| `check-menu-coverage` | 1 | To eliminate this warning, add "type": "module" to \\?\C:\Development\Animal_Shelter_harness-sweep-permissions\package.json. |
| `check-perm-convert-admin` | 1 | {"message":"Failed to run sql query: ERROR:  23001: This resident is deceased — their record is read-only.\nCONTEXT:  PL/pgSQL function enfo |
| `check-perm-convert-medical` | 127 | file:///C:/Development/Animal_Shelter_harness-sweep-permissions/scripts/check-perm-convert-medical.mjs:172 |
| `check-perm-convert-orphans` | 127 | file:///C:/Development/Animal_Shelter_harness-sweep-permissions/scripts/check-perm-convert-orphans.mjs:218 |
| `check-perm-convert-residents` | 1 | FAIL  2 policy(ies) do not ask sees_all_residents() |
| `check-perm-convert-stock-and-lists` | 127 | file:///C:/Development/Animal_Shelter_harness-sweep-permissions/scripts/check-perm-convert-stock-and-lists.mjs:172 |
| `check-place-order-roles` | 1 | Node.js v24.19.0 |
| `check-preferred-channels` | 1 | Failed to run sql query: ERROR:  P0001: FAIL A existing row reads {line,messenger,whatsapp,instagram,phone,email} |
| `check-prescriptions-updated-at` | 1 | Failed to run sql query: ERROR:  42703: column "diet_type_id" of relation "resident_diets" does not exist |
| `check-price-free-pickers` | 127 | file:///C:/Development/Animal_Shelter_harness-sweep-permissions/scripts/check-price-free-pickers.mjs:140 |
| `check-public-stories-schema` | 1 | Failed to run sql query: ERROR:  P0001: FAIL A1 shared 4, anon sees 4 |
| `check-recurring-jobs` | 1 | Failed to run sql query: ERROR:  P0001: FAIL F2 doctor: ERR P0001 Not authorized to record a recurring job. |
| `check-resident-id-search` | 1 | Node.js v24.19.0 |
| `check-resident-sections` | 1 | file:///C:/Development/Animal_Shelter_harness-sweep-permissions/scripts/check-resident-sections.mjs:65 |
| `check-residents-status-chips` | 1 | dev has "Harness F20 Adopt" (zone Lifecycle) as Adopted |
| `check-safety-stock` | 1 | Failed to run sql query: ERROR:  42703: column "daily_qty_small" of relation "diet_types" does not exist |
| `check-schema-drift` | 2 | Give --against <project-ref> or --against-env <test/uat/production>. |
| `check-perm-convert-vet` | 127 | file:///C:/Development/Animal_Shelter_harness-sweep-permissions/scripts/check-perm-convert-vet.mjs:107 |
| `check-security-schema-fold` | 1 | Failed to run sql query: ERROR:  42501: A delivery cannot be edited: delete it and record it again. Only its cost can be changed. |
| `check-social-shares-schema` | 1 | FAIL harness: Failed to run sql query: ERROR:  P0001: FAIL editor should see 2 shares, saw 8 |
| `check-standard-diet` | 1 | Failed to run sql query: ERROR:  42703: column "diet_type_id" of relation "resident_diets" does not exist |
| `check-stock-corrections` | 1 | Failed to run sql query: ERROR:  42703: column "daily_qty_small" of relation "diet_types" does not exist |
| `check-stock-on-hand` | 1 | Failed to run sql query: ERROR:  42703: column "daily_qty_small" of relation "diet_types" does not exist |
| `check-stock-receipts` | 1 | Failed to run sql query: ERROR:  42703: column "daily_qty_small" of relation "diet_types" does not exist |
| `check-unit-conversions` | 1 | Failed to run sql query: ERROR:  23505: could not create unique index "item_unit_conversions_diet_type_purchase_key" |
| `check-weigh-first` | 1 | FAIL  window: yesterday 09:30 as doctor: not returned — got 1 |
| `check-weight-one-per-day` | 1 | Failed to run sql query: ERROR:  42501: You do not have permission to register a resident. |
| `check-who-does-what` | 1 | To eliminate this warning, add "type": "module" to \\?\C:\Development\Animal_Shelter_harness-sweep-permissions\package.json. |

Next batch: the five `check-perm-convert-*` (permissions) and `check-place-order-roles` (it makes a Staff login; Staff is retired; it also needs a server)
are the obvious permissions candidates. The `photos.shelter_add` and `record_intake` causes recur, so look for them first.

## A rule this restates, not a new one

Hard-coding activity lists and counts in a check is the fault Lutan named on 2026-10-23. `check-permission-tables` still carries literal cell
counts; I moved them by one rather than rewriting it, to stay in scope. Deriving them from `cards.ts` is the proper fix.
