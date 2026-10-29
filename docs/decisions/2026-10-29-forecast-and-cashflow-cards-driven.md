# 2026-10-29: the three forecast and cashflow cards, driven for the first time

`food_forecast`, `medicine_forecast` and `view_cashflow` (created by `0280`) were driven as one-card logins, 12 steps, none skipped. Results are in `docs/card-access-faults.md` under the heading of this date.

**Found, not fixed:** the diets and medications pages each draw four links (Stocktake, Stock between counts, Purchasing, Record a delivery) that a read-only forecast card cannot open; every one lands on `/no-access`. This breaks the rule of 2026-10-27 that a control is drawn only when the card allows its action. Eight gates across two files is more than a one-line change, so it is recorded with the activity each link needs (`stock.count`, `stock.usage`, `stock.purchasing`, `stock.delivery`) for a stream of its own.

**Why not fixed here:** the brief limits fixes to one-line gates inside these three cards.
