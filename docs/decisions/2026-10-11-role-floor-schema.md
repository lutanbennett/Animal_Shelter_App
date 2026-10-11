# 2026-10-11 — `role-floor-schema` (`0179`): the volunteer floor becomes a scope, and deleting a maintenance job gets its own box

Batch 89, stream 1. Reads with `2026-10-11-who-does-what-view.md` (the grid and the measuring script) and
`2026-10-11-perm-functions-schema.md` (which left `sees_all_residents()`, `sees_all_contacts()` and `has_shelter_floor()`
for this).

## What was wrong

The 2IC and both Heads borrow `legacy_role = 'volunteer'` (`0143`). `sees_all_residents()` (`0144`) and
`sees_all_contacts()` (`0147`) refused that floor, and `has_shelter_floor()` (`0149`) refused it for deleting a
maintenance job. The refusals were the right answers (docs/roles-and-permissions.md lines 411, 475, 1386; the Director on
contacts, `0155`: the 2IC "reads name and phone"). What was wrong was the **data and the boxes**: those roles' rows said
`scope_residents = 'all'`, so Settings → Who does what offered Edit where the answer is None. **This narrows what the
grid displays, not what anyone can do:** nobody could do those things.

## What 0179 does

1. `roles.scope_residents` gains **`who_and_where`**. Every role on the volunteer floor (the volunteer, the 2IC, both
   Heads, and any future custom role that borrows it) is set to it.
2. `sees_all_residents()` and `sees_all_contacts()` ask the role's **own scope column** only. The `legacy_role <>
   'volunteer'` test is gone, so these two no longer depend on the enum (`perm-drop-enum` has two fewer to do).
   Nothing is widened: the roles that were refused by the floor are now refused by their scope, and the 2IC's contacts
   scope was already `name_phone`.
3. Boxes the old data made look possible are **None**: the 2IC's adopter news, move, hospital, rehome, death, change a
   contact (`contacts.directory`) and add a contact (`contacts.add`); both Heads' move. The 2IC's `resident.record` is
   Read (who and where). Her contacts box is `contacts.browse`, Read, as the Director answered.
4. **`maintenance.delete`** (Yes/No, area maintenance, sort 61): Admin (rule), Management and the **2IC** Yes, the
   **Head of Maintenance** No. `maintenance_delete_perm` asks it and no longer asks `has_shelter_floor()`.

## Why the 2IC and the Head of Maintenance differ (Lutan, 2026-10-11 — do not undo without asking)

The 2IC is the deputy and may tidy up. The Head of Maintenance runs the board and *completes* jobs rather than removing
them: deleting loses the record of what was repaired, and a phone makes it easy to tap by mistake. Splitting delete from
`maintenance.jobs` was the only way to say "both may edit, only one may delete".

**This is a real narrowing on the face of it for the Head of Maintenance**: their cell said Edit on `maintenance.jobs`,
which reads as "may delete". The database already refused it (the floor), and the page still showed a Delete button that
only produced an error. The button is now hidden unless the role holds `maintenance.delete`. Release note written for
users. For the 2IC it is a gain, and is real: she could not delete before.

## Measured with `scripts/check-who-does-what.mjs` (dev)

| | boxes | obeyed | wrong | cannot be taken away | cannot be given |
|---|---|---|---|---|---|
| `main` at 0177 (the brief) | 300 | 157 | 39 | 19 | 85 |
| after 0178, before 0179 | 300 | 177 | 38 | 15 | 70 |
| **after 0179** | **306** | **184** | **27** | **15** | **80** |

306 because `maintenance.delete` adds six boxes (all obeyed). Entries removed from `fixed-for-now.ts`:
`borrowedFloor`, `maintenanceDelete`. `whoAndWhere` stays (the Read really is who-and-where); its comment now names the
scope. Eight entries remain; `databaseWider` is the one still open of the three this stream was given.

## Left: `databaseWider` (job 3), spun out

Nine policies accept either of two cells; the screens follow the box, so this is defence in depth, not a live hole. It is
its own backlog item (on the `backlog` branch), because it is policy work that wants its own migration and its own
before/after, and this PR already carries a role losing a button. **`who-does-what-edit`'s done-when still has this one
entry outstanding.**

## Harnesses re-baselined (all dev-only scripts; none runs in CI)

`check-permission-tables` (61 activities, Management 56 cells, 113 expected, 732 answers; and the bad-scope example is now
`nothing_at_all`, because `who_and_where` is valid), `check-permission-parity` (61), `check-2ic-role` (her delete, her
cells), `check-medical-role` (Head's move), `check-perm-convert-residents/people/work` (fixtures use the new scope and
cell), `check-volunteer-narrowing`, `check-role-write-policies`, `check-perm-functions`, `check-permission-catalogue`
(maintenance page decides `maintenance.delete`). **Still red, not caused by this change:** `check-permission-tables`
fails at section F ("seed left no audit rows": 6 audit rows on dev, 4 role deletions and 2 cell changes that are not this change's; not investigated further); `check-permission-parity` has 21 doctor (`clinicRule`)
mismatches; `check-role-write-policies` 14 doctor write failures; `check-maintenance-role` has a stale bundle
(`assistant.ask`, `facility.map`, `maintenance.photos`) and one error probe for a doctor.

## Release hazard

`0179` must reach a database **before** the app code that asks `maintenance.delete` (the catalogue check and the page both
need the activity). And a role **loses** an ability when it lands: the Head of Maintenance's Delete button.
