# 2026-09-29 — Fixed outgoings are a short list of shelter costs, not payroll

Migration 0114 adds `fixed_outgoings`, the table behind the cashflow forecast's
regular monthly costs. It replaces the 2026-09-23 "Salaries: pay the people"
backlog item, and **payroll was deliberately dropped**. This file records why,
because it is the reasoning a future session will be tempted to undo.

- **Why payroll is out for good.** Per-person pay (employee records, pay rates,
  pay periods, payslips, payment history) is the most sensitive data the app could
  hold, and the risk grows if the app ever serves several shelters (Architecture:
  multi-shelter spike). The forecast does not need it: it needs to know what the
  shelter spends each month, not who is paid what. Salaries is **one total line**
  for the whole staff. Nothing in the table identifies anyone.
- **Built so it cannot become payroll, not merely so it isn't.** No person foreign
  key (the only foreign key is `updated_by` to `auth.users`, the editor, as on other
  tables), no name column, and a **24-line cap** enforced by a `before insert`
  trigger: a table that refuses a 25th line cannot hold one row per employee
  whatever a label says. The cap is small on purpose; loosening it is a one-line
  migration, whereas a table that filled up with people could never be un-filled.
  Line labels are unique case-insensitively so one cost cannot be counted twice.
- **Its own table, not columns on `site_content`.** `site_content` has
  `select using (true)`; every column on it is world-readable, and salaries would
  be published by accident. `fixed_outgoings` is readable and writable by admin and
  management only: two RLS policies, RLS on, anon's grants revoked. Staff, vet and
  volunteer have no policy. `scripts/check-public-views.mjs` refuses anon a read,
  insert and patch on it and asserts no public object has a `monthly_amount` column.
- **Start/end month per line, included now.** `starts_on` and `ends_on` are optional,
  always the 1st of a month (checked), `ends_on` the *last month included*. An amount
  that changes from a date is the old line ended and a new one started ("Rent" to
  September, "Rent from Oct" from October): no history table. Included in the
  schema half because adding them later is another migration and the feature half's
  pro-rata question depends on them. Whole months only is the schema's assumption
  (the page already groups the forecast by month); the forecast may still choose to
  pro-rate a window edge, and nothing here prevents it.
- **Amount:** `numeric(12,2)` baht per month, never negative; nullable is not needed
  (a line with no amount is not a line). `active` lets a line be switched off
  without deleting it.
