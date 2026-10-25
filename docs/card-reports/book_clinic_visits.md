---
card: book_clinic_visits
walked: 2026-10-25, driven in a browser on the test system as a login holding only this card (1 card, 3 permissions: book a visit at edit, vet visits at read, and the View residents read it includes)
---

## Purpose

Putting a vet visit in the diary for one or more residents. It also includes everything the View residents card gives, so a person
holding only this card can look any resident up (checked: the Residents list, a resident's page, Housing & Status, the Photos gallery and
the spreadsheet download all worked with this card alone).

## Gives access to

### Pages

- **Everything in the View residents card**: the Residents list (93 residents and 9 hidden deceased when opened), a resident's own page,
  Housing & Status, the Photos gallery (4 items) and the "Download spreadsheet" button.
- **Vet visits** (reached from Operations): every visit booked at every clinic, as a list or a calendar, with a "Book a vet appointment"
  button. The clinic reads "—" on every row.
- **Calendar entries to confirm**, at the top of Vet visits when the shelter's calendar holds an entry that did not read as one clear
  visit. It lists the clinics by name and has a Create visit button.
- **A resident's Clinic Visits tab**: the list of that resident's visits, with a "Doctor's report: 1 page" note where one was filed.
- **Book clinic visit** (the form).

### Tables

- **Clinic visits**: read, and create (see forms).
- **Residents**: read only (through View residents).
- **Calendar entries** waiting to be confirmed: confirm or dismiss.

### Forms

- **Book clinic visit (the form)**: opens, but **does not work**. The Clinic box has no choices, it is a required box, and the form refuses
  to submit ("Please select an item in the list").
- **Create visit from a calendar entry**: **works**, and it is the only way this card can book. A calendar entry for a resident named Kame
  was turned into a visit with Create visit: the 3 November list grew from 4 to 5, and Kame's Clinic Visits tab showed it as
  "Clinic visit · 3 Nov 2026 · Scheduled · In the shelter calendar".

## Major restrictions

- **The card's own booking form cannot book.** Its Clinic box is empty, and it is required. The calendar panel, in contrast, does list the
  clinics by name (about nine on the test system), so the card can book in one place and not in the place its name points to.
- **A visit it books cannot be opened or edited.** The "Open" and "Edit" links on every visit lead to "You don't have access to this
  page", for the visit's own page and for the edit form alike. A booked visit can be seen in the list and nowhere else.
- **On the live shelter this is real today.** `fault-clinic-visit-save` on production: Management holds the card and the clinic list, so is
  fine; Staff holds the card without the clinic list and is blocked from the form.
- **Cannot see which clinic.** Every visit reads "—" for the clinic.
- **Cannot see any medical page.** Diet, Prescriptions, Weight, the Medication list and Stocktake all say "You don't have access". The
  tiles on the resident's page still show, with wrong counts: "Diet: 0 current, no current diet recorded", "Prescriptions: 0 active",
  "Weight: no data", "Procedures: 0", "Blood Tests: 0", for a resident who has all of them.
- **Is offered buttons it cannot use.** Edit resident details, Send to hospital, Foster / adopt, Move enclosure and the photo drop zone all
  appear (see View residents).
- **The "Appointments" menu entry is a dead end**: it says the account "is not linked to a clinic yet".
- **Cannot see enclosure or zone** on the Residents list (both read "—").

## Recommendation

- **Increase (small, and fix first):** let the card read the clinic list. This card's one job does not work through its own form today, and
  Staff cannot book on the live system.
- **Decide (yours):** should the person who books a visit be able to open it and fix a wrong date? Today they can create one and never open it again.
- **Decrease:** stop offering the buttons it cannot use, and hide the "Appointments" menu entry for a login with no clinic.
- **Fix the display:** the resident's medical tiles should say "not allowed" instead of "none recorded".
- **Worth knowing:** the calendar panel reads clinics in a way the form does not. Whichever way is meant, the form and the panel should agree.
