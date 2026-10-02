# 2026-10-02 — Management → Purchasing, and the stock sum it forced us to fix

Feature half of the Purchasing item (backlog, Lutan 2026-09-28; schema `0128`).

## `stock.ts` was missing receipts — Medications' days-of-stock was wrong

The backlog asked us to check, and it was true. `readStock()` took the usage
since the count off the count and stopped. A delivery recorded after the count
(`stock_receipts`, 0096) was never added, because receipts deliberately do not
change `stock_on_hand`. So an item counted at 20, then topped up by 100 the next
day, read as if the shelf still held 20 less the forecast, and `Reorder` fired
on stock that was sitting in the cupboard.

Fixed at the source rather than beside it: `expectedStockNow()` in
`src/lib/management/stock.ts` is the one place that does
`count − used since + received since`, and `readStock()` calls it. Medications,
Diets and Purchasing all go through it, so they cannot disagree.

Consequences worth knowing:

- Days-of-stock on both pages now reads **longer** for any item delivered since
  its last count. That is the correction, and it is in the release note.
- A count of 0 followed by a delivery is no longer `out`; a count used up on
  paper followed by a delivery is no longer `runDown`.
- "Since the count" means `received_at > stock_counted_at`, the same side of the
  line `stock_count_intervals` (0096) puts a delivery on. A hand edit of the
  stock figure re-stamps `stock_counted_at` (0083), so deliveries before that
  edit are in the new figure, not added again.
- Usage since the count is still the **30-day forward rate × whole shelter days
  since the count**, as before. The item suggests the prescription forecast, but
  that RPC only knows today's prescriptions, so a backward window would be no
  more accurate; keeping the rate means the two pages agree to the day.

## Lead time: included, by default, with an off switch

The item said "consider adding `reorder_lead_days` to the period". We include it.
Stock ordered today arrives `lead` days from now; the period is meant to be
covered *from arrival*, and until then the shelf is drawn down. Everything that
must come from the order is therefore use over **lead + period** days less what is
on the shelf now. Leaving it out would order a week that is already half eaten by
the time it arrives. Each item uses its own lead time (none set = 0), the
working line shows it (`14 + 7 lead time`), and a **Include supplier lead time**
switch (`?lead=off`) counts from today for someone who orders in person.

This costs one forecast RPC call per distinct window (the 30-day rate, the
period, and period + each distinct lead time), all in parallel. Per-item windows
rather than a rate × days estimate, because the forecasts count a weekly tablet
on the days it actually falls (0044).

## Safety stock

- Stored in the **base unit** (0128). The form may be typed in the item's
  purchase or any other unit; `resolveSafetyStock()` converts with the factor in
  force **now** and stores base units only, as deliveries do. It is never
  re-interpreted from a live factor afterwards.
- **Null is not zero** in the form: blank saves null ("no floor"), `0` saves 0
  ("a floor of nothing"). Both add nothing to *needed*; the distinction is kept
  so a deliberate zero is not erased.
- Entered on the **add** form in the item's own unit (no other units exist yet)
  and on **Edit** in either; shown under the Days-of-stock cell when set.

## The sum, and what it refuses to guess

    needed = forecast use over (period [+ lead]) + safety
    buy    = max(0, needed − max(0, expected now)), rounded up to whole packs

- **Never-counted items get no recommendation** — `stock_on_hand` null is not 0.
  The row says "never counted", still shows what the period needs, and a banner
  counts them. They are left out of the buy list. Guessing "0 on the shelf"
  would send someone to buy a cupboard's worth that is already there.
- **A count older than 21 days is flagged unreliable**, not refused. The item
  said "a few weeks"; three is the constant (`STALE_COUNT_DAYS`).
- **Expected stock below zero** (usage has outrun the count) is shown as
  "probably none left" and treated as 0 for the shortfall: the shelf cannot hold
  less than nothing.
- **Rounding up to a pack** uses the item's purchase unit (`is_purchase_unit`,
  first by size) — no pack-size column exists (0128). With no purchase unit the
  shortfall is rounded up to 2 places. An exact multiple does not buy an extra
  pack (an epsilon guards float noise).
- **Food**: special diets first, the standard diet last (badged). Diet usage is
  `diet_forecast`, the same figure the Diets page shows.

## Supplier, CSV, print

- The usual supplier is the `supplier_contact_id` of the item's **most recent
  receipt that named one**; none = "No usual supplier", listed last. Suppliers
  A–Z.
- The CSV uses `csvField`/`toCsv` (hardened in #253) — nothing hand-rolled.
  It carries both the purchase-unit quantity and the amount in the item's own
  unit, since a wholesaler may ask for either.
- Print is the page's own print stylesheet: the working tables and controls are
  `print:hidden`, so the printout is the list alone.
- Receipts are paged 1000 at a time: PostgREST caps a response there, and a
  silently truncated list would under-count what has arrived since a count.

## Not done

- A "custom" period. `ForecastWindowPicker` takes From/To; the buy sum is "from
  today", so a window starting later would leave a gap. 1 week / 2 weeks /
  1 month cover the item; custom can follow if asked for.
- Thai manual: there is still no Thai manual file, so only the dictionaries (en
  and th) carry Thai text, as the brief says.
