# Roles and permissions: the shelter's own roles, and a matrix each shelter can set — a paper

**Status: PROPOSED, 2026-10-03. Nothing in this paper is agreed.** It ends in
questions for Lutan and for the Director (§17). Until they answer, no
`docs/decisions/` file records any of it as decided, and nothing is built. The
one decision this stream does record is a fact, not an agreement: there are no
PCs on site, which overturns part of the 2026-09-24 "Admin on mobile" decision
(`docs/decisions/2026-10-03-no-pcs-on-site-supersedes-admin-on-mobile.md`).

It answers two backlog items as one piece of work, because both ask for the same
table first: *The roles the shelter actually has, from the Director* (Auth) and
*Roles and permissions each shelter configures* (Architecture). The Director's
one-page table is its own file, written for her:
[`roles-director-table.md`](roles-director-table.md).

**One thing was answered while it was being written.** Lutan, 2026-10-03, on
whether the 2IC and Management are one role: *"Yes I think we need to have them
separate and here is why - the director will do management on her mobile during
the day, the 2ic will do her duties on the mobile during the day and admin is
done at night. One thing to think about is that admin and management will
probably be the same person."* The paper is written around that answer. It is
his ruling on that one point; the rest is still proposed.

---

## 1. The short version

1. **One catalogue.** 55 named activities (§4), seeded from the 93 rows of the
   acceptance matrix and then audited against the app's role checks and the 243
   row-level policies in the dev database. Each is **Edit / Read / None** or
   **Yes / No**. The acceptance matrix, the manual's per-role filter, the menu and
   the database policies should all read this one list.
2. **The audit found things the manual does not say.** Eight powers the code
   grants that the 93 rows do not describe, one the manual promises and the
   system refuses (Management and the microchip), and twelve groups of cases
   where the database lets a role do more than any screen offers (§3). None is an
   emergency. All of them have to be settled before "defaults reproduce today
   exactly" means anything, because *today* is three slightly different things:
   what the manual says, what the screens offer and what the database allows.
3. **The fork: the 2IC, Maintenance and Medical should be configured roles, not
   three new enum values.** Recommended, not decided (§16). Each enum value
   costs a two-file migration plus a policy on nearly every one of 47 tables, and
   all of it is thrown away when the matrix lands. The bridge that makes this
   bearable is in §12: until the database is converted, a configured role
   borrows one legacy role's database rights (the 2IC borrows *management*, the
   two Heads borrow *staff*), so all three can have their own name, menu and
   home screen two stages in, while losing nothing they can do today.
4. **Lutan's steer, a page per role: yes to the idea, with one change.** Single
   pages that a role either can or cannot open, with no per-role branching inside
   them, is the right UI rule and the Director's description of the 2IC already
   demands it. Key each page to a **task** rather than to a **role name**, and
   give each role a home screen made of the tasks it holds (§8). Then a role a
   shelter adds later gets a coherent set of pages for free, which role-named
   pages can never give it. It is a rule for the screens; it does not replace
   enforcement in the database.
   **The Director is one person doing two roles' work**: Management by day on
   her phone, Admin at night at her desk. She needs one login, not two, because
   Admin already includes everything Management can do. What she needs is two
   home screens, and the home screen follows the device (§8).
5. **Enforcement: one SQL function, read live, no token hook.**
   `has_permission('stock.delivery', 'edit')` in every policy, a matching `can()`
   in TypeScript, both reading the same two small tables (§10). Not the JWT
   hook: with permissions in the token, archiving a person or narrowing a role
   would not bite until their token refreshed, and today both are immediate.
6. **Three facts from the Director change earlier work** (§2): no PCs on site,
   the Head of Medical has no feature at all (the medication round, scoped in
   §14), and volunteers become read-only, which removes rights real accounts hold
   today and has to be confirmed before anything is taken away.
7. **`0132` is proposed as the permission tables**: additive, read by nothing,
   seeded so that the defaults are today's behaviour (§12, §15). The medication
   round's schema follows it, so that its policies are written against an
   activity from their first day instead of against role names.

## 2. What the Director said, and what it changes

Lutan, 2026-10-03, after talking to the Director, and then his whiteboard and his
answer of the same day (§8). The shelter has six kinds of people, and the
Director's own work falls into two roles:

| # | Who | Role | What they do | On |
|---|---|---|---|---|
| 1 | Director, at night | **Admin** | Settings and setup: the website content, the projects pages, enclosures and zones, the medication and diet lists, people and security | her PC at home |
| 2 | Director, by day | **Management** | Recurring tasks, vet appointments, intake, residents' details and medical records | her phone |
| 3 | 2IC | **2IC** (new) | Stocktakes, ordering medicine and food (Purchasing, deliveries), maintenance tasks. **Not comfortable with computers** | her phone |
| 4 | Head of Maintenance | **Maintenance** (new) | Creates, assigns, progresses and completes maintenance jobs | a phone |
| 5 | Head of Medical | **Medical** (new) | Gives medication to the residents | a phone |
| 6 | Volunteers | **Volunteer**, read-only | See the map and the resident hub. Change nothing | a phone |
| 7 | Vets | the doctor login (`vet` today) | Add an appointment for a resident; add test results and the rest of the clinical record | the clinic's own |

The backlog item mapped the 2IC to Management. Lutan's answer separates them:
the 2IC is her own role, and Management is what the Director does by day. So
Lanna needs **three** roles the system does not have, not two.

Three things in that description overturn something already on `main`.

**There are no PCs on site.** The only computer is the Director's, at home.
Every other role works on a phone and only on a phone. The 2026-09-24 decision
marked a set of Management pages desktop-only behind a "Best on a larger screen"
notice; that is now right only for pages the Director alone uses. §13 goes
through every desktop-only row again, and the superseding decision file records
the fact. It also puts the **Mobile responsiveness sweep** on the critical path
for every role but Admin, the Director's own daytime work included. That item is parked and Lutan schedules it (ruled
2026-10-02), so this paper reports the change and does not reopen it.

**The Head of Medical has nothing to use.** A prescription records what *should*
be given: medication, dose, frequency, dates. Nothing records that a dose *was*
given, by whom, or when. Only immunizations carry `date_administered` and
`administered_by`. The medication round is the largest new build in the item and
is scoped in §14, not built.

**Volunteers lose rights they hold today.** A volunteer account can now add,
refile and remove resident photos and choose the profile photo; move a resident
between enclosures; count the stock; add and remove maintenance and project
photos; mark their own recurring jobs done; ask the assistant questions; and
read every contact's name and phone, the maintenance board, projects, the vet
list and all medical records. The Director leaves them the map and the resident
hub, read-only. That is a behaviour change for real accounts, so §17 asks Lutan
to confirm each line before any of it is removed. The dev database has **no**
volunteer accounts at all (4 admin, 2 management, 6 staff, 4 vet, read
2026-10-03); how many exist in production decides how carefully the change has
to be staged, and this stream did not read production.

Two more points follow from the list rather than from any one line of it.

**There is no plain Staff.** Six dev accounts hold `staff` today. Either every
employee is the 2IC or one of the two Heads, or there are other employees
(kennel hands) the Director did not mention. Until that is answered, nobody but
the Director would be able to register a resident, move one, send one to
hospital, record a foster, an adoption or a death (§17, question D1).

**"The map" does not exist yet.** The facility map is a prototype at
`/enclosures/map-prototype`. Until the Facility item is built, a volunteer's
"map" is the enclosures list.

## 3. What the system does today

### How a right is enforced now

A role is one value of the `app_role` enum on `user_roles`: `admin`,
`management`, `staff`, `vet`, `volunteer`, `public_viewer`. What a role may do is
written down in four places that have to be kept in step by hand.

| Layer | Where | Size, counted 2026-10-03 |
|---|---|---|
| Row-level policies | `pg_policies`, built up across 48 migration files | **243** policies on **47** tables, one policy per role per table: 52 name `admin`, 64 `management`, 60 `staff`, 54 `vet`, 40 `volunteer` |
| Guards inside functions and views | bodies that test `current_user_role()` against a list of their own | **15** of the 82 functions and **10** of the 31 views |
| App predicates and role lists | `src/lib/**`, `src/app/**` | 14 named predicates (`isShelterRole`, `canManage`, `canStocktake`, `canRecordDelivery`, `canArchiveMedical`, `canWriteMaintenance`, `canReadMaintenance`, `canWriteProjects`, `canReadRecurringJobs`, `canDoJob`, `canUseAssistant`, `canWriteWithAssistant`, `hasAppAccess`, `assertPhotoWriteAccess`) plus 16 `*_ROLES` lists and about 20 inline `role === "…"` tests, across 27 files |
| Words | the manual's `roles` tag on 55 topics, `/releases` per-line `roles`, the role walkthrough's six passes, the acceptance matrix | read through `isForRole` |

Adding a role the enum way means touching all four, and a role that is missed in
one place can end up able to do *less* than staff, which is the trap the Senior
Staff item already names.

### What the audit found

The catalogue was seeded from `scripts/lib/acceptance-matrix-entries.mjs` (93
activities from the manual's 67 topics). The manual was written for reading, so
the seed was then checked against the three enforcing layers: every policy in the
dev database, every role test inside a database function, every guard on every
page, route and server action, and every table the app writes to. Appendix B
says how to repeat it.

**A. Powers the code grants that the 93 rows do not describe.**

| # | Power | Who has it today | Where |
|---|---|---|---|
| A1 | Add a missing medication or frequency while writing a prescription, and a missing procedure type while logging a procedure | admin, management, staff, vet | `src/app/prescriptions/actions.ts`, `src/app/procedures/new/actions.ts`; insert policies on `medication`, `frequency`, `procedure_types` |
| A2 | Add a new contact while recording a foster or an adoption | admin, management, staff | `src/lib/contacts/create.ts`, `src/lib/placements/rehome.ts` |
| A3 | Remove a resident's photo, refile it, and choose the profile photo | admin, management, staff, **volunteer** | `delete_resident_photo()`, `set_resident_profile_photo()`. The matrix has only "Add photos" |
| A4 | Add and remove photos on a maintenance job | admin, management, staff, **volunteer** | `assertPhotoWriteAccess`, `volunteer_rw_maintenance_photos`. The matrix row "Edit a job, record its cost, add before and after photos" says a volunteer must not |
| A5 | Put a photo on the public website by filing it anywhere but Medical | everyone who can add a resident photo, **volunteers included** | `0101`, `0103`: every non-Medical photo of a resident on the Adopt page is public. Publishing is hidden inside an upload |
| A6 | Mark *anyone's* recurring job done or skipped | admin, management | `record_recurring_job()` |
| A7 | Correct a stock figure from the Management lists | admin, management | `record_stock_correction()` |
| A8 | Delete a job, a project folder or an adopter's update outright | admin, management, staff | delete policies on `maintenance`, `project_folders`, `adoption_updates`. The matrix mentions "deleting a job" only as the example in the confirm-dialog row; none has a row of its own |

**B. One thing the manual promises that the system refuses.** The manual's
*Scanning a microchip* topic is tagged admin, management, staff and vet, so the
acceptance matrix tells a Management tester to record a chip number.
`set_resident_microchip()` and `MICROCHIP_WRITE_ROLES` both say admin, staff and
vet. Management is refused. It is the same shape as the blood-test fault the
staff dry run found (`0131`): the words and the code disagree and nothing
noticed. Whether Management should have it is question L6.

**C. The database allows more than any screen offers.** Each row is a right a
person could use only by sending a request by hand with their own login. None
is reachable from a button. They matter here for one reason: the matrix has to
pick *one* truth as "today", and for each of these the screens and the database
disagree.

| # | Table or function | The database lets | The screens let |
|---|---|---|---|
| C1 | `enclosures`, `zones` | admin, management, staff insert, update, delete | admin only (Settings) |
| C2 | `residents` | admin, management, staff **delete** | nobody: the app never deletes a resident |
| C3 | `immunization_types` | **vet** insert, update, delete | admin only (Settings) |
| C4 | `blood_tests`, `procedures`, `prescriptions`, `immunization_records`, `vet_appointments` | **vet** delete outright (own clinic's) | Remove is not offered to a vet at all |
| C5 | `weight` | management, staff, vet delete outright | Remove is a soft archive, and not for vets |
| C6 | `contacts` | staff update and delete | staff can only add one (A2); editing is Management's |
| C7 | `vet_doctors`, `vet_doctor_clinics`, `merge_vet_doctors()` | staff and vet insert, update, delete, merge | Management only (`/management/vets/…/doctors`) |
| C8 | `stock_receipts` | staff update | the app only inserts and deletes |
| C9 | `stock_receipts`, `stock_counts`, `medication`, `diet_types` | **volunteer** reads every row and every column, prices and delivery costs included | Stocktake needs the names and the counts, not the prices; Deliveries and both Management lists are refused to a volunteer |
| C10 | `enclosures`, `zones`, `vets`, `diet_types`, `shelter_friends`, `bulk_appointments` | **vet** reads every row, every other clinic and its bulk bookings included | all refused to a vet as pages. A resident's page needs the enclosure's name; nothing a vet opens needs the list of other clinics |
| C11 | `record_recurring_job()`, `reassign_recurring_job()` | a vet may hold and record a recurring job | vets are never offered as assignees |
| C12 | `resident_list_view` | the view carries insert, update, delete and truncate grants to `authenticated` | read only. Whether any of those grants can do anything depends on the view being updatable, which was not tested here |

C9 and C10 are the two worth a second look whatever is decided here, because
they are reads: a volunteer can read what the shelter paid for a delivery, and a
clinic's login can list the other clinics the shelter uses. Both are follow-ups
for the `backlog` branch, not part of this paper's build.

**D. One measurement.** 234 of the 243 policies call `current_user_role()`
bare, not inside a scalar sub-select. Supabase's guidance is to wrap such calls
(`(select current_user_role())`) so that Postgres evaluates them once per
statement rather than once per row. The app is fast enough today, so this is not
a defect report. It is the reason §10 specifies the wrapped form for every
converted policy.

## 4. The catalogue

### The rules it is built on

1. **One activity is one power a person would name.** "Record a delivery", not
   "insert into `stock_receipts`".
2. **Two kinds of cell.** A thing you look at and change is **Edit / Read /
   None**. An act with nothing to look at is **Yes / No** ("record a death").
   Edit always includes Read.
3. **Where one screen hid two powers, there are two activities**, never a
   fourth level. Ten of the 55 exist for that reason: booking a visit apart from
   writing it up, moving a job on apart from managing the board, publishing a
   project apart from editing it, undoing a change apart from seeing it, marking
   anyone's recurring job apart from your own, adding a contact apart from
   managing contacts, adding a missing medication from a form apart from managing
   the list, managing photos apart from adding one, correcting a stock figure
   apart from counting, and giving a dose apart from prescribing it.
4. **A lookup is not an activity.** A prescription form needs medication names;
   a move form needs enclosure names. Those reads come with the activity that
   needs them, through a view that carries only the columns the form shows, as
   `0126` did for contacts. This is what closes findings C9 and C10: a volunteer
   counting stock reads names and counts, not prices.
5. **Some activities need another.** Moving a resident needs Read on residents
   and on enclosures. The catalogue records each prerequisite, and the Settings
   matrix refuses a combination that cannot work, so no column can be set to
   something incoherent.
6. **A key never changes; a name is translated.** `stock.delivery` is what code
   and policies say. "Record a delivery" / its Thai is what people read, from the
   dictionaries like every other label.
7. **The device is not a permission.** Every activity a role other than the
   Director holds has to work on a phone (§13).

### What "today" means for a default cell

The brief requires that the defaults reproduce today exactly. §3 showed that
today is three things. The rule proposed:

- **The cell is what the screens offer today.** That is what people experience
  and what the manual and the acceptance matrix describe.
- **Where the database allows more (C1–C12), the cell is the narrower value**,
  and converting that table closes the gap. Each is a *known tightening*: listed
  by name in the parity check (§11), invisible to anyone using the app, and a
  change only for a request sent by hand.
- **Where the manual promises more than the code (B), the cell is what the code
  does**, until question L6 is answered.

### The 55 activities, with today's five roles

`E` Edit, `R` Read, `Y` Yes, `–` None/No. `°` means "within this role's scope"
(§5): for a vet, the residents their clinic treats and their own clinic's
records. **DT** is the row of the Director's table the activity belongs to.
Admin is shown for completeness; it is never stored (§6).

| Key | Activity | Kind | Admin | Mgmt | Staff | Vet | Vol | DT | Note |
|---|---|---|---|---|---|---|---|---|---|
| **Residents** | | | | | | | | | |
| `resident.record` | A resident's details, housing and history | E/R | E | E | E | R° | R | 1 | Edit is the pencil: name, bio, flags. Reading includes placement history |
| `resident.register` | Register a new resident (intake) | Y/N | Y | Y | Y | – | – | 2 | |
| `resident.microchip` | Record or correct a microchip number | Y/N | Y | **–** | Y | Y° | – | 3 | Finding B: the manual says Management can |
| `resident.adoption_news` | News from an adopter | E/R | E | E | E | R° | R | 4 | Edit includes delete (A8) |
| **Housing** | | | | | | | | | |
| `placement.move` | Move a resident to another enclosure | Y/N | Y | Y | Y | – | Y | 5 | |
| `placement.hospital` | Send to hospital and bring back | Y/N | Y | Y | Y | – | – | 6 | |
| `placement.rehome` | Foster, adopt, return to the shelter | Y/N | Y | Y | Y | – | – | 6 | |
| `placement.death` | Record a death | Y/N | Y | Y | Y | – | – | 7 | |
| `placement.death_withdraw` | Withdraw a death recorded in error | Y/N | Y | – | – | – | – | 8 | |
| **Medical** | | | | | | | | | |
| `visit.book` | Book a vet visit | Y/N | Y | Y | Y | Y° | – | 9 | *Split.* Today it is the same right as writing the visit up |
| `medical.visits` | Vet visits and how they went | E/R | E | E | E | E° | R | 10 | |
| `medical.procedures` | Procedures and their files | E/R | E | E | E | E° | R | 10 | |
| `medical.blood_tests` | Blood tests and their reports | E/R | E | E | E | E° | R | 10 | Staff and Management since `0131` |
| `medical.prescriptions` | Prescriptions: what should be given | E/R | E | E | E | E° | R | 11 | |
| `medical.doses` | Giving medication: what was given | E/R | not built | | | | | 12 | *New.* The medication round, §14 |
| `medical.immunizations` | Immunizations | E/R | E | E | E | E° | R | 13 | |
| `medical.weight` | Weight | E/R | E | E | E | E° | R | 13 | |
| `medical.diet` | A resident's diet | E/R | E | E | E | E° | R | 13 | |
| `medical.archive` | Remove a medical record entered by mistake, and restore it | Y/N | Y | Y | Y | – | – | 14 | |
| **Photos** | | | | | | | | | |
| `photos.resident_add` | Add a photo to a resident | Y/N | Y | Y | Y | Y° | Y | 15 | A vet's go to the Medical folder only (scope). Finding A5: any other folder is public for a resident on the Adopt page |
| `photos.resident_manage` | Refile or remove a photo, choose the profile photo | Y/N | Y | Y | Y | – | Y | 15 | *Split*, finding A3 |
| **Enclosures** | | | | | | | | | |
| `facility.enclosures` | Enclosures and zones | E/R | E | R | R | – | R | 16 | Edit is Settings → Zones and Enclosures |
| `facility.map` | The facility map | Y/N | Y | Y | Y | – | Y | 16 | A prototype today |
| **Maintenance** | | | | | | | | | |
| `maintenance.jobs` | Maintenance jobs: log, edit, assign, cost, delete | E/R | E | E | E | – | R | 17 | |
| `maintenance.progress` | Move a job on: in progress, blocked, completed | Y/N | Y | Y | Y | – | – | 17 | *Split.* Lets someone finish a job without managing the board |
| `maintenance.photos` | Add and remove a job's photos | Y/N | Y | Y | Y | – | Y | 17 | Finding A4 |
| **Projects** | | | | | | | | | |
| `projects.folders` | Project folders and their stories | E/R | E | E | E | – | R | 18 | Edit includes delete (A8) |
| `projects.photos` | Add and remove project photos | Y/N | Y | Y | Y | – | Y | 18 | |
| `projects.publish` | Put a project on the public website | Y/N | Y | Y | Y | – | – | 19 | *Split* |
| **Clinics, contacts, supporters** | | | | | | | | | |
| `clinics.list` | The list of clinics | E/R | E | E | R | – | R | 20 | "Vets" today; the rename is parked |
| `clinics.doctors` | A clinic's doctors: add, rename, merge, retire | Y/N | Y | Y | – | – | – | 20 | |
| `contacts.directory` | Contacts | E/R | E | E | R | – | R° | 21 | A volunteer reads name and phone only (scope). A vet has no Contacts page; the carer's name on a resident's record is a lookup (rule 4) |
| `contacts.add` | Add a new contact | Y/N | Y | Y | Y | – | – | 21 | *Split*, finding A2 |
| `friends.manage` | Shelter Friends: add, publish, unpublish | Y/N | Y | Y | – | – | – | 22 | |
| **Stock and ordering** | | | | | | | | | |
| `stock.count` | Count the stock (stocktake) | Y/N | Y | Y | Y | – | Y | 23 | |
| `stock.delivery` | Record a delivery | Y/N | Y | Y | Y | – | – | 24 | |
| `stock.purchasing` | Work out what to buy | Y/N | Y | Y | – | – | – | 25 | |
| `stock.usage` | Compare stock used with planned | Y/N | Y | Y | – | – | – | 25 | |
| `stock.medications` | The medication list: prices, labels, reorder levels | E/R | E | E | – | – | – | 26 | |
| `stock.diets` | The diet list and the food forecast | E/R | E | E | – | – | – | 26 | Includes units of measure |
| `stock.correct` | Correct a stock figure | Y/N | Y | Y | – | – | – | 26 | *Split*, finding A7 |
| **Management** | | | | | | | | | |
| `reports.dashboard` | The dashboard | Y/N | Y | Y | – | – | – | 27 | |
| `reports.cashflow` | Cashflow and fixed outgoings | E/R | E | E | – | – | – | 28 | |
| `recurring.manage` | Set up recurring jobs and hand dates over | Y/N | Y | Y | – | – | – | 29 | |
| `recurring.do_any` | Mark anyone's recurring job done or skipped | Y/N | Y | Y | – | – | – | 29 | *Split*, finding A6 |
| `recurring.do_own` | Mark your own recurring jobs done or skipped | Y/N | Y | Y | Y | – | Y | 30 | |
| `translations.manage` | Translate the public text | Y/N | Y | Y | – | – | – | 31 | |
| **The assistant** | | | | | | | | | |
| `assistant.ask` | Ask the assistant a question | Y/N | Y | Y | Y | – | Y | 32 | |
| `assistant.record` | Record something through the assistant | Y/N | Y | Y | Y | – | – | 32 | Each thing it records is also checked against that thing's own activity |
| **Settings** | | | | | | | | | |
| `website.content` | The public website's content | E/R | E | – | – | – | – | 33 | |
| `reference.types` | Setup lists: immunization, procedure and blood-test types, frequencies | E/R | E | – | – | – | – | 34 | |
| `reference.add_while_recording` | Add a missing medication, frequency or procedure type from a form | Y/N | Y | Y | Y | Y | – | 34 | *Split*, finding A1 |
| `audit.view` | See who changed what | Y/N | Y | – | – | – | – | 35 | |
| `audit.undo` | Undo a change | Y/N | Y | – | – | – | – | 35 | *Split* |
| `system.status` | The system status page | Y/N | Y | – | – | – | – | 36 | |

Not in the table, because nobody sets them (§6): signing in and out, a forgotten
password, changing your own password, the language switch, the manual, the
release notes, My tasks or Appointments as a home page, the public website, and
everything under Settings → Security.

### From the 93 rows to the 55 activities

The acceptance matrix keeps its 93 rows: they are *test cases*, and one activity
often needs several ("Count the stock" and "Skip an item" are both
`stock.count`). What changes is where its cells come from. Today each row takes
its roles from the manual's `roles` tag. Under this design each manual topic and
each matrix entry names an **activity and a level**, and the does / must-not
cells are worked out from the matrix. Appendix A maps every manual topic to its
activity, so that the next stream does not have to rediscover it.

That is the "define the catalogue once" both backlog items ask for: one file,
`src/lib/permissions/catalogue.ts`, with the key, kind, area, prerequisites and
supporting lookups of each activity; the database seeded from it; and a check
that fails when the two differ (§11).

## 5. Scopes: which rows, as opposed to which powers

A vet seeing only the residents their clinic treats is not a cell. Forcing it
into Edit / Read / None would need a level per kind of limit. So a role has, next
to its column of cells, a small fixed set of **scopes**. Each is a choice from a
short list, and each option is backed by one SQL helper that already exists or
nearly does. A shelter picks an option; it cannot write its own.

| Scope | Options | Today | Backed by |
|---|---|---|---|
| Which residents | all · those the login's clinic treats | vet: clinic's; everyone else: all | `current_vet_resident_ids()` (`0108`) |
| Whose clinical records it may change | any · its own clinic's | vet: own clinic's | `vet_owns_visit()`, `current_user_vet_ids()` (`0110`) |
| How much of a contact | everything · name and phone · name and type | volunteer: name and phone; vet: name and type; others: everything | the `volunteer_contacts` and `vet_contacts` views (`0126`) |
| Which photo folders | all · Medical only | vet: Medical only | `PHOTO_CATEGORIES`, `record_attachment()` |
| Other people's login emails | shown · hidden | hidden for vet and volunteer | `private.app_users` (`0126`) |

A scope narrows what an activity reaches; it never grants anything. A role with
"clinic's residents" and Read on `resident.record` reads those residents and no
others. The "own clinic" options need the login to be linked to a doctor record,
which is the existing rule (`0127`), and a role using them with no link sees
nothing, as a vet with no clinic does today.

## 6. What nobody can configure

1. **Admin has everything, always.** Admin's column is not stored and is not
   editable; `has_permission()` answers yes for Admin before it looks at any
   table. So no edit can take a power away from Admin.
2. **There is always an Admin.** The existing rule that the last admin cannot be
   removed, demoted or archived stays. Together with rule 1, a shelter can never
   be left with nobody able to edit the matrix.
3. **Security is Admin's and needs 2-step verification.** Creating people,
   approving access requests, changing a person's role, archiving a person,
   editing the matrix, adding or removing a role: Admin only, and only in a
   session verified with the authenticator app, exactly as `user_roles` is
   guarded today. None of it is a cell.
4. **The public viewer and the signed-out visitor are fixed.** They see the
   public website. They are not columns.
5. **Everyone with a login can** sign in and out, reset and change their own
   password, switch language, and read the manual and release notes for what
   they can do.
6. **A deceased resident's record is read-only**, whoever is asking. That is a
   rule about the record, not about a role.
7. **The audit log records regardless.** No role, Admin included, can switch off
   `audit_log` or edit it. A change to a cell is itself recorded: who, which
   role, which activity, from what to what, when.
8. **A new activity starts at None** for every role but Admin, on every shelter,
   until an Admin sets it. The six default roles' columns ship with a value for
   it; a role the shelter made does not, and the matrix marks the row as new.
9. **A cell never outranks a prerequisite** (§4, rule 5).

## 7. Lanna's roles, proposed

The template every shelter starts from is today's six roles with today's cells
(§4). Lanna's own set is that template changed to match the Director:

| Role | Kind | Who at Lanna | Home screen | Proposed change from today |
|---|---|---|---|---|
| Admin | fixed | The Director, at night at her desk | Settings | none |
| Management | default | The Director, by day on her phone. She signs in as Admin, which includes it (§8) | Recurring tasks, vet appointments, intake, residents | which other Management pages she wants on the phone is question D2 |
| 2IC | **new**, configured | The 2IC | Stocktake, Purchasing, Maintenance tasks | see the Director's table |
| Maintenance | **new**, configured | Head of Maintenance | Maintenance tasks | see the Director's table |
| Medical | **new**, configured | Head of Medical | Today's medication round | see the Director's table |
| Staff | default | open: question D1 | My tasks | kept in the template; whether anyone at Lanna holds it is the Director's call |
| Volunteer | default, narrowed | Volunteers | Residents | read-only: every Yes and Edit in its column becomes No or Read, confirmed line by line first (L3) |
| Vet | default | Clinics' doctors | Appointments | none now. The name becomes Doctor when the parked clinics item is taken up |
| Public viewer | fixed | Test logins | the public site | none |

The cell-by-cell proposal for those roles **is the Director's table**
([`roles-director-table.md`](roles-director-table.md)): 37 rows, each one or
more activities from §4, each cell marked as *stated by the Director*, *carried
over from today*, or *a gap with a proposed answer*. It is kept as one file, not
repeated here, so that there is one place to correct when she answers.

On the vet's name: `doctor` is the target name for the role, per the parked
*Clinics and doctors* item (Medical records, PARKED 2026-10-03). Nothing here
starts that rename. What will need reconciling when it is unparked: the role key
(`vet` → `doctor`), which under this design is a one-row rename in `roles`
instead of an enum change; and the open question of which residents a doctor
login sees, which is the "which residents" scope of §5 and should be answered
there rather than with new policies.

## 8. Lutan's steer: a fresh page for each role

> **Lutan, 2026-10-03:** "For the roles and permissions design can we consider
> fresh pages for each, this may be easier to maintain if we have single pages
> with access or no access."

This section recommends. It does not decide.

### What is right about it

- **It goes at the real mess.** About a dozen pages branch on the role *inside*
  the page today. The resident hub alone consults five role lists to decide which
  of ten controls to draw. A page that a role either opens or does not open has
  none of that.
- **The Director's description already requires it.** The 2IC is not
  comfortable with computers and needs one task per screen, wizard steps, big
  buttons with an icon and a word, no table edited in place. No single page can
  be right for her on a phone and for the Director at a desk.
- **It makes acceptance testing nearly mechanical.** "Can this role open this
  page" is a yes or a no that can be generated, leaving people to test what the
  page does.

### What it does not solve

- **It is navigation, not capability.** A role that cannot see a page can still
  send its form. Both backlog items say enforcement must be in the database, and
  the volunteer's narrowing most of all, "since a volunteer's JWT is the real
  boundary". Separate pages make the screens simpler. They do not make anything
  safer.
- **Pages named for roles would duplicate actions.** The 2IC counts stock;
  so, today, does a volunteer; so might the Head of Medical. Three role pages
  for one count are either three implementations that drift apart, or one
  component in three wrappers. Drift in a medical record is worse than an `if`.
- **Pages named for roles give a new role nothing.** The Architecture item
  exists so that a shelter can add "Purchasing" or "Kennel lead" and set its
  column. A role nobody wrote pages for would open onto an empty app.

### Three shapes

| | Shared pages, branching inside (today) | A page per **role** | A page per **task**, open or not |
|---|---|---|---|
| Per-role branching inside a page | yes, about a dozen pages | none | none |
| The same action written twice | no | yes, wherever two roles share a job | no |
| A role a shelter adds later | works, shows whatever the `if`s allow | gets no pages until someone builds them | gets every task its column holds |
| Renaming a role (vet → doctor) | touches the `if`s | touches URLs and folders | touches one row |
| Acceptance test per page | what does each role see here? | can the role open it? | can the role open it? |
| The 2IC's simple screens | hard: one page, two audiences | natural | natural: it is a second page for the same task |
| One person doing two roles' work (the Director) | one menu holding everything | two logins, or a page set per role she holds | one login, two home screens |

### What is recommended

Keep Lutan's rule exactly as he put it, **single pages with access or no
access**, and change one word: a page belongs to a **task**, not to a role.

1. **One page, one activity, one guard.** A page opens with
   `requirePermission("stock.count")` and contains no role name and no branch on
   who is looking. Most action pages are already built this way: move,
   hospital, foster and adopt, record a death, edit and microchip are each their
   own route.
2. **A page that shows a thing lists the tasks you can do to it.** The resident
   hub draws its buttons from one registry of routes, filtered by what the
   person may open. That is the only "branching" left, it is written once, and
   it is the same code that builds the menu.
3. **Each role has a home screen made of its tasks.** Big tiles, an icon and a
   word, in the person's language: Today's medication round, Count the stock,
   Maintenance jobs. For the default roles the order is chosen by hand. For a
   role a shelter adds, the same screen is built from its column, so it is
   coherent on the day it is created.
4. **Where one task needs a simple and a full version, there are two pages over
   one action.** The card-by-card stocktake and the desktop stocktake sheet both
   end in `record_stocktake()`. Which one a person gets follows the **device**:
   the step-by-step page on a phone, the full page on a larger screen, with a
   link from one to the other. It is never a test of the role's name. Phone
   pages are the ones built first, since everyone but the Director at her desk
   is on a phone.
5. **The route registry is the single list**: path, activity, level, icon,
   label, and whether it is the phone or the desk version. The menu, the home screens, the hub's buttons, the
   recurring-job "who can do this" rule and the acceptance matrix's page column
   all read it. Adding a page is one entry.

This keeps what Lutan wants, easier maintenance through pages that are simply
reachable or not, and it is the only one of the three shapes that also serves
the Architecture item.

**When his version as stated would be the better one:** if shelter-defined roles
are *not* going to be built. With one fixed set of roles forever, pages named
for roles plus three enum values is less work than a catalogue and a matrix, and
the duplication is bounded by the number of roles. The Architecture item was raised the same day
with seven shelters in mind, so this paper assumes configurable roles are
wanted. If that is wrong, §16's recommendation flips with it, and that is
question L1.

### Lutan's whiteboard, 2026-10-03

While this paper was being written Lutan sent three photos of a whiteboard:
"my brainstorm for the mobile centric views". Transcribed as drawn, a heading
with tiles under it:

| Heading on the board | Tiles under it | Activities (§4) |
|---|---|---|
| **Admin / Settings** | Enclosures · Zones · Medication · Diets | `facility.enclosures` (Edit), `stock.medications`, `stock.diets` |
| **2IC** | Stocktake · Purchasing · Maintenance tasks | `stock.count`, `stock.purchasing`, `maintenance.jobs` / `maintenance.progress` |
| **Management** | Recurring tasks · Vet appts · Intake · Res medical · Res details | `recurring.manage`, `visit.book`, `resident.register`, the `medical.*` records, `resident.record` |
| **Medical** | Residents (scroll) | `resident.record` (Read), `medical.doses` |
| **Maintenance** | Maint tasks | `maintenance.jobs`, `maintenance.progress` |

It is a brainstorm, not a ruling, and it is recorded here as that. What it shows:

- **It is the home-screen-of-tiles shape.** Each heading is a screen with one to
  five big tiles. That is recommendation 3 above, arrived at from the other
  direction.
- **The same tile is on two screens.** "Maintenance tasks" is under both 2IC and
  Maintenance. That is the case that decides between a page per role and a page
  per task: one Maintenance page, reached from two home screens, is the board as
  drawn. Two Maintenance pages would be the duplication this section warns of.
- **Medication and Diets are under Admin / Settings**, where today both are
  Management pages. That agrees with the Settings/Management rule of 2026-09-27
  (lists that other screens pick from are Settings) and it settles a phone
  question in §13: prices and setup of those two lists are the Director's, at a
  desk. The 2IC's part is the count and the order.
- **The screens are small.** No role has more than five tiles, which is what
  makes them usable on a phone by someone who is not comfortable with one.

What it asked, and what was answered:

- **2IC and Management are separate headings**, where the backlog item says the
  2IC *is* Management. **Answered by Lutan the same day: they are separate.**
  The Director does management on her phone by day, the 2IC does her own duties
  on hers, and admin is done at night. See *One person, two roles' work* below.

What it still asks, carried to §17:

- **Much is on no screen**: deliveries, moving a resident, hospital, foster and
  adoption, recording a death, photos, contacts, clinics, projects, Shelter
  Friends, the dashboard, cashflow, stock usage, translations, the website. Each
  is either the Director's at a desk or not placed yet (L7).
- **Medical has one tile, "Residents (scroll)".** §14 proposes the round as a
  list of residents grouped by where they live, which is a scroll of residents.
  Whether the Head of Medical also needs the rest of the medical record from
  there is question D4.
- **No Volunteer and no Vet heading.** Taken to mean unchanged: a volunteer has
  the map and the residents, a vet has Appointments and Residents.

### One person, two roles' work

Lutan's answer ends with the thing to think about: *"admin and management will
probably be the same person."* The Director manages by day on her phone and does
admin at night at her desk. Three ways to give one person both:

| | How it works | Cost |
|---|---|---|
| **One login, home follows the device** (recommended) | She is Admin. Admin includes everything Management can do (§6). On a phone she lands on the Management home; on a larger screen, on Settings. A switch at the top opens the other | nothing new in the data model |
| Two logins | One Admin account, one Management account | two passwords and two 2-step set-ups for someone doing one job; records split between two names in Recent changes |
| Several roles per person | `user_roles` holds more than one row; rights are the union | "what can this person do" stops being one column of the matrix; scopes need a rule for when two roles disagree |

**Recommended: one login.** It works because of a rule that is already fixed:
Admin has everything. So the Director loses nothing by holding only Admin, and
what she actually needs, a small daytime screen with no Settings clutter, is a
*home screen*, which is what the whiteboard drew.

The general form of that, so it is not a special case for one person:

- **A home screen belongs to a role** and is made of that role's tasks.
- **Admin can open any role's home screen**, because Admin can do everything on
  all of them. The switch lists them: Management, 2IC, Maintenance, Medical.
  That is also how the Director sees exactly what the 2IC sees when the 2IC rings
  to say something is wrong.
- **Which home a sign-in lands on follows the device** for Admin: Management on
  a phone, Settings on a desk. For every other role there is one home.

Several roles per person stays out of this design (§9), but nothing in it has
to be undone if a later shelter needs it: `has_permission()` asks whether *any*
of the person's roles grants the activity, so a second row would simply work.
That is question L2.

## 9. The data model

A sketch to agree the shape. It is not a migration and nothing has been run.

```sql
create table roles (
  id                uuid primary key default gen_random_uuid(),
  key               text not null unique,   -- 'admin', 'management', 'maintenance', …
  name              text not null,
  name_th           text,
  kind              text not null check (kind in ('fixed', 'default', 'custom')),
  opens_app         boolean not null default true,     -- false for the public viewer
  home_path         text,                              -- where sign-in lands (for Admin, on a phone: Management's)
  scope_residents   text not null default 'all'  check (scope_residents in ('all', 'own_clinic')),
  scope_clinical    text not null default 'any'  check (scope_clinical  in ('any', 'own_clinic')),
  scope_contacts    text not null default 'full' check (scope_contacts  in ('full', 'name_phone', 'name_type')),
  scope_photos      text not null default 'all'  check (scope_photos    in ('all', 'medical_only')),
  sees_login_emails boolean not null default true,
  legacy_role       app_role,                          -- the bridge of §12; dropped with the enum
  archived_at       timestamptz
);

create table permission_activities (                   -- the catalogue, seeded from the code file
  key      text primary key,
  kind     text not null check (kind in ('level', 'yesno')),
  area     text not null,
  sort     integer not null,
  requires jsonb not null default '[]'                 -- prerequisites: [{activity, level}]
);

create table role_permissions (
  id       uuid primary key default gen_random_uuid(), -- a single-column key, so audit_log (0121) can name the row
  role_id  uuid not null references roles on delete cascade,
  activity text not null references permission_activities,
  level    smallint not null check (level in (1, 2)),  -- 1 read, 2 edit or yes
  unique (role_id, activity)
);

alter table user_roles add column role_id uuid references roles;
```

- **No row means None.** A missing cell, an unknown activity, an archived role
  and a person with no role all answer no.
- **Admin has no rows.** Its column is a rule (§6), not data.
- **Yes / No uses the same column**: Yes is 2. One comparison serves both kinds.
- **Tenancy.** `permission_activities` is the product's and stays global. `roles`
  gains `shelter_id` when the multi-shelter work lands, `key` becomes unique per
  shelter, and `role_permissions` follows its role. Nothing here has to be
  rebuilt for that; it is one column and one index.
- **Audit and export.** `roles` and `role_permissions` get the `audit_log`
  trigger, so Recent changes shows who changed which cell. The matrix exports as
  a sheet and as a PDF from Settings, because it is also what a shelter's
  acceptance sign-off is checked against.
- **One person, one role**, as now. Several roles per person was considered and
  left out: it makes "what can this person do" a union nobody can read off the
  matrix, and a shelter that needs a mix can make a role for it. The Director,
  who does both Admin's and Management's work, does not need it (§8): Admin
  includes Management.

## 10. Enforcement, and how it stays fast

### One function in the database

```sql
create function has_permission(p_activity text, p_level text default 'edit')
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    left join public.role_permissions rp
           on rp.role_id = r.id and rp.activity = p_activity
    where ur.user_id = (select auth.uid())
      and ur.archived_at is null
      and r.archived_at is null
      and (r.key = 'admin' or rp.level >= case p_level when 'read' then 1 else 2 end)
  );
$$;
```

Every policy and every `security definer` guard asks it, and nothing else.
A table gets one policy per command instead of one per role per command:

```sql
create policy weight_select on weight for select to authenticated
  using ((select has_permission('medical.weight', 'read'))
         and ((select sees_all_residents()) or resident_id in (select current_vet_resident_ids())));

create policy weight_insert on weight for insert to authenticated
  with check ((select has_permission('medical.weight'))
              and ((select sees_all_residents()) or resident_id in (select current_vet_resident_ids())));
```

47 tables with at most four commands each is fewer policies than today's 243,
and none of them names a role.

### One function in TypeScript

```ts
const perms = await loadPermissions();      // one RPC per request, my_permissions(), memoised with cache()
perms.can("stock.delivery");                // edit, or yes
perms.can("medical.weight", "read");
await requirePermission("stock.count");     // page guard: signed out → /login, refused → /no-access
```

`my_permissions()` returns the role's key, name, home, scopes and its cells. The keys are a TypeScript union generated from the catalogue file, so a
mistyped activity does not compile. The fourteen predicates and sixteen role
lists of §3 are replaced by it. Client components read the same map from a
provider; it is the person's own permissions, so nothing in it is secret.

The three checks every write has today stay three: the page (may you open it),
the server action (may you do it), the database (the policy). What changes is
that all three ask the same question with the same key.

### Live lookup or the token hook

The item names two ways to keep this fast. They are not equally good here.

| | **Live lookup** (a `stable` function over two small tables) | **Token hook** (permissions written into the JWT at sign-in) |
|---|---|---|
| A changed cell takes effect | on the next request | when the person's token refreshes, up to its lifetime (an hour by default), or on signing in again |
| Archiving a person, narrowing a role | immediate, as today | lags by the same interval |
| Cost per statement | one indexed lookup per policy | none |
| New moving parts | none | a hook registered in each Supabase project's Auth settings, outside the migration files, for dev, production and later UAT |
| The token | unchanged | carries up to 55 entries per person |
| The screen has to say | nothing | "changes apply within the hour" |

**Recommended: the live lookup.** The reason is the second row. Today
`current_user_role()` reads `user_roles` on every request, so the moment an
Admin archives someone, that person is out. A token hook would quietly trade
that for speed the app has not been shown to need: the tables are tiny (nine
roles by 55 activities is fewer than 500 rows) and the lookup is on a primary key.

How it stays fast under RLS, concretely:

- The function is `stable` and every policy calls it as
  `(select has_permission(…))`. Postgres then plans it once per statement as an
  init-plan, not once per row. This is finding D of §3 applied from the start.
- `role_permissions (role_id, activity)` is unique, so the lookup is one index
  probe.
- It is **measured, not assumed**: `explain (analyze, buffers)` on the residents
  list and on the medication round, as a volunteer and as staff, before and
  after the first converted table. The numbers go in that PR's test plan.

If a measurement ever shows a problem, the hook can be added later as a cache in
front of the same function. Starting with it buys a caveat for nothing.

## 11. Proving that the defaults reproduce today

Task B(a) asks for a check, not an assertion. Building it needs the catalogue
file and the tables, which are the next stream's, so it is specified here.

**`scripts/check-permission-parity.mjs`**, against the dev database, nothing
committed, in the style of `check-role-write-policies.mjs`.

**What it compares.** For every activity in the catalogue, every level, and each
of the six legacy roles plus "no role": what the *default cell* says should
happen, against what the system *actually does*, at three layers.

1. **The database.** Each activity in the catalogue file carries one or more
   *probes*: a concrete statement that exercises it at a level, for example
   `{ level: "edit", sql: "insert into weight (resident_id, kg, date) values (…)" }`
   and `{ level: "read", sql: "select 1 from weight where resident_id = …" }`.
   The script builds one made-up resident and one login per role inside a single
   transaction, runs every probe under each role's own JWT with the existing
   `pg_temp.try()` harness, and rolls back. Expected: an Edit or Yes cell is
   allowed; a Read cell reads rows and is refused the write; a None cell reads
   nothing and is refused. For scoped roles the probe runs twice, inside the
   scope and outside it.
2. **The app's predicates.** A table pairs each activity with the predicate that
   guards it today (`{ activity: "stock.count", legacy: canStocktake }`) and
   asserts `legacy(role) === can(defaults[role], activity)` for every role,
   `null` and `public_viewer` included. Before the predicates are deleted their
   truth table is written to `scripts/fixtures/legacy-predicates.json`, and the
   check compares against that file afterwards, so it keeps working once they
   are gone.
3. **The routes.** For every route in the registry and every role: the registry's
   answer (open or refused) against the page's guard today, using the pure guard
   functions and the walkthrough's "must not" lines already in
   `acceptance-matrix-entries.mjs`. No browser.

**Known tightenings.** A list in the script, one entry per row of §3 C:
`{ id: "C3", table: "immunization_types", role: "vet", command: "INSERT", today: "allowed", default: "refused" }`.
The check **fails on any difference that is not in the list**, and it **fails on
any entry in the list that no longer differs**, so the list can neither hide a
regression nor rot. That second rule is the one from
`docs/decisions/2026-10-02-check-scripts-assert-live-not-replay.md`.

**When it runs.** Before each conversion PR against the old policies: green
means the catalogue describes today. After it against the new ones: green means
the conversion changed nothing but the listed tightenings. In CI once the tables
exist.

**A second, smaller check:** `scripts/check-permission-catalogue.mjs` asserts
that the activities in the code file and in `permission_activities` are the same
set, and that every activity key written in a policy, a function or a `can()`
call exists in the catalogue. A mistyped key in a policy would otherwise deny
silently.

## 12. Getting from the enum to the matrix

The hard constraint is the one in `CLAUDE.md`: one schema PR in flight at a
time, each additive and re-runnable. 243 policies cannot be converted in one
file that anyone could review. So the conversion is staged, and a bridge keeps
every stage shippable.

**The bridge: `roles.legacy_role`.** Every existing policy asks
`current_user_role()`. During the migration that function returns the role's
*legacy* enum value. The six built-in roles map to themselves. A configured role
names the legacy role whose database rights it borrows until its areas are
converted: the 2IC borrows `management`, Maintenance and Medical borrow `staff`.
So an unconverted table treats the Head of Maintenance as staff, and the 2IC as
management, which is no more than those people can do today, while the app,
already on `can()`, shows each of them their own menu, home screen and pages. Each area that is converted stops asking `current_user_role()` and the
borrowed rights fall away there.

| Stage | What | Behaviour change |
|---|---|---|
| 0 | This paper and the Director's table agreed; decision files written | none |
| 1 | **Schema, `0132`:** the three tables, `user_roles.role_id` filled from the enum and kept in step by a trigger, the six roles seeded with today's cells, `has_permission()`, `my_permissions()`. Read by nothing | none |
| 2 | **App:** the catalogue file, `can()`, `requirePermission()`, the route registry; predicates replaced area by area; the manual's `roles` tags and the acceptance matrix read activities. Parity layers 2 and 3 green | none |
| 3 | **The three roles exist:** the 2IC as a row with `legacy_role = 'management'`, Maintenance and Medical with `'staff'`; Security lists roles from the table; the home screens, and Admin's switch between them | the 2IC and the two Heads get their own menu and home; the Director gets her daytime screen. Database rights still the borrowed role's |
| 4 | **Database, area by area**, one schema PR each, parity check before and after: photos and moves · stock · maintenance and projects · medical · residents and housing · contacts, clinics, friends · management lists and reports · settings and setup lists · the 15 functions and 10 views that test a role, each with its area | each area: the listed tightenings, then Lanna's cells for it (the volunteer narrowed, the 2IC and the Heads narrowed from the role they borrowed) |
| 5 | **Remove the bridge:** nothing calls `current_user_role()`; drop `legacy_role`, `user_roles.role` and the `app_role` type | none |
| 6 | **Settings → Roles and permissions:** the matrix, editable by Admin with 2-step, audited, exportable | Admin can change a cell |
| 7 | **Roles a shelter adds:** create, rename, archive, set scopes and home | a shelter can add a role |

**What the bridge does not do, said plainly.** Between stage 3 and the end of
stage 4, a configured role's *database* boundary in an unconverted area is its
legacy role's. The Head of Maintenance's screens will not offer a prescription
form, and the database would still accept one from that login until the medical
area is converted. That is no worse than today, when that person is staff, and
it is why the areas where the Director wants a real boundary are converted
first. It is also why stage 7 comes after stage 5: a role a shelter invents must
not need a legacy role.

**The order inside stage 4** puts the volunteer's areas first (photos and moves,
then stock), because that is the one change in the Director's list that removes
a right, and only the database makes it real.

**New tables skip the bridge.** Anything created after stage 1, the medication
round first, is written against `has_permission()` from its first migration and
never names a role.

## 13. Phones: what "no PCs on site" changes

The fact is recorded in
`docs/decisions/2026-10-03-no-pcs-on-site-supersedes-admin-on-mobile.md`. The
rule that follows from it replaces a list of verdicts with a test:

> **A page may be desktop-only only if Admin is the only role that can open
> it.** Any page a phone role can open is built for a phone first, and nothing
> stands in front of it saying "Best on a larger screen".

The Director is the reason the test is about the *role* and not the *person*:
she is on a phone all day doing Management's work, so Management's pages are
phone pages even though the person opening them also has a desk.

With the route registry of §8 that test can be run by a script: a page is allowed
the notice only when Admin is the only role holding any activity on it. Until
the registry exists it is applied by hand, below. "Pending" means the answer
depends on a question in §17.

| Page | 2026-09-24 verdict | Who needs it now | Verdict now |
|---|---|---|---|
| Settings tiles, Security, Website, procedure and blood-test types | nice-to-have | Admin: the Director at night | unchanged |
| Zones, Enclosures, Immunization types, Frequencies | desktop only | Admin (the whiteboard: Enclosures and Zones under Admin / Settings) | **stands** |
| Management → Medications, Diets | desktop only | Admin for prices and setup (the whiteboard puts both under Admin / Settings) | **stands for setup.** The stock figure, Count and the label photo are the 2IC's, and move to the phone stocktake |
| Stocktake, the desktop sheet | n/a (later) | Admin at most | the card-by-card phone stocktake becomes the main one (the medication-label item, part 2) |
| Purchasing | n/a (later; the acceptance matrix says desktop) | **2IC** (stated, and on the whiteboard) | **phone-first**, rebuilt as steps: what is low, how much, from whom |
| Record a delivery | phone | **2IC** (stated) | phone-first, as steps |
| Recurring jobs: set up, hand over | n/a (later; desktop) | **Management**: the Director by day (the whiteboard) | **phone-first** |
| Booking a vet visit, intake, a resident's details and medical records | field-needed | **Management**: the Director by day (the whiteboard) | unchanged, and now also the Director's daily screens |
| Stock between counts | n/a (later; desktop) | pending D2 | desktop if it is Admin's alone |
| Management → Contacts, Vets | desktop only | pending D2 | phone-first **if** the Director wants them by day |
| Shelter Friends, Translations, Dashboard, Cashflow | desktop / nice-to-have | pending D2 | follows the answer |
| Maintenance board | both; moving a card between columns is a desktop drag | **Head of Maintenance**, and the 2IC on the whiteboard | **phone-first**: move a job on with a tap, and log, assign and complete in steps |
| My tasks | phone | every shelter role | unchanged |
| Residents list, hub, edit, move, hospital, foster and adopt | field-needed | every role that holds them | unchanged |
| Residents bulk selection | desktop only | Director | stands |
| Enclosures list | field-needed, known to scroll sideways at 375 px | everyone, and it is the volunteer's "map" until the map is built | field-needed, more so |
| Medication round | does not exist | **Head of Medical** | phone-first from its first screen (§14) |
| A vet's pages | not covered | the clinic's own phone or PC; the fact is about the shelter | both |

**What else it reaches.**

- **The 2IC's screens** are held to the Director's description, not just to
  a width: one task per screen, steps like intake and the Shelter Friend wizard,
  big buttons with an icon and a word, Thai first, no table edited in place, a
  confirmation that says in words what will happen, nothing lost on Back. And
  they are tested by watching the 2IC, or someone like her, use them.
- **The acceptance matrix's device column.** Each entry's `device` came from the
  2026-09-24 decision. It should come from the rule above: phone, unless only
  the Director does it. The role walkthrough's passes run at 375 px for every
  role but the Director.
- **The Mobile responsiveness sweep is now on the critical path for every role
  but Admin**, the Director's own daytime work included. It is parked and Lutan schedules it (2026-10-02). This paper does
  not reopen it; it is reported to him as new information (L11).

## 14. The medication round: scope

Not built here. This is what the Head of Medical's role needs before it means
anything.

**What exists.** `prescriptions` holds the plan: resident, medication,
`dose_quantity`, `frequency_id`, `start_date`, `end_date`, the visit it came
from. `frequency` holds `doses_per_day`, `interval_count`, `interval_unit`.
`medication` holds the unit, the stock and, since `0129`, a label photo. Nothing
holds an administration.

**What is needed.**

1. **Today's round.** Every dose due today, worked out from the active
   prescriptions and their frequencies, grouped by zone, then enclosure, then
   resident, in walking order. Each dose shows the resident's photo and name,
   the medication with its label photo, and the amount.
2. **One tap for Given.** Skipped and Refused need a reason, from a short list
   with room for a note. "Given to all in this enclosure" for the common case,
   with a confirmation that names them.
3. **Who and when, recorded automatically.** The person signed in, and the time.
4. **Undo**, while still on the round. After that, a correction goes through the
   same Remove / Restore as other medical records (`0124`).
5. **History on the resident**: for each prescription, what was given, skipped
   and refused, and by whom. A card on the hub when a dose was missed.
6. **A tile on the home screen**: "Medication round: 14 due, 3 given".

**The model proposed.** Store what happened; work out what is due. One new
table, `medication_doses`: the prescription, the resident, the day, which dose of
that day, the outcome (`given`, `skipped`, `refused`), the reason, who, when, and
the archive columns the other medical tables have. Unique on prescription, day
and dose number, so a double tap is one record. A function,
`medication_round(p_date)`, returns the doses due on a day with what has been
recorded against each. This is how recurring jobs already work (dates are worked
out, outcomes are stored), so a changed prescription changes tomorrow's round
without any rows to repair.

**The permission.** `medical.doses`, Edit / Read / None: Edit records a dose,
Read sees the history. Written against `has_permission()` from its first
migration (§12).

**What has to be asked before it is designed**, because the answers change the
table (D4, D6):

- **Does the shelter give medication at fixed times** (morning, evening), or
  "three times a day" whenever? `frequency` has a count per day and no clock
  times. Fixed rounds would add shelter-wide round times and make the screen
  "the morning round".
- **Residents not on site.** In hospital, fostered or adopted: left off the
  round, or listed apart?
- **Recording late.** Can yesterday's round be filled in today, and by whom?
  Never a future dose, by the shelter's own date (the rule the other medical
  records follow).
- **"As needed" medication**, with no schedule: given and recorded outside a
  round?
- **Does a vet see it?** Whether a prescription was actually given is clinically
  useful to the clinic that wrote it.
- **No signal in the kennels.** The app warns when offline and does not save.
  "Nothing that loses work" may need more than a warning on this one screen. Not
  designed here; flagged so it is not discovered on the first round.
- **Stock.** "Used" on Stock between counts is planned use today. Real doses
  could replace the plan later. Left out of the first version.

**Pieces.** The schema (one table, one function, policies, the audit trigger) ·
the round screen · history, hub card and home tile · manual, both dictionaries,
acceptance entries and a release line with the piece that ships the screen.

## 15. Pieces for planning

Named so that `/plan-day` can schedule them. *Schema* pieces are serial: only
one may be in flight. Everything else can run beside them.

| Piece | Kind | Needs | What it delivers |
|---|---|---|---|
| `permissions-schema` | schema, `0132` | L1 = yes | Stage 1: the tables, the seed, `has_permission()`, `my_permissions()`. Read by nothing |
| `permission-parity-check` | scripts | `permissions-schema` | §11: the probes, the known tightenings, green against today's policies |
| `permissions-catalogue` | app | `permissions-schema` | Stage 2, first half: the catalogue file, `can()`, `requirePermission()`, the route registry, and one area (stock) moved off its predicates as the pattern |
| `permissions-sweep-residents`, `-medical`, `-rest` | app, three streams | `permissions-catalogue` | Stage 2, second half: every remaining predicate, role list and inline test |
| `acceptance-matrix-from-catalogue` | scripts + manual | `permissions-catalogue` | Manual topics and matrix entries name an activity; cells and the device column are worked out |
| `roles-2ic-maintenance-medical` | schema (rows) + app | stage 2 done, the Director's table agreed | Stage 3: the three roles, Security lists roles from the table |
| `medication-round-schema` | schema | `permissions-schema`, D4 and D6 | `medication_doses`, `medication_round()` |
| `medication-round` | app | its schema | The round screen, phone-first |
| `medication-round-history` | app | `medication-round` | History, hub card, home tile |
| `perm-convert-photos-moves`, `-stock`, `-maintenance-projects`, `-medical`, `-residents`, `-people`, `-management`, `-settings` | schema, eight in turn | the parity check, stage 2 done | Stage 4: one area's policies, functions and views on `has_permission()`; its tightenings; Lanna's cells for that area |
| `volunteer-read-only` | app | L3, the first two conversions | The volunteer's screens, manual and release line. The rights themselves go in the conversions |
| `perm-drop-enum` | schema | all eight conversions | Stage 5 |
| `settings-permission-matrix` | app | stage 5 | Stage 6 |
| `custom-roles` | schema + app | stage 6 | Stage 7 |
| `home-screens` | app | `permissions-catalogue` | §8: a home of task tiles for each role, from the registry, starting from the whiteboard; Admin's switch between them; the landing that follows the device |
| `2ic-purchasing-phone`, `2ic-delivery-steps`, `maintenance-phone-board`, `recurring-jobs-phone` | app, four streams | nothing here | §13's phone-first rebuilds. The card-by-card stocktake is already a backlog item |

**What can start the day Lutan says yes**, three abreast: `permissions-schema`
in the schema lane, and two of the phone rebuilds, which depend on nothing in
this paper. **The batch after:** the parity check (scripts), the catalogue
(app), and the medication round's schema once D4 and D6 are answered.

**What does not wait for the fork at all:** the phone rebuilds; the medication
round, if it is acceptable for it to be open to staff and above until the
Medical role exists; and the two faults this audit found, as ordinary backlog
items (Management and the microchip; a volunteer reading prices and a vet reading
the other clinics).

## 16. The fork, Senior Staff, and Staff

### Are the 2IC, Maintenance and Medical enum values or configured roles?

The backlog item asked this of two roles. Lutan's answer on the 2IC makes it
three.

**Recommended: configured roles. No new enum values.**

What each costs, counted against today's code (§3):

| | Three enum values | Configured roles |
|---|---|---|
| Schema | add the three values (their own file: a new enum value cannot be used in the transaction that adds it), then a policy for each role on nearly every one of 47 tables, in the one-policy-per-role style. The five existing roles have 40 to 64 policies each, so on the order of 150 to 190 new ones; 15 functions and 10 views reviewed for their lists | the three tables and the seed; later, eight conversions that have to happen for the matrix anyway |
| App | every one of 14 predicates, 16 role lists and about 20 inline tests reviewed so that no new role can do less than the role it grew out of by omission; 55 manual tags; the release-note tags | `can()` replaces all of them once |
| When the Director's three roles exist | about one batch | about two batches for their own name, menu and home (stage 3). Their own database boundary arrives area by area (stage 4) |
| What is thrown away | all of it, when the matrix lands | nothing |
| Risk | a missed list leaves the 2IC or a Head unable to do something they can do today | the bridge: for a while their database rights are the borrowed role's |

The case for the enum is speed: the three roles would be real, database and all,
about a batch sooner. The case against is that the same sweep is then done a
second time to remove it, and the Architecture item says so in terms: a new enum
value "later has to be migrated out". A third role makes the case against
stronger, not weaker.

What makes the slower route acceptable is that **nothing the three need is
blocked by it.** Whatever logins they hold today, management can already do
everything in the Director's description of the 2IC (the stocktake, Purchasing,
deliveries, maintenance), and staff everything in her description of the Head of
Maintenance. The Head of Medical's one missing thing is a feature, the
medication round, not a role. What the new roles add is a *narrower* fit and
their own home screen, and the Director's list asks for narrowing in one place
only: volunteers.

**If the Director wants a Head kept out of something now**, for instance the
Head of Maintenance out of medical records this month, then the enum is the
faster way to that boundary and this recommendation should be revisited. That is
question L4.

**And if shelter-defined roles are not going to be built at all**, the enum plus
pages named for roles is simply cheaper, and both recommendations flip (L1).

### Senior Staff

**Recommended: close the item as answered, with one line carried forward.**

The item asks for "staff with elevated control over some parts of the system"
and its real question is whether that is *staff plus a list* or *a rung between
staff and management*. The matrix answers it: every role is a list, and there
are no rungs. Its candidate powers are all cells in §4 already:

| Senior Staff candidate | Activity |
|---|---|
| Withdraw a death recorded in error | `placement.death_withdraw` |
| Hand over or reassign a recurring job | `recurring.manage` |
| Approve stocktake and delivery corrections | `stock.correct` |
| Edit the reference lists | `reference.types`, `stock.medications`, `stock.diets` |
| Publish residents and projects to the website | `projects.publish`; for residents, finding A5 |
| Create or delete maintenance jobs for others | `maintenance.jobs` |
| Approve access requests | fixed: Admin with 2-step (§6) |

The 2IC, Maintenance and Medical are the Director's actual "staff with more
control over some elements". If, after her answers, there is still a person who fits none of
the roles, Senior Staff becomes the first role Lanna adds at stage 7, not an
enum value. The line to carry forward is the item's own warning, which the
bridge has to honour: a new role must never be able to do less than staff by
omission.

### Staff

**Recommended: keep Staff in the template, and let the Director say whether
anyone at Lanna holds it.**

The template has to reproduce today, six dev accounts hold `staff`, and another
shelter will have kennel hands. Removing it from the product would be a change
nobody asked for. At Lanna it is question D1: if every employee is the 2IC or
one of the Heads, the role is simply unused there and each of today's staff logins is moved
to the role the Director names. Until stage 3, "moved" means nothing has to
happen at all.

## 17. What has to be answered

Nothing here is decided. Each question has the answer this paper recommends.

### For Lutan

| # | Question | Recommended |
|---|---|---|
| L1 | Will roles that each shelter defines (the matrix) be built? Everything in §8, §12 and §16 assumes yes | Yes. It is why the Architecture item exists |
| — | *Answered 2026-10-03:* the 2IC and Management are separate roles; the Director does Management by day on her phone and Admin at night | recorded in §2 and §8 |
| L2 | "Admin and management will probably be the same person." One login for the Director, as Admin, with the home screen following the device and a switch between the two (§8)? Or two logins, or several roles per person? | One login. Admin already includes Management |
| L3 | Volunteers become read-only. Confirm that **each** of these goes: adding, refiling and removing resident photos and choosing the profile photo; moving a resident between enclosures; the stocktake; maintenance and project photos; marking their own recurring jobs; asking the assistant; reading contacts' names and phones, the maintenance board, projects, the vet list. And: how many volunteer logins exist in production? | Remove all of it, as the Director said, in the database as well as the screens. Until the map is built, their "map" is the enclosures list |
| L4 | The 2IC, Maintenance and Medical: configured roles (the three keep the logins they have until stage 3), or three enum values now? And what is the 2IC's role called on screen? | Configured roles, unless the Director wants one of them kept out of something this month. "2IC" until told otherwise |
| L5 | Senior Staff: close as answered by the matrix? Staff: keep in the template? | Yes to both (§16) |
| L6 | The manual says Management can record a microchip; the system refuses it. Which is right? | Give it to Management. They can edit everything else about a resident |
| L7 | The whiteboard leaves much on no screen (§8). Is each of those the Director's at a desk, or not placed yet? | Go through them with the Director's table in hand |
| L8 | Default cells are what the screens offer today, and the twelve places where the database allows more (§3 C) are closed as the tables are converted. Agreed? | Yes |
| L9 | The live lookup over the token hook (§10). Agreed? | Yes |
| L10 | `0132` is the permission tables, and the medication round's schema follows it. Agreed? | Yes |
| L11 | The Mobile responsiveness sweep is now on the critical path for every role but Admin. It is yours to schedule | Schedule it before the first role walkthrough at 375 px |
| L12 | Does the Director's table need a Thai edition before she sees it? | Lutan's call |

### For the Director

These are on her table in plain words. Listed here so the two files agree.

| # | Question |
|---|---|
| D1 | Is there anyone at the shelter who is not one of the six: other employees, kennel hands? If not, who moves an animal, sends one to hospital, records a foster, an adoption or a death: only you, or the 2IC and the two Heads as well? |
| D2 | By day on your phone you have recurring tasks, vet appointments, intake, and residents' details and medical records. Which of these do you also want on the phone, and which only at your desk: contacts, the clinic list, Shelter Friends, the dashboard, cashflow, stock used against planned, translations, projects? And does the 2IC do anything besides the stocktake, ordering, deliveries and maintenance tasks? |
| D3 | Does the Head of Maintenance change anything about the animals (move one, add a photo), or only look? |
| D4 | The Head of Medical gives the medication. Do they also write or change a prescription, book a vet visit, record weight, vaccinations and diet, count the medicine stock, add a medicine that is missing from the list? And is medication given at fixed times of day? |
| D5 | When a volunteer opens an animal's page, do they see its medical records, or only who it is and where it lives? |
| D6 | Should a vet be able to see whether the medicine they prescribed was actually given? |
| D7 | Who books a vet visit: only you, or the 2IC and the Head of Medical as well? And does the 2IC only work through maintenance tasks, or also create and assign them? |
| D8 | Who may put an animal's photo on the public website? Today anyone who adds a photo does, unless they file it as Medical |

## 18. What is not known yet

- **Production.** Every count and every policy here was read from the dev
  database. Production's accounts by role, and whether its policies match dev's,
  were not read. The conversion PRs run the parity check against dev and the
  production dry-run against production, as usual.
- **Speed.** `has_permission()` under RLS is unmeasured. §10 says how it will be
  measured and where the numbers go.
- **The views.** 10 of the 31 views test a role in their own body. They were
  counted, and the two contact views were read; the other eight were not read
  line by line. Each is converted with its area in stage 4.
- **How the round is really done.** §14's questions need the Head of Medical,
  and preferably someone watching a round.
- **Signal in the kennels**, and what the round does without it.
- **Thai names** for the roles and the 55 activities. They go in the
  dictionaries with everything else, and nobody has written them.
- **Whether a clinic's doctors use a phone or a PC.**
- **`resident_list_view`'s write grants** (finding C12): whether they can do
  anything.

---

## Appendix A. Manual topic → activity

For the stream that makes the acceptance matrix read the catalogue. *fixed*
means §6: not a cell.

| Manual topic | Activity (level) |
|---|---|
| sign-in, confirm-and-offline, language, print-manual, navigation, release-notes, roles, getting-help | fixed: everyone with a login |
| public-pages | fixed: the public |
| security, two-step, my-access-requests | fixed: Admin |
| assistant | `assistant.ask`, `assistant.record` |
| appointments-vet | `medical.visits` (read) with the "own clinic" scope |
| my-tasks-page | `maintenance.jobs` (read), `maintenance.progress` |
| my-recurring-jobs | `recurring.do_own` |
| residents-list, hub, placement-history | `resident.record` (read) |
| edit | `resident.record` (edit) |
| microchip | `resident.record` (read) to find by chip; `resident.microchip` to record |
| intake | `resident.register` |
| adoption-updates | `resident.adoption_news` |
| move | `placement.move` |
| hospital | `placement.hospital` |
| foster-adopt | `placement.rehome`, `contacts.add` |
| deceased | `placement.death` |
| undo-deceased | `placement.death_withdraw` |
| immunizations | `medical.immunizations` |
| vet-visits | `visit.book`, `medical.visits` |
| prescriptions | `medical.prescriptions`, `reference.add_while_recording` |
| diet | `medical.diet` |
| weight | `medical.weight` |
| procedures | `medical.procedures`, `reference.add_while_recording` |
| blood-tests | `medical.blood_tests` |
| archive-records | `medical.archive` |
| resident-photos | `photos.resident_add`, `photos.resident_manage` |
| browse-enclosures, enclosure-hub | `facility.enclosures` (read) |
| zones-enclosures | `facility.enclosures` (edit) |
| log-maintenance | `maintenance.jobs` (edit), `maintenance.photos` |
| maintenance-board | `maintenance.jobs`, `maintenance.progress` |
| browse-projects | `projects.folders` (read), `projects.photos` |
| manage-projects | `projects.folders` (edit), `projects.publish` |
| vets | `clinics.list` (read) |
| manage-vets | `clinics.list` (edit) |
| vet-doctors | `clinics.doctors` |
| contacts | `contacts.directory` (read) |
| manage-contacts | `contacts.directory` (edit), `contacts.add` |
| shelter-friends | `friends.manage` |
| dashboard | `reports.dashboard` |
| cashflow | `reports.cashflow` |
| manage-medications | `stock.medications`, `stock.correct` |
| manage-diets | `stock.diets`, `stock.correct` |
| stocktake | `stock.count` |
| stock-usage | `stock.usage` |
| purchasing | `stock.purchasing` |
| deliveries | `stock.delivery` |
| recurring-jobs | `recurring.manage` |
| translations | `translations.manage` |
| recent-changes | `audit.view`, `audit.undo` |
| website | `website.content` |
| immunization-types, procedure-types, blood-test-types, frequencies | `reference.types` |
| system-status | `system.status` |

Activities with no manual topic of their own yet: `medical.doses` (not built),
`facility.map` (a prototype), `recurring.do_any`, `maintenance.photos`.

## Appendix B. How the audit was done, and how to repeat it

All read-only, against the dev project (`qxkmhwybjggxvsfxsxbd`), through the
Management API the check scripts use, on 2026-10-03 at `47691ac4`.

1. **Policies:** `select tablename, policyname, permissive, cmd, qual, with_check
   from pg_policies where schemaname = 'public'`. A role is counted as named by a
   policy when its expression contains `'<role>'::app_role`, the reading
   `check-role-write-policies.mjs` uses. `FOR ALL` counts for all four commands.
2. **Functions and views:** `pg_proc.prosrc` and `pg_views.definition` searched
   for `current_user_role`, `app_role` and `has_app_access`; each function's role
   list read.
3. **Page guards:** every `page`, `layout`, `route` and `actions` file under
   `src/app` searched for the predicates, `requireRole(…)`, the `*_ROLES` lists
   and inline role tests.
4. **Writes:** every `.from("<table>")` followed by `.insert`, `.update`,
   `.delete` or `.upsert`, and every `.rpc("<name>")`, under `src/`.
5. **Compared** with the 93 entries and the walkthrough's "must not" lines in
   `scripts/lib/acceptance-matrix-entries.mjs`, and with the manual's `roles`
   tags.

The scripts were scratch files and are not committed: the parity check of §11 is
the durable form of the same reading, and a one-off dump kept in `scripts/` would
be a second list to keep true.

## Appendix C. What the database grants today, by table

Generated from step 1 above, not typed. `A` admin, `M` management, `S` staff,
`V` vet, `Vo` volunteer. A letter means a permissive policy names that role for
that command; it does not show a policy's row limits (a vet's are nearly all
limited to their clinic's residents). `(other)` is a policy that names no role
in its own text: on `vet_doctors` it is the vet's, tested through
`vet_may_edit_doctor()`; on the three site tables it is the public's read.

| Table | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `adoption_updates` | A M S V Vo | A M S | A M S | A M S |
| `assistant_actions` | A M S Vo | A M S Vo | A | A |
| `attachments` | A M S V Vo | A M S V Vo | A M S V Vo | A M S V Vo |
| `audit_log` | A | – | – | – |
| `blood_test_types` | A M S V Vo | A | A | A |
| `blood_tests` | A M S V Vo | A M S V | A M S V | A V |
| `bulk_appointments` | A M S V | A M S V | A M S V | A M S V |
| `contacts` | A M S | A M S | A M S | A M S |
| `diet_types` | A M S V Vo | A M | A M | A M |
| `enclosures` | A M S V Vo | A M S | A M S | A M S |
| `fixed_outgoings` | A M | A M | A M | A M |
| `frequency` | A M S V Vo | A M S V | A M | A M |
| `group_origins` | A M S Vo | A M S | A M S | A M S |
| `immunization_records` | A M S V Vo | A M S V | A M S V | A V |
| `immunization_types` | A M S V Vo | A V | A V | A V |
| `item_unit_conversions` | A M S Vo | A M | A M | A M |
| `maintenance` | A M S Vo | A M S | A M S | A M S |
| `maintenance_assignees` | A M S Vo | A M S | A M S | A M S |
| `maintenance_photos` | A M S Vo | A M S Vo | A M S Vo | A M S Vo |
| `medication` | A M S V Vo | A M S V | A M | A M |
| `placement_history` | A M S V Vo | A M S Vo | A M S | A |
| `prescriptions` | A M S V Vo | A M S V | A M S V | A V |
| `procedure_types` | A M S V Vo | A M S V | A | A |
| `procedures` | A M S V Vo | A M S V | A M S V | A V |
| `project_folders` | A M S Vo | A M S | A M S | A M S |
| `project_photos` | A M S Vo | A M S Vo | A M S Vo | A M S Vo |
| `recurring_job_assignees` | A M S V Vo | A M | A M | A M |
| `recurring_job_occurrence_assignees` | A M S V Vo | – | – | – |
| `recurring_job_occurrences` | A M S V Vo | – | – | – |
| `recurring_jobs` | A M S V Vo | A M | A M | A M |
| `resident_diets` | A M S V Vo | A M S V | A M S V | A |
| `residents` | A M S V Vo | A M S | A M S | A M S |
| `shelter_friends` | A M S V Vo | A M | A M | A M |
| `site_content` | (other) | – | A | – |
| `site_content_photos` | A (other) | A | A | A |
| `site_pages` | (other) | – | A | – |
| `stock_counts` | A M S Vo | – | – | – |
| `stock_receipts` | A M S Vo | A M S | A M S | A M S |
| `translatable_fields` | A (other) | A | A | A |
| `translations` | A M S V Vo | A M | A M | A M |
| `user_roles` | A | A | A | A |
| `vet_appointments` | A M S V Vo | A M S V | A M S V | A V |
| `vet_doctor_clinics` | A M S V Vo | A M S V | A M S V | A M S V |
| `vet_doctors` | A M S V Vo | A M S V | A M S (other) | A M S (other) |
| `vets` | A M S V Vo | A M | A M | A M |
| `weight` | A M S V Vo | A M S V | A M S V | A M S V |
| `zones` | A M S V Vo | A M S | A M S | A M S |

240 permissive policies on 47 tables. The three restrictive policies, all on `user_roles`, require a 2-step session for insert, update and delete.
