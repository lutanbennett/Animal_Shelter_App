---
card: record_weight
walked: 2026-10-26, driven in a browser on the test system as a login holding only this card (1 card, 2 permissions: weight at edit and the resident read) (dev: 265 applied, 0 pending)
---

## Purpose

Lets a person weigh a resident and record it: pick the resident from the enclosure list (or search or scan a card), type the kilograms and save. There is one weight per resident per day, so a second save replaces the first. It also shows the weight history and lets a reading be corrected.

## Gives access to

### Pages

- **Record Weight**: "Weigh these first" (residents a vet saw yesterday or today who have not been weighed since), a name search, a Scan card button and everyone enclosure by enclosure.
- **A resident's page** and its **Weight History**: a chart of the readings, how much each changed, and a pencil on every reading.
- **Edit Weight** (the pencil) and a **Log weight** button on the history, which leads to a second add form (not driven).
- The same resident look-up as View residents (the whole resident record, read only), because the card holds the resident read the picker needs.

### Tables

- **Weight readings** (add and edit).
- **Residents**: the whole record, read only.

### Forms

- **Record weight**: works. Recorded 4.4 kg for one resident and the page said "Saved: <name>, 4.4 kg". Opening that resident again read "Today already has 4.4 kg. Saving will replace it." and the button changed to "Replace today's weight".
- **Edit weight**: works. Added a note to the reading and it showed under the 4.4 kg on the history. It has a date, a linked clinic visit and a note.

## Major restrictions

- **Cannot see its own job.** A recurring job that opens the Record Weight page was assigned to this login and was active for today. Its My tasks page said "Nothing is assigned to you right now" and the menu has no My tasks entry. The job is in the database against this login; the card does not carry the permission to see it. This is the main finding for the card: it is a job card that cannot be handed its job.
- **Can correct any reading,** not only its own (the pencil is on every row).
- **Cannot open** a resident's Diet, Prescriptions or Clinic Visits pages, or the Stocktake (each refused: "You don't have access to this page").
- **Reads more than it needs.** The resident look-up holds the whole record, the same as View residents, which also offers the spreadsheet download (driven for Feed Special Diets, which holds the same resident read; not driven separately here).
- A resident's page offers Edit resident details, Send to hospital, Foster / adopt and Move enclosure to this card (the links are there; not opened).

## Recommendation

- **Increase (to make the card work):** give it the My tasks piece, so a job set for Record Weight appears for the person who holds it. Do Maintenance has this and works.
- **Decrease (for Lutan):** a who-and-where read in place of the whole resident record, and no spreadsheet download.
- **Decrease (small):** stop offering the buttons it cannot use on a resident's page.
