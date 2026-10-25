---
card: add_medical_photos
walked: 2026-10-25, driven in a browser on the test system as a login holding only this card (1 card, 2 permissions: add resident photos at edit and the resident read)
---

## Purpose

Lets a person photograph a resident for the medical record: a wound, a rash, a bandage. The photos go into the resident's Medical folder and
never onto the website. The page says "You can add photos here but not look at them again", which turned out not to be true (see
restrictions). It does not include the View residents card, but it holds the same resident read.

## Gives access to

### Pages

- **Add Medical Photos** (the card's own page): a "Scan card" button, a name search, and every resident listed by zone and enclosure with
  their name and number. Tapping a resident opens "Take a photo" and "Choose from phone".
- **The same resident look-up as View residents**: the Residents list (93 residents and 9 hidden deceased when opened), a resident's page,
  Housing & Status, the Photos gallery and the "Download spreadsheet" button.
- **A resident's Photos page**, including its upload box.

### Tables

- **Photo and video gallery**: add. Nothing in this card lets it move, refile, remove or publish a photo.
- **Residents**: the whole record, read only.

### Forms

- **Add a medical photo (the card's own page)**: works. "1 photo saved" appeared, and the photo showed in the resident's gallery as
  "Medical · 25 Oct 2026, not posted yet".
- **Upload on the resident's Photos page**: also works ("Done"). It gave no choice of folder, so everything went into Medical. This card
  cannot put a photo in the Foster or Adoption folders, which is what publishes a photo to the website.

## Major restrictions

- **It can look at the photos it just added.** The Add Medical Photos page says it cannot, but the card also holds the resident read, so
  Residents, then the resident, then Photos shows the whole gallery (2 items on the resident tried, both the photos it had just added). The promise on the page is wrong.
- **The first photo added became the resident's profile picture.** The resident it was tried on had no photo, and the new one now shows at
  the top of their page. Whether a profile picture can appear on the public website was not established.
- **Cannot see any medical page.** Diet, Clinic Visits, Prescriptions, Weight, Procedures and Blood Tests all say "You don't have access",
  and so do the Medication list and Stocktake. The tiles on the resident's page still show, with wrong counts ("Diet: 0 current",
  "Prescriptions: 0 active", "Weight: no data").
- **Cannot move, refile, remove or set the profile photo** of an existing photo; none of those controls is offered.
- **Is offered buttons it cannot use** on a resident's page (Edit resident details, Send to hospital, Foster / adopt, Move enclosure).
- **Reads more than it needs.** A person who only needs to choose a resident is also offered the whole residents spreadsheet.
- **Cannot see enclosure or zone on the Residents list** (both read "—"), although its own page lists residents by enclosure.

## Recommendation

- **Fix the wording or the access:** the page tells the person they cannot look at the photos again but they can. Either correct the
  sentence or take the gallery away; the first is simpler.
- **Decrease:** stop a medical-only upload from becoming a resident's profile picture, or decide that it may.
- **Decrease (bigger question):** the card needs a name and an enclosure to pick a resident, but holds the whole record, spreadsheet
  included. This is the same finding as for View residents.
- **Decrease:** stop offering the buttons it cannot use.
- **Nothing to increase:** the card does the one job it names.
