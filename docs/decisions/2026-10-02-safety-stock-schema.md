# 2026-10-02 — `safety_stock` on medication and diet_types, in the base unit (`0128`)

Schema half of Management → Purchasing (backlog, Lutan 2026-09-28). The
feature half reads and writes it.

- **Base unit, not "the item's unit".** The backlog said "numeric, the item's
  unit", written before `0118` gave an item several units. The column is stored
  in the base unit (`medication.dose_unit`, `diet_types.unit`), the same as
  `stock_on_hand`, `stock_counts.counted_quantity`, `stock_receipts.quantity`
  and the forecasts, so Purchasing's sum (counted − used + received against
  usage + safety) never mixes units. A form may take "two bags" in the purchase
  unit and convert on save, as deliveries do.
- **No unit column.** A second column would be a second source of truth, and a
  conversion edited later (`item_unit_conversions` is mutable) would silently
  re-value a saved floor if it were kept in purchase units.
- **Both tables, one migration.** A food that is always in use is the same case
  as a fluid that is, and the page covers every diet as well as every medicine
  (backlog: "make the safety stock available on `diet_types` too"). Adding
  `diet_types.safety_stock` later would cost the second schema PR this one
  exists to avoid.
- **No pack-size column.** The backlog allowed "pack size, if wanted". The
  purchase unit in `item_unit_conversions` already is the pack
  (`base_units_per`), so rounding up to a whole pack needs nothing new.
- **`>= 0`, null = none; zero is not null.** A check on each table. Zero is
  accepted and distinct from null so a form can say "deliberately none" if it
  wants to; the sum treats both as no floor.
- **Access is inherited.** Neither table has column grants or a `select *`
  view, so the column is writable by exactly who can already edit the table
  (management and admin) and no view exposes it. No policy added.
- **Down-migration:** none; an unread nullable column is left in place.
