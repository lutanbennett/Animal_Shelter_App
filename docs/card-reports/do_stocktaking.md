---
card: do_stocktaking
walked: 2026-10-25, driven in a browser on the test system as a login holding only this card (dev: 265 applied, 0 pending)
---

## Purpose

Lets a person count what is on the shelves, medicines and food, and save the counts. Each saved count becomes the shelter's "last count" for that item.

## Gives access to

### Pages

- **Stocktake**: two tabs, Medications and Food, each a list of items with a count box and a "Same as last time" button, a search box, and a Review and save step.
- **The Residents list** appears in the menu and opens empty, and **Operations** appears in the menu.

### Tables

- **Stock counts** (add), and a read of the medicine and food lists and their last counts. Nothing else.

### Forms

- **Count the stock**: works. Counted Amoxiclav (never counted before) as 7, pressed Review and save, then Save 1 count. After a reload the item reads "Last count 7 tablet, counted today",
  and the Purchasing page's "never counted" list dropped from 24 items to 23.
  A stocktake has no free-text name field, so the usual walk-test label could not be used.

## Major restrictions

- **Cannot see the figure it changed.** The stock figures and history on the Medications page are refused to this card (`/management/medications` goes to "no access"). The person who counts cannot see the stock they have just set.
- **Cannot open** the medication list (refused).
- **Menu dead ends.** The menu offers Residents (opens as an empty list) and Operations. The card grants neither.

## Recommendation

- **Keep as is.** The card does the one job its name says and the job works.
- **Decrease (small):** hide the Residents and Operations menu entries, which lead to an empty list and a page of tiles the card cannot use.
- **For Lutan to decide:** whether the counter should be allowed to see the stock figure they just set. It is deliberate today (answered 2026-10-23).
