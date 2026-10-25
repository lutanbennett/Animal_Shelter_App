# Card report, stream 7: the dashboard, Who does what and the two landing cards (2026-10-25)

Cards written up: `dashboard`, `who_does_what`, `operations_landing`, `management_landing`. Reports are in `docs/card-reports/`; the faults are in
`docs/card-access-faults.md` under "Added 2026-10-25 by `claude/card-report-admin`". `build-card-report.mjs --check` reports **20 of 29**,
so this is not the stream that completes the set and the backlog item stays open. Nothing was fixed, no grant changed, no card added; the
format and the generator were not touched, and all four cards fitted it.

## What the pass found

- **`dashboard` is wrong, not empty.** It opens and shows 0 for every figure while the test database holds 102 residents, 112 clinic visits and
  14 maintenance jobs. It leaks nothing (it reads none of the data), which answers the brief's "is a figure a door?" question with no; the fault
  is the `enclosures` shape, a page that looks like access and under-reports silently.
- **Its Cashflow read does nothing.** Both Cashflow pages refuse a login holding the card's `reports.cashflow` read cell. The brief's walkthrough
  step 3 cannot be done as written (the Cashflow pages are not part of the dashboard page).
- **`who_does_what` can see everything and change nothing.** It lists every role including the Doctor and a full activity grid with a CSV;
  every control is disabled. Its one cell is stored at edit although the card is described as read only.
- **The landing cards do nothing alone and are not a menu of locked doors.** Held alone, a login is sent to the public website from every
  staff address. Held with `do_stocktaking` or `dashboard`, each adds one home-screen tile; the Operations / Management pages and menu entries
  open without them and list only what the other cards open. So the brief's worst case does not occur; the fault is a card whose only effect
  is a tile. The Recommendation says advice-only: probably not a card. That is Lutan's call and Card review 2's work.

## Choices worth knowing

- **Read-back first, every login.** A throw-away read-only script in the scratchpad (not committed) confirmed each login held exactly the card
  and its cells before any page was opened; counts are in the fault log.
- **The landing cards were driven in pairs as well as alone**, because alone they open nothing and so cannot answer what they list. Each pair
  was compared with the other card alone.
- **Production:** every report and row says card grants are identical on dev and production; no production read was attempted, per the brief.
- **Nothing was saved on Who does what.** The page offers nothing to press, and a save on a real role is not part of this review. The Doctor
  was only opened to read its card list.

## Not established

- Whether Who does what's refusal to a card-only login is enforced on the server for a direct save: the page offers no control, so no save
  was attempted (the brief forbids saving on any role but one made for the purpose, and none was needed).
- The `reports.cashflow` read-versus-edit mismatch was explained from the page's guard, but only the refusal was driven.
- The dashboard figures were not driven against a login that also holds View residents, so the exact correct values per tile were not compared;
  the service-role counts show only that 0 is wrong.
