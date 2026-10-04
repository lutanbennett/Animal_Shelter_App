# 2026-10-04 — The Head of Maintenance (`0141`): the second configured role, and where it departs from Medical's

`docs/roles-and-permissions.md` §12 R3. It follows `2026-10-04-medical-role.md` (the role row, the
scopes, `legacy_role = 'volunteer'`, `home_path = '/home'`, a job in `jobs.ts` and `bundleOfRole()`
checked against `role_permissions`) and does not repeat it. This file is what was different, because the
2IC's turn (§12 R4) inherits it, and her column is much wider.

## 1. The role, as copied

`head_of_maintenance`, Thai name หัวหน้าฝ่ายซ่อมบำรุง (Lutan to confirm), `kind = 'custom'`,
`legacy_role = 'volunteer'`, `scope_residents = all`, `scope_clinical = any`, `scope_contacts =
name_type`, `scope_photos = medical_only`, login emails off. **`volunteer` is still the right floor
here** (who-and-where, the enclosures): she needs exactly those, and it is the narrowest value. It will
be the wrong floor for the 2IC (§5).

`scope_clinical = any` is carried over though she holds no clinical cell: `own_clinic` is a vet's
clinic limit and the app reads it as one, so putting it here to be "narrower" would make her look like a
vet to code that asks. The cells are what keep her out of clinical records, and the check proves it.

## 2. Her cells, and the one job

`maintenance.jobs` Edit, `maintenance.progress` Yes, `recurring.do_own` Yes, `resident.record` Read,
`facility.enclosures` Read, written by the migration and expressed as the job `do_maintenance` in
`jobs.ts`. Not given: `maintenance.photos` (the whiteboard says jobs and progress), `recurring.manage`
(P2: setting them up stays Management's), anything medical, stock, contacts or money. `maintenance.progress`
and `maintenance.jobs` are separate cells but one table, and a policy cannot see which column changed, so a
role holding progress without jobs-Edit would be refused at the table; she holds both, so this does not bite
here. It will for any role given only "move a job on".

## 3. Where the volunteer floor was not enough (the departures)

Signing in as her, as Medical's decision said to do first, found the same kind of gap and **three more
places `0134` had taken from the volunteer** that the job needs. Each is now answered by the cell:

| What | Why it was empty or refused | The fix |
|---|---|---|
| `maintenance` and `maintenance_assignees` | `0134` dropped the volunteer's read; the writes named admin, management and staff. Without a policy the board is empty. | Six `*_perm` policies asking `has_permission('maintenance.jobs')` at read / edit. Additive: the role-name policies stay (R5 converts them), and no existing role's answer changes because their cells already say what the old policies did. |
| `translations` | The board shows a job's approved Thai title; `0134` dropped the volunteer's read of the whole table. | A select policy filtered to `table_name = 'maintenance'` and `maintenance.jobs` Read. A row filter and not a view because the whole row is her job's own title; the table also holds resident and project prose, which stays unreachable. |
| the four `recurring_*` reads, and `record_recurring_job()` | `0134` removed the volunteer from both, together with its `recurring.do_own` cell, so the cell she is given had nothing behind it: `/my` would list no task and the function refused her. | Four select policies asking `recurring.do_own`, and the function's guard now also lets in a holder of that cell. The assignee rule below the guard is untouched, so she can still only record a date she is assigned to. Reading is the whole rota, as staff's is today; `/my` filters to her own in code. |

**What is deliberately not given.** No delete policy on `maintenance`: she creates, changes and completes
jobs, and deleting one for good (its photos, its Drive folder) stays admin, management and staff's. A job's
team is the opposite: it is rewritten as a set, so `maintenance_assignees` has delete. No policy on
`maintenance_photos` or `attachments`, so she cannot add or see a job's photos.

`app_users` needed nothing: it already answers a volunteer-based login, and hides emails from it, so the
assignee picker shows names and roles, not addresses.

## 4. Found on the screen, left alone

- **The board and the job page still offer what she cannot do.** The new-job form shows Photos, the job
  page shows Add before/after photos and Delete job. Photos are refused by the upload route (403); delete is
  refused by the database with *"You don't have permission to change maintenance jobs"*, which reads
  oddly to someone who just changed one. The screens gate on `maintenance.jobs`, not on the narrower
  facts. **Decide before the 2IC:** either give her `maintenance.photos` (a photo of the problem is a
  natural part of logging it; it needs a policy on `maintenance_photos` and a branch in `record_attachment`
  like `0140`'s) or gate the controls. This PR does neither: the brief said not to rebuild the board.
- **My tasks is not on her home, but it is in her menu.** A role with jobs shows only its jobs, so the
  home has one tile; `/my` is a menu entry for anyone with `recurring.do_own`, and worked end to end
  (Done, Done today, the maintenance jobs section).
- **Eligibility on `/my` asks the wrong role.** `loadMyRecurringTasks` is passed `current_user_role()`
  (`volunteer`) and `role_can()` refuses a caller about any role but their own *key*
  (`head_of_maintenance`). A recurring task that links to a page therefore errors on her `/my`. The same
  bridge means the rota picker, which filters by enum role, will not offer her a task linked to `/maintenance`
  (a volunteer cannot do it). Unlinked tasks, which is what was tested, are unaffected. This is the
  `legacy_role` bridge showing, not a bug in this PR: fix it with the enum, or by passing the role key.

## 5. What the 2IC (R4) should do differently

- **Do not copy `legacy_role = 'volunteer'`.** Her column is staff-wide (stock, purchasing, maintenance,
  deliveries). A volunteer floor would need a policy or view for every one; borrowing `staff` means the
  old role-name policies already admit her. The cost is that `staff` is the wider floor, so her scopes and
  the absence of a cell stop being the only guard: check what staff's policies still allow that her
  cells say no to (the parity script lists them).
- **Reuse the cell policies from `0141` and `0135`; do not write a third set.** `maintenance_*_perm`
  and the `recurring_*_select_perm` ask a cell, so the 2IC's cells light them up with no new SQL.
- **Settle photos and delete first** (§4), since her board is the same screens.
- Her home will have several tiles: `JOBS_OF_ROLE` takes a list, and `homeTilesFor` draws one per job.

## What the checks say

- `scripts/check-maintenance-role.mjs`: **140 checks, 0 failed**, seven principals (her, admin, management,
  staff, volunteer, a vet, no role), each under its own JWT in a rolled-back transaction: the board's
  sources read as expected; she creates, changes, completes and assigns a job and removes a team member;
  she cannot delete a job, file a photo, set up, change, assign or reassign a recurring task, or read
  residents, the list view, weight, prescriptions, medication, diets, attachments, stock, contacts or the
  assistant; `record_recurring_job()` accepts her on a task she is assigned to and refuses her on another;
  the role row and `role_permissions` equal `bundleOfRole()`.
- Parity, volunteer narrowing, `check-medical-role` (101), `check-medical-jobs` (157), `check-recurring-jobs`
  and `check-role-can`: green before and after. `check-recurring-job-eligibility` fails the same line on
  `main` and on this branch (`canDoJob(/management)`), so it is not this change.
- In the browser at 375 px, as a real Head of Maintenance login on dev: Home (one tile, English and Thai),
  the board, Move job on, Log maintenance (create, assign), Completed, Delete refused, My tasks (Done, Done
  today), a resident's page (who and where only), and the management, stock and admin URLs refused.

## What was not done

- **Production.** Apply `0141` from the main checkout, `--dry-run` first, after the merge. The apply prints a
  consumer warning (the readers are not live): the safe direction, since it adds a role, policies and a
  guard that only widens `record_recurring_job()` for a cell no existing role newly holds.
- **Nothing creates a login for her.** The dev login was made by script and deleted.
- **The role is not finished until the Head of Maintenance has run a real week on her phone** (§12's
  done-when); the test plan's manual table holds that line.
