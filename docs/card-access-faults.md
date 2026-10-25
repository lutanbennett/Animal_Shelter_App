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

---

## Added 2026-10-25 by `claude/card-review-1-a` (Card review 1, first half: 10 `cards.ts` cards and 4 jobs)

Each card judged on its own, whether or not any role holds it. Read from the wiring (bundle, page guard, RLS policy); nothing here was driven in a browser. Nothing was fixed and no card was proposed. Full table: `docs/decisions/2026-10-25-card-review-1-a.md`.

| card | kind | what | missing / extra | production | read at |
|---|---|---|---|---|---|
| `medical_records` | not enough | cannot book a visit: `/clinic-visits/new` asks `visit.book` and `clinic_visits_insert_perm` asks it too (0182); the card holds only `medical.visits` | `visit.book` | not established | 2026-10-25 (`/clinic-visits/new/page.tsx:14`, 0182) |
| `medical_records` | not enough | can open a visit to edit but the clinic dropdown is empty: `clinics` is readable only with `clinics.list` at read (0182) | `clinics.list` at read | not established | 2026-10-25 (`clinic-visits/[id]/edit/page.tsx:57`, 0182) |
| `book_clinic_visits` | not enough | can open the booking form but cannot save: the required clinic list is empty, so the form has nothing to submit | `clinics.list` at read | not established | 2026-10-25 (`clinic-visits/new/page.tsx:46`, 0182) |
| `book_clinic_visits` | not enough | cannot edit or complete a visit it booked: the edit page asks `medical.visits` at edit, the card gives read | `medical.visits` at edit (a judgement: the label says book, not edit) | not established | 2026-10-25 (`clinic-visits/[id]/edit/page.tsx:21`) |
| `book_clinic_visits` | not enough | the list it opens (`/upcoming-visits`) shows the clinic as "—" on every row: it joins `clinics`, which RLS hides without `clinics.list` | `clinics.list` at read | not established | 2026-10-25 (`upcoming-visits/page.tsx:41`, 0182) |
| `residents` | enough, now | register a resident: **CLOSED by 0248** (`record_intake` is `security definer` gated on `resident.register`; `picker_zones` / `picker_enclosures` also admit `placement.move`). Move, hospital and Arrival pickers closed the same way, so row 15 above is closed too. Not re-driven in a browser | n/a | n/a | 2026-10-25 (`0248`, `2026-10-22-residents-card-can-register.md`) |
| `residents` | too much | bundle is 12 activities. Beyond the record and intake it reaches `placement.move`, `.hospital`, `.rehome`, `.death` (moving, hospitalising, rehoming, recording a death), `resident.microchip`, and `photos.resident_publish`, which puts a photo on the public website. The label does not name any of them | the card is the whole job; split is Card review 2's, Lutan's call | not established | 2026-10-25 (`cards.ts:70`) |
| `contacts` | too much | label is Contacts; bundle also edits the clinic list (`clinics.list` edit), adds and removes doctors (`clinics.doctors`) and manages Shelter Friends (`friends.manage`) | `clinics.list`, `clinics.doctors`, `friends.manage`, `friends.view` | not established | 2026-10-25 (`cards.ts:110`) |
| `recurring_jobs` | too much (judgement) | also holds `recurring.do_any`: the holder can mark anyone's task done, not only set tasks up | `recurring.do_any` | not established | 2026-10-25 (`cards.ts:123`) |
| `view_residents`, `add_photos`, `approve_photos`, `administer_medication`, `record_weight`, `add_medical_photos`, `feed_special_diets` | too much | each says in its code comment that `resident.record` at read is "who and where, nothing more (0134)". Since 0259 it reads the **resident record itself** (101 of 101 on dev, see Kind 1 above). The comments are now false, and seven cards that need only a name and an enclosure read the whole record | a who-and-where read that is not the record (a card, not a role column) | not established | 2026-10-25 (`jobs.ts`, `cards.ts`, 0259) |
| `view_residents`, `enclosures` | works only by accident | the resident list and occupancy read `resident_current_state` / `current_placement`, which since 0259 have **no card gate at all** (Kind 2 above). Without that hole these two cards would show nothing | the cards depend on views no card guards | not established | 2026-10-25 (0259) |
| `administer_medication`, `feed_special_diets` | not established | the lists read frequency and rounds tables; their select policies were not found in 0148-0182, so whether `medical.prescriptions` at read reaches them is unsettled | read the policies, then a browser pass | not established | 2026-10-25 |

---

## Added 2026-10-25 by `claude/card-review-1-b-money` (Card review 1, money, content and website: 7 cards)

Each card judged on its own, on dev, **wiring plus a driven pass** as a login holding only that card (read back: each login held exactly the one card and its expected cells in `role_cards` and `role_permissions`; dev carried `0261`, applied from `role-extras-drop`). Nothing was fixed and no card was proposed. Full table: `docs/decisions/2026-10-25-card-review-1-b-money.md`.

| card | kind | what | missing / extra | production | read at |
|---|---|---|---|---|---|
| `run_appeals`, `website`, `meme_library`, `donations_receipts`, `dashboard`, `bills` | not enough (ONE root cause, one decision) | None of these cards grants `resident.record`, and since 0259 every resident read needs it, so each page's resident picker or resident-backed figures come back empty. Driven: `run_appeals` Start an appeal shows "No residents match", so **an appeal cannot be started**; `meme_library` "Select residents" is empty; `donations_receipts` "A resident" gift target and the donor list are empty; `website` reads 0 of 101 residents and 0 of 18 project folders (Projects tab: "No project stories"); `dashboard` reads 0 of 101 residents, 195 placements, 111 visits, 57 blood tests, 12 procedures, 20 vaccines, so **every figure on it is 0**; `bills` reads 0 of 13 maintenance jobs, so a bill cannot be matched to a job. Contacts (donor list, 0 of 9) and attachments (appeal photos, 0 of 374) are the same shape. Candidate fix for Lutan, not applied: `includes: ["view_residents"]` on the four cards that pick a resident (`run_appeals`, `website`, `meme_library`, `donations_receipts`), as `residents` already does; `dashboard` and `bills` need reads of tables no card carries, which is Card review 2's question | `resident.record` read (the four pickers); per-table reads for `dashboard`, `bills`; contacts read for the donor list | not established | 2026-10-25 dev, driven |
| `dashboard` | not enough (level mismatch, separate) | the card grants `reports.cashflow` at **read** ("Cashflow and fixed outgoings, read only") but `/management/cashflow` and `/management/cashflow/fixed-outgoings` call `requirePermission("reports.cashflow")`, which defaults to **edit**, so both show "You don't have access". Driven | the pages should ask read, or the card should grant edit | not established | 2026-10-25 dev, driven (`cashflow/page.tsx:32`, `fixed-outgoings/page.tsx:20`, `require.ts:25`) |
| `donations_receipts` | enough, narrowly | issued a receipt for a typed-in donor (LCA0009008, filed to Drive); donations list, donors page and receipts open | none for the receipt itself | not established | 2026-10-25 dev, driven |
| `website` | enough for what was driven | saved a page setting ("Saved.") and reverted it; hero photo, pet-of-the-week picker, impact figures load. Not driven: photo upload, publishing a project | none found | not established | 2026-10-25 dev, driven |
| `outreach_notes` | enough | recorded a visit (place, fed, 3 dogs, note) and it showed on the list; needs no resident. Photo upload not driven | none found | not established | 2026-10-25 dev, driven |
| `meme_library` | partly | opens the library, recorded a share ("Share recorded."). Cannot tag residents (root row). Adding a meme needs an image upload, not driven. Shares list shows 3 of 6: **not established why** | see root row | not established | 2026-10-25 dev, driven |
| `bills`, `run_appeals` | partly | `bills` opens and shows a waiting bill but has nothing to match it to; `run_appeals` lists the existing appeals and gifts (it bundles `donation.receipt`) but cannot start one | see root row | not established | 2026-10-25 dev, driven |
| any card-only login | misleading menu | the top menu offers **Residents** to card-only logins (seen for `donations_receipts`, `bills`) although none holds a residents card | not established which rule draws it | not established | 2026-10-25 dev, driven |

**Over-grant, this half: none found.** Each of the seven bundles is one or two activities its label names (`donation.receipt`; `appeal.run` plus `donation.receipt`; `maintenance.bills`; `website.content`; `community.outings`; `social.library`; `reports.dashboard` plus `reports.cashflow` read).

## Added 2026-10-25 by `claude/card-review-1-b-ops` (Card review 1, second half, operations: 7 cards)

Each card judged on its own, whether or not any role holds it, **driven in the browser** as a login holding only that card (`node scripts/dev-signin.mjs --cards <card>`, phone width, aal1, dev project). Nothing was fixed and no card was proposed. Full table: `docs/decisions/2026-10-25-card-review-1-b-ops.md`.

| card | kind | what | missing / extra | production | read at |
|---|---|---|---|---|---|
| `assistant` | not enough | opens `/assistant` and answers "What is due this week?", but **cannot name any resident or enclosure**: "Where is Angsumalin?" (a real resident) and "Where is Panda?" both answer "Which resident do you mean?", and "Who is in Cat Enclosure?" answers "Which enclosure do you mean?". The same question was answered in full for a login that also held `resident.record` read and `facility.enclosures` read. Every record request in the suggestion list (weigh, move, hospital, death, book a visit) starts by naming a resident, so none can begin | `resident.record` at read and `facility.enclosures` at read for the lookups; and each request's own activity (`medical.weight`, `placement.move`, `placement.hospital`, `placement.death`, `visit.book`) before a confirmed write could save | not established | 2026-10-25 (driven, `/assistant`) |
| `assistant` | too much (judgement) | holds `assistant.record`, which gives nothing to a holder of this card alone: with no resident to name, no request can reach the confirm step | `assistant.record` does nothing on its own | not established | 2026-10-25 (driven) |
| `operations_landing` | a card that does nothing | empty bundle. A login holding only this card is **not let into the app**: `/home` and `/operations` both send it to the public website, so the advertised page cannot be opened. (The `role-cards-coverage` rule: no state in which a card does nothing.) | at least one cell; the card gives none | not established | 2026-10-25 (driven; same cause as the "no cell, locked out" row above) |
| `operations_landing` | not gated by the card | `/operations` opened, with its Enclosures and Maintenance tiles, for a login holding only `do_maintenance`, which does **not** hold this card. The page asks `requireAnyPageIn("operations")`, so it opens for anyone whose cells open one tile in the section; the card neither opens nor guards it. The Operations entry in the menu follows the same test | the page guard should ask the card, or the card has no job | not established | 2026-10-25 (driven; `operations/page.tsx`) |
| `management_landing` | a card that does nothing | same as `operations_landing`: empty bundle, locked out of the app alone, `/management` sends it to the public website | at least one cell | not established | 2026-10-25 (driven) |
| `management_landing` | not gated by the card | `/management` opened, with its Purchasing tile, for a login holding only `do_purchasing`; the page asks `requireAnyPageIn("management")` | the page guard should ask the card | not established | 2026-10-25 (driven; `management/page.tsx`) |
| `do_maintenance` | not enough | the walkthrough says log, change, assign, cost **and delete**. Log, change status, assign, estimated and actual cost all saved and read back (M-5753 on `/maintenance` and `/my`); **there is no delete control** on the job page. Same fault as the second row at the top of this log, now re-driven | a delete control and its activity, or the label stops promising delete | **LIVE** (row 2) | 2026-10-25 (driven) |
| `do_maintenance` | too much | the "Assigned to" picker on the new-job and edit forms lists **every login in the app with its email address** (about 45 on dev). It reads `app_users`, which since `0259` has no card gate (Kind 2 above). A maintenance worker needs the people who do maintenance, not every address | a card for seeing who the logins are (Card review 2) | not established | 2026-10-25 (driven, `/maintenance/new`, step 3) |
| `do_maintenance` | too much | `resident.record` at read is the whole resident record since `0259` (the comment "who and where, nothing more (0134)" is false, see the row for seven cards above). Driven: `/residents` lists 92 residents and offers **Download spreadsheet** (`/residents/export`, gated only by `resident.record` read), and the resident page opens in full | a who-and-where read that is not the record | not established | 2026-10-25 (driven; `residents/export/route.ts:34`) |
| `do_maintenance` | controls offered that refuse | on a resident's page the hub offers *Edit resident details*, *Send to hospital*, *Foster / adopt* and *Move enclosure* to a read-only holder. Opened: edit says "Only staff and admins can edit resident details" and move says "Only staff, volunteers and admins can move residents". Nothing writes, but the walkthrough expects no write control to be offered, and the messages still name the old role words | hide the buttons the card cannot use; reword the refusals | not established | 2026-10-25 (driven) |
| `do_maintenance` | not driven | the **photo upload** (before and after) and **marking a recurring job done** were not driven: the browser pane cannot choose a file, and no recurring task is assigned to a card-only login. The controls are offered and `/my` lists tasks | pending: drive with a file and an assigned task | not established | 2026-10-25 |
| `do_stocktaking` | enough, with a dead end | counted AMC 500 (41), Review and save, Save 1 count; after a reload the item reads "Last count 41 tablet - counted today". The refused page (`/operations/medication-list`) is refused. **But** the menu offers *Residents* and *Operations*, and `/residents` opens and shows "0 residents": a page no card of this login grants, empty because the table is gated. `/management/medications` is refused to this card (walkthrough, answered 2026-10-23; driven for `record_delivery`, read from the wiring here: the same single `stock.count` cell) | hide the menu entries the card cannot use | not established | 2026-10-25 (driven) |
| `do_purchasing` | enough, with a dead link | the page loads, lists what is short and names the 24 items never counted, switches 1 week / 2 weeks / 1 month, offers Print and Download CSV, and shows how each figure was worked out (nothing is written by design). The *Count them in a stocktake* link goes to `/stocktake`, which this card is refused. `/management` opens (Purchasing tile only) and the menu offers *Residents*, which opens empty | hide the link and menu entries the card cannot use | not established | 2026-10-25 (driven) |
| `record_delivery` | enough | six steps (what, item, amount, day, details, check) saved: the delivery is the first row of Recent deliveries, and **deleting a row works** (confirm, then it is gone). `/management/stock-usage` and `/management/medications`, where this write should also show, are refused (`/no-access`): the person who receives cannot see the figure they changed (Lutan decides) | n/a | not established | 2026-10-25 (driven) |
| `record_delivery` | notes | the *Bills* link opens `/bills` (`canUseBills` accepts `stock.delivery` on purpose) and shows another login's waiting bill with its cost field; the supplier picker lists the Shelter Friends' names without `friends.view`. Both look intended for the job, listed here so Lutan can say so | none if intended | not established | 2026-10-25 (driven) |
| `assistant`, `do_stocktaking`, `do_purchasing`, `record_delivery` (and the two landings) | shared root cause: none grants `resident.record` at any level | each of these opens a page or menu entry that shows residents (`/residents` read as "0 residents"; the assistant cannot name one). Only `do_maintenance` holds the read, and it saw 92 of 92. The likely fix to weigh is `includes: ["view_residents"]` (the floor card, `0134`) where a card needs to name a resident, as `residents` does; **noted, not applied** | one read, not seven; Lutan reviews as a set | not established | 2026-10-25 (driven) |

**Read-back before every conclusion above** (so "sees nothing" cannot be a failed assignment): each login's role held exactly one card in `role_cards` and the expected cells in `role_permissions`: `assistant` 2 cells (`assistant.ask`, `assistant.record`); `do_maintenance` 7; `do_stocktaking` 1 (`stock.count`); `do_purchasing` 1 (`stock.purchasing`); `record_delivery` 1 (`stock.delivery`); `operations_landing` and `management_landing` **0 cells**. Dev carried `0261` (from `role-extras-drop`, not on `main`) and `check-card-grants.mjs` was green against it.

---

## Added 2026-10-25 by `claude/card-report-residents` (`view_residents` and `residents`, driven)

Driven in a browser as a login holding only the card (`dev-signin.mjs --cards`). Read-back before each: `view_residents` login held 1 card and 1 cell (`resident.record` read); `residents` login held 1 card and 11 cells (`photos.resident_add/manage/publish`, `placement.death/hospital/move/rehome`, `resident.adoption_news/microchip/record/register`, all edit; `resident.record` at edit, so the included `view_residents` read is satisfied). Dev schema at the time: 265 applied, 0 pending (origin/main `6f4fc995`; code at `2374d15d`). Nothing was fixed and no card proposed. Reports: `docs/card-reports/`.

| card | kind | what | missing / extra | production | read at |
|---|---|---|---|---|---|
| `residents` | not enough (**contradicts the row above marked CLOSED by 0248**) | Move, Send to hospital, Foster / adopt and Record death all fail on save. Move says "That enclosure no longer exists"; the others say "The Hospital / Fostered / Deceased status enclosure is missing from this database". The picker is filled (via `picker_enclosures`, 0248) but `src/lib/placements/move.ts` then reads the `enclosures` table directly, which needs `facility.enclosures` at read (0145). Register, edit, microchip, adopter news and photos all work | the save step's enclosure lookup, or `facility.enclosures` read | not live today: `fault-residents-lifecycle` shows management, staff and 2IC all hold enclosures read | 2026-10-25 dev, driven |
| `residents`, `view_residents` | misleading display | the resident's page shows medical tiles with "none" counts the card cannot see: a resident registered with a starting diet reads "Diet 0 current, no current diet recorded" (the `resident_diets` row exists, read on dev by service role) | read of those tables, or the tile should say "not allowed" | not established | 2026-10-25 dev, driven |
| `residents`, `view_residents` | "Current location" and Enclosure column blank | every enclosure name reads as a dash, so the "where" half of View residents is empty | `facility.enclosures` read | not established | 2026-10-25 dev, driven |
| `view_residents` | controls offered that refuse | the list shows an edit pencil per row; a resident's page offers Edit, Send to hospital, Foster / adopt, Move enclosure; the Photos page offers a drop zone. Opened: each refuses ("Only staff and admins can edit...", "Only staff, volunteers and admins can move...", upload: "Not authorized to manage attachments"). Nothing writes | hide the controls; reword refusals that still name old roles | not established | 2026-10-25 dev, driven |
| `view_residents` | too much | **Download spreadsheet** (`/residents/export`) returns every resident to a read-only holder; Photos gallery reads (4 items) with no photo cell | a who-and-where read; decide on the export | not established | 2026-10-25 dev, driven |
| `residents` | too much (judgement) | one card for twelve jobs; includes recording a death, rehoming and, through the Foster / Adoption folders, putting a photo on the public website. Folder choice at upload and Move to folder are how it publishes | split is Card review 2's | not established | 2026-10-25 dev, driven |
| `operations_landing`, `management_landing` | a card with zero grants, held by nobody | `card_grants` has no rows for either on production (27 of 29 cards have rows). `role-cards-coverage` is silent about them because no role holds them. Already recorded above as "does nothing" from the driven pass; this adds that production holds none. **Which stream owns them: the stream that walks `operations_landing` and `management_landing` must be briefed by name, since the other four streams' card lists do not include them** | at least one cell | n/a (nobody holds) | 2026-10-25 (brief, production read) |

**Method note for later streams.** The browser pane cannot choose a file, but a file can be handed to the page's `<input type=file>` from `javascript_tool` (build a `File`, put it in a `DataTransfer`, assign `input.files`, dispatch `change`). That drove photo upload on both cards. Select boxes must be set with the pane's form-input, not a scripted change event: scripted events left the enclosure picker looking empty and nearly produced a false fault.
