# Dev's two hand-edited columns are now written into the files (0213)

**Decision:** the migration files were brought to dev's shape, not the reverse.

- `immunization_types.interval_months`: `numeric not null` (0007 said `integer`, nullable).
- `zones.internal`: nullable, default `true` (0004 said `not null`).

**Why dev's way.** Dev is the only shape the app has ever been tested against, and changing the shape dev holds
would be a data migration, not a file tidy-up. Reading the columns did not argue the other way: all seven
immunization types on dev carry a whole-number interval (1, 12 or 24), so `numeric` loses nothing and `integer`
would gain nothing; no code reads `zones.internal` as possibly-null in a way that matters (the app writes it
from a checkbox and filters `eq("internal", true)`).

**Rounding comparison (the thing that could hurt someone).** `immunization_due_dates()` steps doses forward
with `last + (k * interval_months || ' months')::interval` and bounds `k` with a division by `interval_months`.
`scripts/check-restated-columns.mjs` rebuilds the integer shape inside a rolled-back transaction and prints
doses 1–3 from 2026-01-31 for every interval in use under both shapes: **identical for all seven types**
(e.g. 1 month: 2026-02-28, 2026-03-31, 2026-04-30; 24 months: 2028-01-31, 2030-01-31, 2032-01-31). The upper
bound is `floor(x/i) + 1` under integer division and `floor(x/i + 1)` under numeric: equal for any whole
interval. They would differ only for a fractional interval, and none exists. So today the shape difference
changes no date; it would the first day someone entered 1.5. That is why the files now say numeric: the
function was written against it.

**Why the file is longer than two `alter`s.** Two views (`immunization_next_due`, `picker_immunization_types`)
read the column, and Postgres will not change a column's type under a view. 0213 drops and recreates them
exactly as dev holds them, only when the column is still `integer`, so on dev (already numeric) it changes
nothing. It stops with an error rather than invent an interval if a rebuild has a type with a null one.

**Not done, and why.** The from-zero rehearsal (all 213 files into an empty project, then the AppSheet
import dry-run) needs a third free Supabase project; the free tier allows two and a paid plan is ruled out.
`scripts/check-schema-drift.mjs` (the dev-vs-rehearsal column diff) also waits for that. The backlog item
stays open, annotated with which half landed.
