# 2026-10-15 — Several pack sizes: schema half (`0199`)

**Decision.** Many sizes may be "bought in" per item; exactly one is the *default*. The price actually paid
on a delivery wins over a typed price.

**Bought in.** The unique indexes on `is_purchase_unit` (0118) are dropped. New `is_default_purchase`
(unique per item, always also bought in) is the one row forms open on, prices are typed against and
Purchasing suggests. Triggers keep it true: the first bought-in size becomes the default, ticking another as
default moves the flag, un-ticking the default hands it on. So `is_purchase_unit and is_default_purchase`
names exactly the row the old index named.

**Price: delivery wins, typed price is the fallback.** `stock_receipts.cost ÷ base quantity` is money that
left the shelter; a typed price goes stale. View `item_latest_delivery_cost` gives the latest delivery's cost
per base unit (cost > 0; 0 means donated and says nothing about price). With no such delivery the item's
typed `cost_per_unit` applies, unchanged and still per base unit. **No per-size price column and no dated
price table** were added: a size's price is just the base-unit cost times its size, so a second typed price
per size could only disagree with the first. Nothing is re-valued by this PR; forecasts still read
`cost_per_unit`. Switching them to the view is the app half's job.

**Readers audited before the drop.** Every reader of the purchase unit goes through `defaultUnit(…,
"purchase")` in `src/lib/units.ts` (deliveries, stocktake, units actions, purchasing, stock cards, units
panel); `UnitsPanel` had one raw `find(isPurchase)`, now routed through it. `defaultUnit` now resolves
`isDefaultPurchase` first. Scripts only mock the type. The forecasts read `cost_per_unit`, not a conversion
row, so they cannot pick a wrong bag. None could pick an arbitrary row, so the drop ships.

**Trap found.** 0118 is re-runnable and would re-create the dropped index; `check-unit-conversions.mjs` now
runs 0199 after it.
