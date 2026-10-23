# 2026-10-23 — Units of measure are data (0252, schema half)

- **Existing rows are untouched.** `diet_types.unit` and `medication.dose_unit` keep storing the unit's
  name as text. The new `units` table is a list to pick from, not a foreign key.
- **The check is a trigger on write, not a constraint.** A check or foreign-key constraint is validated
  against every existing row and could refuse data already in the database (dev has 24 tablet rows and a
  handful of g/can/cup rows; production has more and we cannot see it). The trigger runs only on insert,
  or when the unit column itself changes, so an untouched legacy value always saves. It refuses a unit
  that is not in the table, is archived, or is not tagged for that list (a pill for an ingredient).
- **`medication_dose_unit_check` (0027) is dropped.** It was a fixed-list CHECK that would have refused
  every new unit, defeating the table. The trigger replaces it, and is stricter-in-the-right-way: the
  list now lives in data. Existing rows were valid under the old list and the seed contains all of it.
- **Archived** units stay readable and stay on rows already using them; only a new use or a change to
  one is refused. There is no delete policy or grant.
- **Write gate** is `reference.types` Edit plus either stock cell (`stock.diets` or `stock.medications`),
  the activity form of `canEditItemSettings`, which is per kind; one table serving both lists accepts
  either. Reads: every signed-in login.
- **`kg` is not seeded.** `DIET_UNITS` has no kg; kg is a *conversion* unit (`item_unit_conversions`,
  0118), the base staying g. No dev ingredient uses it as a base. If Lutan wants kg as a base, he adds
  it on the Units screen. (The backlog item listed kg among ingredients; a seed added after applying
  to dev would have made dev and production differ, so it is left for the screen.)
- **`each`** Thai is `ชิ้น`, general rather than eggs-only; Lutan can correct it on screen.
- **Consumer header** names the three `src/app/admin/diets/` files the app half will change, so the
  runner warns if this ships to production ahead of the release that reads it.
- Tags are a first guess; Lutan corrects them on screen. Ingredients: g, ml, can, sachet, cup, portion,
  each. Medicines: tablet, capsule, mg, mcg, IU, drop, application, dose. Both: g, ml, sachet.
