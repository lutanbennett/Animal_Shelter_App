---
card: view_residents
walked: 2026-10-25, driven in a browser on the test system as a login holding only this card
---

## Purpose

Lets a person look residents up: who they are, what they look like and where they have lived. It changes nothing.
It is the "floor" that the Residents, Medical records and Book clinic visits cards are all built on, so everything below
is also true of those three.

## Gives access to

### Pages

- **The Residents list** (92 residents on the test system; the 9 who have died are hidden). Search by name or chip number, filter by
  zone, status, adopted, fostered, hospitalised or no microchip.
- **A resident's own page**: photo, name, species, size, microchip number, bio, intake date and current status.
- **Housing & Status**: the history of where the resident has lived and what has happened to them.
- **Photos**: the resident's whole photo and video gallery (4 items on the first resident opened).

### Tables

- **Residents**: the whole record, not just name and place. The "Download spreadsheet" button on the list hands over a spreadsheet of every resident.
- **Where each resident has lived** (placement history).
- **Photo and video gallery** for each resident.

### Forms

- None that save. Every form it is shown refuses (see restrictions).

## Major restrictions

- **Cannot change anything.** It cannot add or edit a resident, move, hospitalise, foster out, adopt out, or record a death,
  and cannot upload or remove photos.
- **But it is offered all of those buttons.** The Residents list shows a pencil on every row; a resident's page shows
  *Edit resident details*, *Send to hospital*, *Foster / adopt* and *Move enclosure*; the Photos page shows a drop zone for uploads.
  Each one opens, then refuses ("Only staff and admins can edit resident details", "Only staff, volunteers and admins can move
  residents", "Not authorized to manage attachments"). Nothing is written, but a person is invited to try and then told no,
  in words that still name the old role names.
- **Cannot see where.** The Enclosure and Zone columns on the list, and "Current location" on a resident's page, are blank
  (a dash) for every resident, because enclosure names are a separate permission this card does not hold.
- **Cannot see any medical page.** Diet, Immunizations, Clinic Visits, Prescriptions, Weight, Procedures and Blood Tests all
  say "You don't have access". Their tiles on the resident's page still show, with counts that are wrong because the card is not
  allowed to look (for example "Diet: 0 current, no current diet recorded" for a resident who has one).
- **Cannot open** Stocktake, Enclosures or Upcoming visits.

## Recommendation

- **Decrease:** stop offering the buttons it cannot use (edit pencil, Send to hospital, Foster / adopt, Move enclosure, photo
  upload). Today they invite a try and then refuse. Decide whether a read-only card should be able to download the whole residents
  spreadsheet; at the moment it can.
- **Decrease (bigger question):** the card is described as "who and where, nothing more", but it reads the whole resident record
  (bio, age, sex, microchip, intake date). A true who-and-where read would be narrower.
- **Increase:** let it read enclosure names, so the "where" half of the promise works. Otherwise the Enclosure column is empty
  for everyone who holds only this card.
- **Fix the display:** the medical tiles on a resident's page should say "not allowed" rather than "none recorded".
