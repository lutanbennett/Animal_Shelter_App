# Settings → Who does what, view only (who-does-what-view)

2026-10-11. Batch 88, stream 1 of 3: step (a) of the *PRIORITY: Settings → Who does what* item.
No migration.

## What shipped

`/admin/who-does-what`, titled "Who does what" in Lutan's own words, reached from a tile on Settings
and one on Management. Every activity of the catalogue down the side, grouped by area in plain words
in both dictionaries; every live role across the top (archived Staff and the Public viewer are not
columns); Edit / Read / None or Yes / No in each box, read live from `role_permissions`. Admin is a
line above the grid, "everything, always", not a column of ticks (§6 rule 1). A print stylesheet
(landscape, the page alone, no scroll box) and one CSV of the same grid. View only: no edit control,
disabled or otherwise.

## Decisions

**Who opens it, and how it reads the tables.** Admin and Management, as the item says. There is no
activity for "see the roles grid", and adding one needs a migration this stream was forbidden, so
`opensWhoDoesWhat()` (`src/lib/permissions/who-does-what.ts`) asks `isAdmin || role.key ===
'management'`. It is the page's one role-key check, kept to one function so the stream that gives it
an activity changes one line; the page guard is pinned in `check-permission-catalogue.mjs` section F.
`roles` and `role_permissions` are readable by Admin alone (`0132`, `0153`), so the page reads them
with the service role **after** that guard. Nothing in them is secret to these two roles.

**Phone fallback: sideways scroll with the activity column pinned**, not one card per role. The demo
is on a laptop, where all six roles fit at 1440 px with no scroll; a sideways scroll keeps the phone
showing the same grid rather than a second layout to keep true, and costs one `sticky` class. At
375 px the pinned column narrows to 9rem so two roles show beside it.

**Marks are per box, not per row.** A box the system does not obey carries a numbered circle that
links to its reason under the grid, and the reason names the roles it affects. A row-level tag would
mark 30 of 60 rows, mostly because of the doctor's column, and say less: it is the box that is
untrue, not the activity.

## FIXED_FOR_NOW: measured, not written from the catalogue

The brief's warning was the point of the stream: populate the grid from `role_permissions` and stop,
and the page reports its own configuration back to itself. So the list
(`src/lib/permissions/fixed-for-now.ts`) is measured by **`scripts/check-who-does-what.mjs`**:

- For each live role but Admin, each of the 50 activities with a database probe (the parity check's
  own statements, `scripts/lib/permission-probes.mjs`), each probe is run twice under a throwaway login
  holding that role, in a rolled-back subtransaction: with the role's cell as it is, and with that one
  cell flipped. A box is **obeyed** only if the database follows it both times.
- Otherwise it is **WRONG** (the database answers differently today), **STICKY** (yes, and still
  allowed with the box set to no) or **INERT** (no, and still refused with the box set to yes).
  WRONG and STICKY must be listed; INERT is true today and often only a missing prerequisite, so it is
  reported, not required.
- The check fails on an unlisted box, on an entry whose boxes are all obeyed (STALE), and on an entry
  that marks an obeyed box (OVERLISTED, which would have the page call a true box fixed).
  `WDW_DROP=<entry>` drops one entry to show it goes red; it does.
- **`scripts/check-who-does-what-page.mjs`** then checks the page itself: as Admin and as Management
  every one of the 360 boxes says what `role_permissions` holds, the marks sit on exactly the boxes the
  list shows (49), Volunteer and 2IC are sent to `/no-access`, signed out to `/login`.

**Measured on dev at `main` 56ec669 (0177): 300 boxes; 157 obeyed, 39 wrong, 19 sticky, 85 inert.**
That is far from empty, which the brief said would be the surprising result. The entries:

| Entry | Boxes | Why | Stays / closed by |
|---|---|---|---|
| `clinicRule` | doctor × 20 | The doctor's policies ask `is_clinic_login()`, not cells (`0167`, Lutan 2026-10-07: "nothing changes for a vet"). Every medical box reads None while a doctor records their own clinic's medical work | Stays (the item ends with "the §6 rules and the doctor's clinic scope") |
| `whoAndWhere` | volunteer, both Heads, 2IC × record | They read `resident_who_and_where`, not `residents` (§5). For the three configured roles it is reached through the volunteer floor while their own `scope_residents` says `all` | Stays (it is what Lutan asked, §7) |
| `nameAndPhone` | 2IC × contacts.browse | `0155` set her to `name_phone`; she browses `volunteer_contacts` | Stays |
| `borrowedFloor` | 2IC × 8, both Heads × move | Every configured role borrows `legacy_role = 'volunteer'` (`0143`), and `sees_all_residents()` / `sees_all_contacts()` (`0144`, `0147`) refuse that floor. The Director's draft gave boxes the database refuses | **Nobody in the plan** (below) |
| `maintenanceDelete` | Head of Maintenance, 2IC × jobs | Delete asks `maintenance.jobs` AND `has_shelter_floor()` (`0149`), which refuses the floor; §4 says Edit includes delete | Nobody yet; delete needs its own activity (role-gaps-sweep) |
| `stockCorrect` | 2IC, Management × correct | `record_stock_correction()` names admin/management, and both screens ask `stock.medications` / `stock.diets` instead of `stock.correct` | perm-functions-schema (the function); who-does-what-edit (the screens) |
| `namedInDatabase` | Management × 4, doctor × own jobs | `record_stocktake()`, `record_recurring_job()`, `record_attachment()` name roles | perm-functions-schema |
| `notAskedYet` | `visit.book`, `maintenance.progress`, `projects.publish` | Three §4 splits nothing reads: booking is written under `medical.visits`, moving a job on under `maintenance.jobs`, `is_public` under `projects.folders` | who-does-what-edit |
| `databaseWider` (not shown) | Management × 7, 2IC × 2, Head of Medical × 1 | The screens ask the box; another box the role holds opens the same table (archiving is an update, receipts read on any stock box, contacts on browse OR directory, ...). No app user can tell | Nobody yet; listed under the grid for the record |

Of the 11 functions measured on 2026-10-10, five do not show as a box out of step and are not
entries: `undo_deceased_placement()` (Admin only, and nobody else holds the box),
`record_deceased_archive()` and `set_standard_diet()` (no probe, behind boxes only Admin and
Management hold), `set_resident_microchip()` (asks the cell; names the doctor only for the scope) and
the three doctor functions, which are the clinic rule.

**The app's role-name lists**, read by hand: `APP_ACCESS_ROLES` / `hasAppAccess` decide whether a
login opens the app, not a box; `ASSIGNABLE_ROLES` and `NEVER_ASSIGNABLE` keep the doctor off rotas,
whose box is None anyway; the Management home keyed on `management` and `VALID_ROLES` on Security are
not boxes. None makes a box untrue, so none is an entry. The page adds one of its own,
`opensWhoDoesWhat()`, above.

### perm-functions-schema applied `0178` to dev mid-stream

At 01:33 UTC today, before merging, it applied `0178_perm_functions.sql` to dev. The check, run again,
then finds five listed boxes obeyed: Management's `stock.correct`, `stock.count`, `recurring.do_any`
and `photos.resident_add`, and the doctor's `recurring.do_own` (and 15 INERT boxes become givable:
`clinics.doctors`, `recurring.do_any`, `placement.death_withdraw`). As the brief says, the list stays
true to `main`; until `perm-functions-schema` merges, the check is red on dev with exactly those five
boxes, and says that entry's `closedBy` stream is the reason. That stream removes them when it merges.
Management's `recurring.do_own` is still sticky after `0178`.

## What this means for the rest of the sequence

**who-does-what-edit's done-when cannot be met as planned.** It says every box not on the §6 list can
be changed, and that by then the list is "the §6 rules and the doctor's clinic scope". `borrowedFloor`,
`maintenanceDelete` and `databaseWider` are closed by **no stream in the plan**: perm-functions-schema
converts functions, and `sees_all_residents()`, `sees_all_contacts()` and `has_shelter_floor()` are not
among them; perm-role-lists is app lists. Until something stops those three reading `legacy_role`, an
Admin who ticks "move a resident" for the 2IC will see the box change and the 2IC still refused. It
needs a schema stream of its own before (e); what it should do (ask the role's own scope columns, give
delete its own activity) is Lutan's call, so it is raised in the PR rather than decided here.

**INERT boxes for the edit stream** (main, before `0178`): giving these would not work today, some for
want of a prerequisite and some not. Worth knowing before an Admin tries: `audit.view` for every role
(the log is Admin's whatever the box says), `photos.resident_manage` / `photos.resident_publish` /
`projects.publish` / `resident.register` for every role but Management, `visit.book` for every
non-doctor role, the placement boxes and contacts boxes for the volunteer floor, `stock.correct` for
all but Management and the 2IC. `node scripts/check-who-does-what.mjs` prints the full list.

## For the release manager

No database change. **This page is a demo surface, and its truthfulness depends on FIXED_FOR_NOW
being kept current** by perm-functions-schema, perm-role-lists and who-does-what-edit. Each of them
re-runs `check-who-does-what.mjs` and edits the list in the same PR as the change that moves a box.
