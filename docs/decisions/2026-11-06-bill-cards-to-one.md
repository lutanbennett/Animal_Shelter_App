# The bill cards become one (0327, backlog #ywn5r)

Lutan, 2026-11-05: "that to me would be a single card." Filing a bill is one job; the /bills inbox already asks "What type of bill is this?" and the type decides the route (`kindsFor`, unchanged).

- `bills` now grants `maintenance.bills`, `maintenance.jobs` (read), `bills.utilities`, `bills.general`. `utility_bills` and `general_bills` are retired.
- `bill_sites` stays separate: administering places, accounts and kinds is not filing a bill.
- Safety, by card: migration 0327 moves any holder of a retired card onto `bills` before deleting, so nothing is taken. Production on 2026-11-06 had no holder of either retired card; every holder of `bills` gains the two activities.
- `/bills` already links to `/bills/utilities`, so the page stays reachable with no card of its own.
- `kindsFor()` read and left unchanged. Card count 52 to 50 in `check-cards-count.mjs`.
