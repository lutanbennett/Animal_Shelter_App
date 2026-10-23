# Lanna Care: the features of the system, for review

**Written 2026-10-23 for Lutan, to be printed and marked up by hand. Paper only: nothing in the app, the cards, the roles or the permissions has changed.**

This is **step 1** of the card simplification (backlog: *the foundation of the security rebuild*). It lists what the system *does*, in thirteen broad areas, so that the next steps (which card gives which feature, and a simpler set of cards) can be built on **your words**. If a name below is not how you would say it, rename it: your word wins.

## How to read it

- A **feature** is a broad area, like *Medical information* or *Finances*. There are 13.
- Under each feature the **functions** are a numbered list, so you can say "Medical 4". Each shows the page it lives on (in `code font`) and the permission behind it (the *activity*, the small switch the database checks).
- **Who uses it today** is the roles that hold a card for it on the dev database, 2026-10-23. **Admin** can do everything and is not repeated each time. A role can also be given a single permission outside any card (an *extra*), which this list cannot see: where a role looks missing, that is the first thing to check.
- **Cards today** are the cards that give the feature now. *None* means no card reaches it: only Admin (or a role given the single permission) can use it.
- For each feature, mark **Keep / Rename / Merge with / Split** by hand, and use the ruled space for notes.

## What was counted (from the code on `main`, 2026-10-23)

26 cards, 66 permissions (activities), 8 jobs, 44 pages in the route registry, plus 4 pages outside it (Residents, Bills, Assistant, My tasks) and about 90 other pages in the app (detail, edit and public pages) which sit under their parent function.

## The thirteen features at a glance

| # | Feature | Functions | Cards that give it today |
|---|---|---|---|
| 1 | Resident information | 9 | View residents, Residents |
| 2 | Housing and moves | 9 | Residents, Enclosures |
| 3 | Medical information | 11 | Medical records, Book clinic visits, Administer Medication, Record Weight |
| 4 | Feeding and diets | 6 | Feed Special Diets, Medical records (none for the recipes or diet stock) |
| 5 | Stock and purchasing | 8 | Do Stocktaking, Do the Purchasing, Record a Delivery (none for the rest) |
| 6 | Maintenance and projects | 7 | Do Maintenance (none for projects, delete) |
| 7 | Finances and reports | 8 | Bills, Donations and receipts, Dashboard |
| 8 | Photos, videos and social media | 9 | Residents, Add Medical Photos, Add Photos, Approve photos, Meme library |
| 9 | People and contacts | 7 | Contacts |
| 10 | Fundraising and outreach | 6 | Run appeals, Outreach notes, Donations and receipts |
| 11 | Website and public pages | 6 | Website (none for the desexing drives list by name) |
| 12 | Staff tasks and the assistant | 6 | Recurring jobs, My tasks, Do Maintenance, Assistant |
| 13 | Settings and administration | 13 | None (Admin only) |

---

## 1. Resident information

*The animals themselves: who they are, their record and how they are found.*

1. **Resident list**: browse, search, filter by status, export. `/residents` · `resident.record` (read)
2. **Resident record (the hub)**: name, Thai name, bio, sections for housing, medical, photos, history. `/residents/[id]`, `/residents/[id]/[section]` · `resident.record` (read, edit)
3. **Edit a resident's details**. `/residents/[id]/edit` · `resident.record` (edit)
4. **Register a new resident (intake)**. `/residents/new` · `resident.register`
5. **Microchip**: record, correct, scan. · `resident.microchip`
6. **Adoption updates**: news from adopted residents, published or staff only. `/residents/[id]/adoption-updates/new`, `.../edit` · `resident.adoption_news` (read, edit)
7. **Foster and adopt**: the public lists of animals needing homes (read from the record). `/adopt`, `/adopt/[id]`, `/adopt/international`, `/adopt/stories/[id]`, `/foster`
8. **Community dogs**: dogs known outside the shelter. (Part of the resident record and outreach visits.)
9. **Who and where (the picker)**: the read-only who-and-where that other jobs use to choose an animal. · `resident.record` (read)

**Who uses it today:** Doctor, Head of Medical, Head of Maintenance, 2IC, Volunteer (read only, "View residents"); Management (edit, "Residents").
**Cards today:** View residents (read), Residents (edit). Also read as a side-effect inside Administer Medication, Record Weight, Add Medical Photos, Feed Special Diets, Do Maintenance, Add Photos, Approve photos (*all need it only to pick an animal*).
**Notes:** *View residents* is a smaller copy of *Residents*. Seven other cards each carry a hidden copy of the read.

Keep / Rename / Merge with ______ / Split ______

Notes: ____________________________________________________________

________________________________________________________________

________________________________________________________________

---

## 2. Housing and moves

*Where each animal lives, and every change of place or status.*

1. **Move to another enclosure**. `/residents/[id]/move` · `placement.move`
2. **Send to hospital and bring back**. `/residents/[id]/hospital`, `.../hospital/return` · `placement.hospital`
3. **Rehome or adopt out, and undo**. `/residents/[id]/rehome`, `.../rehome/return` · `placement.rehome`
4. **Record a death**. `/residents/[id]/deceased` · `placement.death`
5. **Undo a death recorded by mistake**. `/residents/[id]/deceased/undo` · `placement.death_withdraw`
6. **Placement history** on the resident record. · `resident.record` (read)
7. **Enclosures: which animal is where** (browse). `/enclosures`, `/enclosures/[id]`, `/e/[id]` (QR) · `facility.enclosures` (read)
8. **Set up enclosures and zones**. `/admin/enclosures`, `/admin/zones` · `facility.enclosures` (edit)
9. **Facility map** (maps, rooms, markers). `/admin/facility-map` · `facility.enclosures` (edit)

**Who uses it today:** Management (moves and status); Volunteer (browse enclosures); Head of Maintenance, 2IC (read, inside Do Maintenance).
**Cards today:** Residents (1 to 4), Enclosures (7, read only), Do Maintenance (read). **No card gives 5, 8, 9.**

Keep / Rename / Merge with ______ / Split ______

Notes: ____________________________________________________________

________________________________________________________________

________________________________________________________________

---

## 3. Medical information

*The clinical record of each animal and the visits that make it.*

1. **Vet visits: record and report**. `/clinic-visits/new`, `/clinic-visits/[id]`, `.../edit` · `medical.visits`
2. **Book a clinic visit and see the booked visits**. `/upcoming-visits` (shelter), `/appointments` (a clinic's own login) · `visit.book`, `medical.visits` (read)
3. **Procedures**. `/procedures/new` · `medical.procedures`
4. **Blood tests**. `/blood-tests/new` · `medical.blood_tests`
5. **Prescriptions (the medication each animal is on)**. `/prescriptions/new`, `/prescriptions/[id]/edit` · `medical.prescriptions`
6. **Medication list: what to give today** (read-only list). `/operations/medication-list`, `/management/medication-list` · `medical.prescriptions` (read)
7. **Immunizations**. `/immunizations/new` · `medical.immunizations`
8. **Weight**: record and correct, one a day. `/weight/new`, `/weight/[id]/edit`, `/medical/weight` · `medical.weight`
9. **Diet on the medical record** (see 4 Feeding and diets). · `medical.diet`
10. **Archive a medical record** (soft delete). · `medical.archive`
11. **Load lab reports** (blood work inbox to the record). Script, not a page.

**Who uses it today:** Doctor (book, read); Head of Medical (medication list, weight, diets, read). The full set (*Medical records*) is held by no current role on dev; Admin only.
**Cards today:** Medical records (1, 3, 4, 5, 7, 8, 9, 10), Book clinic visits (2), Administer Medication (6), Record Weight (8).
**Notes:** the pages for 3, 4, 7 and 1 are reached from the resident record. Admin-maintained lists of types: see 13.

Keep / Rename / Merge with ______ / Split ______

Notes: ____________________________________________________________

________________________________________________________________

________________________________________________________________

---

## 4. Feeding and diets

*What each animal eats, and the recipes.*

1. **A resident's diet** (standard or special) on the record. · `medical.diet`
2. **Special diets list: who needs what** (read-only). `/medical/diets` · `medical.diet` (read)
3. **Feeding list for the day**. `/operations/feeding-list` · `medical.diet` (read)
4. **Diet recipes and ingredients**: add, edit. `/diets/new`, `/diets/[id]/edit`, `/admin/diets/ingredients` · `reference.types`
5. **Diet option lists**. `/admin/diets`, `/admin/diets/[id]` · `reference.types`
6. **Diet stock** (what is in the store, and the servings). `/management/diets` · `stock.diets`

**Who uses it today:** Head of Medical (lists). **Cards today:** Feed Special Diets (2 only), Medical records (1). **No card gives 3, 4, 5, 6.**

Keep / Rename / Merge with ______ / Split ______

Notes: ____________________________________________________________

________________________________________________________________

________________________________________________________________

---

## 5. Stock and purchasing

*What the shelter holds, uses, and needs to buy.*

1. **Stocktake (count the shelves)**. `/stocktake` · `stock.count`
2. **Record a delivery**. `/deliveries` · `stock.delivery`
3. **Purchasing: what to buy** (1 week, 2 weeks, 1 month; print or CSV). `/management/purchasing` · `stock.purchasing`
4. **Stock usage**: what was used and the forecast. `/management/stock-usage` · `stock.usage`
5. **Medication stock** (figures, history, item settings). `/management/medications` · `stock.medications`
6. **Diet stock** (see 4 Feeding and diets, item 6). `/management/diets` · `stock.diets`
7. **Correct a wrong stock figure**. · `stock.correct`
8. **Units and pack sizes** (Settings). `/admin/medications` · `reference.types`

**Who uses it today:** 2IC (1, 2, 3). **Cards today:** Do Stocktaking, Do the Purchasing, Record a Delivery. **No card gives 4, 5, 6, 7, 8.**
**Notes:** the three stock cards each give one yes/no switch, but a role with any one of them can read the figures.

Keep / Rename / Merge with ______ / Split ______

Notes: ____________________________________________________________

________________________________________________________________

________________________________________________________________

---

## 6. Maintenance and projects

*Repairs and building work, and longer jobs.*

1. **Log a maintenance job**. `/maintenance/new` · `maintenance.jobs` (edit)
2. **Maintenance board: see and move jobs on** (in progress, blocked, done). `/maintenance`, `/maintenance/[id]`, `/maintenance/[id]/edit` · `maintenance.jobs`, `maintenance.progress`
3. **Job photos** (before and after). · `maintenance.photos`
4. **Delete a maintenance job**. · `maintenance.delete`
5. **Projects (folders of longer work)**: browse, manage. `/projects`, `/projects/[id]` · `projects.folders`
6. **Project photos and publish to the website**. · `projects.photos`, `projects.publish`
7. **"Our work" public pages** (what is shown to the public). `/our-work`, `/our-work/[id]`

**Who uses it today:** Head of Maintenance, 2IC. **Cards today:** Do Maintenance (1, 2, 3). **No card gives 4, 5, 6.**

Keep / Rename / Merge with ______ / Split ______

Notes: ____________________________________________________________

________________________________________________________________

________________________________________________________________

---

## 7. Finances and reports

*Money in and out, and the numbers management watches.*

1. **Bills**: photograph, record, pay or reject. `/bills` · `maintenance.bills`
2. **Maintenance bills page** (bills linked to maintenance jobs). · `maintenance.bills`
3. **Donations and receipts**: record a gift, issue a receipt. `/management/donations`, `/management/donations/new`, `/management/donations/[id]` · `donation.receipt`
4. **Donors**. `/management/donations/donors`, `.../donors/[id]`, `.../donors/new` · `donation.receipt`
5. **Cashflow**. `/management/cashflow` · `reports.cashflow`
6. **Fixed outgoings**. `/management/cashflow/fixed-outgoings` · `reports.cashflow`
7. **Dashboard** (the management overview). `/management/dashboard` · `reports.dashboard`
8. **Management landing page** (tiles to the above). `/management`

**Who uses it today:** Management (Dashboard only by card). **Cards today:** Bills, Donations and receipts, Dashboard (cashflow read). Cashflow's own page and fixed outgoings have no card of their own (the Dashboard card reads the cashflow figures).

Keep / Rename / Merge with ______ / Split ______

Notes: ____________________________________________________________

________________________________________________________________

________________________________________________________________

---

## 8. Photos, videos and social media

*Pictures of the animals and the shelter, and what is posted.*

1. **Resident photos: add**. `/residents/[id]/photos` · `photos.resident_add`
2. **Resident photos: move, remove, set the profile photo**. · `photos.resident_manage`
3. **Resident photos: publish to the website**. · `photos.resident_publish`
4. **Resident videos**. (On the resident record.)
5. **Medical photos (phone page, filed in the Medical folder)**. `/medical/photos` · `photos.resident_add`
6. **Add shelter photos (photo first, then the animal)**. `/photos/add` · `photos.shelter_add`
7. **Approve photos waiting for approval**. `/photos/approve` · `photos.approve`
8. **Medical photos shown on an appeal**. · `appeal.medical_photo`
9. **Social media library (memes)**: browse, add, make, record where posted. `/memes`, `/memes/new`, `/memes/make`, `/memes/[id]`, `/memes/[id]/edit` · `social.library`

**Who uses it today:** Head of Medical (medical photos, add photos), Management (add, approve), Doctor and 2IC (add photos). **Cards today:** Residents (1, 2, 3), Add Medical Photos (5), Add Photos (6), Approve photos (7, 2), Meme library (9). **No card gives 8.**
**Notes:** Add Shelter Photos, Add Medical Photos and Approve photos overlap.

Keep / Rename / Merge with ______ / Split ______

Notes: ____________________________________________________________

________________________________________________________________

________________________________________________________________

---

## 9. People and contacts

*Everyone outside the shelter that the shelter deals with.*

1. **Contacts: browse (read)**. `/contacts`, `/contacts/[id]` · `contacts.browse`
2. **Contacts directory: edit**. `/management/contacts` · `contacts.directory`
3. **Add a contact**. `/management/contacts/new` · `contacts.add`
4. **Vets and clinics: list**. `/clinics`, `/clinics/[id]` · `clinics.list` (read)
5. **Manage clinics; their doctors**. `/management/clinics`, `/management/clinics/[id]/doctors` · `clinics.list`, `clinics.doctors`
6. **Shelter friends (supporters)**: view, manage, join. `/management/shelter-friends`, `/management/shelter-friends/new`, `/friends`, `/friends/join` · `friends.view`, `friends.manage`
7. **Volunteer page**. `/volunteer`

**Who uses it today:** nobody by card. **Cards today:** Contacts. Contacts browse and vet list **are in the registry but no card points at them**: they are reached from the menu.

Keep / Rename / Merge with ______ / Split ______

Notes: ____________________________________________________________

________________________________________________________________

________________________________________________________________

---

## 10. Fundraising and outreach

*Raising money for sick animals, and going out into the community.*

1. **Appeals**: set up and run a sponsorship drive for a sick resident. `/management/appeals`, `/management/appeals/new`, `/management/appeals/[id]`, `.../preview` · `appeal.run`
2. **The public appeal pages**. `/appeals`, `/appeals/[id]`, `/donate`
3. **Desexing drives and sign-ups**. `/management/desexing-drives`, `/management/desexing-drives/new`, `/management/desexing-drives/[id]`, `/services/desexing` · `website.content`
4. **Outreach visits**: a note typed standing at a temple or village. `/outreach`, `/outreach/new`, `/outreach/[id]/edit` · `community.outings` (read, edit)
5. **Donation channels and receipts** (see Finances). · `donation.receipt`
6. **QR short links**. `/r/[code]`

**Who uses it today:** nobody by card. **Cards today:** Run appeals, Outreach notes, Donations and receipts. Desexing drives is reached only through the Website permission.

Keep / Rename / Merge with ______ / Split ______

Notes: ____________________________________________________________

________________________________________________________________

________________________________________________________________

---

## 11. Website and public pages

*What the world sees.*

1. **Website content (edit the public site)**. `/admin/website` · `website.content`
2. **Public home, about, privacy, releases**. `/`, `/about`, `/privacy`, `/releases`
3. **Public adopt and foster pages** (see Resident information, 7). `/adopt`, `/foster`
4. **Public "our work" pages** (see Maintenance and projects, 7). `/our-work`
5. **Desexing drives** (see Fundraising, 3). `/management/desexing-drives`
6. **Donate page**. `/donate`

**Who uses it today:** nobody by card. **Cards today:** Website.

Keep / Rename / Merge with ______ / Split ______

Notes: ____________________________________________________________

________________________________________________________________

________________________________________________________________

---

## 12. Staff tasks and the assistant

*Daily recurring work and the helper that answers questions.*

1. **Recurring jobs: set up**. `/management/recurring-jobs` · `recurring.manage`
2. **Recurring jobs: do anyone's**. · `recurring.do_any`
3. **My tasks: do mine, mark done or skipped**. `/my` · `recurring.do_own`
4. **Operations landing page**. `/operations`
5. **Assistant: ask a question**. `/assistant` · `assistant.ask`
6. **Assistant: record on someone's behalf**. · `assistant.record`

**Who uses it today:** Management (recurring jobs); Head of Maintenance, 2IC (My tasks, by Do Maintenance); the Assistant is by Do Maintenance too. **Cards today:** Recurring jobs, My tasks, Do Maintenance, Assistant.

Keep / Rename / Merge with ______ / Split ______

Notes: ____________________________________________________________

________________________________________________________________

________________________________________________________________

---

## 13. Settings and administration

*Who may do what, keeping the system safe, and the lists everything else uses.*

1. **Who does what (roles, cards, permissions)**. `/admin/who-does-what`, `/admin/who-does-what/details`, `/admin/role-draft` · Admin
2. **Security and two-step sign-in**. `/admin/security`, `/admin/security/verify`
3. **Recent changes (audit log) and undo**. `/admin/recent-changes` · `audit.view`, `audit.undo`
4. **System status**. `/admin/status` · `system.status`
5. **Immunization types**. `/admin/immunization-types` · `reference.types`
6. **Procedure types**. `/admin/procedure-types` · `reference.types`
7. **Blood test types**. `/admin/blood-test-types` · `reference.types`
8. **Medication option lists** (see Stock). `/admin/medications` · `reference.types`
9. **Frequencies**. `/admin/frequencies` · `reference.types`
10. **Add a missing option while recording**. · `reference.add_while_recording`
11. **Translations**: manage, view. `/management/translations` · `translations.manage`, `translations.view`
12. **My account**: password, home screen icons, language. `/account/password`, `/account/home-screen-icons`
13. **Manual, sign-in, no-access**. `/manual`, `/login`, `/login/forgot`, `/login/request`, `/no-access`, `/home`, `/home/[role]`, `/home/group/[id]`, `/admin`

**Who uses it today:** Admin only. **Cards today:** none.

Keep / Rename / Merge with ______ / Split ______

Notes: ____________________________________________________________

________________________________________________________________

________________________________________________________________

---

## Cross-check

Done from the code: every route in the registry and every activity appears above.

**Activities with no card** (reachable only by Admin or a role given the single permission): `placement.death_withdraw`, `projects.folders`, `projects.photos`, `projects.publish`, `stock.usage`, `stock.medications`, `stock.diets`, `stock.correct`, `translations.manage`, `translations.view`, `reference.types`, `reference.add_while_recording`, `audit.view`, `audit.undo`, `system.status`, `maintenance.delete`, `appeal.medical_photo`.

**Registry pages with no card opening them** (reached from menus or landings): `/projects`, `/contacts`, `/clinics`, `/management/shelter-friends`, `/management/desexing-drives`, `/management/clinics`, `/operations/feeding-list`, `/management/medications`, `/management/diets`, `/management/stock-usage`, `/management/cashflow`, `/management/translations`, `/admin/enclosures`, `/admin/zones`, `/admin/facility-map`, `/admin/immunization-types`, `/admin/procedure-types`, `/admin/blood-test-types`, `/admin/medications`, `/admin/diets`, `/admin/frequencies`, `/admin/recent-changes`, `/admin/status`.

**Features reached by more than one card:** Resident information (2 plus 7 hidden copies), Medical information (4), Photos (5), Stock (3), Finances (3).

**Features with no card at all:** Settings and administration (13). Several whole functions in other features also have no card (marked above).

**Overlaps to settle** (named, not decided): *View residents* / *Residents*; *Add Shelter Photos* / *Add Medical Photos* / *Approve photos*; *Do the Purchasing* / *Record a Delivery* / *Do Stocktaking*; *Contacts* browsing versus directory versus clinics.

**Not placed with confidence** (pages the code has but no one named; say if dead or a feature): `/volunteer`, `/home/group/[id]`, `/management/medication-list` (a second medication list beside `/operations/medication-list`), community dogs (item 8 of Resident information).

*Source: `src/lib/permissions` (cards, catalogue, jobs, routes), `src/lib/home/tiles.ts`, `src/app`, the manual. Who-holds-what read from the dev database on 2026-10-23.*
