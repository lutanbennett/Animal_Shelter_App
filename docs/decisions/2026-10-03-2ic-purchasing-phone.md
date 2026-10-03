# 2026-10-03 — Purchasing on a phone is one screen over the desk page's sums

`2ic-purchasing-phone`, §13 and §12 R4 of `docs/roles-and-permissions.md`. The 2IC
does the ordering, there are no PCs on site, and she is not comfortable with
computers, so the table #295 built for a desk is rebuilt for her. No migration, and
**no arithmetic was reimplemented**: the page still computes every figure with
`purchaseRow()`, `groupBySupplier()` and `expectedStockNow()`, and hands the
results to the phone view as data.

## One screen, not three steps (changed 2026-10-04, before merge)

§13 sketches the rebuild as **what is low, how much, from whom**, and the first
version was exactly that: three screens in intake's wizard chrome. Lutan, looking at
it, said the screens were not adding value. They were not: step 1 and step 2 listed
the same items with different figures, and step 3 repeated them again grouped by
supplier. The task has one answer, "what do I buy, and from whom", so it is one
screen. The wizard chrome fits tasks that gather input in stages (intake, the
Shelter Friend wizard); this page asks for no input, so the steps only added taps.
This departs from §13's wording on purpose: the requirement it serves is "one task
per screen, nothing that loses work", and a single read-only screen meets it. If the
watched test shows she gets lost, the steps are in this PR's history.

## The shape

- **One page, two layouts.** Below `md` the page shows `PurchasingPhone`; from `md`
  up it shows the table, unchanged. `LargerScreenNotice` is gone: §13's rule is that
  a page a phone role can open has no "Best on a larger screen" in front of it. The
  register entry says `device: "any"`.
- **How long it should last** (1 week / 2 weeks / 1 month): big buttons that are
  links, since the period changes the sums and so asks the server again.
- **Anything nobody has counted** is listed apart in a warning box with a button to
  the stocktake (shown only to someone who may count). Whether such items should
  instead be assumed to be none on the shelf is a backlog item, not decided here.
- **Medicines and Food are two folds** (`<details>`), because they are bought at
  different shops. The first non-empty one is open. Inside each, the list is grouped
  by usual supplier, A–Z, "no usual supplier" last. **Each item is one line: its name
  and the amount to buy** (whole bags or boxes where there is a purchase unit), so a
  long list stays short. A small warning mark on the line means the count is over
  three weeks old. **Tapping an item opens its detail:** the amount in the item's own
  unit, what is left against what is needed, and the working: counted, used since,
  received since, so about this much on the shelf, and what the period needs. Her
  trusting the number matters more than brevity, so every figure is there, one tap
  away, rather than dropped. (The first cut showed all of this on every item as a
  card; Lutan found the cards too large.)
- Print and Download CSV sit at the bottom. The page says in words that the app does
  not place the order.
- **Nothing is typed and nothing is saved**, so there is nothing to lose by going
  back. There is no keypad on this page.

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
- **Three steps** (see above).
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
