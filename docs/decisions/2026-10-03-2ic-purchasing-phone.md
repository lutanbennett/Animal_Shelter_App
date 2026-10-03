# 2026-10-03 — Purchasing on a phone is three steps over the desk page's sums

`2ic-purchasing-phone`, §13 and §12 R4 of `docs/roles-and-permissions.md`. The 2IC
does the ordering, there are no PCs on site, and she is not comfortable with
computers, so the table #295 built for a desk is rebuilt for her as the paper's
sequence: **what is low, how much, from whom.** No migration, and **no
arithmetic was reimplemented**: the page still computes every figure with
`purchaseRow()`, `groupBySupplier()` and `expectedStockNow()`, and hands the
results to the steps as data.

## The shape

- **One page, two layouts.** Below `md` the page shows `PurchasingSteps`; from
  `md` up it shows the table, unchanged. `LargerScreenNotice` is gone: §13's rule
  is that a page a phone role can open has no "Best on a larger screen" in front
  of it. The register entry says `device: "any"`.
- **The chrome is intake's.** `WizardProgress` and `WizardNav` from
  `src/app/residents/new/WizardChrome.tsx`, with this feature's own labels, as the
  Shelter Friend wizard does. The last step uses `finalActions` (Print, Download
  CSV) instead of a Next button. No fourth pattern.
- **Step 1, What is low.** How long it should last (1 week / 2 weeks / 1 month,
  big buttons that are links, since the period changes the sums and so asks the
  server again; the step is first, so nothing is lost by the reload), then each
  item that needs buying with "about X left, Y needed". Items nobody has counted
  are listed apart with a button to the stocktake. A count over three weeks old
  carries its "probably out of date" flag.
- **Step 2, How much.** The amount to buy in big type, in whole bags or boxes
  where there is a purchase unit, with the item's own unit beneath. **The working
  is behind "The working"** (a `<details>`), sentence for sentence what the table
  says: counted, used since, received since, so about this much on the shelf, and
  what the period needs. Her trusting the number matters more than brevity, so it
  is one tap away on every item rather than dropped.
- **Step 3, From whom.** The list grouped by usual supplier, A–Z, "no usual
  supplier" last: the step *is* the grouping, not a footer. Print and Download CSV.
  It says in words that the app does not place the order.
- **Nothing is typed and nothing is saved**, so Back loses nothing by
  construction. There is no keypad on this page: it reads, it does not ask for a
  quantity. (The brief expected one; nothing in §13's sequence needs her to type.)

## Kept from the desk version

The working per item; an uncounted item flagged and never guessed; the three-week
stale flag; rounding up to whole packs; `safety_stock`'s null versus zero (it is
read, not changed: a floor of nothing and no floor both add nothing to what is
needed, and the working only mentions a floor above zero); supplier grouping;
special diets before the standard diet; the desktop table, CSV and print.

## Deliberately not carried over to the phone

- **The "include supplier lead time" toggle.** It is a Director's refinement and
  jargon for her. The phone always uses the default (lead time included) and the
  working says when it was added; `?lead=off` still works if a link carries it,
  and the period buttons keep it.
- **The long explanatory note** under the list ("Buy = needed minus…"): the
  working under each item says the same in the item's own numbers.
- **Leaving an item out, or editing a quantity.** "No tables to edit in place"; the
  app does not place the order, so she can skip a line when she reads it to the
  shop. If the watched test shows she needs to, that is a follow-up.

## Who opens it, and what changes when `2ic-role` lands

The guard is now `requirePermission("stock.purchasing")` (and the route has its
registry entry), not `requireManagementUser()`. The seed gives the cell to
Management and Admin only, so **today's reach is the same**. When `2ic-role` gives
the 2IC the cell, Purchasing opens for her with no change here; her home tile and
menu entry (`menu: false` for now) are that stream's. The page offers the
stocktake link only to someone holding `stock.count`.

## Not ticked

The roles backlog item is not ticked: this is one of the 2IC's three screens and
her role does not exist. The done-when, "the 2IC, watched, has done each of the
three without help", is **not met and cannot be signed by Claude**; it is the first
row of the test plan's Left for manual verification.
