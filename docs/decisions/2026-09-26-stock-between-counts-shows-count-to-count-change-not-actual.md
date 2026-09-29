# 2026-09-26 — Stock between counts shows count-to-count change, not "actual usage"

> **Superseded 2026-09-27** by "Stock between counts reads usage from recorded
> deliveries" below: deliveries are now recorded, the page shows *used*, and
> the "fall is a lower bound" / "a rise is an unlogged delivery" readings no
> longer apply. The plan-window, pairing, threshold, departed-residents and
> unit-change points here still hold.

The backlog item asked for actual usage between two stocktakes
(`used = previous count + received − new count`) beside the plan. `0093` gave
the count history; nothing records **received**. The page
(Management → Stock between counts, `src/lib/management/stock-usage.ts`) is
built around what can honestly be said without it, and this is the decision
most likely to be re-litigated:

- **Nothing is labelled "actual usage".** The page shows each count's change
  beside the plan for the same dates, under a standing warning that it is not
  what was used. A page that confidently reported "actual used" from this data
  would be wrong in the direction that gets someone accused of theft.
- **What each direction means.** A fall is a *lower bound* on what left the
  cupboard — receipts are never negative, so `used = fall + received ≥ fall`,
  exact only if nothing arrived. So "fell more than planned" is solid and reads
  "at least N more went than planned". "Fell less than planned" cannot be told
  apart — doses not given, or a delivery nobody logged — and says both. A rise
  is an unlogged delivery; usage over it cannot be read, and the row says so
  rather than showing a negative.
- **The plan reads low for a past interval, and the page says when.**
  `medication_forecast` and `diet_forecast` filter residents by their status
  *today*, so an animal adopted, fostered (diets only) or who died since was
  on the item over those dates but is not in the plan. The backlog item assumed
  the forecasts handled this; they don't. That error points the dangerous way —
  a low plan makes a normal fall look like loss — so rows where it applies carry
  a note ("the plan leaves out N residents…"), found from each departed
  resident's open placement (the day they moved to Adopted / Fostered /
  Deceased, a timestamptz read as a shelter day). Fixing it properly means a
  forecast over placement history — a new SQL function, so a schema PR; not
  done here.
- **The plan window** is the day of the earlier count up to the day before the
  later one, inclusive (`days` days), so back-to-back intervals never count a
  day twice. Counts are dated by shelter day (Asia/Bangkok).
- **Default pairing** is each item's latest count against its last count on an
  *earlier* shelter day, not simply its last two rows: a recount the same
  afternoon would otherwise give a zero-day interval and hide the real one. Any
  two saved stocktakes can be picked instead; only items in both are compared,
  and items counted in just one are named.
- **Marking threshold** is a fall more than 25% away from the plan
  (`GAP_RATIO`), ratio only. An absolute floor ("tiny items don't shout") was
  left out: units differ per item (g vs tablet), so no single floor fits. A
  fall with nothing planned is always marked.
- **Not compared:** a unit change between the counts or since (0093's rule —
  no subtracting across units), and a hand edit made after the latest
  stocktake is noted, because the single-cell edit writes no history.
- **Receipts are split out** as their own backlog item, with the CSV download
  and a percentage column, which only mean something once "received" exists.
