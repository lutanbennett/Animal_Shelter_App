# Roles and permissions: the shelter's own roles, and a matrix each shelter can set — a paper

**Status, 2026-10-03: who does what at Lanna is answered by Lutan, and the fork
is DECIDED: configured roles. The details of how it is built are still
PROPOSED.** Nothing is built. Three decision files record what is settled, and
only that:

- `docs/decisions/2026-10-03-no-pcs-on-site-supersedes-admin-on-mobile.md`: a
  fact, which overturns part of the 2026-09-24 "Admin on mobile" decision.
- `docs/decisions/2026-10-03-lanna-roles-lutans-answers.md`: Lutan's answers on
  the roles, in his words.
- `docs/decisions/2026-10-03-configured-roles-not-enum-values.md`: the fork.

The rest of the design (the "today" rule for default cells, the live lookup, one
login for the Director, the order of the roles) has no decision file, because
the questions about it in §17 are still open.

It answers two backlog items as one piece of work, because both ask for the same
table first: *The roles the shelter actually has, from the Director* (Auth) and
*Roles and permissions each shelter configures* (Architecture). The Director's
one-page table is its own file, written for her:
[`roles-director-table.md`](roles-director-table.md).

**What Lutan settled on 2026-10-03, in three messages while it was being
written.** The paper is written around all three.

1. *The 2IC and Management are separate:* "the director will do management on
   her mobile during the day, the 2ic will do her duties on the mobile during the
   day and admin is done at night. One thing to think about is that admin and
   management will probably be the same person."
2. *Answers to the questions on the Director's table* (§17 has them in full):
   medication given is **not** recorded, the Head of Medical only needs to see
   who gets what and how much; only Management and Admin move, hospitalise,
   foster, adopt out or record a death; the 2IC does her three tasks and nothing
   else; the Head of Maintenance views residents and updates only maintenance and
   recurring tasks; volunteers see "just who and where", read-only; vets are on
   hold; Management and Admin book vet visits; only Management and Admin put
   photos on the website.
3. *How to build it:* "I suggest that when we implement we take it role by
   role." §12 and §15 are organised that way.
4. *The fork:* "Decision: Lets do Configured roles." §16.

He uses "Manager / Director" for the two roles the Director holds; this paper
says Management and Admin, which are the names in the system.

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
3. **The fork is decided: the 2IC, Maintenance and Medical are configured
   roles, not three new enum values** (Lutan, 2026-10-03; §16). Each enum value
   would have cost a two-file migration plus a policy on nearly every one of 47
   tables, all of it thrown away when the matrix lands. §12 shows how to get there
   **role by role**, as Lutan asked: the volunteer is narrowed first, each new
   role then starts from that narrowest set of rights and is granted only what
   its own job needs, and the roles that exist today are converted last.
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
6. **Three things change earlier work** (§2): there are no PCs on site; the
   Head of Medical needs a screen that does not exist, which Lutan has ruled is
   a read-only list of who gets what and not a record of doses given (§14); and
   volunteers shrink to "who and where", which removes rights that role holds
   today.
7. **`0132` is proposed as the permission tables**: additive, read by nothing,
   seeded so that the defaults are today's behaviour (§12, §15). Nothing else in
   this paper needs a new table: the medication list reads the prescriptions
   that are already there.

## 2. What the Director said, and what it changes

Lutan, 2026-10-03, after talking to the Director, and then his whiteboard and his
answer of the same day (§8). The shelter has six kinds of people, and the
Director's own work falls into two roles:

| # | Who | Role | What they do | On |
|---|---|---|---|---|
| 1 | Director, at night | **Admin** | Settings and setup: the website content, the projects pages, enclosures and zones, the medication and diet lists, people and security | her PC at home |
| 2 | Director, by day | **Management** | Recurring tasks, vet appointments, intake, residents' details and medical records | her phone |
| 3 | 2IC | **2IC** (new) | Stocktakes, ordering medicine and food (Purchasing, deliveries), maintenance tasks. **Not comfortable with computers** | her phone |
| 4 | Head of Maintenance | **Maintenance** (new) | Creates, assigns, progresses and completes maintenance jobs, and marks recurring tasks. Looks at residents; changes nothing about them | a phone |
| 5 | Head of Medical | **Medical** (new) | Gives medication to the residents. Needs to see who gets what and how much. Records nothing | a phone |
| 6 | Volunteers | **Volunteer**, read-only | See who each resident is and where they live, and the map. Nothing else, medical records included | a phone |
| 7 | Vets | `vet`, **on hold** | Unchanged for now. The rename to Doctor and what a doctor login sees are in the parked clinics item | the clinic's own |

The backlog item mapped the 2IC to Management. Lutan's answer separates them:
the 2IC is her own role, and Management is what the Director does by day. So
Lanna needs **three** roles the system does not have, not two.

**Everything that changes a resident is Management's and Admin's alone**
(Lutan's answer 1): registering one, moving one, hospital, foster, adoption, a
death, booking a vet visit, the medical record, photos. The 2IC and the two
Heads each have a narrow job and no part in that.

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
be given: medication, dose, frequency, dates. No screen gathers today's
prescriptions into something a person can walk round the kennels with. The
backlog item proposed a medication round that also recorded each dose given,
skipped or refused. **Lutan ruled that out:** "We will not record medication
given, the head of medical can purely just view what medicine should be given …
all they need is a reference system to tell them who and how much." So the build
is a read-only list (§14), with no new table, and the system will go on holding
no record of a dose having been given.

**Volunteers lose rights they hold today.** A volunteer account can now add,
refile and remove resident photos and choose the profile photo; move a resident
between enclosures; count the stock; add and remove maintenance and project
photos; mark their own recurring jobs done; ask the assistant questions; and
read every contact's name and phone, the maintenance board, projects, the vet
list and all medical records. Lutan's answer: "Just Who and Where - Read only".
So a volunteer keeps a resident's identity and where it lives, and the
enclosures, and loses everything else in that list, the medical records
included. The dev database has **no** volunteer accounts at all (4 admin, 2
management, 6 staff, 4 vet, read 2026-10-03); how many exist in production
decides how carefully the change has to be staged, and this stream did not read
production.

Two more points follow from the list rather than from any one line of it.

**There is no plain Staff.** Six dev accounts hold `staff` today, and Staff is
the role that registers, moves and treats residents. Lutan's answer gives all of
that to Management and Admin alone, and names nobody else. This paper takes that
to mean Staff is unused at Lanna: the role stays in the product's template (§16)
and each of today's staff logins becomes one of the roles above or is archived.
Which login becomes which is the one part still to be asked (L5).

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
   the list, managing photos apart from adding one, putting a photo on the
   website apart from adding it, and correcting a stock figure apart from
   counting.
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
| `medical.prescriptions` | Prescriptions: what should be given | E/R | E | E | E | E° | R | 11, 12 | Read also opens the medication list (§14), which is a new screen over the same records and not a new activity |
| `medical.immunizations` | Immunizations | E/R | E | E | E | E° | R | 13 | |
| `medical.weight` | Weight | E/R | E | E | E | E° | R | 13 | |
| `medical.diet` | A resident's diet | E/R | E | E | E | E° | R | 13 | |
| `medical.archive` | Remove a medical record entered by mistake, and restore it | Y/N | Y | Y | Y | – | – | 14 | |
| **Photos** | | | | | | | | | |
| `photos.resident_add` | Add a photo to a resident | Y/N | Y | Y | Y | Y° | Y | 15 | A vet's go to the Medical folder only (scope) |
| `photos.resident_manage` | Refile or remove a photo, choose the profile photo | Y/N | Y | Y | Y | – | Y | 15 | *Split*, finding A3 |
| `photos.resident_publish` | Put a resident's photo on the public website | Y/N | Y | Y | Y | – | Y | 15 | *Split*, finding A5. Today it is not a separate act: filing a photo anywhere but Medical publishes it. Lutan's answer 8: at Lanna, Management and Admin only |
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
| How much of a resident | the whole page · who and where | everyone: the whole page | **new.** A fixed-column view (name, photo, species, sex, status, enclosure), as `0126` did for contacts. Lanna's volunteers, 2IC and two Heads get "who and where" |
| Whose clinical records it may change | any · its own clinic's | vet: own clinic's | `vet_owns_visit()`, `current_user_vet_ids()` (`0110`) |
| How much of a contact | everything · name and phone · name and type | volunteer: name and phone; vet: name and type; others: everything | the `volunteer_contacts` and `vet_contacts` views (`0126`) |
| Which photo folders | all · Medical only | vet: Medical only | `PHOTO_CATEGORIES`, `record_attachment()` |
| Other people's login emails | shown · hidden | hidden for vet and volunteer | `private.app_users` (`0126`) |

"Who and where" is Lutan's phrase for what a volunteer sees (answer 5): who the
resident is and where it lives, with no background, no placement history, no
adopter's news and no medical record. It is the one scope here with nothing
behind it yet. It is a scope and not a seventh kind of cell for the same reason
the contact one is: a policy can hide a row but not a column, so "less of each
row" has to be a view.

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

## 7. Lanna's roles

The template every shelter starts from is today's six roles with today's cells
(§4). Lanna's own set is that template changed to match Lutan's answers:

| Role | Kind | Who at Lanna | Home screen | What it may do |
|---|---|---|---|---|
| Admin | fixed | The Director, at night at her desk | Settings | everything |
| Management | default | The Director, by day on her phone. She signs in as Admin, which includes it (§8) | Recurring tasks, vet appointments, intake, residents | as today's Management. It and Admin are the only roles that change a resident, book a vet visit or publish a photo |
| 2IC | **new**, configured | The 2IC | Stocktake, Purchasing, Maintenance tasks | those three, and nothing else |
| Maintenance | **new**, configured | Head of Maintenance | Maintenance tasks | maintenance jobs and their own recurring tasks. Sees who each resident is and where |
| Medical | **new**, configured | Head of Medical | Today's medication list | reads prescriptions and the medication list. Changes nothing |
| Staff | default | nobody, as far as Lutan's answers go (L5) | My tasks | kept in the template for other shelters |
| Volunteer | default, narrowed | Volunteers | Residents | sees who each resident is and where, and the enclosures. Nothing else |
| Vet | default, **on hold** | Clinics' doctors | Appointments | unchanged. The name becomes Doctor when the parked clinics item is taken up |
| Public viewer | fixed | Test logins | the public site | unchanged |

Four of those roles, the 2IC, both Heads and the volunteer, see a resident as
"who and where" (§5).

**Publishing a photo** (Lutan's answer 8: Management and Admin only). At Lanna
the cells alone deliver this: under the roles above nobody else can add a
resident's photo at all, and a vet's go to Medical, which is never public. The
per-photo switch, where a photo is public only once someone holding
`photos.resident_publish` says so, is needed the day a role can add a photo
without being allowed to publish it. That is a column on the photo and a change
to the public view (`0101`), and it is not built until such a role exists.

The cell-by-cell table for those roles **is the Director's table**
([`roles-director-table.md`](roles-director-table.md)): 37 rows, each one or
more activities from §4. After Lutan's answers six cells are still a guess and
marked `?`. It is kept as one file, not repeated here, so that there is one place
to correct when the Director has seen it.

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
   word, in the person's language: Today's medication, Count the stock,
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
the duplication is bounded by the number of roles. That was the open question
when this section was written. Lutan has since decided for configured roles
(§16), so roles a shelter defines are being built, and the page-per-task shape
is the one that fits.

### Lutan's whiteboard, 2026-10-03

While this paper was being written Lutan sent three photos of a whiteboard:
"my brainstorm for the mobile centric views". Transcribed as drawn, a heading
with tiles under it:

| Heading on the board | Tiles under it | Activities (§4) |
|---|---|---|
| **Admin / Settings** | Enclosures · Zones · Medication · Diets | `facility.enclosures` (Edit), `stock.medications`, `stock.diets` |
| **2IC** | Stocktake · Purchasing · Maintenance tasks | `stock.count`, `stock.purchasing`, `maintenance.jobs` / `maintenance.progress` |
| **Management** | Recurring tasks · Vet appts · Intake · Res medical · Res details | `recurring.manage`, `visit.book`, `resident.register`, the `medical.*` records, `resident.record` |
| **Medical** | Residents (scroll) | `resident.record` (Read, who and where), `medical.prescriptions` (Read) |
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

- **Medical has one tile, "Residents (scroll)".** Answered: the Head of Medical
  needs "a reference system to tell them who and how much", and nothing is
  recorded. §14's medication list is that scroll of residents, grouped by where
  they live, with what each one gets.
- **Much is on no screen**: moving a resident, hospital, foster and adoption,
  recording a death, photos, contacts, clinics, projects, Shelter Friends, the
  dashboard, cashflow, stock usage, translations, the website. Answered as to
  *who*: all of it is Management's and Admin's. Still open as to *where*: which
  of it the Director wants on her phone by day and which only at her desk (L7).
- **No Volunteer and no Vet heading.** A volunteer has the residents (who and
  where) and the enclosures; vets are on hold.

### One person, two roles' work

Lutan's answer ends with the thing to think about: *"admin and management will
probably be the same person."* The Director manages by day on her phone and does
admin at night at her desk. Three ways to give one person both:

| | How it works | Cost |
|---|---|---|
| **One login, home follows the device** (recommended) | She is Admin. Admin includes everything Management can do (§6). On a phone she lands on the Management home; on a larger screen, on Settings. A switch at the top opens the other | nothing new in the data model |
| Two logins | One Admin account, one Management account | two passwords for someone doing one job, signing out and in to change hats; her changes split between two names in Recent changes |
| Several roles per person | `user_roles` holds more than one row; rights are the union | "what can this person do" stops being one column of the matrix; scopes need a rule for when two roles disagree |

**Recommended: one login.** It works because of a rule that is already fixed:
Admin has everything. So the Director loses nothing by holding only Admin, and
what she actually needs, a small daytime screen with no Settings clutter, is a
*home screen*, which is what the whiteboard drew.

Its one cost, said plainly: the phone she carries all day is signed in as Admin.
Security still asks for the authenticator before anything about people or roles
can be changed, and the inactivity timeout (2026-10-01) applies. If Lutan judges
that not enough for a phone that leaves the house, two logins is the answer, and
it costs her a sign-out and a sign-in each evening.

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

**Built as `0132_permission_tables.sql` (2026-10-03, PR `claude/permissions-schema`), and corrected below to match it.** The first draft of this section was a sketch; where the migration departs from it, the bullets after the block say so, and `docs/decisions/2026-10-03-permission-tables.md` says why.

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
  created_at        timestamptz not null default now(),
  archived_at       timestamptz,
  check ((kind = 'fixed') = (key in ('admin', 'public_viewer'))),   -- §6: fixed means exactly these two
  check (kind = 'custom' or legacy_role is not null)               -- until the enum goes
);

create table permission_activities (                   -- the catalogue, seeded from the code file
  key      text primary key,
  kind     text not null check (kind in ('level', 'yesno')),
  area     text not null,
  sort     integer not null unique,
  requires jsonb not null default '[]' check (jsonb_typeof(requires) = 'array')   -- [{activity, level}]: data, not enforced
);

create table role_permissions (
  id       uuid primary key default gen_random_uuid(), -- a single-column key, so audit_log (0121) can name the row
  role_id  uuid not null references roles on delete cascade,
  activity text not null references permission_activities,
  level    smallint not null check (level in (1, 2)),  -- 1 read, 2 edit or yes; a Yes/No activity takes 2 only (trigger)
  unique (role_id, activity)
);

alter table user_roles add column role_id uuid references roles;
```

- **No row means None.** A missing cell, an unknown activity, an archived role
  and a person with no role all answer no. So does a level that is not `read`
  or `edit`. Only Admin answers yes without a cell, an activity the catalogue
  does not know included (§6, rule 8).
- **Admin has no rows.** Its column is a rule (§6), not data, and a trigger
  refuses a cell for Admin or for the public viewer. The same trigger holds a
  Yes/No activity to level 2.
- **What the database holds of §6**, as built: rules 1 and 4 by check constraint
  and trigger; rule 2 (always an Admin) by a deferred constraint trigger on
  `user_roles`, new, judged at commit; rule 3 by RLS (an admin at aal2) on
  `roles` and `role_permissions`; rule 7 by the audit trigger; rule 8 by
  construction. Rules 5, 6 and 9 are not the database's: 5 and 6 are not
  activities, and 9 waits with `requires`.
- **The scope "who and where" is not in the table yet.** `scope_resident_detail`
  was in the sketch, and nothing in the database can honour it until the
  volunteer slice builds its view. That slice adds the column and the view
  together (widening a check is one statement).
- **`scope_photos = 'medical_only'` is honoured by app code, not the database.**
  `record_attachment()` does not look at the folder. It is the only scope whose
  enforcement is in TypeScript today.
- **`requires` is data for later.** Empty in `0132`; the catalogue file states
  the prerequisites and the Settings matrix refuses an incoherent column.
- **Yes / No uses the same column**: Yes is 2. One comparison serves both kinds.
- **Tenancy.** `permission_activities` is the product's and stays global. `roles`
  gains `shelter_id` when the multi-shelter work lands, `key` becomes unique per
  shelter, and `role_permissions` follows its role. Nothing here has to be
  rebuilt for that; it is one column and one index.
- **Audit and export.** `roles` and `role_permissions` have the `audit_log`
  trigger (the seed is excluded: the trigger is created after it), so Recent
  changes shows who changed which cell. The matrix exports as
  a sheet and as a PDF from Settings, because it is also what a shelter's
  acceptance sign-off is checked against.
- **`user_roles.role_id`** is filled from the enum for every existing login and
  kept in step by a trigger in both directions until the enum goes. It is
  nullable, so "a person with no role" has an answer.
- **One person, one role**, as now. Several roles per person was considered and
  left out: it makes "what can this person do" a union nobody can read off the
  matrix, and a shelter that needs a mix can make a role for it. The Director,
  who does both Admin's and Management's work, does not need it (§8): Admin
  includes Management.

## 10. Enforcement, and how it stays fast

### One function in the database

```sql
create function has_permission(p_activity text, p_level text default 'edit')
returns boolean language sql stable security definer set search_path = '' as $
  select exists (
    select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id and r.archived_at is null
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and p_activity is not null
       and p_level in ('read', 'edit')
       and (r.key = 'admin'
            or exists (select 1 from public.role_permissions rp
                        where rp.role_id = r.id and rp.activity = p_activity
                          and rp.level >= case p_level when 'read' then 1 else 2 end))
  );
$;
```

This is the function as built (`0132`). The draft let a mistyped level mean
"edit", which is the stricter answer but a silent one; it now answers no.
`my_permissions()` returns one `jsonb` object (`role`, `is_admin`, `scopes`,
`permissions`, with Admin's cells expanded to every activity), or null for a
person with no live role.

Every policy and every `security definer` guard asks it, and nothing else.
A table gets one policy per command instead of one per role per command:

```sql
create policy weight_select on weight for select to authenticated
  using ((select has_permission('medical.weight', 'read'))
         and ((select sees_all_residents()) or resident_id in (select current_vet_resident_ids())));
-- (sees_all_residents() is illustrative and does not exist yet: the residents conversion
-- PR writes it over roles.scope_residents, or inlines the test.)

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
  list and on the medication list, as a volunteer and as staff, before and
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

## 12. Getting from the enum to the matrix, role by role

> **Lutan, 2026-10-03:** "I suggest that when we implement we take it role by
> role."

The first draft of this section staged the database work by *area* (photos,
stock, medical and so on), with the new roles borrowing staff's or management's
rights in the meantime. Role by role is better, for four reasons that come from
how the policies are written today.

1. **A table does not have to be converted in one go.** Policies are permissive
   and are OR-ed together, so a new policy that asks `has_permission()` can sit
   on a table beside the old role-named ones. Each role's slice adds only what
   that role needs.
2. **Narrowing the volunteer is mostly deletion.** There is one policy per role
   per table, so taking a right away from volunteers is dropping the
   `volunteer_…` policy for it. 40 policies name the volunteer.
3. **Once narrowed, the volunteer is the narrowest role in the system, and every
   new role can start from it.** The 2IC and both Heads borrow the volunteer's
   database rights ("who and where", the enclosures) and are granted the rest of
   their job through `has_permission()`. Their database boundary is then right
   from their first day. In the first draft it would have been staff's or
   management's, wider than the job, until each area was converted.
4. **Each slice ends in something a person uses and something that can be
   tested:** that role's home screen on a phone, and that role's walkthrough
   pass at 375 px.

The hard constraint is unchanged: one schema PR in flight at a time, each
additive and re-runnable (`CLAUDE.md`).

**The bridge: `roles.legacy_role`.** Every existing policy asks
`current_user_role()`. During the migration that function returns the role's
*legacy* enum value. The six built-in roles map to themselves; a configured role
names the one it borrows, which is `volunteer` for all three of Lanna's.

### The foundation, once

| Step | What | Behaviour change |
|---|---|---|
| F1 | **Schema, `0132`:** the three tables, `user_roles.role_id` filled from the enum and kept in step by a trigger, the six roles seeded with today's cells, `has_permission()`, `my_permissions()`. Read by nothing | none |
| F2 | **App:** the catalogue file, `can()`, `requirePermission()`, the route registry, the home-screen shell; **every** page guard, predicate and role list moved onto `can()`; the manual's `roles` tags and the acceptance matrix read activities; the parity check built and green against today | none |

F2 has to be complete before the first configured role exists. A page still
guarded by an old predicate would see a Head as the role they borrow, a
volunteer, and show them a volunteer's pages.

### Then one role at a time

| # | Role | Screens | Database | Done when |
|---|---|---|---|---|
| R1 | **Volunteer** | The buttons and pages a volunteer loses are gone; home is Residents and Enclosures; a resident's page in its who-and-where form | The who-and-where view; the volunteer's read of `residents` narrowed to it; the `volunteer_…` policies dropped on the medical tables, photos, maintenance and project photos, the move, the stock tables, contacts; `volunteer` removed from the role lists in `record_stocktake()`, `delete_resident_photo()`, `set_resident_profile_photo()`, `record_attachment()`, `record_recurring_job()`. Closes finding C9 | A script shows each removed right refused under a volunteer's own JWT; the walkthrough's volunteer pass, rewritten, is run |
| R2 | **Head of Medical** | Home; the medication list (§14) | The role row; a read policy on `prescriptions`, and on the names it needs from `medication` and `frequency`, asking `has_permission('medical.prescriptions', 'read')` | The Head of Medical has used it for a real round |
| R3 | **Head of Maintenance** | Home; the maintenance board on a phone (move a job on with a tap; log, assign and complete in steps); their own recurring tasks | The role row; `has_permission()` policies on `maintenance`, `maintenance_assignees` and a job's photos; `record_recurring_job()` asks `recurring.do_own` | The Head of Maintenance has logged, assigned and completed a job on a phone |
| R4 | **2IC** | Home (Stocktake, Purchasing, Maintenance tasks); the card-by-card stocktake; Purchasing as steps; a delivery as steps | The role row; `record_stocktake()`, `stock_receipts` and the forecasts behind Purchasing ask `has_permission()`; maintenance is already done in R3 | The 2IC, watched, has done each of the three without help |
| R5 | **Management** (the Director by day) | Her phone home from the whiteboard; recurring jobs on a phone; Admin's switch between home screens; the landing that follows the device; the microchip, if L6 says so | Management's 64 role-named policies replaced by `has_permission()`. A table converted here is converted for every role at once, because the function answers for staff, vets and Admin too; behaviour unchanged, proved by the parity check. The largest database slice: several schema PRs (medical · residents and housing · contacts, clinics, friends · stock and the management lists) | Parity green on every converted table; the Director has run a day from her phone |
| R6 | **Admin** (the Director at her desk) | Settings unchanged | The Settings tables and setup lists on `has_permission()`. `user_roles` keeps its own fixed rule (§6) | Parity green |
| Last | **Staff and Vet**, behaviour unchanged | none | Whatever still names `staff` or `vet` is replaced; a vet's clinic limits become the scopes of §5, one for one. Then nothing calls `current_user_role()`: drop `legacy_role`, `user_roles.role` and the `app_role` type | Parity green; the enum is gone |
| Then | **The matrix, and roles a shelter adds** | Settings → Roles and permissions, editable by Admin with 2-step, audited, exportable; then create, rename and archive a role, set its scopes and home | none new | An Admin has changed a cell and seen it bite |

**The order is a recommendation.** Volunteer first, because the three new roles
stand on it. Then smallest first: Medical is one read-only screen, and proves
the whole chain (a role row, a home, a page, a policy) on the least that can go
wrong. Maintenance before the 2IC, because her third task is the page built for
the Head of Maintenance. The 2IC's screens need the most care and a watched
test, so they come when the pattern is settled. Lutan can reorder the new roles
freely. Putting one of them *before* the volunteer also works, at a cost: it
would borrow today's volunteer, who can still add photos, move a resident and
count stock, until R1 lands.

**What the bridge does not do, said plainly.** Between a role's slice and the
end, that role's rights on a table nobody has converted yet are the narrowed
volunteer's. That is *narrower* than its job, never wider. So the way this goes
wrong is a refusal, not a leak: a slice that forgets a policy leaves the role
unable to do part of its job, and the "done when" column is there to catch it.
A role a shelter invents must not need a legacy role at all, which is why that
comes after the enum is dropped.

**New tables skip the bridge.** Anything created after F1 is written against
`has_permission()` from its first migration and never names a role.

**Vets are on hold** (Lutan's answer 6). Nothing in R1 to R6 changes what a vet
can do. Their policies are only rewritten at the end, like for like, and the
rename and the question of what a doctor login sees stay with the parked item.

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
| Record a delivery | phone | **2IC** (from the backlog item; point P1) | phone-first, as steps |
| Recurring jobs: set up, hand over | n/a (later; desktop) | **Management**: the Director by day (the whiteboard) | **phone-first** |
| Booking a vet visit, intake, a resident's details and medical records | field-needed | **Management**: the Director by day (the whiteboard) | unchanged, and now also the Director's daily screens |
| Stock between counts | n/a (later; desktop) | Management; pending L7 | desktop unless the Director wants it by day |
| Management → Contacts, Vets | desktop only | Management; pending L7 | phone-first **if** the Director wants them by day |
| Shelter Friends, Translations, Dashboard, Cashflow | desktop / nice-to-have | Management; pending L7 | follows the answer |
| Maintenance board | both; moving a card between columns is a desktop drag | **Head of Maintenance**, and the 2IC on the whiteboard | **phone-first**: move a job on with a tap, and log, assign and complete in steps |
| My tasks | phone | every shelter role | unchanged |
| Residents list, hub, edit, move, hospital, foster and adopt | field-needed | every role that holds them | unchanged |
| Residents bulk selection | desktop only | Director | stands |
| Enclosures list | field-needed, known to scroll sideways at 375 px | everyone, and it is the volunteer's "map" until the map is built | field-needed, more so |
| Today's medication list | does not exist | **Head of Medical** | phone-first from its first screen (§14). Read-only |
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

## 14. The medication list: a reference, not a record

> **Lutan, 2026-10-03:** "We will not record medication given, the head of
> medical can purely just view what medicine should be given." And, on the Head
> of Medical: "their only job is to administer medicine and we will not be
> recording it so all they need is a reference system to tell them who and how
> much."

The backlog item proposed a *medication round*: doses due, ticked off as given,
skipped or refused, with a history per resident and a schema PR first. That is
not being built. What is built instead is smaller.

**What exists.** `prescriptions` holds the plan: resident, medication,
`dose_quantity`, `frequency_id`, `start_date`, `end_date`. `frequency` holds
`doses_per_day`, `interval_count`, `interval_unit`. `medication` holds the unit
and, since `0129`, a label photo. `current_placement` says where each resident
lives. Everything the list needs is already stored.

**What is needed: one screen.**

1. **Today's medication**, for a phone: every resident with a prescription
   current today, grouped by zone and then enclosure, in walking order.
2. **For each resident:** photo and name, so the right animal is treated; then
   each medication with its label photo, the amount, and how often.
3. **Nothing to tap.** No given, no skipped, no reason, no history. It is a list
   to read.
4. **A tile on the Head of Medical's home screen** that opens it.

**The permission.** No new activity. The list is a second page over
prescriptions, so it opens for anyone with Read on `medical.prescriptions`: the
Head of Medical, and Management and Admin, who can already read them.

**No migration.** One query over tables that exist. So this can be built at any
time, before any of §12, for the roles that can read prescriptions today; the
Head of Medical gets it when their role exists (R2).

**What the ruling leaves as it is.** The system will still hold no record that a
dose was given, by whom or when, which is the gap the backlog item described.
That is now a decision, not an oversight. Two things follow, neither needing
action: *Stock between counts* goes on comparing stock used with what was
*planned*, since there is no "given" to compare with; and if a record is ever
wanted (a clinic asking whether a course was finished, a controlled medicine),
it is a new item that starts from this list.

**Small questions, for whoever builds it** (none blocks the roles work):

- **Residents not on site**, in hospital or fostered: left off, or listed apart?
- **"Every 2 days" and the like:** show only on the days it falls due, worked
  out from the start date? Proposed: yes.
- **Times of day.** `frequency` has a count per day and no clock times, so the
  list can say "3 times a day" and no more. If the shelter gives medication in
  fixed rounds, that is the Head of Medical's knowledge and not the system's.
- **No signal in the kennels.** A list that is only read can be opened at the
  office and carried round. Worth checking on site once.

**Pieces.** One app stream: the screen, the home tile, a manual topic, both
dictionaries, acceptance entries and a release line.

## 15. Pieces for planning

Named so that `/plan-day` can schedule them, and grouped by role as Lutan asked.
*Schema* pieces are serial: only one may be in flight. Everything else can run
beside them.

| Piece | Kind | Needs | What it delivers |
|---|---|---|---|
| **Foundation** | | | |
| `permissions-schema` | schema, `0132` | nothing: the fork is decided | F1: the tables, the seed, `has_permission()`, `my_permissions()`. Read by nothing. **Built, 2026-10-03** |
| `permission-parity-check` | scripts | `permissions-schema` | §11: the probes, the known tightenings, green against today's policies |
| `permissions-catalogue` | app | `permissions-schema` | F2, first part: the catalogue file, `can()`, `requirePermission()`, the route registry, and one area (stock) moved off its predicates as the pattern |
| `permissions-sweep-residents`, `-medical`, `-rest` | app, three streams | `permissions-catalogue` | F2, the rest: every remaining predicate, role list and inline test; manual topics and acceptance entries name an activity |
| `home-screens` | app | `permissions-catalogue` | §8: the home of task tiles built from the registry, Admin's switch between homes, the landing that follows the device |
| **R1 Volunteer** | | | |
| `volunteer-schema` | schema | L3 (how many volunteer logins production has) | The who-and-where view; the volunteer's policies dropped; five function role lists |
| `volunteer-read-only` | app | `volunteer-schema` | The screens, the manual, the rewritten walkthrough pass, a release line |
| **R2 Head of Medical** | | | |
| `medication-list` | app | **nothing here** | §14: the list, phone-first. Usable by Management and Admin as soon as it ships |
| `medical-role` | schema (a role row, one read policy) + its home | F2, R1 | The Head of Medical's login, home and boundary |
| **R3 Head of Maintenance** | | | |
| `maintenance-phone-board` | app | **nothing here** | §13: the board on a phone |
| `maintenance-role` | schema + its home | F2, R1 | The Head of Maintenance's login, home and boundary |
| **R4 2IC** | | | |
| the card-by-card stocktake (already a backlog item), `2ic-purchasing-phone`, `2ic-delivery-steps` | app, three streams | **nothing here** | §13: her three tasks as one-task-per-screen steps, Thai first, tested by watching |
| `2ic-role` | schema + its home | F2, R1, R3 | The 2IC's login, home and boundary |
| **R5 Management** | | | |
| `management-phone-home`, `recurring-jobs-phone` | app | `home-screens` | The Director's daytime screen from the whiteboard |
| `perm-convert-medical`, `-residents`, `-people`, `-stock-and-lists` | schema, four in turn | the parity check | Management's policies on `has_permission()`, which converts those tables for every role |
| **R6 Admin, and the finish** | | | |
| `perm-convert-settings` | schema | the four above | The Settings tables and setup lists |
| `perm-drop-enum` | schema | every table converted, vets and staff included | The bridge and the enum removed |
| `settings-permission-matrix` | app | `perm-drop-enum` | The matrix in Settings |
| `custom-roles` | schema + app | the matrix | A shelter adds a role |

**§15 is authoritative on order, not complete on prerequisites.** It has now omitted one twice: the parity check's probes, and `role_can()` (`0133`), the schema piece that recurring-job eligibility needs before any sweep touches `eligibility.ts` because `can()` answers only about the caller. Read the backlog's Architecture items and `docs/decisions/` for the permission streams before planning from this table.

**What can start now that the fork is decided**, three abreast: `permissions-schema`
in the schema lane, and two of the app streams marked *nothing here*. The
medication list and the maintenance board are the obvious two: each is the whole
of what its Head will use.

**What does not wait for the fork at all:** every stream marked *nothing here*,
which is the medication list and all the phone rebuilds; and the two faults the
audit found, as ordinary backlog items.

**How long, as a judgement and not a measurement:** the foundation is about two
batches of three, then about one batch per role. The 2IC's is the one most
likely to run over, because it ends in a watched test.

## 16. The fork, Senior Staff, and Staff

### Are the 2IC, Maintenance and Medical enum values or configured roles?

The backlog item asked this of two roles. Lutan's answer on the 2IC makes it
three.

**Decided by Lutan, 2026-10-03: "Lets do Configured roles."** No new enum
values. What follows is the reasoning that was put to him, kept as the record of
why.

What each costs, counted against today's code (§3):

| | Three enum values | Configured roles |
|---|---|---|
| Schema | add the three values (their own file: a new enum value cannot be used in the transaction that adds it), then a policy for each role on nearly every one of 47 tables, in the one-policy-per-role style. The five existing roles have 40 to 64 policies each, so on the order of 150 to 190 new ones; 15 functions and 10 views reviewed for their lists | the three tables and the seed; then a slice per role (§12), each of which has to happen for the matrix anyway |
| App | every one of 14 predicates, 16 role lists and about 20 inline tests reviewed so that no new role can do less than the role it grew out of by omission; 55 manual tags; the release-note tags | `can()` replaces all of them once |
| When the Director's three roles exist | about one batch for all three | after the foundation (about two batches), one role per batch, each with its real database boundary from its first day |
| What is thrown away | all of it, when the matrix lands | nothing |
| Risk | a missed list leaves the 2IC or a Head unable to do something they should, or able to do something they should not | a slice that forgets a policy leaves a role unable to do part of its job; never able to do more |

The case for the enum is speed: the three roles would be real, database and all,
about a batch sooner. The case against is that the same sweep is then done a
second time to remove it, and the Architecture item says so in terms: a new enum
value "later has to be migrated out". A third role makes the case against
stronger, not weaker.

What makes the slower route acceptable is that **nothing the three need is
blocked by it.** Whatever logins they hold today, management can already do
everything in the 2IC's job (the stocktake, Purchasing, deliveries,
maintenance), and staff everything in the Head of Maintenance's. The Head of
Medical's one missing thing is the medication list, which is a screen and not a
role, and can be built first (§14). What the new roles add is a *narrower* fit
and their own home screen.

Lutan's answers make that narrower fit matter more than the first draft
assumed: the 2IC and both Heads are to be kept out of nearly everything, the
medical record included. Role by role is what delivers that. Each of the three
gets its real boundary in its own slice (§12), about a batch each after the
foundation, and none of them spends any time with staff's or management's rights
under a new name.

Two cases would have argued the other way, and both were put to Lutan: one of
the three having to be kept out of something sooner than its slice will come,
and shelter-defined roles not being built at all. He decided for configured
roles with both in front of him.

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
the roles, Senior Staff becomes the first role Lanna adds for itself (§12, the last step), not an
enum value. The line to carry forward is the item's own warning, which the
bridge has to honour: a new role must never be able to do less than staff by
omission.

### Staff

**Recommended: keep Staff in the template; at Lanna nobody holds it.**

The template has to reproduce today, six dev accounts hold `staff`, and another
shelter will have kennel hands. Removing it from the product would be a change
nobody asked for. At Lanna, Lutan's answer 1 gives everything Staff does with a
resident to Management and Admin alone and names no other employee, so the role
is simply unused there. Each of today's staff logins is moved to the role Lutan
names for it, or archived, when that role's slice lands (L5). Until then nothing
has to happen to them.

## 17. What is answered, and what still has to be

### Answered by Lutan, 2026-10-03

The first draft put eight questions on the Director's table. Lutan answered
them, with one piece of feedback ahead of them. His words, and what each does to
the table:

| | Lutan | What it changes |
|---|---|---|
| Feedback | "We will not record medication given, the head of medical can purely just view what medicine should be given" | The medication round is not built. A read-only list is (§14). No new table |
| 1 | "Only Manager and Admin can perform those tasks" (moving a resident, hospital, foster, adoption, a death) | The 2IC and both Heads get None on every row that changes a resident |
| 2 | "The 2IC only does those three tasks" | Stocktake, Purchasing, Maintenance tasks. Everything else is None for her |
| 3 | "Head of maintenance can only view resident info, only update is the Maintenance tasks and recurring tasks" | Read on residents, Edit on maintenance jobs and on their own recurring tasks |
| 4 | "No their only job is to administer medicine and we will not be recording it so all they need is a reference system to tell them who and how much" | Read on prescriptions and the medication list. No booking, no weight, no stock count, no adding a medicine |
| 5 | "Just Who and Where - Read only" (what a volunteer sees of a resident) | A new scope (§5). Volunteers lose the medical records they read today, as well as everything they can change |
| 6 | "Put vets on hold for now" | The vet role is left exactly as it is |
| 7 | "Manager / Director book vet visits, the 2IC will create maintenance tasks along with Manager / Director" | Booking is Management's and Admin's. The 2IC has Edit on maintenance jobs |
| 8 | "Only Manager Director should be allowed to publish photos" | `photos.resident_publish` is its own activity, held by Management and Admin |
| On building | "I suggest that when we implement we take it role by role" | §12 and §15 |
| Earlier | The 2IC and Management are separate; the Director does Management by day and Admin at night | §2, §8 |

These are recorded in `docs/decisions/2026-10-03-lanna-roles-lutans-answers.md`.
The Director has not yet seen the table they produce.

### Decided by Lutan, 2026-10-03: the fork

"Decision: Lets do Configured roles." That answers the two questions the rest
turned on, which were L1 and L4 in the draft:

- **The 2IC, Maintenance and Medical are configured roles**, rows in a `roles`
  table with their own cells, and not three new values of the `app_role` enum.
  No enum migration is written.
- **So the permission tables are built**, since a configured role cannot exist
  without them. That is the Architecture item's matrix going ahead, in its
  stages: enforcement first, then the Settings screen, then roles a shelter adds.

Recorded in `docs/decisions/2026-10-03-configured-roles-not-enum-values.md`.

### Still for Lutan: the details of the design

Nothing in this table is decided. Each has the answer this paper recommends.
None of them holds up the first piece; L8 to L10 are settled in practice when
its schema PR is reviewed.

| # | Question | Recommended |
|---|---|---|
| L2 | "Admin and management will probably be the same person." One login for the Director, as Admin, with the home screen following the device and a switch between the two (§8)? Or two logins? | One login. Admin already includes Management |
| L3 | Volunteers: how many volunteer logins exist in production? It decides whether R1 can simply be applied or has to be announced first | Ask a session to read it, or look under Security |
| L4 | What is the 2IC's role called on screen, in English and in Thai? | "2IC" until told otherwise |
| L5 | Senior Staff: close as answered by the matrix? Staff: keep in the template, unused at Lanna? And which of today's staff logins becomes which role? | Yes to both (§16) |
| L6 | The manual says Management can record a microchip; the system refuses it. Which is right? | Give it to Management. It edits everything else about a resident |
| L7 | Everything not on the whiteboard is Management's and Admin's. Which of it does the Director want on her phone by day, and which only at her desk: contacts, the clinic list, Shelter Friends, the dashboard, cashflow, stock used against planned, translations, projects? | Ask her with the table in hand. It decides phone work, not permissions |
| L8 | Default cells are what the screens offer today, and the twelve places where the database allows more (§3 C) are closed as tables are converted. Agreed? | Yes |
| L9 | The live lookup over the token hook (§10). Agreed? | Yes |
| L10 | With configured roles decided, `0132` is the permission tables: additive, read by nothing. Agreed? | Yes. It is the first thing a configured role needs |
| L11 | The Mobile responsiveness sweep is now on the critical path for every role but Admin. It is yours to schedule | Schedule it before the first role's walkthrough at 375 px |
| L12 | The order of the roles (§12): Volunteer, Medical, Maintenance, 2IC, Management, Admin? | That order; the three new roles can be swapped freely |

### Small points the answers leave open

Six cells on the Director's table are still marked `?`. None blocks the
foundation; each is needed by the time its role is built.

| # | Point | Taken as, until told otherwise |
|---|---|---|
| P1 | "Those three tasks" for the 2IC are the whiteboard's: Stocktake, Purchasing, Maintenance tasks. The backlog item also gave her **recording a delivery** | Hers, as part of ordering |
| P2 | The Head of Maintenance updates "recurring tasks": marking their own done, or also **setting up** recurring maintenance tasks? | Marking their own. Setting up stays Management's |
| P3 | Does the 2IC see residents at all? Does the Head of Maintenance's "resident info" mean the whole page or who and where? | Both see who and where, as a volunteer does |
| P4 | Does the 2IC mark her own recurring tasks done (the weekly stocktake is one)? | Yes |

## 18. What is not known yet

- **Production.** Every count and every policy here was read from the dev
  database. Production's accounts by role, and whether its policies match dev's,
  were not read. The conversion PRs run the parity check against dev and the
  production dry-run against production, as usual.
- **Speed.** `has_permission()` under RLS is unmeasured. §10 says how it will be
  measured and where the numbers go.
- **The views.** 10 of the 31 views test a role in their own body. They were
  counted, and the two contact views were read; the other eight were not read
  line by line. Each is converted in the slice that touches it (§12).
- **Whether the Director agrees.** The answers in §17 are Lutan's. The table
  they produce has not been shown to her.
- **Which login is whose.** Which of today's accounts are the 2IC, the two
  Heads and the people who are plain staff now.
- **Signal in the kennels**, for a list that has to be read there (§14).
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
| resident-photos | `photos.resident_add`, `photos.resident_manage`, `photos.resident_publish` |
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

Activities with no manual topic of their own yet: `photos.resident_publish` (not a separate act today),
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
