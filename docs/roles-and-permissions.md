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

<!-- next-section -->
