# 2026-09-30 — Residents list: adopted residents and search (investigation), and the ID column on phones

**Outcome: not reproduced.** Lutan's 2026-09-26 search for adopted Panda with
Show all on, which found nothing, was not reproduced, and this stream did not
have a signed-in session to try it on live data. What follows is what the
code says and what was hardened, not a claimed fix.

## The four suspected causes

Ruled in or out by reading the code, not by running it:

- **(a) On-site / Off-site was selected — the code explains it.**
  `STATUSES_IN_PLACE` holds no `Adopted`, so under a place adopted residents
  never appear, and `showAll` requires `place === "all"`, so Show all is
  ignored there. Nothing on the page said so. Most likely cause.
- **(b) A zone chip was selected — the code explains it.** Adopted residents
  sit in the Lifecycle pseudo-zone, and `zone_id in (...)` (or an enclosure)
  excludes them, again silently.
- **(c) Search by R-code — the code explains it.** Search matched name, Thai
  name and other names only. It now matches `resident_code` too.
- **(d) RLS / the row's `current_status` — not checked.** `resident_list_view`
  (0058) has no status filter and the page hides only Deceased, so it is not
  a code fault, but a wrong `current_status` on Panda's row on the site used
  was not looked at. If (a)–(c) do not account for it, that is the next look.

Ruled out from the code: the view itself dropping adopted rows, and
`NOT_DECEASED` (it keeps every status but Deceased, and null).

## What changed

- Search matches the R-code (`resident_code.ilike`).
- **Adopted matches hidden by a filter are named.** When there is a search and
  a place, zone or enclosure is set, the adopted residents matching the name
  are counted ignoring those filters, and the header says "N adopted residents
  match — show", as the deceased line does. The count is skipped when nothing
  could be hiding them, to save a query.
- **An Adopted chip** (`?adopted=1`), shown under Everywhere with no zone or
  enclosure chosen, lists only adopted residents, search still applies. It
  is offered only there because place, zone and enclosure all exclude adopted
  animals: a place or zone chip tapped while it is on drops it rather than
  give an empty list, as Show all is dropped on leaving Everywhere.
- Adopted stays a status, not a place: it is still not on-site or off-site.

## Phones: the ID column

Below `md` the R-code column is hidden (`hidden md:table-cell`) so long
bilingual names get the width. The R-code is on the hub and now searchable,
so nothing is lost. No Thai manual exists, so the caption changed in English only.
