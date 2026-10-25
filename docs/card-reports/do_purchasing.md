---
card: do_purchasing
walked: 2026-10-25, driven in a browser on the test system as a login holding only this card (dev: 265 applied, 0 pending)
---

## Purpose

Shows what the shelter needs to buy. It works out, from the last counts, what has been used and what is on its way, a shopping list for the next week, two weeks or month, with the working shown
so nobody has to trust a bare number. It does not place an order and writes nothing.

## Gives access to

### Pages

- **Purchasing**: a "To buy" list grouped by supplier, switchable between 1 week, 2 weeks and 1 month, with an "Include supplier lead time" switch, **Print** and **Download CSV**.
  It also flags items that have never been counted (23 on the test system) and shows how each figure was worked out. It can take about a minute to appear the first time.
- **Residents** appears in the menu (see restrictions).

### Tables

- **Medicines and food, their stock counts, deliveries received and usage** (read). Nothing is written.

### Forms

- None. The page has no form that saves anything.

## Major restrictions

- **Dead link.** The warning "N items have never been counted" carries a link, "Count them in a stocktake", that goes to Stocktake, which this card is refused (it goes to "no access").
- **Cannot open** Stocktake or the medication list (both refused).
- **Menu dead end.** The menu offers Residents, which opens as an empty list.
- **Cannot place or record an order.** Printing and downloading the list is the whole of it.

## Recommendation

- **Keep as is** for what it is: a read-only shopping list that works.
- **Decrease (small):** hide the "Count them in a stocktake" link and the Residents menu entry from a holder who cannot use them. Or, if the person who buys should be able to prompt a count, give the link a page they can open.
