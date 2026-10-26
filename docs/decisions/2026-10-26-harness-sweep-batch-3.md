# Harness sweep, batch 3 (2026-10-26)

Backlog item "Sweep the remaining red database harnesses in bounded batches". Batch 3 is the diets/stock family, eight harnesses, plus one
named production check. **Scripts only: no migration, nothing under `src/`.** All eight were red; all eight now print `HARNESS-OK` against
dev. **30 red harnesses remain** (38 after batch 2, less these eight), plus 17 that need a dev server.

The permissions-first ten that batch 2 recommended were skipped **on purpose**: `check-who-does-what`, `check-resident-sections` and
`check-menu-coverage` test card wiring, and `card-decisions-schema` was changing card grants in migration `0265` during this batch. Fixing them
then would have pinned them to a card model mid-change. They are next.

The rule that governed every verdict is batch 2's: a harness that tests a removed mechanism is cut down to what still exists, never edited to
assert that a role column, role scope or role name is consulted. Nothing here asserts `roles.scope_*`, `opens_app` or `sees_login_emails`,
and none of the eight pins the cells of management, the volunteer or the doctor (live data under cards-only access).

## Verdicts

| Harness | Verdict | What it was, and what happened |
|---|---|---|
| `check-medication-label` | **FIX** | Inserted a `diet_types` row with `daily_qty_*`. `diet_types` is the ingredient list since `0239` and lost those columns (`0260`); the insert is now `(name, unit)`. Proves `label_drive_file_id` round-trips and no anon-readable view names it. |
| `check-safety-stock` | **FIX** | Same insert. Proves `safety_stock` is null when omitted, round-trips at full precision, 0 is not null, negative is refused on both tables. |
| `check-pack-sizes` | **FIX** | Same insert (three throwaway ingredients). Proves one default purchase size per item, the delivery-derived cost per base unit, and the typed-only and gift-only fallbacks. |
| `check-stock-on-hand` | **FIX** | Same insert, inside the shared `cases()` helper. Also dropped "file ran twice" from its report: it replays no migration, and the line was untrue. |
| `check-prescriptions-updated-at` | **FIX** | The `resident_diets` insert named `diet_type_id`; the column is `diet_id` (`0239`). Its replay of `0078` is unchanged and still harmless. |
| `check-stock-corrections` | **FIX** | The rename, plus two stale fixtures. (1) "management" and a "clerk" copied from the retired `staff` role: management is now the Admin login (whose answer does not move when a card is edited) and the clerk is a throwaway custom role holding one unrelated cell. (2) **The harness replays `0112` first, and that replay re-creates 0112's `record_stock_correction`/`record_stocktake`, which gate on the long-gone `current_user_role()`. The harness shim answers `management` for every custom role, so the replayed function let the clerk in and the refusal check failed.** What is live is the `0178` body, which asks `stock.correct` and `stock.diets`/`stock.medications`. The harness now saves the live definitions, replays, and restores them, so every assertion runs against what production runs (rule 4, `2026-10-02-replay-or-assert-live.md`). |
| `check-stock-receipts` | **FIX** | The rename, and four stale expectations. A receipt edit (unit, quantity, item) is refused since `0235` (only its cost may change), so "unit re-stamped on edit/move" became "refused, so the stamp cannot drift"; the odd-unit interval case now inserts a receipt after `dose_unit` changes. Management, volunteer and doctor are no longer probed: Admin records and may change a cost (not a note), and a custom role with one unrelated cell reads no receipts or intervals and records none; anon is refused by the grant. |
| `check-standard-diet` | **FIX, cut down** | It replayed `0087`, whose back-fill (every living resident without a current diet got the standard one; a booked-ahead resident stopped at today + 4) is written against `diet_types.is_standard` and `resident_diets.diet_type_id`, both gone since `0239`. That back-fill was a one-off whose result is history, and it can no longer run. What is live and now asserted: `diets.is_standard` is not-null boolean default false, `diets_one_standard` is a partial unique index, `diet_types` has no flag, exactly one standard recipe exists (its name is not pinned), a second is refused, and moving the standard leaves exactly one. |

**No harness was deleted and no genuine fault was found.** The expected shared cause (the `diet_types` rename) was five of the eight; the
other three had their own causes, as batch 2 warned. A `HARNESS-OK` here is not "nothing compared with nothing": each harness inserts real
rows or reads live schema and asserts on them, and each prints the list of what held.

## The production check

`node scripts/check-production.mjs clinic-login-helpers` (the entry is in `scripts/lib/readonly-checks.mjs`, where the named checks live;
`check-production.mjs` only runs them). Read-only like the others (one SELECT, wrapped in `begin read only`, covered by
`check-production.test.mjs`, which passes). For each of `current_clinic_resident_ids`, `clinic_login_owns_visit`, `doctor_can_write_attachment`
and `clinic_login_may_edit_doctor` it reports whether the function exists and which function, policy, view, check constraint or column default
mentions it, comments stripped, whole-word match. Names only.

**Read from production at 09:13 UTC on 2026-10-26: all four exist, and none is called by any policy, view, other function or column rule.**
Dev gave the same answer. The detector was checked on dev against a name it must find (`has_permission`: 33 function bodies). The only `src/`
mentions are two comments. Nothing was dropped (it needs a migration and the slot belonged to `0265`). The drop is now a straightforward schema
PR; the harnesses that still name the functions (`check-perm-functions`, `check-doctor-own-clinic-writes`, `check-medical-soft-delete`) change
in the same PR, and the check should be re-run just before the migration is written, because a reading is a measurement.

## What is not changed

- `check-prescriptions-updated-at` and `check-stock-corrections` still replay old migrations. Replays that overwrite a live function are a trap
  for any harness of this kind; worth checking when the other 30 are taken.
- If a harness here starts failing on a permissions error, suspect `0265` (applied to the shared dev database in the same batch) before the harness.
