# Forecasts price at the latest priced delivery (0211)

Part (d) of *Pack sizes, the rest*. Schema only; no screen changes.

**Rule.** `diet_forecast` and `cashflow_forecast` now price each item at
`coalesce(item_latest_delivery_cost.cost_per_base_unit, typed cost_per_unit)`. That is the rule
Diet stock and Medication already followed in the app (0199 decision), so Cashflow and Diet stock
now agree.

**Fallback.** No priced delivery (cost null or 0 means unpriced or donated) leaves the typed price
in charge, so the figure does not move. A typed price of 0 with no delivery still counts as a
missing price, as before.

**Medication is included.** The brief named the two functions, but Cashflow's medication line also
read `medication.cost_per_unit`, and the Medication page already prices from deliveries. Leaving it
would have kept one more disagreement between Cashflow and a stock page, so it follows the same rule.

**Pack size.** `stock_receipts.quantity` is already in base units (0118), and the view divides cost
by it, so no pack size enters the sum. A 20 kg bag is never divided as 14 kg.

**Surprise.** Dev had no priced diet delivery, so the diet proof used a receipt inserted inside a
rolled-back transaction. Dev's FBC has a priced delivery (200 for 150 = 1.33 a unit) against a typed
12.50, so the Cashflow medication line for October drops from 1,554 to 1,375. That is the intended
effect, but the size of the gap is worth a look at the real prices when this reaches production.

**Release notes.** Production applies 0211 with the release, so a note would promise users
something before the step is done. None written in this PR.
