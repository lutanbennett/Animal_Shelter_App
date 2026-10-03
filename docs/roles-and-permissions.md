# Roles and permissions: the shelter's six roles, and a matrix each shelter can set — a paper

**Status: PROPOSED, 2026-10-03. Nothing in this paper is agreed.** It ends in
questions for Lutan and for the Director (§17). Until they answer, no
`docs/decisions/` file records any of it as decided, and nothing is built. The
one decision this stream does record is a fact, not an agreement: there are no
PCs on site, which overturns part of the 2026-09-24 "Admin on mobile" decision
(`docs/decisions/2026-10-03-no-pcs-on-site-supersedes-admin-on-mobile.md`).

It answers two backlog items as one piece of work, because both ask for the same
table first: *The roles the shelter actually has, from the Director* (Auth) and
*Roles and permissions each shelter configures* (Architecture). The Director's
one-page table is its own file, written for him:
[`roles-director-table.md`](roles-director-table.md).

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
3. **The fork: Maintenance and Medical should be configured roles, not two new
   enum values.** Recommended, not decided (§16). Each enum value costs a
   two-file migration plus a policy on nearly every one of 47 tables, and all of
   it is thrown away when the matrix lands. The bridge that makes this bearable
   is in §12: until the database is converted, a configured role borrows one
   legacy role's database rights (both Heads borrow *staff*), so the two Heads
   can have their own name, menu and home screen two stages in, while losing
   nothing they can do today.
4. **Lutan's steer, a page per role: yes to the idea, with one change.** Single
   pages that a role either can or cannot open, with no per-role branching inside
   them, is the right UI rule and the Director's description of the 2IC already
   demands it. Key each page to a **task** rather than to a **role name**, and
   give each role a home screen made of the tasks it holds (§8). Then a role a
   shelter adds later gets a coherent set of pages for free, which role-named
   pages can never give it. It is a rule for the screens; it does not replace
   enforcement in the database.
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

Lutan, 2026-10-03, after talking to the Director. The shelter has six kinds of
people:

| # | Who | Becomes | What the Director said they do |
|---|---|---|---|
| 1 | Director | **Admin** | Everything. Named: the website content, the projects pages, booking vet visits |
| 2 | 2IC / Manager | **Management** | Management activities, which ones still to be settled; explicitly stocktakes and ordering medicine and food. **Not comfortable with computers** |
| 3 | Head of Maintenance | **Maintenance** (new) | Creates, assigns, progresses and completes maintenance jobs |
| 4 | Head of Medical | **Medical** (new) | Gives medication to the residents |
| 5 | Volunteers | **Volunteer**, read-only | See the map and the resident hub. Change nothing |
| 6 | Vets | the doctor login (`vet` today) | Add an appointment for a resident; add test results and the rest of the clinical record |

Three things in that description overturn something already on `main`.

**There are no PCs on site.** The only computer is the Director's, at home.
Every other role works on a phone and only on a phone. The 2026-09-24 decision
marked a set of Management pages desktop-only behind a "Best on a larger screen"
notice; that is now right only for pages the Director alone uses. §13 goes
through every desktop-only row again, and the superseding decision file records
the fact. It also puts the **Mobile responsiveness sweep** on the critical path
for five of the six roles. That item is parked and Lutan schedules it (ruled
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
employee is one of the two Heads, or there are other employees (kennel hands)
the Director did not mention. Until that is answered, nobody but the Director
and the Manager would be able to register a resident, move one, send one to
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
| Guards inside database functions | `security definer` functions that test `current_user_role()` | **17** functions, each with its own hard-coded role list |
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
| Admin | fixed | The Director | My tasks | none |
| Management | default | The 2IC / Manager | My tasks, in the simple layout (§8) | which Management pages it keeps is question D2 |
| Maintenance | **new**, configured | Head of Maintenance | Maintenance | see the Director's table |
| Medical | **new**, configured | Head of Medical | Today's medication round | see the Director's table |
| Staff | default | open: question D1 | My tasks | kept in the template; whether anyone at Lanna holds it is the Director's call |
| Volunteer | default, narrowed | Volunteers | Residents | read-only: every Yes and Edit in its column becomes No or Read, confirmed line by line first (L3) |
| Vet | default | Clinics' doctors | Appointments | none now. The name becomes Doctor when the parked clinics item is taken up |
| Public viewer | fixed | Test logins | the public site | none |

The cell-by-cell proposal for those roles **is the Director's table**
([`roles-director-table.md`](roles-director-table.md)): 37 rows, each one or
more activities from §4, each cell marked as *stated by the Director*, *carried
over from today*, or *a gap with a proposed answer*. It is kept as one file, not
repeated here, so that there is one place to correct when he answers.

On the vet's name: `doctor` is the target name for the role, per the parked
*Clinics and doctors* item (Medical records, PARKED 2026-10-03). Nothing here
starts that rename. What will need reconciling when it is unparked: the role key
(`vet` → `doctor`), which under this design is a one-row rename in `roles`
instead of an enum change; and the open question of which residents a doctor
login sees, which is the "which residents" scope of §5 and should be answered
there rather than with new policies.

<!-- next-section -->
