---
card: medical_records
walked: 2026-10-25, driven in a browser on the test system as a login holding only this card (1 card, 9 permissions: the 8 medical ones at edit, plus the View residents read it includes)
---

## Purpose

The whole job of keeping a resident's medical record: weights, diets, medicines, immunizations, procedures, blood tests and vet
visits, and taking out an entry made by mistake. It also includes everything the View residents card gives, so a person holding
only this card can look any resident up. That was checked, not assumed: with only this card the Residents list, a resident's
page, Housing & Status, the Photos gallery and the spreadsheet download all worked.

## Gives access to

### Pages

- **Everything in the View residents card**: the Residents list (90 residents and 9 hidden deceased when first opened), a resident's
  own page, Housing & Status, the Photos gallery (4 items) and the "Download spreadsheet" button on the list.
- **A resident's seven medical pages**: Diet, Immunizations, Clinic Visits, Prescriptions, Weight, Procedures and Blood Tests. All open
  and show real figures. The tiles on the resident's page are correct too (for example "Diet: 2 current", "Prescriptions: 2 active",
  "Weight: 13.1 kg").
- **Vet visits** (the shelter's list of every visit, as a list or a calendar) and **a single visit's own page**, which holds the
  bill photos and the doctor's report.
- **Operations**, showing three tiles: Medication list, Feeding list and Vet visits.
- **Medication list**: a new prescription added with this card showed up here straight away, with the enclosure names.
- **Record Weight** (the page where you tap a resident by enclosure to weigh them).

### Tables

- **Medical records of every kind**: weights, diets, prescriptions, immunizations, procedures, blood tests and vet visits. Read and change.
- **Files attached to those records** (scans, X-rays, doctor's report pages): add.
- **The lists the forms pick from**: medicines (25 on the test system), diets, procedure types and blood-test types. Read.
- **Residents**: read only (through View residents).

### Forms

- **Log weight**: works. A reading of 14.2 kg was saved and the chart and history updated.
- **Remove an entry and restore it**: works. Removing the weight reading took it off the list and the chart, the page said "1 removed hidden",
  and Show removed then offered Restore, which brought it back.
- **Add prescription**: works. It appeared under Current on the resident's Prescriptions page and on the Medication list.
- **Log procedure**, with a file attached in the same step: works.
- **Log blood test**: works. A scan was attached to it afterwards from the same row ("Done").
- **Log immunization**: works. It shows a table straight after saving (resident, immunization, date, next due).
  The "Add all in a zone" and "Add all in an enclosure" pickers on that form are empty for this card.
- **Add diet**: works. It showed under Current with the amounts for the resident's size.
- **Add a doctor's report page to a vet visit**: works. The resident's Clinic Visits tab then showed "Doctor's report: 1 page".
- **Book a vet visit** and **Edit or complete a vet visit**: do not work (see restrictions).

## Major restrictions

- **Cannot book a vet visit.** The "Book clinic visit" button is offered on the resident's page, on the Residents list and on the
  Clinic Visits tab, and every one of them leads to "You don't have access to this page". Booking is the Book clinic visits card's job.
- **Cannot mark a visit done, cancelled or changed.** The edit form opens, but the Clinic box has no choices in it and the form will not
  save ("Please select an item in the list"). So a visit that has passed stays "Scheduled" and sits under Overdue (8 on the test
  system). This is the same fault as the clinic-visit rows already in the access fault log.
- **On the live shelter this is real today.** `fault-clinic-visit-save` on production names the Staff role: it holds Book clinic visits and
  Medical records but not the clinic list, so Staff is blocked from saving a visit. Management is not affected.
- **Cannot see which clinic a visit was at.** The clinic reads "—" on every visit and on the Vet visits list, and the "linked visit"
  choices on the medical forms show only a date.
- **Cannot add photos.** The Add Medical Photos page is refused, and a photo dropped on the resident's Photos page is refused with
  "Not authorized to manage attachments".
- **Cannot change the resident itself, and is offered the buttons anyway.** Edit resident details, Send to hospital, Foster / adopt
  and Move enclosure all open and then refuse, in words that still name old roles ("Only staff and admins can edit resident details").
- **Cannot see enclosure or zone on the Residents list** (both columns read "—"), although the Medication list and Record Weight show them.
- **The "Appointments" menu entry is a dead end** for this card: it says the account "is not linked to a clinic yet".
- **No read-only version.** All eight medical permissions are at edit, including removing and restoring. Nobody can be given "look at
  the medical record" without also being able to change it.
- **Cannot open** Stocktake or Add Medical Photos.

## Recommendation

- **Increase (small, and fix first):** let the card read the clinic list. Without it a card called "Medical records" cannot finish the
  vet visits its own page lists, and Staff cannot save one on the live system today.
- **Decide (yours):** should this card also book visits? Staff holds both cards on the live system, so today the answer only matters for
  anyone given Medical records alone.
- **Increase or split:** add a read-only medical card for people who only need to look (a vet, a volunteer coordinator). At the moment
  the choice is everything or nothing.
- **Decrease:** stop offering the buttons it cannot use (Book clinic visit, the resident-edit buttons, photo upload).
- **Fix the display:** the "Appointments" menu entry should not appear for a login with no clinic.
