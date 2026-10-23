# Stock pages slow on first load: the form id was the fault, the slowness was not reproduced (2026-10-23)

## The hydration mismatch (fixed)

`RecordDeliveryForm` built each size line's DOM id from a module-level counter (`delivery-line-${line.key}`).
On the server that counter keeps climbing across requests, so the server HTML said `delivery-line-1-quantity`
and the browser, starting at 1 again, said something else. React discards server HTML on a mismatch and
re-renders, and taps in that window are lost. The id is now `useId()` plus the line's position, which both
sides compute identically. Row keys still use the counter; they are not rendered into the HTML.

## The slowness (not reproduced)

The report was 60 s for first load on dev. Measured 2026-10-23, management login, page GET on dev, warm:
`/deliveries` 1.1 to 1.3 s, `/management/purchasing` 1.6 s, `/stocktake` 0.9 s (first hit with compile 1.6 to 2.9 s).
The main queries on each page already run in `Promise.all`. On `/deliveries` two lookups (bill photos, recorder
names) ran one after the other afterwards; they now run together, about 0.2 s. The 60 s was probably dev
compilation plus the hydration retry, but that was not observed. **Production is not measured.**

Also noticed, not changed: `/deliveries` reads every non-correction `stock_counts` row on each load; it grows
with use and is the obvious next thing to bound if production turns out slow.
