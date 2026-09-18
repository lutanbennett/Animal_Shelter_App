# Lanna Care for Animals — Custom Rebuild Requirements

**Purpose:** This document specifies the replacement of the current AppSheet/Google Sheets application with a custom-built web application, for implementation by Claude Code. It is intended as a self-contained brief — Claude Code should not need the AppSheet app itself to build from this, though the live Google Sheets data will be the migration source.

**Status:** Draft v1 — for review before implementation begins.

**Author context:** Lutan Bennett, Director, Lanna Care for Animals (Chiang Mai, Thailand). Prepared by Claude based on the current AppSheet system's documented data model, business logic, and integration conventions.

---

## 1. Background and Rationale

The current system is built on Google AppSheet with Google Sheets as the backing database. It has been in production use and has matured through several rounds of design (notably a full event-sourced "Placement History" model for resident lifecycle state — see Section 4.1). However, the platform has hit a set of fundamental, non-negotiable limitations:

- **Unresolved data-integrity bug (B69):** an immunization-recording workflow intermittently adds duplicate rows and drops others. Root-cause investigation ruled out Quick Sync, Sheets version-history interference, and several Apps Script race conditions (a `getLastRow()` write-batching race and self-triggering reentrancy were found and patched, but the bug persists). This points to a deeper issue with AppSheet's automation/Sheets concurrency model that cannot be fully engineered around on this platform.
- **No native multi-file/image upload.** This is a hard capability gap, not a bug. The current workaround (a separate Google Form + Apps Script glue to reorganize submissions into Drive folders) is itself unreliable and requires users to re-click uploads to register all files.
- **No multi-column form/view layout.** AppSheet's view/form layout engine is single-column only, limiting how information can be organized for users.
- **Restricted, slow HTML columns.** LongText columns rendered as HTML support only a narrow tag subset (`<b>`, `<img>`) and are a known performance cost.
- **Runaway virtual column recalculation.** AppSheet recomputes virtual/calculated columns **client-side**, on every user interaction/sync — not incrementally, not server-cached. As the app has grown, the number of virtual columns has become a genuine performance liability.
- **Deceased archival already requires bypassing AppSheet** (implemented as a bound Apps Script, `archiveDeceasedResidentFolders`) — evidence that native AppSheet automation is already insufficient for the app's real needs.
- **120-second hard automation timeout** (non-configurable at any plan tier) constrains any workflow requiring longer processing.

**Decision:** Move off AppSheet entirely to a custom-built application on a modern, self-managed stack. This is a considered architectural decision based on accumulated, specific platform limitations — not a reaction to a single bad week.

**What must be preserved:** the business logic and data relationships that took multiple design iterations to get right (especially the Placement History event-sourcing pattern — see 4.1), the Google Drive file/folder conventions staff already know, and the core day-to-day workflows staff rely on (recording vet visits, immunizations, weights, procedures; managing enclosures and resident status; community/maintenance project tracking).

**What is explicitly new scope, not just replication:** proper role-based access control (the current app has no discrete roles at all — just two full-access Google accounts).

---

## 2. Technology Stack

| Layer | Choice | Notes |
|---|---|---|
| Database | **Supabase (Postgres)** | Real relational database with transactions, constraints, and row-level security (RLS). Replaces Google Sheets as the system of record. |
| Auth | **Supabase Auth** | Email/password and/or Google OAuth (staff already use Google Sign-In today — support Google OAuth to ease transition). Backs the RBAC model in Section 6. |
| Realtime (optional, use where it adds value) | **Supabase Realtime** | Not a requirement, but useful for e.g. live-updating a maintenance kanban board or enclosure occupancy view if multiple staff work concurrently. Not needed to satisfy any functional requirement below — treat as a nice-to-have. |
| Backend/API | **Next.js** (App Router, Route Handlers / Server Actions) | Single codebase for UI and API. Use Server Actions or Route Handlers for writes that need transactional integrity (see 7.3). |
| Frontend | **Next.js + Tailwind CSS** | Enables genuine multi-column, responsive layouts — a direct fix for AppSheet's single-column limitation. |
| File/image storage | **Google Drive** (via Google Drive API, service account or domain-wide delegation) | Deliberately kept as the file store rather than moving to Supabase Storage, to preserve the existing folder structure staff and volunteers already navigate manually in Drive (see Section 5). |
| PDF generation | A proper PDF library/service (e.g. `@react-pdf/renderer`, Puppeteer/HTML-to-PDF, or a templating service) | Replaces the AppSheet Bot + Google Docs merge-template hack currently used for resident profiles and deceased summaries. |
| Hosting | Vercel (natural fit for Next.js) or equivalent | Not mandated by the user but assumed; flag as an open question if a different host is preferred. |
| Repository | **GitHub** | Source of truth for code; Claude Code will work against this repo. |
| Offline support | **Not required.** | Explicit user decision: shelter has reliable connectivity on-site; field staff take photos on phones and upload in the evening when back on Wi-Fi. Do not build a PWA/offline-sync layer — this would add complexity with no corresponding requirement. |

---

## 3. Non-Functional Requirements

1. **Data integrity over convenience.** Every write path that could plausibly race (see 7.3, immunization recording in particular) must use real database transactions and unique constraints to make duplicate/lost-row bugs structurally impossible, not just unlikely. This is a direct response to the unresolved B69 bug — the new system must not be able to reproduce that failure class regardless of which platform it's built on.
2. **Performance.** No AppSheet-style "recompute everything on every click." Use normal relational patterns: indexed foreign keys, computed values done once at write time or via targeted queries/views, and caching only where genuinely needed. A resident's "current status" (see 4.1) should be a cheap, well-indexed query — not a client-side recalculation of the whole dataset.
3. **Multi-column, responsive layouts.** UI should take advantage of Tailwind's layout flexibility — this is an explicit fix for a named AppSheet gap, not just an aesthetic preference.
4. **Reliable multi-file/multi-photo upload.** Must support selecting and uploading multiple images/files in a single action, with clear per-file upload progress/success/failure feedback, uploading directly to the correct Google Drive folder (Section 5). This directly replaces the flaky Google Forms + Apps Script workaround.
5. **No offline mode.** See stack table above — explicitly out of scope.
6. **Auditability.** Because Placement_History (4.1) and similar event logs are the source of truth for lifecycle state, all inserts into these tables should record who made the change and when (this is straightforward with Supabase Auth + `created_at`/`created_by` columns, and was not well supported in AppSheet).
7. **Migration-friendly.** Schema and migration scripts should be able to ingest the existing Google Sheets data (Section 9) without manual row-by-row reconciliation.

---

## 4. Data Model

The current system's tables fall into four domains. Below, each table is specified with its purpose, key fields, and relationships. **Note on staleness:** the original `01-data-model.md`/`03-automations.md` documentation describes Residents as having physical `Status`/`Zone`/`EnclosureID`/`CarerID`/`Deceased` fields directly on the Residents table. **This was superseded by the B48 redesign, which is the authoritative model below** — those fields were deleted from Residents entirely and replaced by an event-sourced Placement_History table plus computed "current state" views.

### 4.1 Residents & Housing

**This is the most important domain to get right, because it encodes a hard-won architectural lesson: model resident lifecycle as an append-only event log, not as mutable fields on the Residents row.**

**`residents`**
- `id` (PK, UUID)
- `name`
- `species`, `breed`, `sex`, `date_of_birth` (or estimated age), `intake_date`
- `bio` / `temperament_notes` / `past_story_notes` / `behaviour_notes` (free text — this is explicitly called out in the project brief as core content: "bio of the dogs temperament, past story and behaviour")
- `profile_photo_url` (or Drive file reference — see Section 5)
- `ready_for_adoption` (boolean)
- Do **not** add `status`, `zone`, `enclosure_id`, `carer_id`, `deceased`, or `date_of_death` columns directly here — these are all derived from `placement_history` (below).

**`placement_history`** (append-only event log; this is the single source of truth for "where is this resident and what state are they in")
- `id` (PK, UUID)
- `resident_id` (FK → residents)
- `placement_type` (enum: `Intake`, `ChangeEnclosure`, `SendToHospital`, `ReturnFromHospital`, `Foster`, `Adopt`, `Deceased`, `ReturnToShelter`)
- `start_date` (timestamptz, not null)
- `end_date` (timestamptz, nullable — null/blank means this is the currently active record)
- `zone_id` (FK → zones, nullable)
- `enclosure_id` (FK → enclosures, nullable)
- `previous_enclosure_id` (FK → enclosures, nullable — used when returning from hospital, to restore prior placement)
- `carer_id` (FK → contacts, nullable, filtered to contacts where `type = 'Carer'`)
- `notes` (text — the **only** field on this table that may be edited after creation)
- `created_by`, `created_at`

**Business rules:**
- Records are immutable except `notes`. No UI should allow deleting or editing a placement_history row's core fields once written.
- On inserting a new `placement_history` row for a resident (except `Intake`), the previous active record (the one with `end_date IS NULL`) for that resident must have its `end_date` set automatically, in the same transaction, to the new record's `start_date`. This replaces AppSheet's "Close Prior Placement Record" Bot — implement it as a DB trigger or as part of the same server-side transaction that inserts the new row, not as a separate async step.
- "Deceased" and "Fostered" and "Adopted" and "Unassigned"/"Hospital" are modeled as **pseudo-enclosures under pseudo-zones**, exactly as in the current system (this pattern is proven and should be preserved) — e.g. a `zones` row "Deceased" containing an `enclosures` row "Deceased", so that "current enclosure" queries work uniformly whether a resident is physically housed or in one of these lifecycle states. Do not special-case deceased/fostered/adopted residents with a separate boolean flag scattered across queries — keep them expressible as "current enclosure = the Deceased/Fostered/Adopted pseudo-enclosure."

**Computed values (implement as SQL views or query helpers, not stored columns unless performance requires materializing):**
- `current_placement`: the placement_history row per resident where `end_date IS NULL`.
- `current_enclosure_id`, `current_zone_id`, `current_carer_id`: pulled from `current_placement`.
- `current_status`: derived from the current placement's enclosure — one of `Deceased`, `Hospitalised`, `Fostered`, `Adopted`, `Outreach`, `Resident` (i.e., physically at the shelter).
- `is_deceased`, `date_of_death`: derived from whether current placement type/enclosure is the Deceased pseudo-enclosure, and its `start_date`.
- `active_hospital_previous_enclosure`: for a resident currently hospitalised, the `previous_enclosure_id` captured at admission, used to auto-restore placement on return.

**`enclosures`**
- `id` (PK), `name`, `zone_id` (FK → zones), `capacity` (if tracked), `notes`.
- Includes the fixed pseudo-enclosures: Unassigned, Fostered, Adopted, Deceased Enclosure (plus a Hospital equivalent if distinct from "Unassigned" in the current system — confirm against live data during migration).

**`zones`**
- `id` (PK), `name`. Includes the pseudo-zone "Deceased" and any others used for the pseudo-enclosure pattern.

**`group_origins`**
- Reference table for where a group of animals originated (e.g. a rescue intake batch). `id`, `name`, `notes`, `date`.

### 4.2 Vet & Health

- **`vets`** — `id`, `name`, `clinic_name`, `contact_info`.
- **`vet_appointments`** — `id`, `resident_id` (FK), `vet_id` (FK), `appointment_date`, `reason`, `notes`, `status` (scheduled/completed/cancelled). Supports the "Bulk Appointments" fan-out pattern below.
- **`bulk_appointments`** — represents a single scheduling action against multiple residents at once; on save, fans out into individual `vet_appointments` rows. Implement as a real transaction (insert N rows in one DB transaction) rather than AppSheet's row-by-row "grouped action" pattern, which is one of the mechanisms implicated in race-condition bugs like B69.
- **`weight`** — `id`, `resident_id` (FK), `date`, `weight_kg`, `notes`.
- **`procedures`** — `id`, `resident_id` (FK), `vet_appointment_id` (FK, nullable), `procedure_type`, `date`, `notes`.
- **`blood_tests`** — `id`, `resident_id` (FK), `vet_appointment_id` (FK, nullable), `date`, `results`/`notes`, file/attachment reference (Drive).
- **`medication`** — reference table of medication names/types.
- **`prescriptions`** — `id`, `resident_id` (FK), `medication_id` (FK), `start_date`, `end_date`, `frequency_id` (FK), `notes`.
- **`frequency`** — reference table (e.g. "twice daily", "every 8 hours").
- **`immunization_types`** — `id`, `name`, `is_mandatory` (boolean), plus **forecast fields** per `immunization-system-design.md`: precomputed or queryable counts of doses due in 7/14/30/90 days, used for vaccine stock/procurement planning.
- **`immunization_records`** — `id`, `resident_id` (FK), `immunization_type_id` (FK), `date_administered`, `administered_by`, `notes`, `batch_number` (if tracked). **Critical:** enforce a unique constraint or upsert-on-conflict on `(resident_id, immunization_type_id, date_administered)` to make the B69 duplicate/dropped-row bug class structurally impossible — see Section 7.3.
- **`immunization_history`** — if this was a separate audit/log table in the original system (vs. `immunization_records` itself), confirm its exact purpose against the live sheet during migration; likely can be collapsed into `immunization_records` with proper `created_at`/`updated_at` auditing in a Postgres design, but flag this as an open question (Section 11).

**Immunization business logic to carry forward** (from `immunization-system-design.md`):
- Do not seed empty/placeholder immunization records for a resident — compute "missing mandatory immunizations" as `all_mandatory_types - recorded_types_for_this_resident`, done as a query, not stored data.
- Exclude residents who are Deceased or Adopted from forecasting/compliance views (join against `current_status` from 4.1).
- Provide two views: (a) per-resident compliance (which mandatory vaccines does this resident have/lack), and (b) per-vaccine-type stock forecast (how many doses will be needed across all active residents in the next 7/14/30/90 days).

### 4.3 Photos & Files

See Section 5 for the full Google Drive storage design. Data model needs:
- **`attachments`** — polymorphic or per-domain reference table(s) linking a resident (or project, or maintenance record) to a Google Drive file ID/URL, with `sub_folder` category (matching current conventions: general photos, blood test scans, procedure photos, etc.), `uploaded_at`, `uploaded_by`.
- **`project_folders`**, **`project_photos`** — mirror the current Projects tree structure (Section 5.2).
- **`maintenance_photos`** — photos attached to maintenance/community project records.
- Legacy file migration: a one-time mapping table or migration script step to carry over existing Drive file references from the old Bulk Upload / Attachments sheets so nothing is orphaned.

### 4.4 Community & Maintenance

- **`maintenance`** — `id`, `title`, `description`, `status` (the current app uses 4 status values driving a kanban board — confirm exact values during migration, e.g. To Do / In Progress / Blocked / Done), `location`/`zone_id` (nullable, for shelter-adjacent work like fence repair), `assigned_to` (FK → contacts), `date_created`, `date_completed`.
- **`maintenance_filter`** — if this was an AppSheet Slice-equivalent (a saved filter, not real data), it does not need a table in Postgres — implement as query parameters/saved views in the UI instead.
- **`contacts`** — `id`, `name`, `type` (enum including at least `Carer`, plus whatever other types exist — e.g. Volunteer, Vendor, Donor — confirm during migration), `phone`, `email`, `line_id` (the current system has a "tap to message" Line integration — replicate as a `line_id` field with a `https://line.me/ti/p/~{line_id}` link, or confirm exact current URL pattern during migration).

### 4.5 Reference/system tables not needing direct translation

- `_Per User Settings` — AppSheet-specific per-user app preferences; not needed in a custom build (use normal user preference storage tied to the Supabase Auth user if any per-user settings are genuinely needed).
- The 10 AppSheet Slices — these were AppSheet's mechanism for filtered views (e.g. "Active Residents", the 4 maintenance-status slices). In the new system these become SQL views, API query filters, or just filtered React Query calls — not separate stored tables.

---

## 5. Google Drive Integration

Google Drive is retained as the file/image store (explicit user decision) so that existing folder structures remain navigable to staff outside the app.

### 5.1 Folder conventions to preserve

- **Per-resident:** `Residents/<Name> (<ID>)/Photos/<Sub_Folder>/<YYMM>/...`, `Residents/<Name> (<ID>)/Blood Tests/<YYYYMMDD>/...`, `Residents/<Name> (<ID>)/Procedures/<Type> <YYYYMMDD>/...`
- **Deceased archive:** residents' folders move to `Residents/Deceased/` — currently done by a 15-minute Apps Script polling trigger (`archiveDeceasedResidentFolders`). In the new system, trigger this synchronously (or via a queued job) at the moment a `Deceased` placement_history record is written, rather than polling — this is a case where the new architecture can genuinely improve on the old.
- **Community projects:** `Projects/<TopLevelCategory>/...` (12 fixed top-level categories), built recursively up to ~5 segments deep via what was a formula (`Ful_Folder_Path`) in AppSheet — reimplement as a server-side function that builds the path deterministically from project metadata.
- **Admin templates:** `Admin/PDF Templates/` — likely not needed in the new system if PDF generation moves to a code-based templating approach (Section 8.5), but confirm no other process depends on this folder.
- **Bulk Uploads:** the current `Bulk Uploads/` staging folder + `onBulkUploadFormSubmit` reorganization script exists specifically to work around AppSheet's lack of native multi-file upload. **This entire mechanism should be eliminated**, not replicated — the new app's upload UI (Section 3, requirement 4) should upload multiple files directly to their final per-resident/per-project Drive folder in one action, with no staging/reorganization step needed.

### 5.2 Implementation notes

- Use a Google service account with domain-wide delegation (or shared-drive access) scoped to the shelter's Drive, so the Next.js backend can create folders and upload files server-side without per-user OAuth friction for staff.
- Store the Drive file ID (not just a URL) in the `attachments`/related tables, and construct view/download links from the ID — this is more robust to folder moves (e.g. the deceased-archive move) than storing full paths.
- Multi-file upload UI should show per-file progress and clearly surface any individual file failure (direct fix for the current "doesn't recognize them first time" flakiness).

---

## 6. Role-Based Access Control (RBAC)

The current system has **no discrete roles** — two Google accounts, both full access. This is new scope, explicitly requested, not a replication of existing behavior.

**Four roles**, to be implemented via Supabase Auth + Postgres Row-Level Security (RLS) policies:

| Role | Intended users | General access level |
|---|---|---|
| **Director/Admin** | Lutan and any future director-level staff | Full read/write access to everything, including user/role management, deletion of records, and RBAC configuration itself. |
| **Staff** | Day-to-day shelter staff and reliable volunteers | Read/write on residents, placements, weights, photos, maintenance/community projects, contacts. Likely should **not** be able to delete placement_history records (immutability rule, 4.1) or manage other users' roles. |
| **Vet** | Veterinarians (internal or external, e.g. visiting/contracted vets) | Read/write on vet appointments, procedures, blood tests, prescriptions, immunization records, weight. Read access to resident bios/history needed for context. Likely read-only (or no access) on maintenance/community projects and RBAC settings. |
| **Public/Anonymous** | General public, e.g. viewing an adoptable-animal listing or a QR-code-scanned resident profile | Read-only, and only on a deliberately narrow, non-sensitive subset of fields — e.g. name, species, breed, adoption-readiness, bio/temperament, public photos. Must **not** expose vet records, internal notes, contact/carer personal information, or maintenance/financial data. |

**Requirements to specify precisely during implementation (flagged as needing sign-off, not fully resolved here):**
- Exact per-table CRUD matrix for each role (the table above is a starting point, not exhaustive).
- Whether "Public/Anonymous" access requires authentication at all, or is genuinely unauthenticated (e.g. for QR-code scans on enclosure signage — see 8.4) — likely unauthenticated read-only, scoped via RLS policies that key off a `is_public_visible` flag on residents plus a restricted column set exposed through a dedicated public view/API, not the same query path staff use.
- Whether Vets should be scoped to only residents they've treated, or have shelter-wide read access to all residents' medical context (recommend shelter-wide read for medical safety — a vet covering for a colleague needs full history).
- Whether volunteers should be a distinct fifth tier under "Staff" with reduced permissions (out of scope unless the user asks — flagged as an open question in Section 11).

---

## 7. Core Business Logic / Workflows to Replicate

### 7.1 Placement transitions (7 types)
Implement each of the 7 placement actions (Intake, Change Enclosure, Admit to Hospital, Return from Hospital, Foster, Adopt, Deceased, Return to Shelter — note the original has these as named Actions in AppSheet, all writing through one shared form) as a single server-side transaction per action that: (a) validates the transition is legal given current state, (b) closes the prior active placement_history record, (c) inserts the new record. See 4.1 for the exact mechanics.

### 7.2 Deceased workflow (cascading cleanup)
On a `Deceased` placement_history insert, in the same transaction or a reliably-triggered follow-up job:
- Cancel all future-dated vet appointments for that resident.
- End all active prescriptions for that resident (set end_date to today).
- Clear/cancel future blood-test reminders if such a concept exists (confirm during migration).
- Set `ready_for_adoption = false`.
- Generate the Deceased Resident Summary PDF (Section 8.5) and move the resident's Drive folder to the archive location (Section 5.1).
- **Important lesson from the original build:** a bug was once introduced where the "Deceased" action set `end_date = start_date` at creation, which broke every "find the active record" query. Guard against this class of bug with a database constraint or check (e.g. `CHECK (end_date IS NULL OR end_date > start_date)`), not just careful coding.
- **Another lesson:** cascade-delete relationships previously caused ALL historical blood tests/procedures/prescriptions (not just future ones) to be deleted when a parent vet appointment was deleted. Do not use `ON DELETE CASCADE` on these relationships in the new schema — cleanup of future-dated records should be an explicit, scoped update (as above), never a blanket cascade delete.

### 7.3 Immunization recording — idempotency (direct fix for B69)
This is the single highest-priority correctness requirement, since it's the specific bug that triggered this migration:
- Enforce a **unique constraint** on `immunization_records (resident_id, immunization_type_id, date_administered)` (or add a natural idempotency key if duplicate same-day doses of the same vaccine are legitimately possible — confirm with the user).
- Write immunization records via a single INSERT ... ON CONFLICT DO NOTHING/UPDATE (upsert), inside a transaction, rather than a client-side "check if exists, then insert" pattern (which is exactly the race condition that likely caused B69's duplicates).
- For any bulk/fan-out recording (e.g. recording the same vaccine across multiple residents in one action, mirroring the current "grouped action" pattern), insert all rows in a single transaction/batch statement, not a loop of individual requests — this removes the `getLastRow()`-style batching race entirely, since Postgres handles the atomicity.
- Add a periodic reconciliation check (e.g. a scheduled query) that flags any resident with more than one immunization_record for the same type+date, as a safety net — not because the constraint above should ever allow it, but as defense in depth during the transition period.

### 7.4 Bulk vet appointments
Same principle as 7.3 — fan out to multiple `vet_appointments` rows in a single transaction, not a loop of separate writes.

### 7.5 Multi-file/photo upload
Direct upload of multiple files in one user action to the correct Google Drive folder (Section 5), with clear per-file success/failure feedback. This eliminates the Google Forms + Apps Script staging workaround entirely.

### 7.6 PDF generation
Generate a "Resident Profile" PDF (living residents) and a "Deceased Resident Summary" PDF (same template, with one conditional section for cause/date of death, per the original 11-section template design) using a code-based PDF library rather than a Google Docs merge-template hack. Confirm the original template's 11 sections and the one conditional section during implementation (available in the current documentation set if needed for reference).

---

## 8. UI/UX Requirements

1. **Multi-column layouts** for resident detail pages, forms, and dashboards — an explicit fix for AppSheet's single-column restriction. Use Tailwind's grid/flex utilities.
2. **Navigation structure**: replicate the current app's primary information architecture (residents, enclosures/zones, vet & health records, community/maintenance projects, contacts) but redesign as proper Next.js routes/pages rather than a 1:1 clone of the AppSheet view list. Use the current `02-views-and-ux.md` navigation map as a reference for what functionality must exist, not as a literal page-for-page spec.
3. **Maintenance kanban board**: a drag-and-drop or click-to-transition kanban view for maintenance/community project status, replacing the current 4-Slice/4-Deck-view workaround with a single proper board component.
4. **QR/RFID deep links**: preserve the pattern of physical QR codes on enclosures and RFID cards per resident that deep-link directly to that record's detail page (e.g. `https://<app-domain>/residents/<id>` and `https://<app-domain>/enclosures/<id>`). Existing physical signage/cards will need their encoded URLs updated during cutover (flag in migration plan, Section 9).
5. **Public-facing pages**: a small set of public, unauthenticated pages (adoptable animals listing, individual public resident profile) per the RBAC "Public/Anonymous" tier (Section 6), served from the same Next.js app but restricted to public-safe data.
6. **Format/status indicators**: replicate the current 6 confirmed Format Rules (visual indicators, e.g. color-coding by status) as conditional Tailwind classes — exact rules to be confirmed against the live app during implementation if not already fully documented.

---

## 9. Migration Plan

1. **Schema first**: stand up the Supabase Postgres schema per Section 4, including constraints (Section 7.3) and RLS policies (Section 6), before migrating data.
2. **Data migration**: write a one-time ETL script (Node/Python) to read the current Google Sheets tables (via Sheets API) and load them into Postgres, table by table, respecting foreign key order (reference tables → residents/enclosures/zones → placement_history → dependent domains). Pay special attention to:
   - Reconstructing `placement_history` correctly if the live sheet still has any leftover artifacts from the pre-B48 design — confirm the live Placement_History sheet is clean before migrating it directly (it should be, since B48 is confirmed built and closed).
   - Deduplicating any existing immunization_records duplicates caused by the B69 bug **before** applying the new unique constraint, or the migration will fail on constraint violation (which is actually a useful data-quality check).
3. **File references**: migrate Drive file ID references from the current Attachments/Bulk Upload log sheets into the new `attachments`/related tables; verify no orphaned files.
4. **Parallel run**: recommend a short parallel-run period (e.g. 1–2 weeks) where staff use the new app for new data entry while the old AppSheet app remains read-only/reference-only, rather than a hard cutover, to catch any migration gaps before fully retiring AppSheet.
5. **Physical signage**: reprint/reflash QR codes and RFID cards with new URLs (Section 8.4) as part of cutover, not before (to avoid dead links during the parallel-run period).
6. **Decommission**: once parallel run is confirmed clean, retire the AppSheet app and Apps Script triggers (`archiveDeceasedResidentFolders`, `onBulkUploadFormSubmit`) — the latter should already be obsolete per Section 5.1.

---

## 10. Explicitly Out of Scope

- Offline/PWA support (explicit user decision — reliable on-site connectivity, field photos uploaded later).
- Native mobile apps (assume responsive web is sufficient unless the user says otherwise).
- Any AppSheet-specific mechanism being carried forward as-is (Google Forms upload workaround, Apps Script polling triggers, Docs-merge PDF generation) — these should all be replaced by proper equivalents, not ported.

---

## 11. Open Questions for the User / for Claude Code to Flag During Implementation

1. Exact per-table RBAC permission matrix (Section 6) beyond the general role descriptions given — needs sign-off before RLS policies are finalized.
2. Whether `immunization_history` is a distinct concept from `immunization_records` in the live data (Section 4.2) — needs confirmation against the actual Sheets data during migration.
3. Exact current values for `maintenance.status` (the 4 kanban states) and any other enum fields not fully enumerated here — confirm against live data.
4. Whether Vets should have shelter-wide read access to all resident medical history, or be scoped per-resident (Section 6) — recommend shelter-wide for medical safety, but this is a policy decision for the user.
5. Whether a "Volunteer" tier distinct from "Staff" is needed (not part of the original 4-role request, but worth confirming it isn't needed before building).
6. Hosting choice (Vercel assumed but not specified by the user).
7. Whether Supabase Storage should be used for anything at all (e.g. small UI assets) even though Drive is the primary file store, or whether the app should avoid it entirely for consistency.
8. Exact current Line-messaging URL pattern used for the "tap to message" contact action (Section 4.4) — confirm against live app before reimplementing.

---

## 12. Summary for Claude Code

Build a Next.js + Tailwind CSS application backed by Supabase (Postgres + Auth), using Google Drive as the file/image store via the Drive API. The core architectural principle to preserve is **event-sourced resident lifecycle state** (Section 4.1's `placement_history` table) rather than mutable status fields — this was a hard-won design in the prior system and must not be regressed. The core correctness principle to add is **transactional, constraint-backed writes** everywhere the old system used loops of individual writes (Section 7.3), since a race-condition bug in exactly that pattern is what triggered this migration. RBAC (Section 6) is genuinely new scope requiring careful RLS design. Multi-file upload to Drive (Section 5) and multi-column layouts (Section 8) are direct fixes for named AppSheet capability gaps. No offline support is needed.

