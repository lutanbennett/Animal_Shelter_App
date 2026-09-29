# 2026-09-29 — Fixed outgoings in the cashflow forecast: by the day, folded in on the page

Feature half of the fixed-outgoings item (schema half:
`2026-09-29-fixed-outgoings-not-payroll.md`, which records why **payroll was
deliberately dropped** — per-person pay is the most sensitive data the app could
hold; Salaries is one total line; the 24-line cap exists so the table cannot
become a pay register). Nothing here reopens that. The editor says so on the page
and in the manual, and offers no field that could hold a person.

- **A month only partly inside the window: pro-rata by the day.** `cashflow_forecast`
  already slices the window per month (each month row carries only the days
  actually asked for, "so the columns add up to the window total rather than to
  two whole months", 0072). A fixed amount follows the same rule:
  `monthly × days in window ÷ days in month`. Whole-months-only would have made
  every 30-day window that starts mid-month show two full months of rent, which
  would read as a bug beside food and medication that do not. A window covering a
  whole calendar month carries exactly one month. *Whether a line applies* is still
  decided by month (`starts_on` / `ends_on` are firsts of months, `ends_on`
  inclusive), so a line ended in September has nothing in October.
- **Folded in on the page, not in `cashflow_forecast`.** The brief said no
  migration, and only one in-flight branch may carry one. `fixedOutgoingRows()`
  (`src/lib/management/fixed-outgoings.ts`) produces rows in the function's own
  shape (`category = 'fixed'`, `basis = 'priced'`, `missing_prices = 0`) for the
  same months, and the page appends them. The chart, table, totals, toggle and CSV
  needed nothing but the new category. Moving it into the SQL later is possible
  and would change no figure; the cost of not doing so is that the rule lives in
  TypeScript, next to its tests, rather than beside the other categories.
- **One category, not one per line.** A per-line category would put up to 24
  colours in a stacked chart and would invite a row per employee. One "Fixed
  outgoings" column keeps the shape of the page; the lines are on the edit page.
- **Where it lives:** Management → Cashflow → Fixed outgoings
  (`/management/cashflow/fixed-outgoings`), reached from a link under the table.
  The Management-vs-Settings split is undecided; this sits where Cashflow is.
- **The cap is surfaced, not just enforced.** The page shows "n of 24 lines",
  disables Add when full and says why; the action checks the count first and only
  falls back to the trigger's error.
- **Sixth series colour** `--series-fixed` (slate `#7f8c9b`), placed last so the
  five checked adjacencies are untouched. It has **not** been run through the
  colour-blind check; only its adjacency to maintenance would need it.
- **No Thai manual.** `src/lib/manual/th.ts` does not exist (the manual is English
  only); both UI dictionaries are done.
