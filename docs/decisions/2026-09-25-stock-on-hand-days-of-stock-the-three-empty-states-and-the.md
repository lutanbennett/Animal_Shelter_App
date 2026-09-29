# 2026-09-25 — Stock on hand: days-of-stock, the three empty states and the Count action

- **Days-of-stock is read, not stored, and it runs from the count, not from
  today.** `readStock()` (`src/lib/management/stock.ts`) takes the fixed
  Next-30-days forecast quantity as the rate (quantity ÷ 30 per day), takes
  off the usage since `stock_counted_at` at that rate, and divides what is
  left by it, floored to whole days. So a 10-tablet count at 1 a day reads
  10 days on the day it is counted and 6 days four days later, with nobody
  touching it — the schema half left "show the age or subtract the usage" to
  this stream, and it does both: the age is shown under the count as well.
  The rate always comes from the fixed 30-day window, never the custom
  From/To one, so the figure does not change when someone picks a window.
  The usage since the count is estimated from the *forward* forecast; for a
  prescription that started or ended since the count that is approximate,
  and a recount fixes it.
- **Null, zero and "used up" are three different cells.** Null reads *Not
  counted* in the stock cell and *—* for days; a counted 0 reads *Out of
  stock* in red; a positive count the forecast has used up since reads
  *Probably used up since the count — count again*, also red. An item with
  nothing due in the next 30 days reads *None due in the next 30 days*
  rather than an infinite or blank figure. None of these is ever "0 days"
  for an item nobody counted.
- **The flag is `daysLeft <= reorder_lead_days`**, inclusive: 7 days left
  on a 7-day lead time is already the last day to order. Out of stock and
  used up count as 0 days left, so they flag whenever a lead time is set;
  a null lead time never flags.
- **Counting is its own action, separate from Edit.** The schema half noted
  that the trigger restamps whenever the update names `stock_on_hand`, so an
  edit that sends every field would record a stocktake on every rename. The
  row's Edit (name, unit, price, lead time) therefore never sends
  `stock_on_hand`, and Count sends only it — every Count save restamps, which
  is what re-confirming a figure should do. The lead time is in Edit, because
  it describes the supplier rather than the cupboard.
- **Both figures are validated before they reach the constraints**: a count
  must be a number ≥ 0 (blank = not counted), a lead time a whole number of
  days 1–365 (blank = none). 365 is not in the schema — it is there so a typo
  gets a readable message rather than an integer-overflow error.
- **The usage since the count is taken off in whole shelter calendar days**
  (Asia/Bangkok), the same N as the "counted N days ago" line under the
  figure, not in elapsed real time. The first version used real time, and
  the browser check caught it: 20 tablets at 1 a day, counted seconds
  earlier, read "About 19 days", because the few seconds of usage pushed the
  quotient under 20 before it was floored. With calendar days a count reads
  its full figure all day and drops by the daily rate at shelter midnight.
  The floor also carries a 1e-9 epsilon, because 0.3 ÷ 0.1 is 2.9999999999999996
  in floating point. `scripts/check-stock-reading.mjs` asserts all of this
  against fixed instants either side of 17:00Z, in local time and under
  `TZ=UTC`, and its three regression cases fail against the real-time version.
