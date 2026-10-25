# Card access faults: the log to review at the end

**What this is.** Lutan's instruction, 2026-10-24: *"I want all errors to surface based on card only access. Please add these to a log that I can review at the end of the fix to the card access control work."*

**Who reviews it, and when.** Lutan, once, when the card-access work (the item *a card given to a role must carry its own access*) closes. **That review is the gate, not each fault.**

**How to use it.** A fault found while access is driven by cards only gets a **row here** instead of a one-off fix. Later streams **append a row rather than fixing a fault in isolation**, and held faults stay held until the review. If your work happens to fix one, say so in your PR and mark its row, rather than quietly removing it.

Roles, cards and activity names only. No personal data.

| role | card | fails at | missing | production | read at |
|---|---|---|---|---|---|
| doctor | `book_clinic_visits` / `medical_records` | saving a clinic visit (the clinic list is empty) | `clinics.list` | **LIVE** | 2026-10-24 19:53 (`check-production.mjs`) |
| three roles | `do_maintenance` | deleting a maintenance job (there is no delete control) | not established | **LIVE** | 2026-10-24 19:53 (`check-production.mjs`) |
| any role holding it | `residents` | move, hospitalise, foster/adopt, record a death | the enclosure lookup, refused by RLS from `0145` (not a card cell) | not live | 2026-10-24 19:53 (`check-production.mjs`) |
| doctor | `view_residents` / any card that opens `/residents` | the Residents tile is no longer drawn (it used to follow `roles.opens_app`) | `resident.record` at read (the doctor's cells hold it as None; `clinicRule` in fixed-for-now.ts) | not established; settle with `node scripts/check-production.mjs role-cards` | 2026-10-25 (found by removing the app-side rule; `claude/remove-hidden-security-invisible-failures`) |
| doctor | `book_clinic_visits` | the card now opens the shelter's list of visits (`/upcoming-visits`) instead of the clinic's own `/appointments`; the database shows a clinic login only its own clinic's visits, so the page can be narrower or empty | one card, one page: the clinic-only page has no card of its own | not established; settle with `node scripts/check-production.mjs role-cards` | 2026-10-25 (found by removing the app-side rule; `claude/remove-hidden-security-invisible-failures`) |
| ~~CLOSED by 0259~~ doctor | `bills`, `do_*` cards that file a bill | offered the Bills page (the clinical refusal in `canUseBills` is gone); `record_attachment()` (0174, 0190) then refuses the upload | the database function asks the role's clinical column, not a card | not established; settle with `node scripts/check-production.mjs role-cards` | 2026-10-25 (found by removing the app-side rule; `claude/remove-hidden-security-invisible-failures`) | **CLOSED 2026-10-25 by 0259** (is_clinic_login() reads no role column)
| ~~CLOSED by 0259~~ doctor | `administer_medication`, `feed_special_diets`, `record_weight`, `add_medical_photos` | the four medical pages (`/operations/medication-list`, `/operations/feeding-list`, `/medical/weight`, `/medical/photos`, `/medical/diets`) are now offered to a doctor holding the activity; their views are for a login that sees every clinic (`sees_all_clinical()`, 0135, 0136, 0140), so they open empty | the views and `sees_all_clinical()` ask the role's clinical column | not established; settle with `node scripts/check-production.mjs role-cards` | 2026-10-25 (found by removing the app-side rule; `claude/remove-hidden-security-invisible-failures`) | **CLOSED 2026-10-25 by 0259** (sees_all_clinical() reads no role column)
| ~~CLOSED by 0259~~ second_in_command, volunteer | `contacts` | the Contacts page now reads the `contacts` table for anyone holding `contacts.browse`; the database narrows a `name_phone` role to `volunteer_contacts` (0126, 0155) and refuses the table, so the list comes back empty | `sees_all_contacts()` asks `roles.scope_contacts` | not established; settle with `node scripts/check-production.mjs role-cards` | 2026-10-25 (found by removing the app-side rule; `claude/remove-hidden-security-invisible-failures`) | **CLOSED 2026-10-25 by 0259** (sees_all_contacts() reads no role column; volunteer_contacts dropped)
| ~~CLOSED by 0259~~ a role with `scope_residents = who_and_where` | `residents` (Mark as posted on photos and adoption updates) | the button is now offered to any holder of `photos.resident_manage`; the write policies ask `sees_all_residents()`, which reads `roles.scope_residents` (0144, 0179, 0196), and refuse | the database function asks the role's residents column | not established; settle with `node scripts/check-production.mjs role-cards` | 2026-10-25 (found by removing the app-side rule; `claude/remove-hidden-security-invisible-failures`) | **CLOSED 2026-10-25 by 0259** (sees_all_residents() reads no role column)
| any role holding cards whose bundles are all empty, or no cards | (none) | the login is no longer let into the app: `entersApp()` needs Admin or at least one cell. It used to follow `roles.opens_app`, so a role switched on by that column and holding no cell is now locked out | at least one card that gives a cell; `operations_landing` and `management_landing` give none | not established; settle with `node scripts/check-production.mjs role-cards` | 2026-10-25 (found by removing the app-side rule; `claude/remove-hidden-security-invisible-failures`) |
| a clinic login with no clinic linked | `book_clinic_visits`, `medical_records` | `loadClinicScope()` now answers `any` (it used to answer `unlinked` and refuse); the database still refuses the write (`current_clinic_resident_ids()`) | a clinic link for the login; the app no longer fences it | not established; settle with `node scripts/check-production.mjs role-cards` | 2026-10-25 (found by removing the app-side rule; `claude/remove-hidden-security-invisible-failures`) |
| Head of Medical, Head of Maintenance, 2IC | (no cards held) | the job-based home these three had when they held no cards is gone (`JOBS_OF_ROLE`): with no cards they now get the home derived from their cells, which includes pages the jobs did not list (for example `/photos/add`) | a card home; give the role its cards | not established; settle with `node scripts/check-production.mjs role-cards` | 2026-10-25 (found by removing the app-side rule; `claude/remove-hidden-security-invisible-failures`) |

Not fixed by the stream that created this log (`claude/cards-grants-app`): none of the first three rows above was touched.

**Added 2026-10-25 by `claude/remove-hidden-security-invisible-failures`** (rows 4 to 12): each is a place where removing an app-side role rule stopped hiding what the database still refuses. None was patched. Rows 6 and 8 to 12 are the visible half of database functions that still read a role column; the follow-on schema PR's scope is in docs/decisions/2026-10-25-remove-hard-coded-security.md.

---

## Added 2026-10-25 by `claude/security-db-half` (migration `0259`)

**Rows 6, 7, 8 and 9 above are marked CLOSED by this stream**, because each named a database function that read a role
column and each of those functions now reads none. Nothing was patched to close them: the clause was deleted and the card
check beside it became the whole decision.

**What `0259` found that nobody had written down, and it is the headline of this log.** Every role column in the database
sat BESIDE a card check and only ever SUBTRACTED from what the card gave. So removing them produced **no losses at all**
— every measured change was a role reading MORE, not less. Measured on dev by impersonating one real login per role
through RLS, before and against after (`docs/test-plans/security-db-half.md`). Admin was unchanged on every surface.

That splits into two kinds, and the second kind is the one that needs Lutan.

### Kind 1 — the card decides now, which is the rule working (no action needed)

| role | card | what changed | why it is right |
|---|---|---|---|
| volunteer, head_of_maintenance, doctor | `view_residents` | reads the resident record itself (101 of 101 on dev), where a role column held them to `resident_who_and_where` | each holds `view_residents`, which grants `resident.record` at read. The role column was overriding the role's own card, which is exactly what the rule forbids. If this is too much, the **card** is wrong and Card review 2 fixes the card |
| volunteer, doctor, head_of_medical, head_of_maintenance, 2IC | the medical and photo cards | `attachments` reads widened (0 to ~140 on dev) | same shape: `sees_all_clinical()` / `sees_all_residents()` were narrowing a held card |

### Kind 2 — surfaces with NO card gate at all, now open to everyone in the app (FOR THE REVIEW)

These six views were gated by `private.has_app_access()` **and a role column, and nothing else**. There is no card check
anywhere in them. With the role column gone, **every login that is in the app reads them in full.** No card was created
to close this, per Lutan's instruction *"No creating cards just remove permissions"* — so each one is a fault held for
**Card review 2**, which is where the card set gets proposed and approved.

| surface | was gated by | now | what it needs |
|---|---|---|---|
| `current_placement` | `has_app_access() AND NOT on_volunteer_floor()` | every login in the app (99 rows on dev) | a card for reading where a resident is |
| `translation_queue` | same | every login in the app (129 rows on dev) | a card for the translation queue |
| `immunization_compliance` | same | every login in the app (346 rows on dev) | a card for immunisation records |
| `immunization_duplicate_check` | same | every login in the app | the same card as above |
| `resident_current_state` | same | every login in the app | a card; it backs the resident lists |
| `private.app_users` / `app_users` | same | every login in the app | a card for seeing who the logins are |

**And one that predates `0259` and is NOT caused by it, found while measuring:** `resident_who_and_where` has **no
`has_app_access()` gate at all**, so the `public_viewer` role reads all 101 resident rows on dev. That was true before
this migration and is still true after it. It is the only reading in this log that a signed-out-ish role can reach, so
it is worth settling first.

### Kind 3 — what the doctor loses, which is the only genuine loss

The doctor is **lowest priority by Lutan's own ranking** (2026-10-25: *"The vet can wait as it's the least used (current
no doctors are in the system) profile."*) and **no doctor logins exist on production**, so nothing is broken for anybody
today. No card was created; his own remedy is *"I will be creating a new set of doctor cards"*.

| role | card | fails at | missing | production | read at |
|---|---|---|---|---|---|
| doctor | (none) | the clinic's own contact list: `doctor_contacts` was granted by `is_clinic_login()` alone and is **dropped** by `0259` | a contacts card for a clinic login | not live (no doctor logins) | 2026-10-25 (`claude/security-db-half`) |
| doctor | `book_clinic_visits` | filing a **visit report** attachment: `record_attachment()`'s clinic-login branch is removed, so a report now needs the same cards as anyone else | a card that files a visit report | not live (no doctor logins) | 2026-10-25 (`claude/security-db-half`) |
| doctor | (none) | the three `doctor_read_*` policies (`residents`, `attachments`, `adoption_updates`) granted by `is_clinic_login()` now grant nothing | they were the vet's own-clinic reads; the vet now reads by its cards instead, which is wider, not narrower | not live (no doctor logins) | 2026-10-25 (`claude/security-db-half`) |

**The doctor's own-clinic confinement is gone, not just its grants.** `is_clinic_login()` was what held a vet to its own
clinic's residents; with it reading no role column, a doctor login reads every resident its cards allow. Per-login clinic
links (`current_clinic_resident_ids()`) are untouched and are the right place to scope a vet, because they are per login,
not per role — but nothing asks them any more. **This is the single most important thing for Card review 2 to settle.**
