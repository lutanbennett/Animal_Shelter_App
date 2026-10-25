# Card report, stream 3: maintenance, purchasing and stock (2026-10-25)

Five cards driven in a browser as logins holding only that card and written up in the approved format: `do_maintenance`, `do_purchasing`, `do_stocktaking`, `record_delivery`, `enclosures`.
No grant, card, fault or generator line was changed. Findings are in `docs/card-reports/` and one block at the end of `docs/card-access-faults.md`.

## What the pass found that is worth keeping

- **Lutan's example, tested.** "Someone doing maintenance doesn't need access to residents, just enclosure info." `do_maintenance` does reach residents (list, a 94-row spreadsheet export, resident pages, assistant), and does not need to:
  the Enclosures page already carries zone, enclosure and open jobs.
- **`enclosures` alone is worse than empty.** It reports every enclosure as empty and a full one as "Space available", because the card reads enclosures but not who is in them. It is the clearest case of a card that looks like access and is not.
- **The delete fault on `do_maintenance` is confirmed by driving**, on the job page and the edit page.
- **The Residents menu entry is drawn for every card in this stream**, none of which holds a residents card.

## Limits, stated plainly

- Production could not be read from this worktree (`.env.deploy.production` absent), so the `check-production.mjs` faults were not re-run; the "production" column says "not established".
- Cell counts come from the card definitions; the sign-in script confirmed each login held exactly the one card. No separate `role_permissions` read-back was taken.
- Not driven: marking a recurring job done (no recurring task is assigned to a card-only login).
- The earlier note that `record_delivery` is "six steps" does not match what was driven (one form). Recorded, not changed.
- Scripted input to a form can leave a validation message stuck; the first delivery attempts failed that way and were not a fault. Real clicks worked.
