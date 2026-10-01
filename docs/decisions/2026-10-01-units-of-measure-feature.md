# 2026-10-01 — Units of measure, feature half

Builds on `2026-09-30-units-of-measure-schema.md` (0118). No migration.

- **The base unit is the item's existing unit, and everything computed stays in
  it.** `diet_types.unit` and `medication.dose_unit` are not renamed or
  re-meant. Doses, prescriptions, diets, forecasts, Stock between counts and
  Cashflow read base units exactly as before; the new units only change what a
  person types and what a screen shows back. Existing rows have `entered` null
  ("entered in the base unit") and need no rewrite: nothing reads
  `item_unit_conversions` to interpret a saved row.

- **The factor is stamped on the server at save time.** The delivery and
  stocktake actions load the item's conversions, compute the base amount from
  what was typed, and write `quantity` / `counted_quantity` together with
  `entered = [{quantity, unit, factor}]`. The browser sends the unit name and
  the quantity it typed, never a factor; the stocktake sheet's own preview is
  display only. History is never re-valued by a later correction because no
  reader joins to the live table (the Recent deliveries list prints `entered`
  from the row).

- **Decision 1 — a factor may be approximate, and the page says so.** A cup of
  kibble varies with the brand and the scoop. The Units panel states it, the
  delivery and stocktake previews carry "≈ (approximate factor)", and the manual
  says to use the usual measure. Nothing stores a tolerance; the schema takes any
  positive number.

- **Decision 2 — one unit per line, no "3 bags and 4 kg".** `entered` is an array
  so mixed entry needs no migration, but on a phone a unit box and a number per
  row is already two controls; two of each per row is a bigger interaction to
  design than this feature. A count of 3 bags and 4 kg is typed as 3.2 bags (or
  64 kg). Revisit if staff ask: only the sheet and `resolveEntered` change.

- **Decision 3 — this does not settle "A single-cell stock edit writes no
  history".** That item was already closed by `0112` (`record_stock_correction()`
  writes a `source = correction` row, kept out of usage intervals). The
  Management single-cell edit stays in the base unit and writes `entered` null,
  which the schema defines as "entered in the base unit"; nothing here changes
  it, so there was nothing further to tick.

- **A conversion named like the base unit is refused** by the form's server action
  (the stored value and the reader's translated label, case-insensitively), as
  the schema decision left it. Duplicates are refused with a message before the
  unique index would; purchase and count are cleared on the other conversions
  before being set, because the partial unique indexes are checked row by row.

- **Price per purchase unit is stored as the existing cost per base unit.** The
  Units panel takes "850 baht a bag" and writes `cost_per_unit = 850 ÷ 200`; the
  purchase-unit price shown is derived again from the cost and the current
  factor. No column was added. The columns keep two decimals, so a price that
  rounds more than 1% off (35 baht a kg as a per-gram cost, 0.035 → 0.04) is
  refused with a message rather than saved wrong. Fixing that properly (more
  decimals on `cost_per_unit`) is a schema change and goes on the backlog.

- **Stock on hand is shown in the purchase unit** as an extra line on the
  Management tables ("≈ 2.4 bag (20 kg)"), from the base figure and the current
  factor. It is a display of the current count, not a stored value, so it moves
  if the factor is corrected, which is intended: the cupboard did not change, the
  estimate of what a bag holds did. Days of stock is unchanged (base units).
