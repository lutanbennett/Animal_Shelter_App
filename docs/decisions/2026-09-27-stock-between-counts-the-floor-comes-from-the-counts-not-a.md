# 2026-09-27 — Stock between counts: the floor comes from the counts, not a number

Follow-up to "Stock between counts reads usage from recorded deliveries"
(above): the CSV, the percentage and the "tiny items don't shout" floor.

- **The floor is what two counts can get wrong, per item.** The 2026-09-26
  entry ruled out one absolute floor (units differ per item), and the
  backlog offered per-unit, per-item or a minimum on the planned figure. A
  minimum on the plan still needs a number in some unit, and a per-item
  setting needs a column and someone to fill it in for every item. What
  actually makes a small item shout is counting noise: two tablets planned
  and three used is +50% and one miscount. So `countMargin`
  (`src/lib/management/stock-usage.ts`) is the smallest gap the item's own
  counts can tell apart: **one** for a unit counted piece by piece (tablet,
  capsule, sachet, application, dose, can, portion), and **5% of the larger
  of the two counts** for one read by eye (ml, g, mg, mcg, IU, drop, cup) —
  a 400 ml bottle read by eye is good to about 20 ml, a 5 kg sack to about
  250 g. A row is marked only when it is past the 25% ratio **and** past
  this margin. No absolute number was reintroduced: the margin is in the
  item's own unit and scales with its own stock. The 5% is a judgement,
  like the 25%; move it in one place if stocktakes turn out finer or coarser.
- **The floor also applies below zero and with nothing planned.** Used a
  little below zero (within the margin) is a miscount, not "at least N
  arrived unrecorded"; one tablet used with nothing planned is not marked.
  Both read "About as planned" with the gap and the margin given, as the
  new `withinCount` reading, so nothing is hidden, only not marked.
- **Difference is its own column**: used − planned, signed, with the
  percentage of the plan underneath. **No plan, no percentage** — a dash,
  never ∞% or 0%. Where usage can't be stated (unit change, same day,
  unrecorded deliveries, deliveries not loaded) the whole column is a dash,
  as Used is.
- **The CSV is built on the server, downloaded in the browser.** The page
  is a server component and the table is small, so it renders the CSV text
  once and a small client button (`CsvDownloadButton`) saves it. Cashflow's
  field quoting and BOM download moved to `src/lib/csv.ts` and both pages
  use it, rather than a second exporter. Plain numbers, the unit in its own
  column, a blank cell where the page shows "—", and the reading text in
  the last columns, so the file says what the page says.
- **Deliveries on a stocktake day are tagged Before / After that day's
  stocktake** in the recent list (`sideOfCount`), read from the stored
  instant exactly as `receivedAtFor` wrote it, so the tag can't disagree
  with the interval the delivery landed in. "Between" appears only when an
  item was counted twice that day and the delivery sits between them.
