---
card: feed_special_diets
walked: 2026-10-26, driven in a browser on the test system as a login holding only this card (1 card, 2 permissions: diets at read and the resident read) (dev: 265 applied, 0 pending)
---

## Purpose

A list for the person who feeds the residents on special diets: who is on one, how much, and at which meal (Morning or Evening), enclosure by enclosure. It is a list to read. The page says so itself: "nothing here is ticked off or recorded".

## Gives access to

### Pages

- **Feed Special Diets**: Morning and Evening buttons, then each zone and enclosure with each resident's photo, diet name, amount per meal, amount per day, meals a day and any note.
- **Feeding list** (from Operations): what each zone's food batch needs for a meal, diet by diet, with "Batch for each zone" and "Plate by dog". Also a list to read.
- **A resident's Diet page**: their current diets (name, meals a day, size, notes). It shows an **Add diet** button.
- **The same resident look-up as View residents:** the Residents list (93 residents and 9 hidden deceased when opened) with a "Download spreadsheet" button, and a resident's page.

### Tables

- **Diets**: read only.
- **Residents**: the whole record, read only.

### Forms

- **None that save.** The Add diet button on a resident's Diet page leads to "You don't have access to this page".

## Major restrictions

- **Cannot record that a feeding happened.** By design: both lists say nothing is ticked off. A person holding this card can look, not tick, and there is nowhere in the system that records a meal given.
- **Cannot see its own job.** A recurring job opening the Feed Special Diets page was assigned to this login. Its My tasks page said "Nothing is assigned to you right now" and the menu has no My tasks entry. The job is in the database against this login.
- **Cannot add or change a diet,** though the button is offered.
- **Cannot open** the Stocktake (refused).
- **Enclosure and zone read "—" on the Residents list,** while the two feeding pages show them correctly.
- **Reads more than it needs.** The resident look-up is the whole record, and the spreadsheet download (`/residents/export`) returned a file of 95 lines, one per resident (name, Thai name, species, breed, microchip, status, place, intake date, current diet) to this login.

## Recommendation

- **Keep as is** for what it is meant to be: a read-only feeding list. Both feeding pages work and show the right people.
- **Increase (to make the card work):** give it the My tasks piece, so a job set for it appears for the person who holds it. If feeding should ever be recorded, that is a new activity, not a change to this card.
- **Decrease (for Lutan):** a who-and-where read in place of the whole resident record, and no spreadsheet download.
- **Decrease (small):** hide the Add diet button.
