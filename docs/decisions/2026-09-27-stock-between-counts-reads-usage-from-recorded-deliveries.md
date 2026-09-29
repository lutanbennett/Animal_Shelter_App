# 2026-09-27 — Stock between counts reads usage from recorded deliveries

Feature half of "Record stock deliveries, so Stock between counts can state
usage" (schema: `0096`, entry above). Supersedes the 2026-09-26
count-to-count entry on what the page may call *used*.

- **What the page now states.** Each row shows the deliveries recorded
  between the two counts and **Used = earlier count + recorded − later
  count**, against the plan. The standing warning is replaced by what the
  figure *assumes*: every delivery was recorded. The page names the date
  deliveries were first recorded (before it, every figure assumes nothing
  arrived), or says none have been.
- **What it still cannot state, and which way it errs.** An unrecorded
  delivery makes usage read **low**, not high — so the backlog's "forgotten
  ones still look like overuse" was the wrong way round. The "check
  deliveries" line therefore sits on **less than planned** ("or a delivery
  arrived that nobody recorded"); **more than planned** instead asks to
  check that no delivery was recorded twice or too large. A negative used is
  the one case the data proves something is missing: it reads "at least N
  arrived that wasn't recorded" and is marked, rather than being shown as
  negative usage. Hand edits of the count and the forecast's status-today
  gap are unchanged caveats.
- **The page reads the view, never re-derives it.** Latest-mode pairs skip
  same-day recounts and picked stocktakes can have others between them, so
  a pair is usually not one `stock_count_intervals` row. `receivedBetween`
  walks the view's rows from the earlier count's id to the later one's and
  adds their `received` and `used` (the sum telescopes, as `0096`
  asserts); any null `used` on the way means a unit change and nothing is
  subtracted. If the view can't be read, rows say so instead of falling back
  to count-to-count.
- **The "before or after the stocktake?" question is asked on any day the
  item was counted, today included** — a narrowing of `0096`'s "only for a
  back-dated delivery". A delivery unpacked at 08:00 and typed in at 15:00,
  after a 10:00 stocktake, would otherwise be stamped `now()` and land in
  the next interval. Before = the day's earliest count's own instant (the
  closed end, so inside the interval it ends); after = a second past the
  day's latest count, or `now()` if later. A back-dated day with no count
  is stamped midday Bangkok time, which is on the same side of every count.
  `scripts/check-stock-deliveries.mjs` pins these.
- **Where it lives: `/deliveries`, outside `/management`,** like
  `/stocktake` and for the same reason: the people at the door are staff,
  and `0096` lets staff write. Volunteers are sent away (they count, they
  don't record deliveries or costs). No nav entry — it is reached from
  Record a delivery on Management → Medications / Diets, the Stocktake page
  (staff and up) and Stock between counts, which keeps `NavLinks.tsx` out
  of this PR.
- **Correction is delete and re-record.** The table allows updates, but a
  one-row edit form was not worth its weight at shelter volumes; the recent
  list (latest 50, with who recorded each) has Delete. A delivery never
  touches `stock_on_hand`, and the form offers no "and set the count" —
  that is a stocktake's job.
- **Split out, not done here:** the CSV download, a difference-as-percentage
  column and a minimum-quantity floor carried on the backlog item. They are
  a follow-up item on `backlog`; the 2026-09-26 entry's reasoning against
  a single absolute floor (units differ per item) still stands.
