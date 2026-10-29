# Walkthrough seam: the ten pages' buttons, Book clinic visit, and why the Admin pages need no steps (2026-10-29)

Stream `claude/page-buttons-and-seam`. No migration. All findings are by card.

## Re-measured seam
46 registered paths, 37 with a numbered opening step, 13 without (the item's "22" was stale; the walkthrough is generated and was
regenerated twice since). The 13: `/management/stock-usage` and twelve `/admin/*` pages.

## 1. Controls of the ten pages, and the activity each action asks
| Page | Controls | Action asks | Result |
|---|---|---|---|
| `/appointments` | Book (`visit.book`), procedure / blood test / prescription / weight links, Edit visit | `visit.book`; `medical.procedures`, `.blood_tests`, `.prescriptions`, `.weight`; `medical.visits` (all edit) | already match |
| `/projects` | create folder | `projects.folders` edit (`canWrite`) | already matches |
| `/clinics` | Manage in Admin link | `clinics.list` edit, same as the destination | already matches |
| `/operations/feeding-list` | view / round links only | read-only | nothing to gate |
| `/management/desexing-drives` | New, edit, signup controls | `website.content` edit, page and actions | already match |
| `/management/clinics` | rename, merge, delete, add | `clinics.list` edit, page and actions | already match |
| `/management/medications`, `/management/diets` | count, edit, links | `stock.medications` / `stock.diets` edit; links gated today by `2026-10-29-stock-links-gate.md` | already match |
| `/management/stock-usage` | filter, CSV, Deliveries link | read-only page | see below |
| `/management/cashflow` | fixed-outgoings link, website link | `reports.cashflow` edit; `website.content` edit | already match |

**Found, not fixed:** on `/management/cashflow` the "fix N" links in the Not priced row (`CATEGORY_PRICE_PATH`,
`src/lib/management/cashflow.ts:52`) are drawn for any holder of `reports.cashflow` at read, but lead to pages that ask
`stock.diets` / `stock.medications` edit (food, medication) or are Admin pages (immunization, clinic) or `/maintenance`. A card
that only views cashflow is offered a link that ends on `/no-access`. Fix: draw each link only when the destination's own activity
is held. Navigation links, not actions, so left for its own item.

## 2. Book clinic visit (done)
The Vet appointments tile on the resident hub drew its action through `medicalActions("visits")`, which asks `medical.visits` at
edit. The page and action it opens ask `visit.book`. That tile holds no other action, so I gated this one action on its own
(`bookVisitActions`, `can(perms, "visit.book")`) instead of changing `medicalActions`, which the other five tiles still use
correctly. It is now exactly what the section page does. A card holding only `medical.visits` edit is no longer offered the button.

## 3. The twelve `/admin/*` pages need no steps (Lutan, 2026-10-29)
Admin reaches these unconditionally: the `perms.isAdmin` short-circuit in `src/lib/permissions/can.ts` answers before any cell is
read. No card-limited login can reach them, so none can be offered an ungated control there, and a step would test nothing.
Admin is outside the card system (2026-10-25): it is given no cards, is not debt, is not a precedent.

## `/management/stock-usage` is in the same position
`stock.usage` is held by no card: Lutan's card review 2 answers made stock usage an Admin task with no card
(`0280`, `2026-10-28-forecast-and-cashflow-view-cards.md`). Only Admin reaches it, so it needs no step either.

## Walkthrough wording
Step 6 of the Medical cards said the zone and enclosure pickers are empty for a card-only login. Driven passes show they list
everything. Corrected in `scripts/gen-card-walkthrough.mjs` and regenerated.
