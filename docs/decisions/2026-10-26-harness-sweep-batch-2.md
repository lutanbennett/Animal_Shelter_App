# Harness sweep, batch 2 (2026-10-26)

Backlog item "Sweep the remaining red database harnesses in bounded batches". The hold of 2026-10-25 lifted when hard-coded
security left both `src/` and the database (`0259`, `0264`). **Ten harnesses, ten verdicts: one deleted, eight fixed, one fixed
with a genuine fault filed. Scripts only: no migration, nothing under `src/`.** 38 red harnesses remain.

The rule that governed every verdict: **a harness that tests a removed mechanism is deleted or reduced to what still exists; it is never
edited to assert that a role column, a role scope or a role name is consulted.** Nothing here asserts `roles.scope_*`, `opens_app`,
`sees_login_emails`, `sees_all_*()` or `is_clinic_login()`.

## Verdicts

| Harness | Verdict | What it was, and what happened |
|---|---|---|
| `check-perm-convert-residents` | **FIX** (28 reds, all one cause) | Asserted that the volunteer, the doctor's other-clinic residents and a role with an `own_clinic` scope were *refused* (the volunteer floor, `sees_all_residents()`, `is_clinic_login()`). All retired: `sees_all_residents()` was dropped by `0264` and answered `true` since `0259`. The cell-to-CRUD matrix is real coverage and stays: a custom role with Read cells reads, with Edit cells writes, and a role with a scope answers as any other role holding the same cells. The volunteer and the doctor are no longer probed (see "Live roles" below). 135 checks hold. |
| `check-perm-convert-medical` | **FIX** | `diet_types` is `diets`. Same retired scoping (`c_scoped`, the vet's clinic reach). Management, the volunteer and the doctor are no longer pinned. The scoped role now answers as the Edit role, except it cannot book a visit (that is `visit.book`, which it does not hold). 143 checks hold. |
| `check-perm-convert-orphans` | **FIX** | Same rename (`diet_type_id` is `diet_id`) and same live-role removal; the archived-Staff stand-in role is gone. `check_round_applies()` reads `rounds` as the caller, so a login with no rounds read is stopped there before the policy is asked; counted as refused (-3), and never as allowed. 519 checks hold. |
| `check-perm-convert-stock-and-lists` | **FIX, and one GENUINE FAULT filed** | Rename; live roles unpinned. `diets` is no longer a price table (`0239`: recipes, no prices, readable by whoever picks a diet through `stock.diets`, `resident.register` or `medical.diet`), so the harness now expects that and the "price tables ask no medical cell" sweep covers `medication` only. **The fault** is below. 387 checks hold, 1 known fault counted. |
| `check-perm-convert-admin` | **FIX** | Two stale fixtures, not a policy fault. (1) Admin's DELETE of the first `prescriptions` row hit `enforce_deceased_lock()` (23001), because that row belongs to a dead resident; the policy had let it through, so 23001 now counts like the foreign key (23503) already did. (2) Management was expected to update `site_content`; it holds no `website.content` cell on dev today, so the expectation follows the cell. 186 checks hold. |
| `check-perm-convert-vet` | **DELETE** | "The vet's 54 policies ask `is_clinic_login()`". The function is gone and the 60 `doctor_*` policies were dropped by `0264`. It still printed green, but only because it compared nothing with nothing. The doctor's reach is `check-doctor-clinic-scope` and `check-doctor-own-clinic-writes`, both green. |
| `check-place-order-roles` | **FIX** | Built a **Staff** login (retired in `0173`; not resurrected). It now builds a throwaway custom role holding `facility.enclosures` at Read, which is the access the Staff login had, expressed as a cell. The doctor part is dropped (it asked what a doctor's live cells open). The zone-order assertion now compares the internal zones: `/enclosures` folds the off-site zones into one chip and lists them after the rest (2026-10-08), so comparing every zone was always going to fail on dev data. The throwaway role is deleted at the end. Needs a dev server; run green against `:3006`. |
| `check-audit-undo` | **FIX** | `record_intake` asks `resident.register` (`0248`); it now runs as the Admin login. A restored visit differs from the original in `calendar_out_of_date_at`, which the insert trigger stamps with `now()` (the restored visit is rightly flagged for a calendar resync); that one column is excluded and the failure message now names any other differing column. |
| `check-medical-soft-delete` | **FIX** | Same `record_intake` fix. Section E (a doctor's resident scope drops an archived visit and returns on restore) tested `current_clinic_resident_ids()`, which `0264` left a dead cluster: `current_user_clinic_ids()` answers `{}` for everyone. Removed, with a comment saying why. A, B, C, D, F, G, H hold. |
| `check-diets-sheet` | **FIX** | Was seeding the pre-`0239` model. `diet_types` is now the ingredient list, a recipe is a `diets` row with servings per size, and each ingredient carries `qty_per_serving`. The expected quantities are compared as numbers, since the view's numeric scale (`0.10`, `0.250`) is not the check's business. |

**The three `record_intake` seeders had one shared cause, as predicted:** `0248`'s `resident.register`. They now call it as Admin, whose
answer is `true` without a card and does not move when a card is edited on Settings → Who does what. That also makes them immune to
the Doctor test role being edited (see `doctor-is-the-test-role`).

## Live roles: why management, the volunteer and the doctor are no longer probed

Four of these harnesses pinned the cells of `management`, `volunteer` and `doctor` (for example "Management reads and writes the seven medical
tables"). Those cells are **live data** under cards-only access: Lutan edits them on Settings → Who does what, and on dev Management currently
holds no medical, website or resident-record cell at all, which is exactly what "a role is a placeholder until a card is assigned" means. A harness
that pins them goes red whenever a card is edited, and then has to be "fixed" by re-asserting whatever the cards say that day, which is the
hard-coded security the rule forbids. The harnesses now probe **admin, no role and custom roles whose cells the harness writes itself.**
Per-role coverage of the live roles belongs to `check-permission-parity` and the role-cards checks, which derive their expectations from the cells.

## The extra deliverable: the two policies that "do not ask `sees_all_residents()`"

Read from dev on 2026-10-26, all `pg_policies` rows on `residents`, `placement_history` and `adoption_updates`:

- **`residents_admin_delete`** (DELETE, `is_admin()`)
- **`placement_history_admin_delete`** (DELETE, `is_admin()`)

Every other policy on the three tables asks `has_permission(...)` on a resident card cell, and nothing else. **Both of the two are correct, not over-grants:**
they are the Admin bypass, which sits outside the card system by Lutan's ruling of 2026-10-25 (`CLAUDE.md`, "Hard-coded security is forbidden"), and Admin
being the only principal that can delete a resident or a placement row is the intent (`management`'s delete is refused in the harness, "C2 closed").
Nothing is filed in `docs/card-access-faults.md` for them. The count of "2" was never two missing role checks: it was the two Admin deletes, which have no
card and so never called `sees_all_residents()`. The function itself is gone (`0264`), so the question closes with this file.

## The genuine fault (filed, not fixed)

**A login whose only cell is `reference.add_while_recording` cannot add a medication.** `medication_insert_perm` allows it, then the BEFORE INSERT
trigger `check_unit_in_units()` (invoker rights) looks the default unit up in `units`, which the login cannot read (`units_select_perm` lists ten cells and
not this one), and raises *"There is no unit called "tablet". Add it under Settings -> Units first."* The message is false: the unit exists. A role that
holds any of the ten cells beside it (for example `medical.prescriptions` at Read) is unaffected, so it may never bite in practice, and it is not known whether
any real role holds the cell alone. Filed as a row in `docs/card-access-faults.md`. In `check-perm-convert-stock-and-lists` it is **counted as a known fault and
does not fail the run**, because the other 386 checks in that harness are sound; the line prints in `--verbose` and the count prints every run, and if the database
starts allowing the insert the case turns into an ordinary pass. Fixing it needs a migration (a units read for that cell, or `check_unit_in_units()` as `security
definer`), which this stream was forbidden to write.

## What is not changed, and what remains

- `diet_types` (now the ingredients table) has no table-level policy coverage in `check-perm-convert-stock-and-lists`; the old assertions were about the pre-`0239`
  single diet table, which is `diets`. Worth one line when the diets work is next touched.
- `check-permission-tables` still carries literal cell counts (said so in batch 1); not touched.
- **38 red harnesses remain** (the 48 in batch 1's table less these ten) plus 17 that need a dev server. The next bounded batch, permissions first: `check-director-answers-schema`,
  `check-recurring-jobs` (a doctor refused a recurring job: check it is the card, not a role), `check-who-does-what`, `check-menu-coverage`, `check-resident-sections`,
  `check-security-schema-fold`, `check-weight-one-per-day` and `check-weigh-first` (the `0248` seeder cause again, likely), `check-preferred-channels`, `check-social-shares-schema`.
  Then the diets/stock family, which all fail on `diet_types.daily_qty_*` and `resident_diets.diet_type_id` (one cause, one rename: `check-medication-label`, `check-pack-sizes`,
  `check-safety-stock`, `check-stock-corrections`, `check-stock-on-hand`, `check-stock-receipts`, `check-prescriptions-updated-at`, `check-standard-diet`).
