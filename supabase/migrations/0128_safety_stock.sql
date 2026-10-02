-- consumer: none
--
-- Safety stock on medication and diet_types (backlog, "Management →
-- Purchasing: how much of each medicine and food to buy, for a period you
-- choose, with a safety stock"; schema half — the Purchasing page and the
-- add/edit forms are the feature half and read and write this).
--
--   safety_stock   numeric, null = none. A floor kept on the shelf whatever is
--                  prescribed or fed today (IV/sub-Q fluids, common
--                  antibiotics, a food that is always in use). Purchasing adds
--                  it to "needed" for every period. Must be >= 0.
--
-- ## The unit: the item's BASE unit
--
-- "numeric, the item's unit" in the backlog predates 0118, which gave an item
-- several units. Stored here in the BASE unit — medication.dose_unit,
-- diet_types.unit — exactly as stock_on_hand (0083), stock_counts.
-- counted_quantity (0093), stock_receipts.quantity (0096) and the forecasts
-- are, so Purchasing's sum (counted - used + received vs. usage + safety)
-- never mixes units. The form may accept "two bags" in the purchase unit
-- (item_unit_conversions, 0118) but converts to base on save, the way
-- deliveries do. There is deliberately NO unit column: one source of truth,
-- and a conversion edited later cannot silently re-value a saved floor.
--
-- ## Both tables, one migration
--
-- A food that is always in use is the same case as a fluid that is, and the
-- Purchasing page covers every diet as well as every medicine, so diet_types
-- gets the column now rather than costing a second schema PR. Pack size needs
-- no column: the purchase unit in item_unit_conversions is the pack.
--
-- ## Nothing changes for anyone
--
-- Additive and nullable; no code reads it yet; no trigger, no default, no
-- back-fill. A column inherits its table's RLS and grants, and neither table
-- has column-level grants or a select-* view, so write access stays exactly
-- who can already edit medication / diet_types (management and admin).

alter table medication add column if not exists safety_stock numeric;
alter table diet_types add column if not exists safety_stock numeric;

alter table medication drop constraint if exists medication_safety_stock_nonnegative;
alter table medication add constraint medication_safety_stock_nonnegative
  check (safety_stock is null or safety_stock >= 0);
alter table diet_types drop constraint if exists diet_types_safety_stock_nonnegative;
alter table diet_types add constraint diet_types_safety_stock_nonnegative
  check (safety_stock is null or safety_stock >= 0);

comment on column medication.safety_stock is
  'Floor kept on the shelf regardless of current prescriptions, in the item''s BASE unit (dose_unit) like stock_on_hand. Null = none. Purchasing adds it to the quantity needed for the period. No unit column on purpose: a purchase-unit entry is converted to base on save (item_unit_conversions, 0118).';
comment on column diet_types.safety_stock is
  'Floor kept on the shelf regardless of the residents currently on this diet, in the diet''s BASE unit (unit) like stock_on_hand. Null = none. Purchasing adds it to the quantity needed for the period. No unit column on purpose: a purchase-unit entry is converted to base on save (item_unit_conversions, 0118).';
