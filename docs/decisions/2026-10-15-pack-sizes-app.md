# 2026-10-15 — Several pack sizes: app half

**Decision.** The units screen takes many bought-in sizes with one usual; Diet stock and Medication stock price
from the latest delivery, with the typed price as the fallback. Cashflow was left on the typed price.

**Screen.** Two plain boxes per size instead of one: *We buy it in this size* and *This is the size we usually
buy*. Ticking "usually" also ticks "buy". The size that is the usual one has both boxes locked with a line saying
to tick "usually" on another size to change it, because the 0199 triggers would put the flag straight back on a
sole default that was un-ticked; handing it on is the only meaning the screen can honestly offer. Badges read
"Usually bought" and "Bought in". Counted in is unchanged (still one per item).

**Which forecasts moved.** The money on Management → Diet stock (card forecast lines and the "all diets" total):
`diet_forecast` prices in SQL at `cost_per_unit`, and a migration is not this PR's to carry, so the page keeps its
quantity and multiplies by the delivery cost per base unit when an item has a priced delivery. An item with none
keeps the SQL figure exactly as before. Medication stock shows no money in its forecast, so only the cost-per-unit
line and the pack price moved onto the delivery price, and each says "from the delivery on <date>".

**Which were left, and why.** `cashflow_forecast` (0183) and the Cashflow page read `cost_per_unit` inside SQL.
Leaving it means a diet with a priced delivery can show a different baht figure on Diet stock than on Cashflow
until a function migration lands; that is filed on the backlog. No number the Director has already seen on
Cashflow changed.

**Gift deliveries.** Cost 0 is skipped by the view (0199) and `effectiveCost` refuses a non-positive figure too,
so a donation never pulls a price to zero.

**Price field.** Typing a price per pack still writes `cost_per_unit`, but once an item has a priced delivery that
typed price no longer drives the forecast; the Price per pack panel says so, with the delivery date, rather than
letting a number be typed that does nothing.

**Purchasing, deliveries, stocktake.** Audited, unchanged: all go through `defaultUnit(…, "purchase" | "count")`,
which resolves the default first. Purchasing carries no prices.

**Not built here (backlog).** Several lines in one delivery; counting in several sizes at once; "about 3 × 20 kg or
4 × 14 kg" in Purchasing; Cashflow on the delivery price.

**Proof.** `scripts/check-pack-sizes.mjs` (rollback harness on dev): kibble in 20/14/10 kg bags; deliveries 400 cups
for ฿3,200, 100 for ฿900, 140 for ฿700 (the 14 kg special, ฿5.00 a cup) and 200 donated; the view gives ฿5.00 a cup
and 1,000 cups forecasts ฿5,000 (the typed ฿8 would have said ฿8,000).
