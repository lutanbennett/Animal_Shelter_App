# 2026-09-30 — Units of measure, schema half (0118)

- **Today's unit becomes the base unit; nothing is rewritten.**
  `diet_types.unit` and `medication.dose_unit` stay exactly as they are and are
  now *defined* as the item's base unit. Every existing `stock_counts` and
  `stock_receipts` row is already in it, so no row was touched and the forecasts,
  prescriptions, diets and stock-on-hand keep reading base units unchanged.

- **The point-in-time factor is a copy on the row, not a reference to the live
  conversion.** This is the decision a future reader needs. `item_unit_conversions`
  is mutable on purpose: a wrong factor ("a bag is 180 cups, not 200") is corrected
  by editing it. If a receipt or count only pointed at that row, the correction
  would silently re-value every past delivery and stocktake — the failure the
  `stock_counts` history split (0093, 0112) was built to avoid. So each row
  records what was typed alongside the factors in force then:
  `entered jsonb = [{"quantity","unit","factor"}, …]`, on both `stock_receipts`
  and `stock_counts`. The row's own `quantity` / `counted_quantity` remains the
  base-unit total and is what every reader uses, so no view or forecast had to
  change. Measured: a receipt of 2 bags at factor 200 stays 400 cups after the
  conversion is edited to 180 (`scripts/check-unit-conversions.mjs`, step E).

- **A jsonb array, not `entered_quantity / entered_unit / entered_factor`.** The
  backlog sketched three columns. An array costs nothing extra for the single-unit
  case and holds "1 bag and 10 kg" without a second migration, and mixed entry on
  the stocktake was still undecided. The price is that the lines are not plain
  columns to `group by`; nothing needs that, because reporting is done in base
  units.

- **A CHECK keeps the copy and the figure from drifting apart.** `entered` must be
  a non-empty array of well-formed lines (quantity ≥ 0, unit text, factor > 0)
  whose sum of quantity × factor equals the base-unit total, to 1e-6 relative.
  The first version of the constraint let a malformed `entered` through: the helper
  returns null for one, and a CHECK that evaluates to null *passes*. Found by the
  harness; the comparison is now wrapped in `coalesce(…, false)`. Worth
  remembering for any CHECK built on a function that can return null.

- **`entered` is null for everything that predates the feature and for anything
  typed in the base unit**, including `record_stock_correction()` rows and the
  0093 back-fill. Null means "entered in the base unit", not "unknown".

- **`record_stocktake()` keeps its signature.** Each list element may now carry an
  optional `entered` array beside `id` and `count` (count stays base units). It is
  validated against `count` before anything is written and stored on the history
  row; without it the function behaves exactly as in 0093/0112. Deliveries need no
  function, because `stock_receipts` is written directly: the feature half sets
  `quantity` and `entered` together and the CHECK enforces that they agree.
  `stock_receipts.unit` is still stamped by trigger and stays the base unit, so
  `stock_count_intervals`, which compares units, is untouched.

- **One purchase unit and one count unit per item**, enforced by partial unique
  indexes; the same row may be both and neither is required. Units are unique per
  item case-insensitively. A conversion may not repeat the base unit, but that is
  a cross-table rule and is left to the feature's form rather than a trigger.

- **Conversions are edited by admin and management, read by everyone who counts.**
  admin and management write; admin, management, staff and volunteer read (the
  stocktake roles). Anonymous has no grant.

- **Cost has no new column.** The feature half stores price per purchase unit and
  derives the existing per-base-unit cost as price ÷ `base_units_per`. Whether a
  factor can be approximate (a cup of kibble) and whether the page should say so is
  still to be decided while building; nothing in the schema forces either answer.

- **Dev migration edited once before merge.** The null-CHECK fix above was made to
  `0118_unit_conversions.sql` after it had been applied to dev; its
  `schema_migrations` row was removed and the file re-applied. This is permitted
  because the file was unmerged, dev-only and this stream held the only migration
  slot. Production has never seen it.
