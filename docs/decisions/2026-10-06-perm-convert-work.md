# 2026-10-06 — Converting the work-assignment tables to `has_permission()` (`0149`, R5's sixth slice)

`docs/roles-and-permissions.md` §12 R5, §9 rule 4 and §15. The second-to-last conversion; it copies the shape in
`2026-10-04-perm-convert-medical.md` (one policy per command, `(select has_permission(…))`, no role named) and reports the
way `2026-10-06-perm-convert-stock-and-lists.md` does. What follows is only what this slice added or found.

## The tables

| Table | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `maintenance` | `maintenance.jobs` Read | `maintenance.jobs` Edit | `maintenance.jobs` Edit | `maintenance.jobs` Edit **and** `has_shelter_floor()` |
| `maintenance_assignees` | `maintenance.jobs` Read | `maintenance.jobs` Edit | same | same |
| `project_folders` | `projects.folders` Read | `projects.folders` Edit | same | same |

Six role-named policies dropped (`management_rw_*` and `staff_rw_*` on each table; found in `pg_policies`). `admin_all_*` is
untouched, as in `0135`, `0147` and `0148`.

**Most of the work was already done.** `0141` (the Head of Maintenance) had written every `maintenance` and
`maintenance_assignees` policy bar one, additively, beside the role-named pair. Converting them is therefore dropping the
pair, and the one policy `0141` left out. Only `project_folders` needed four new policies.

## What this slice had to decide that the earlier ones did not

### "Mine versus anyone's" did not arrive

The brief expected the `recurring.do_own` / `recurring.manage` shape here: an activity *and* whether the row is the caller's.
**It is not in these tables.** `maintenance_assignees` is who a job is given to, but nothing in a policy needs to know which
row is the caller's: since `0134` the volunteer reads none of the job tables, and a login that can see the board sees every
job (the board lists them all, and `/my` filters to the caller's in code). The `do_own` / `manage` split lives in the
recurring tables, which `0145` converted. Nothing to add; recorded so the next reader does not look for it.

### Delete has no activity, and the plain answer would have undone `0141`

Delete on `maintenance` is the one place the conversion was forced into the open question the brief named
(`role-gaps-sweep`): **delete has no activity of its own, and I did not invent one.** The choices were:

1. Ask `maintenance.jobs` Edit, the cell the probe in `permission-probes.mjs` models delete on. Management and staff keep it,
   **but the Head of Maintenance and the 2IC hold that cell too, so both would gain delete.** `0141`'s header says the opposite
   on purpose: "removing one for good stays Admin's, management's and staff's", and its handover said the board still offers
   the button. This turns a refusal she sees into a deletion she can do.
2. Drop the role-named delete and give nothing back: management and staff lose a right they use.
3. **Ask `maintenance.jobs` Edit and a floor test**, so nobody's answer changes.

I took (3). `has_shelter_floor()` is true for a live login whose floor (`user_roles.role`) is above the volunteer's; the Head of
Maintenance and the 2IC sit on the volunteer floor and so are refused, and management, staff, admin, a vet and any
staff-floor configured role are not. **It is the same kind of test as `sees_all_residents()` (`0144`) and `sees_all_contacts()`
(`0147`):** a function that reads the floor, so the policy text names no role, and a refusal rather than a right. It is added to
`check-volunteer-narrowing`'s short list of functions that still say "volunteer", beside those two.

It is a stopgap with a named end: when delete gets an activity, `maintenance_delete_perm` asks it and `has_shelter_floor()` is
dropped. **The one thing it cannot do is be configured**: a custom role on the volunteer floor can never be given job delete
until then. That is the open question, not a new one.

The first version wrote the floor test inline, `current_user_role() <> 'volunteer'`. It passed the new script and **failed
`check-volunteer-narrowing`** (`policies that still name the volunteer: maintenance_delete_perm`): a regression in a check
the brief had said fails only on recurring rows. Moving it into a function fixed it; the check is back to its five
recurring lines.

### `project_folders` is `projects.folders`, and publishing is a column

The brief asked for the activity, and said to say how it was worked out. The catalogue has three projects cells:
`projects.folders` (level), `projects.photos` (yes/no) and `projects.publish` (yes/no). The page guards
(`src/app/projects/page.tsx`, `[id]/page.tsx`) and the route registry ask `projects.folders`, read to open and edit to write;
the manual ties "Manage projects" to it; and the parity probes model insert, update, delete and read on it. **So the table's
four policies ask `projects.folders`.**

`projects.publish` sets `is_public` on the **same table**. I did not split the update by column: management and staff hold
both cells, no configured role holds either, and a column split is the redesign's, as the brief said of delete. The
consequence is stated rather than hidden: a role given `projects.folders` Edit without `projects.publish` could set
`is_public` by a hand-built request. `check-perm-convert-work` asserts the other direction, that `projects.publish` alone opens
nothing.

`project_folders_before_write` reads the parent folder as the caller. A role refused the parent's read is refused the insert by
that trigger (P0001), before the policy: the existing probe records the same (`refusedBy: ["P0001"]`), and the script counts it
as a refusal.

### `maintenance.progress` is still not asked by any policy

`maintenance.progress` is "move a job on". The update policy asks `maintenance.jobs` Edit only, so a role holding progress
without jobs could not. No role does (the Head of Maintenance, the 2IC, management and staff hold both). A progress-only role
would need an update policy by column, and that is the `role-gaps-sweep` shape; I left it, and a configured role with only
`maintenance.progress` is in the script, **refused**.

## Which known tightenings closed

**None, and none opened.** The five `maintenance` and `projects` probes (`permission-probes.mjs`) already agreed for management
and staff, and the volunteer's reads went in `0134`. The answers that moved are not probed: none, because the delete floor test
reproduces every login's answer.

## The parity check, before and after (§11)

The dev database still holds the Director's first draft of the role matrix (`#380`), so `check-permission-parity` and
`check-permission-tables` are RED before any change of mine. I did not revert it: it is the Director's, deliberately on test.

- **Before** (`0148` applied, nothing of `0149`): **1,907 match / 26 known / 27 mismatch.**
- **After** (`0149` applied): **1,907 match / 26 known / 27 mismatch**, **the same 27: the mismatch lines diff identically**
  (`diff` of the two outputs is empty). 245 probe runs, 1,960 answers, both times. Zero known entries closed, none opened.
- **No failing line names `maintenance`, `maintenance_assignees` or `project_folders`.** Counted by name and by activity
  (`maintenance.*`, `projects.*`): 0 of 27. The 27 are the draft's cells: `assistant.ask`, the
  `medical.*` activities, `photos.resident_add`, `recurring.do_own`, `reference.add_while_recording`, `resident.*` and `visit.book`.

`check-policy-role-names` is GREEN with the three tables removed from `OWNERS` (7 tables, 14 policies remain: settings and the
photo split). `check-permission-catalogue` passes. `check-permission-tables` fails at `A cells vet: got 2, wanted 13`, as it did
before, on the draft. `check-volunteer-narrowing` fails on its five recurring lines only (as before); `check-maintenance-role`
fails on one line, the Head of Maintenance's bundle having gained `assistant.ask`, `facility.map`, `maintenance.photos` and
`placement.move` in the draft, and **every one of its 139 other checks held, including that she cannot delete a job and that
management and staff still do**. `check-2ic-role` (3) and `check-perm-convert-orphans` (11) fail on the draft too.

## What the new script covers

`scripts/check-perm-convert-work.mjs`: real rows, each login's own JWT, always rolled back. Three tables, four commands, fourteen
principals: admin, management, staff, volunteer, no role, a vet, **the real `head_of_maintenance`**, and seven configured roles
(`maintenance.jobs` Read, Edit on the staff floor, Edit on the volunteer floor; `maintenance.progress` alone;
`projects.folders` Read and Edit; `projects.publish` alone). 171 checks, all held, plus three sweeps (no policy names
management or staff; every `_perm` policy wraps `has_permission()` in `select`; 12 `_perm` policies).

It was not run red against the unconverted tables, because the policies it asserts for `project_folders` did not exist before
the apply. The first run did disagree on nine cases, all `project_folders` inserts refused by the trigger above, which is
how that fixture detail was found.

## What this does not cover

- **The maintenance board, driven by someone.** `check-phone-width` opened `/maintenance` and `/maintenance/new` at 375 px as the
  Head of Maintenance (a disposable login made by the script) and as staff, in English, and neither scrolls sideways. It does
  not tap, drag or delete; that is Lutan's check, and `Manual verification by` says so.
- **Photos on a job** (`maintenance_photos`) and the project photo tables are the photo split's, untouched.
- **Production apply is Lutan's**, from the main checkout: `--dry-run`, then apply `0149`. `-- consumer: none`.
- **`0149` was applied to dev once by the runner, then its file changed twice** (the floor test moved into
  `has_shelter_floor()`, once as `above_volunteer_floor()` and then renamed so no policy name contains the word) and the file's
  SQL re-run against dev, as `0147` and `0148` did. It is unmerged and re-runnable; dev holds the final file.
