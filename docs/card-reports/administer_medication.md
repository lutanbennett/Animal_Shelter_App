---
card: administer_medication
walked: 2026-10-25, driven in a browser on the test system as a login holding only this card (1 card, 2 permissions: prescriptions at read and the resident read)
---

## Purpose

A list for the person who gives out medicine: who needs what today, how much, and where they are. It is a list to read; nothing is
ticked off or recorded, and the page says so. It does not include the View residents card, but it holds the same resident read, so a
person holding it can also look residents up.

## Gives access to

### Pages

- **Medication list** (from Operations), with three ways to read it:
  - **By round**: Morning, Lunch or Evening (the page suggests the right one for the time of day).
  - **By resident**, enclosure by enclosure, with each resident's photo, the medicine, how many tablets and how often.
  - **Stock-room pick list**: what to bag up for a round, by zone and enclosure, with the total ("Omeprazole, 1 dose, total 1 tablet").
  It also lists, in a separate group, residents who are in hospital, fostered or out, so nobody thinks they were missed, and it shows a red
  "No round set" on a medicine with no round ticked.
- **A resident's Prescriptions page**: opens read only, showing Current and Expired medicines with dose, how often, start date and notes.
  It has no edit or remove buttons.
- **The same resident look-up as View residents**: the Residents list (93 residents and 9 hidden deceased when opened), a resident's page,
  Housing & Status, the Photos gallery and the "Download spreadsheet" button.

### Tables

- **Prescriptions**: read only.
- **Residents**: the whole record, read only (the spreadsheet download included, and it has a "Prescriptions running today" column).

### Forms

- None that save. The "Add prescription" button on the Prescriptions page leads to "You don't have access to this page".

## Major restrictions

- **Cannot record that a dose was given.** By design: the list is for reading and the system keeps no record of doses.
- **Cannot add, change or stop a prescription.** The Add prescription button is offered and refuses.
- **Cannot see any other medical page.** Diet, Clinic Visits, Weight, Procedures and Blood Tests all say "You don't have access". The tiles
  on the resident's page still show, with wrong counts for everything except prescriptions: "Diet: 0 current", "Clinic Visits: none
  scheduled", "Weight: no data", "Procedures: 0", "Blood Tests: 0".
- **Is offered buttons it cannot use** on a resident's page (Edit resident details, Send to hospital, Foster / adopt, Move enclosure) and a
  photo drop zone on the Photos page.
- **Cannot see enclosure or zone on the Residents list** (both read "—"), although the Medication list shows them.
- **Cannot open** Stocktake or Add Medical Photos.
- **Reads more than it needs.** A list that needs a name, a photo and an enclosure can also download every resident's whole record.

## Recommendation

- **Decrease:** stop offering the buttons it cannot use, and decide whether a person who only hands out medicine should be able to download
  the whole residents spreadsheet. At the moment they can.
- **Decrease (bigger question):** the card needs who and where, but the resident read it holds is the whole record (bio, age, sex,
  microchip, intake date). A true who-and-where read would be narrower. This is the same finding as for View residents.
- **Fix the display:** the resident's medical tiles should say "not allowed" instead of "none recorded".
- **Nothing to increase:** the list does the job it describes.
