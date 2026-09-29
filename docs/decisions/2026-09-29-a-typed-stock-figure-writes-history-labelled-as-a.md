# 2026-09-29 — A typed stock figure writes history, labelled as a correction (0112)

Backlog item "A single-cell stock edit writes no history, but the `0093`
back-fill treated past ones as counts". **Chosen by Lutan, 2026-09-29, from
three options** (one way in with a source flag / leave out of history with a
note / route through `record_stocktake()` as a plain count).

- **The split that forced the question.** Before `0093`, a figure typed on
  Management → Medications / Diets was history, because the back-fill turned
  every `stock_on_hand` + `stock_counted_at` into one synthetic stocktake
  (`counted_by` null, its own `stocktake_id`). After `0093`, the same edit
  wrote nothing: `updateMedicationStock` / `updateDietTypeStock` updated the
  column directly and `0083`'s trigger only stamped the date. Leaving it out
  "on purpose" would have frozen that split; the page note would have had to
  describe a rule that holds only after a date.
- **One way in, honestly labelled.** `stock_counts.source` is `count`
  (`record_stocktake()`), `correction` (the cell edit, via the new
  `record_stock_correction(kind, id, count)`, admin and management only) or
  `backfill` (`0093`'s synthetic rows, identified by `counted_by is null`).
  A typed figure is not a count, and 0093 was right that logging it as one
  would invent usage; the flag keeps the history and the distinction.
- **Corrections are not paired into usage.** `stock_count_intervals` now
  skips `correction` rows, and so do the two delivery-timing reads. The
  Stock-between-counts page's existing "changed by hand … after this count"
  note keeps working, since `stock_counted_at` still moves on a correction
  and the correction is not the newest count. `backfill` rows still pair:
  they are the only baseline the earliest items have.
- **A blank cell clears the item to "not counted" and writes no row** — there
  is no figure to record.
- **No double stamp.** The function sets `stock_on_hand` and lets `0083`'s
  trigger stamp `stock_counted_at` once; the history row copies that stamp
  back, so latest-row and item agree, as in `record_stocktake()`.
- **0093's comments are corrected by replacement, not edited** (applied files
  are never edited): `0112` re-comments `stock_counts` and `record_stocktake`
  to say where a typed figure goes. The header prose of `0093` and `0096` that
  says the cell edit "writes no history row" stays as the record of the day
  it was true.
- **Not built:** showing corrections as a list on any page. They are in the
  table for the day something wants them.
