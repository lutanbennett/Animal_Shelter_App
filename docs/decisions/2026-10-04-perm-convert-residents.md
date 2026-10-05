# 2026-10-04 — Converting the resident tables to `has_permission()` (`0144`, R5's second slice)

`docs/roles-and-permissions.md` §12 R5 and §10. The second of four conversions; it copies the shape in
`2026-10-04-perm-convert-medical.md` (read that first: one policy per command, `(select has_permission(…))`,
no role named, no delete policy where the cells have no delete act). What follows is only what this slice
added or found.

## The tables

| Table | Activity | Select | Insert | Update | Delete |
|---|---|---|---|---|---|
| `residents` | `resident.record` | read | `resident.register` | edit | none (C2 closed) |
| `placement_history` | `resident.record` | read | by `placement_type`, below | edit | none |
| `adoption_updates` | `resident.adoption_news` | read | edit | edit | **edit** (Edit includes delete, A8) |

`placement_history` insert asks the activity of the row's own type, because one table carries five acts:

| `placement_type` | Activity |
|---|---|
| `Intake` | `resident.register` |
| `ChangeEnclosure` | `placement.move` |
| `SendToHospital`, `ReturnFromHospital` | `placement.hospital` |
| `Foster`, `Adopt`, `ReturnToShelter` | `placement.rehome` |
| `Deceased` | `placement.death` |
| `DeceasedInError` | `placement.death_withdraw` |

Policies: `residents_*_perm`, `placement_history_*_perm` (3 each), `adoption_updates_*_perm` (4), ten in all,
plus `vet_read_adoption_updates` (below). Each also asks `(select sees_all_residents())`.

## What this slice had to decide that `0135` did not

### `sees_all_residents()` is not just the `scope_residents` question

`0135`'s `sees_all_clinical()` reads `roles.scope_clinical`. The matching function over `scope_residents`
(§10 names it, illustratively) would have been wrong on its own, and wrong in the dangerous direction.
**The volunteer holds Read on `resident.record`**, and reads a resident only as who-and-where
(`resident_who_and_where`, `0134`, gated on `current_user_role() = 'volunteer'`). A policy asking only the
cell and `scope_residents = 'all'` would hand the whole `residents` table to the volunteer, **and to the 2IC
and both Heads, who borrow the volunteer floor through `legacy_role`**, OR-ed beside the view. §5's "how much of
a resident" scope exists on paper and has no column behind it.

So the function asks two things: `scope_residents = 'all'`, and the role's `legacy_role` is not `'volunteer'`.
That mirrors the view's own gate and the app's `readsWhoAndWhereOnly()`, so the three agree. It is the one
place a converted policy leans on the bridge, it names the volunteer, and it is named in
`check-volunteer-narrowing.mjs`'s allow-list as "a refusal, not a right". When `perm-drop-enum` removes
`legacy_role`, "how much of a resident" needs a real column (`whole` / `who_and_where`) and this function is
the one place to change. The harness proves it from the dangerous side: a configured role that borrows the
volunteer and holds **Edit on every resident and placement cell** reads and writes nothing on the three
tables.

### Findings in what was there

- **`adoption_updates` policies carry no role prefix**, so `0135`'s `management_%` / `staff_%` sweep would not
  have found them. They are `record_keepers_write_adoption_updates` and `resident_roles_read_adoption_updates`,
  named in the file. The read policy also held the **vet's** half (`current_vet_resident_ids()`); that is
  re-created unchanged as `vet_read_adoption_updates`, or the conversion would have taken a vet's read away.
  Admin had no policy of its own on this table; it now reaches it through `has_permission()`.
- **Other policies that name a role and are not prefixed**, found by looking for `'management'::app_role`
  outside `management_%` / `staff_%` / `_perm`: `resident_diet_rounds_write`, `prescription_rounds_write`,
  `frequency_rounds_read` (medical; `0135` did not reach them), `item_unit_conversions` (two),
  `stock_receipts` (two), `stock_counts_read`, and `managers_write_recurring_job_assignees` / `managers_write_recurring_jobs`. None is mine; they
  go on the backlog for `-stock-and-lists` and the medical follow-up, so the last conversion can end on "no
  policy names a role but Admin and Vet", not on "no policy has the prefix".
- **`DeceasedInError` was insertable by hand.** `undo_deceased_placement()` is the real path (security definer,
  Admin only); a hand-built insert of that type used to pass for management and staff. It now asks
  `placement.death_withdraw`, which they do not hold. Not a visible change: the app never inserts it directly.
  `check-perm-convert-residents.mjs` asserts it per type.
- **Management can still change a microchip by editing the resident.** `resident.microchip` is No for Management
  (finding B), but the number is a column of `residents` and the update policy is row-wide, so a hand-built update
  gets through, as before. A policy cannot see a column; the real guard is `set_resident_microchip()`. Unchanged and
  recorded, not built (a column trigger is its own piece).

## What was dropped and what was left

- **Dropped:** `management_rw_residents`, `staff_rw_residents`; the three management and the three staff policies on
  `placement_history`; the two `adoption_updates` policies above. Found in `pg_policies`.
- **Left on purpose:** `admin_all_*` (R6), `vet_read_residents`, `vet_read_placement_history` (Vet is last; its clinic
  limit is `current_vet_resident_ids()` and stays as is).
- **Left because they are not these tables' conversion:** `attachments` and the photo tables (the `photos.*`,
  `maintenance.photos` and `projects.photos` activities share it and wait for the photo split, A3/A5),
  `enclosures` and `zones` (`facility.enclosures`), `group_origins`, `vet_doctors` and the rest of the people tables
  (`-people`, where they fit). The residents list is `residents`, `placement_history` and `adoption_updates`.
  `attachments`, `enclosures`, `zones` and `group_origins` still carry `management_*` / `staff_*` policies and **no
  conversion stream is assigned them** (§15 names `-people`, `-stock-and-lists` and `perm-convert-settings`, and
  none of those lists says where they land), so they are filed on the backlog branch.

## Which known tightenings closed

- **C2** (`residents`: management and staff could hard-delete a resident from a hand-built request; the app never
  does): **closed for both**. The check went RED with exactly two STALE entries on the first run after the apply,
  the predicted result and the proof the check notices a closing. The `known` entry is removed from
  `scripts/lib/permission-probes.mjs`; the probe now says "Admin only".
- **C8, C12 and the rest:** untouched.

## The parity check, before and after (§11)

- **Before** (`0143` applied, nothing of `0144`): **1,924 match / 36 known / 0 mismatch, GREEN** (the figure in the
  `0135` note; `0136` to `0143` added no probe). Run on this branch before the migration was written.
- **After** (`0144` applied): **1,926 match / 34 known / 0 mismatch, GREEN.** Two known entries closed (C2 for two
  roles), which is the whole delta.
- `check-permission-catalogue`, `check-permission-tables`, `check-role-write-policies` (taught the
  `sees_all_residents()` condition, as it was taught `sees_all_clinical()`), `check-volunteer-narrowing`,
  `check-medical-role`, `check-2ic-role`, `check-maintenance-role` all pass after.

## What the new script covers

`scripts/check-perm-convert-residents.mjs`: real rows, each login's own JWT, always rolled back. Three tables, four
commands, twelve principals: admin, management, staff, volunteer, no role, a vet (own clinic and another's, with the
vet's writes asserted refused), and six configured roles created inside the transaction (two borrow the volunteer,
Read and Edit; four borrow staff: Read, Edit, **`placement.move` only**, and `own_clinic`-scoped). Plus the six
placement types as management, staff, the Edit role, the move-only role and admin. 181 checks, all held. The cases
§10 asks for: a role that reads and cannot write, one that writes, one that sees nothing (the volunteer-floor roles,
the scoped role), and a role holding one housing act only.

It was not run red against an unconverted table (the `_perm` policies it asserts did not exist before the apply).
Two things show it can fail: the sweeps that count the policies and check each asks `sees_all_residents()`, and the
first-run RED of the parity check. Two fixture faults were found and fixed on the way (a hard delete of a resident
with children fails on the foreign key for everyone, so the delete case uses a resident with none; a Yes/No cell has
no Read). Each was reported by the harness's own "the statement errored" case and not read as a policy answer.

## §10's measurement: before and after

`scripts/measure-permission-baseline.mjs`, unchanged, twice before and twice after, dev, median of four, a rolled-back
transaction under each login's own JWT. **This time the residents list is the converted query**: `resident_list_view`
reads `residents`, which now asks `(select has_permission(…))` and `(select sees_all_residents())`. The medication
list's prescriptions query joins `residents` and so reads it too; both medication rows moved for that reason.

| login | query | rows | before: exec ms (plan ms, shared hit) | after: exec ms (plan ms, shared hit) |
|---|---|---|---|---|
| staff | residents list | 86 | 15.02 / 15.91 (1.04 / 1.04, 1563) | 7.13 / 7.15 (0.94 / 1.00, 306) |
| staff | medication list: placements | 86 | 14.74 / 15.89 (0.95 / 0.96, 1603) | 7.02 / 6.93 (1.00 / 0.93, 360) |
| staff | medication list: prescriptions | 13 | 2.97 / 3.34 (0.31 / 0.33, 175) | 3.96 / 4.00 (0.31 / 0.31, 169) |
| volunteer | residents list | 0 | 7.37 / 8.05 (0.95 / 0.97, 347) | 6.11 / 6.06 (0.98 / 0.96, 182) |
| volunteer | medication list: prescriptions | 0 | 1.20 / 1.24 (0.30 / 0.31, 34) | 1.44 / 1.41 (0.34 / 0.30, 34) |
| volunteer | medication list: placements | 0 | 7.46 / 8.15 (0.94 / 0.97, 387) | 6.03 / 6.17 (0.95 / 0.91, 236) |

**Read it as two things.**

- **The residents list got twice as fast and read a fifth of the buffers** (staff 15 ms and 1,563 buffers down to 7 ms
  and 306). That is finding D paying out, not a side effect to lean on: the old `staff_rw_residents` and
  `management_rw_residents` called `current_user_role()` bare, once per row, and the new policies call two functions
  once per statement. The plan of `select … from prescriptions p left join residents r` as staff shows
  `InitPlan 5` and `InitPlan 6` as the filter on `residents` and `InitPlan 2` and `3` on `prescriptions`; the
  residents scan's own filter still carries `current_user_role()` bare for `admin_all_residents` and the vet policy,
  and that is what remains of D here until Vet and Admin convert.
- **The prescriptions query got about 0.7 to 1 ms slower for staff** (3.0 / 3.3 to 4.0 / 4.0), with buffers slightly
  down (175 to 169). That is the join into `residents` now planning two more init-plans (each runs once, so it is a
  fixed cost, about 0.3 to 0.5 ms each on a cold call, not a per-row one). Volunteer 1.2 to 1.4 is inside the spread
  the controls show. It is a real cost and it is small and constant; it is the opposite of what a table of ten
  thousand rows would punish. **L9 (the live lookup, not the token hook) stands.**

Dev has 86 residents, so this says the init-plan is planned and cheap, not that a table of ten thousand is; the
mechanism, not the timing, is what scales.

## What this does not cover

- No page was driven in a browser for a signed-in role (the harness has no browser, and a role account is a person
  to make). The resident pages' manual list is in the test plan. `check-resident-id-search.mjs` needs a running dev
  server and was not run.
- **A configured role that borrows staff and holds Edit cells reaches these tables with no policy of its own**, which
  is R3's database half; no login holds such a role (the four that exist borrow the volunteer and so read who and
  where, proved above).
- Production apply is Lutan's, from the main checkout: `--dry-run`, then apply.
