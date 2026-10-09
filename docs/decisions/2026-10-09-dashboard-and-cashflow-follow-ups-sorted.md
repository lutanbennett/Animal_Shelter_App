# 2026-10-09 — Dashboard and Cashflow follow-ups: what shipped, what is its own item, what waits

The backlog's *Dashboard follow-ups* and *Cashflow follow-ups* were two umbrella
lists of candidates written while the pages were first built, not agreed work.
The `dashboard-cashflow-followups` stream checked every lettered candidate
against the code as it stands after the 0172 clinic rename, asking "can the
outcome still happen?" rather than "does the named code still exist", and sorted
them into three piles. Lutan saw the piles before anything was built and approved
pile 1 as a whole.

## Already done before this stream

- **Cashflow (c) CSV export.** Done 2026-09-24, struck through in the item.
- **Cashflow (f) salaries, rent and fixed costs.** Done: `fixed_outgoings`
  (0114), *Edit fixed outgoings* on the Cashflow page, folded in as the `fixed`
  category. The "no salaries" sentence is gone; the page now says
  "No fixed outgoings are listed yet" only when the list is empty.
- **Dashboard (g) public "our impact" lifetime totals.** Done by
  `impact_baselines` / `public_impact_figures` (0156) and the community-dogs
  work (0169): rehomed, sterilisations and community dogs are each a baseline
  plus a live count. What is left is the Director's starting numbers, which is
  data, tracked on its own Management item.

## Pile 1 — built in this stream (no schema, no open question)

- **Dashboard (a) Copy as text and Print.** The month section's cards and the
  copied text are generated from one list in `page.tsx`, so they cannot drift.
  The text is plain (LINE shows markdown as typed). Print uses a page-scoped
  `@media print` rule that hides every element that neither contains nor is
  inside `#month-report`, so the app chrome goes without touching the shared
  layout or nav, and no blank pages are left behind. Black on white whatever
  the theme.
- **Dashboard (e) time zone, app half.** `shelterMidnight()`,
  `shelterMonthKey()` and `addMonthsToKey()` join `todayIso()` in
  `src/lib/format.ts`. `monthWindow()` bounds are now 00:00 Asia/Bangkok, the
  trend buckets and the clinic hub's visits-per-month chart key on the shelter
  month, and the month label is formatted from the `YYYY-MM-01` string rather
  than from `window.start` (which is 17:00 UTC the day before and would read as
  the previous month on a UTC server). `SHELTER_TIME_ZONE` already existed from
  backlog d98695a; this decision is only that the dashboard uses it too.
  Verified on dev: a Foster placement at `2026-05-31T17:00Z` (00:00 on 1 June,
  Thai time) shows under June.
- **Dashboard (f) Vaccinations given.** A card grouped by vaccine, like
  Procedures. Read through `picker_immunization_types`: embedding
  `immunization_types` directly came back null for a management login and
  grouped every dose under "Other". Archived doses (0124) are excluded. The
  **stock forecast** half of (f) is *not* this card: it is a page of its own
  and is now its own backlog item. The blocker decisions.md open item 6 names
  (no interval per type) was cleared by 0007's `interval_months`.
- **Dashboard (d) clinic spend.** Sum of `clinic_visits.cost` over the month's
  visits that happened, initial and follow-up alike, with a count of those that
  have no amount yet. That count is the point: as with the cashflow page's "not
  priced yet", a low figure must never read as the whole bill.
- **Cashflow (d) the diverged windows: permanent.** Diets and Medications keep
  `FIXED_FORECAST_DAYS` (7, 30) as side-by-side columns; Cashflow keeps
  `CASHFLOW_FIXED_DAYS` (30, 90), one window at a time. A week of outgoings is
  not a useful money figure, and a quarter of food quantities is not a useful
  stock figure: the pages answer different questions, so sharing one set would
  make one of them worse. Both still share the From/To picker and its parser.

## Pile 2 — needs a migration, so its own schema stream later

- **Cashflow (e) immunization doses counted once per window.** Fix in
  `cashflow_forecast`: generate every due date from the last dose by
  `interval_months` up to `p_to`, not only `immunization_next_due`.
- **Cashflow time zone, SQL half.** `cashflow_forecast` (current body in 0172)
  still buckets clinic visits by `va.appointment_date::date`, which is the UTC
  date. 0073 already provides `shelter_date(timestamptz)`; the fix is that one
  expression, in a `create or replace` of the function.

Both are changes to the same function and should go in one schema PR.

## Pile 3 — needs real data or Lutan's opinion; not built, not guessed

- **Cashflow (a) forecast against actuals.** Only meaningful after a few months,
  and it needs each month's forecast stored as it stood (a snapshot table), so it
  is schema as well as data.
- **Cashflow (b) per-clinic or per-reason average** to replace the flat
  `site_content.clinic_visit_estimate` (renamed from `vet_visit_estimate` by
  0172). Needs invoice history first: on dev on 2026-10-09 one of September's
  six visits carried a cost.
- **Dashboard (b) year view and year-over-year.** A design question for Lutan.

## Closed by an answer, not code

- **Dashboard (c) blood-work location.** Lutan, 2026-10-09: "MW" in the monthly
  report means *done at the shelter*. The dashboard's existing split (a test not
  linked to a clinic visit is in-house) is therefore already the right one; no
  clinic field on `blood_tests` is needed.

## Noticed, not changed

The Fostered card's headline counts residents while its "New this month" line
counts placements, so a resident fostered four times in a month reads "3" over
"6". Pre-existing and arguably correct both ways; left for the next time
someone looks at the dashboard with Lutan.
