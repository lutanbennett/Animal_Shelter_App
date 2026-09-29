# 2026-09-25 — Stock on hand: the column shape (`0083_stock_on_hand.sql`)

The schema half of "Stock on hand and days-of-stock". The feature stream
(`claude/stock-on-hand`) builds on these columns, so their shape is settled here.

- **The same three nullable columns on `medication` and `diet_types`:**
  `stock_on_hand numeric`, `stock_counted_at timestamptz` and
  `reorder_lead_days integer`. Stock is `>= 0` and lead days are `> 0`.
- **Stock uses the item's own unit, and no new unit column.** For medication
  that is `dose_unit` and for diets it is `unit`. `medication_forecast` and
  `diet_forecast` already return `quantity` in exactly those units, so
  days-of-stock is `stock_on_hand / (30-day quantity / 30)` with no
  conversion. A separate stock unit (boxes of 100 tablets, 10 kg sacks)
  would have needed a conversion factor on every row. The cost would come
  first and the benefit later, if at all. The page can still say "tablets".
- **Null means never counted, and it is not the same as 0.** Zero is an
  empty cupboard and should flag loudly. Null means nobody has done a
  stocktake for this item yet, and it should show a blank. Every existing row
  starts null, so the feature launches with every item blank rather than
  falsely out of stock.
- **Days-of-stock is computed, never stored.** A stored figure goes stale the
  moment a prescription changes, and it would then disagree with the 30-day
  forecast next to it on the same page.
- **The reorder flag uses a per-item lead time in days, not a reorder
  quantity.** Lutan chose this over three alternatives: a `reorder_at`
  quantity, one shelter-wide lead time, or no flag. A quantity threshold does
  not adapt when more animals go on the item. Days-of-stock against "the
  supplier takes N days" does. A null lead time means the item never flags.
- **`stock_counted_at` exists because the count is a snapshot.** The cupboard
  starts emptying the moment it is counted. A count from six weeks ago would
  otherwise read as current, and days-of-stock would be wrong by six weeks.
  The feature can show how old the count is, or subtract the usage since then.
  That choice belongs to the feature stream.
- **The stamp is trigger-owned, and it moves whenever the update names
  `stock_on_hand`, not only when the value changes.** If someone saves the
  same figure again, that is a stocktake that confirmed it. It should restamp,
  so a comparison of old and new values would be the wrong rule. Only a
  trigger declared `update of stock_on_hand` can see which columns the SET list
  names, and a function cannot ask. So each table has two triggers, and they
  fire in name order. `*_stock_1_keep` runs on every update and restores the old
  stamp, so a hand-set value never sticks. `*_stock_2_stamp` runs only when
  `stock_on_hand` is named, and it stamps `now()`, or null when the count is
  cleared. One consequence for the feature: its update must include
  `stock_on_hand` only when the count was actually edited. An edit form that
  sends every field on each save would restamp whenever someone renames the
  item or changes its price.
- Evidence: `scripts/check-stock-on-hand.mjs`, a rollback harness against dev.
  Its negative control, with the keep trigger neutered, fails case C.
