# 2026-10-11 — `perm-policy-cleanup` (`0182`): narrow the either-or policies, and wire three splits of §4

Batch 91, stream 1. Closes `notAskedYet` in `src/lib/permissions/fixed-for-now.ts` and most of `databaseWider`. Reads with
`2026-10-11-role-floor-schema.md` (same measuring terms) and `2026-10-11-who-does-what-edit.md`.

**Nothing was broken today.** Management holds both cells of every pair here, so each box was right only because the same
role held both. It matters the first time an Admin gives one cell of a pair without the other: the grid saved the box
and the system ignored it. This is not a fix for a live hole.

## Before and after (`node scripts/check-who-does-what.mjs`, dev)

| | boxes | obeyed | wrong | cannot be taken away |
|---|---|---|---|---|
| before (`0181`) | 306 | 184 | 27 | 15 |
| after (`0182`) | 306 | 189 | 27 | 6 |

The 27 are the clinic rule and the who-and-where floor, which stay by design. The 15 become 6: the doctor's resident box,
`recurring.do_own` (a prerequisite rule), and the four `databaseWider` boxes left below. `notAskedYet` is gone from
`fixed-for-now.ts`; the four `databaseWider` boxes that were narrowed are out of it.

## What the items said, and what I found

`databaseWider` named nine policies. Reading the bodies on dev, **six groups of policy were either-or and are narrowed;
three were not a policy defect and are left, with reasons.**

| Policy | Was | Now | Does any role lose anything? |
|---|---|---|---|
| `contacts_select_perm` | browse OR directory | browse | No. Only Management holds directory, and holds browse. A role given directory without browse now reads nothing (0171 let it read; the grid has to give the pair) |
| `shelter_friends_select_perm` | view OR manage | view | No. Only Management holds either, and holds both |
| `clinics`, `doctors`, `doctor_clinics` select | clinics.list OR clinics.doctors OR visit.book | clinics.list (read) | No. Only Management holds them. **A role with visit.book or clinics.doctors and not clinics.list now sees no clinics** |
| `doctors`, `doctor_clinics` insert | clinics.doctors OR visit.book | clinics.doctors | No. Same holders. Booking no longer lets you add a doctor |

The brief's "`clinics.list` / `stock.medications` for clinics and doctors" did not match the bodies: no clinics or doctors
policy reads `stock.medications`.

**Left, and why (a new backlog item for each is on the `backlog` branch):**

- `medical.archive`: archiving a weight, prescription, vaccination or visit is an UPDATE its own table Edit allows. A row
  policy cannot tell `archived_at` from any other column, so this is a trigger on four tables, more than narrowing.
- `stock.delivery`: the purchasing job reads receipts **by design** (`0143`, `check-2ic-role.mjs` proves each stock cell
  stands alone). Narrowing it would break that rule. Needs a decision on whether to keep it.
- `reference.add_while_recording`: a medication is legitimately addable through `stock.medications` Edit as well. Two
  cells opening one insert is the design; the probe cannot tell them apart. Nothing to narrow.

`databaseWider` therefore stays in `fixed-for-now.ts`, shorter, with `closedBy: null` and a comment saying why.

## The three splits

- **`visit.book`.** `clinic_visits_insert_perm` asks `visit.book` (was `medical.visits`). `bulk_appointments` already asked
  it, so booking needed both cells; now it needs the one the grid names. The booking page and its action read `visit.book`.
  `medical.visits` keeps read and change; its insert probe is dropped (`noInsert` in `permission-probes.mjs`) because
  another activity owns that act. A doctor login is unchanged: its cells were None for both, and its own policies ask
  `is_clinic_login()`.
- **`maintenance.progress`.** A status change needs it. A row policy cannot tell one column from another, so the check
  is in `maintenance_before_write` (errcode `42501`, so it reads as a refusal). `maintenance.jobs` still opens the row for
  every other change. The board's drag and Move, the job page's status buttons and the My tasks status control now follow
  `maintenance.progress`. The edit form still posts the status it loaded, which is no change and passes.
- **`projects.publish`.** A change to `is_public` needs it, in `project_folders_before_write`. The info form and the switch
  on the project page show only with it, and `updateProjectFolderInfo` leaves `is_public` out when the caller lacks it
  (otherwise saving a project as a folders-only role would have switched it off).

Both triggers pass a caller with no login (`auth.uid()` is null: the service role, the worker): they have no role to ask,
and RLS does not apply to them either. No SQL function writes either column (searched `pg_proc`), so no definer function
is caught by the new checks.

## Probes and checks changed

- `permission-probes.mjs`: `noInsert` flag on the `medical.visits` table probe.
- `check-permission-catalogue.mjs`: pins for `/clinic-visits/new`, `/maintenance/[id]`, `/my`, `/projects/[id]`.
- `check-perm-convert-medical.mjs`: the edit role also holds `visit.book`. `check-perm-convert-people.mjs`: the directory
  editor also holds browse, the friends manager also holds view, the doctors manager also holds clinics.list, and a role
  with `visit.book` alone now reads no clinics or doctors.

## Release hazard

**`0182` must reach a database before the app code that reads the new boxes.** The new code asks `visit.book`,
`maintenance.progress` and `projects.publish`; before `0182` the database still opens those acts under the old cells, so
the old order merely leaves the grid marking the boxes. Run in the other order (app first), a role with only the old
cell is refused by the screen with the database ready to allow it. Nothing drops a column, so a redeploy can roll the app
half back. To undo: re-create the policies and the two trigger functions as `0155`, `0170`/`0171`, `0172` and their
earlier definitions had them.

## Not checked by me

`check-maintenance-role.mjs` is red on two lines (a doctor marking another's recurring task done; the Head of
Maintenance's bundle differing from `jobs.ts` by `maintenance.photos`) and `check-permission-parity.mjs` reports 21
MISMATCH, all medical, visit and photo boxes for the doctor. None involves a table or box changed here, but I did not run
them on `0181` to prove it.
