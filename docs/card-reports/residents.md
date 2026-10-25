---
card: residents
walked: 2026-10-25, driven in a browser on the test system as a login holding only this card
---

## Purpose

The whole job of keeping a resident's record: register new arrivals, correct their details and microchip, look after their photos
and note news from adopters. It also includes everything View residents gives (the list, the pages, the gallery).

## Gives access to

### Pages

- **The Residents list and each resident's page**, as View residents.
- **Register a resident** (six steps: who, arrival, health, for adopters, story, review).
- **Edit resident details**: name, Thai name, species, breed, sex, size, age, colour, bio, adopter-facing facts, ready for adoption.
- **Photos**: upload, move between folders, remove, choose the profile photo.
- **Adoption updates** (only on an adopted resident): add an update from the adopter.
- **Four life-event pages**: Move enclosure, Send to hospital, Foster / adopt, Record death. They open and the forms fill in, but see restrictions.

### Tables

- **Residents** (read and change), with the microchip number and the opening placement.
- **Photo and video gallery** (add, refile, remove, profile photo).
- **Adopter news** (add).
- **The starting diet** chosen at registration is saved, although the card cannot read diets afterwards.

### Forms

- **Register a resident**: works end to end. The zone and enclosure pickers are filled, the new resident appeared in the list and the
  starting diet and microchip were saved.
- **Edit resident details**: works.
- **Correct the microchip number**: works; the new number shows on the page straight away.
- **Add adopter news**: works.
- **Add, refile and remove a photo**: work. Filing a photo under **Foster** or **Adoption** instead of Medical is what puts it on the public website,
  and this card can do that (the tile read "Foster" straight after).
- **Move, Send to hospital, Foster / adopt, Record death**: **do not work.** Each fails on save with a misleading message.

## Major restrictions

- **Cannot move a resident, send one to hospital, foster or adopt one out, or record a death.** Move says "That enclosure no longer exists"; the other three
  say "The Hospital (or Fostered, or Deceased) status enclosure is missing from this database". Neither is true: the card is simply not allowed to look the
  enclosure up. The pickers were fixed for this card, but the save step still looks the enclosure up directly. This is the same fault already in the access
  fault log, which had been marked closed.
- **Cannot see enclosure names.** "Current location" on every one of those forms is a dash.
- **Cannot see any medical page** (Diet, Immunizations, Clinic Visits, Prescriptions, Weight, Procedures, Blood Tests). The tiles still show, with wrong "none" counts:
  the new resident's page says "Diet: 0 current" although registration had just saved a diet.
- **The Foster form says "No carers in contacts yet".** That is probably because the card cannot read the contacts book (not confirmed, because the save failed first).
- **A death cannot be undone by this card.** The confirmation box says only an Admin can withdraw it afterwards.
- **Cannot open** Stocktake, Enclosures, Upcoming visits or any medical page.
- **It can do more than its name suggests.** Besides editing records it can publish a resident's photo to the public website
  (through the Foster and Adoption folders) and correct a microchip number. The card is also meant to move residents, hospitalise them, rehome them
  and record deaths, which are heavier jobs than the name "Residents" suggests.

## Recommendation

- **Fix before anything else (increase the access):** give the card the enclosure lookup its own forms need, so Move, Send to hospital, Foster / adopt and
  Record death can save. Today four of the card's headline jobs cannot be done.
- **Decrease or split:** this card bundles twelve different jobs under one plain name. Recording a death, rehoming and publishing photos to the
  website are far weightier than correcting a bio. Consider separate cards for the life events and for public photos.
- **Increase (small):** let the card see the contacts book for the Foster form's carer list, and show "not allowed" instead of "none" on the medical tiles.
