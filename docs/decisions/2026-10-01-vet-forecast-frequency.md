# The cashflow vet line forecasts from visit frequency (2026-10-01)

Picks up the item left on the flat figure on 2026-09-24 (`docs/decisions.md`,
"The cashflow vet line stays on the flat per-visit figure, for now"). Asked
for by Lutan 2026-09-23.

**The rule, per week (Monday to Sunday):**
`visits = max(typical visits a week, visits booked that week)`. Booked
visits are *inside* that count, not added to it. Cost: a booked visit with a
recorded `vet_appointments.cost` uses its own cost; every other visit
(booked without a cost, and expected-but-unbooked) uses the unit cost.

- **(a) Weekly rule, monthly display.** Each week is clipped to the window
  and counted whole. A booked visit lands in the month it actually falls
  in; the unbooked remainder is spread over the week's days, so a week
  that straddles a month end is split by day, never counted twice, and the
  columns add up to the window total. The typical rate applies from today
  onward only. Weeks are Monday–Sunday in the shelter time zone.
- **(b) Cost per visit becomes the mean of actual costs**, from completed
  visits in the last 90 days that have a `cost` — but only once at least 3
  are recorded (`MIN_COSTED_FOR_MEAN`); below that, the flat estimate from
  `/admin/website` (`site_content.vet_visit_estimate`) stays in force. One
  invoice is an anecdote, not a price. Dev had none when this was last
  measured, so today it still reads the flat figure. The field stays on
  the website settings as the fallback.
- **(c) A booked visit with a known cost uses its own.** Worked example: a
  typical 1.5 a week, two visits booked in one week at ฿1,000 and ฿2,000:
  `max(1.5, 2) = 2` visits, ฿3,000, nothing added for the 1.5 — the
  history is a floor, not an extra. With one booked at ฿2,000 it is
  that visit plus 0.5 × the unit cost. So the count is the max and the
  price is per visit, not one count times one price.
- **(d) The empty case is unknown, not zero.** No completed visit in the
  last 90 days gives a typical rate of 0 for arithmetic, but the page says
  so in words ("no typical rate to forecast from… an empty month means
  nothing is booked, not that no visits are expected") instead of
  presenting 0 as a forecast. Booked visits still count. With no unit cost
  at all (no estimate, fewer than 3 invoices), expected visits show as
  "not priced yet" like every other category; and the #60 care stands —
  a month with no visits and no expectation costs 0, never the estimate.

**Where it is computed: TypeScript, not SQL.** The brief said no migration,
and `cashflow_forecast` (0072) is a SQL function, so changing the rule there
would have needed one. `src/lib/management/vet-forecast.ts` computes the
vet rows (pure, like `fixedOutgoingRows`) and the page drops the RPC's `vet`
rows in favour of them. The RPC still returns vet rows; they are ignored.
If a second consumer of the forecast ever appears (a report, the assistant),
move the rule into the function then, as a schema PR.

**Explainability.** The note under the table states the rate, how many
completed visits it came from, and the cost per visit and its source
(average of N invoices, or the typical figure). `basis` is `actual` only
for a month made wholly of booked, invoiced visits with nothing expected on
top; every other vet month is `estimated`.

**Known limitation.** The rate divides by the full 90 days even when the
shelter's history is shorter, so the first weeks of data understate it.
