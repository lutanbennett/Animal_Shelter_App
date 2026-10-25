---
card: record_delivery
walked: 2026-10-25, driven in a browser on the test system as a login holding only this card (dev: 265 applied, 0 pending)
---

## Purpose

Lets a person record medicine or food as it arrives: what, how much, which day, from whom and what it cost. It does not change the stock count; the next stocktake does that. A recorded delivery lets the shelter work out what was used.

## Gives access to

### Pages

- **Deliveries**: a form to record a delivery (Medication or Food tab, item, quantity in the item's own unit or in packs, cost, arrival day, supplier, a photo of the bill, a note) and the **Recent deliveries** list below it.
- **Bills** (opened from a link on Deliveries).
- **The Residents list** appears in the menu and opens empty; **Operations** appears too.

### Tables

- **Deliveries received** (add and delete).
- **Medicines and food** lists (read) and the **suppliers** list (Shelter Friends) the supplier picker reads.
- **Waiting bills** (see restrictions).

### Forms

- **Record a delivery**: works. Recorded 20 tablets of Amoxiclav and it appeared as the first row of Recent deliveries. When the item has already been counted that day the form stops and asks whether the delivery came before or after the count
  ("the delivery is set against the right stocktake"). Pick the answer after choosing the item and typing the quantity: choosing the item clears the quantity.
- **Delete a delivery**: works. A confirm box ("Record it again if it was typed wrong"), then the row is gone. It offers a delete button on **every** row in the list, not only ones this person recorded.

## Major restrictions

- **Cannot see the effect of what it records.** Stock usage on the Management page and the stock figures on the Medications page, which a delivery feeds, are refused to this card. The person who receives cannot see what they changed (Lutan decides, answered 2026-10-23).
- **Anyone holding it can delete any delivery,** including ones other people recorded. There is no "only my own".
- **The Bills link opens Bills,** which shows another person's waiting bill and its cost field; the supplier list shows the Shelter Friends' names without any Shelter Friends card. Both look intended, listed here so Lutan can say so.
- **Cannot open** the medication list (refused). **Menu dead end:** Residents opens as an empty list.

## Recommendation

- **Keep as is.** The card does its one job and the job works.
- **Decrease (for Lutan):** limit delete to deliveries a person recorded themselves, or to a short time after recording.
- **Decrease (small):** hide the Residents menu entry, which leads to an empty list.
