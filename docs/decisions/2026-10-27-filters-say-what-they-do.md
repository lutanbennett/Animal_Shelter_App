# Filters say what they do (2026-10-27)

Lutan reported appointments "overdue and cancelled — it can't be both". One row cannot be both; the
"Show cancelled" chip was **additive** (it added cancelled rows to the list, including the red Overdue
group), so its label promised one thing and behaviour did another.

## Vet visits (`/upcoming-visits`)
- Show cancelled and Show completed each show **that status only**, and are mutually exclusive
  (ticking one unticks the other). Neither on: the list is exactly as before.
- Labels unchanged: they now say what they do.
- Hide overdue (removes, truthful label), the clinic select and the view/nav buttons are untouched.

## Residents (`/residents`)
- `Deceased` added to `STATUS_CHIPS`; `listQuery` skips `NOT_DECEASED` when that chip is picked
  (without it the chip would always be empty).
- All five controls under Filter (Show all/Hide deceased + the four status chips) clear zone chips,
  Unallocated and the enclosure in their `href`, so the URL, screen and list agree. `applyFilters`
  does not drop the zone silently. The visibility gate on the chip row is removed, as the
  empty status+zone combination can no longer be produced by a chip.
- `hiddenStatuses` is still needed (zone browsing with a search term hides adopted/fostered/hospitalised
  matches); Deceased is excluded from it as the deceased banner already covers it.
- A hand-typed `?status=` with a zone is still ignored by the parser (unchanged).

## Found, not fixed
None seen on other pages. Action controls on these pages are links/filters, not permission-gated actions.
