---
card: add_photos
walked: 2026-10-25, driven in a browser on the test system as a login holding only this card (1 card, 2 permissions: add shelter photos at edit and the resident read at read); the public site was read with no sign-in
---

## Purpose

Lets a volunteer file photos of the shelter's animals from a phone: take or choose the photos, tap who is in each one, and they go into the resident's
Shelter folder. The page says "Your photos wait for Management to look at them. Nobody outside the shelter sees them until then." The card is meant to
publish nothing by itself. It cannot be given to a role until some role also holds Approve photos.

## Gives access to

### Pages

- **Add photos** (the card's own page): "Take a photo" and "Choose from phone", then for each photo either "I know who it is" (a name search, quick buttons for
  the last animals tagged and for the enclosure, and every resident listed by zone and enclosure) or "I don't know, tag the enclosure" (pick a zone, then an
  enclosure).
- **The same resident look-up as View residents**: the Residents list (93 residents when opened), a resident's page and its Photos page, and the
  "Download spreadsheet" button.

### Tables

- **Shelter photos**: add. Two routes: a photo tagged to a resident, and a photo tagged only to an enclosure that waits for an approver to name the animal.
- **Residents**: the whole record, read only.

### Forms

- **Tag a photo to a resident ("I know who it is")**: **does not work.** Tried on two residents (one with no photo, one with a profile picture), three attempts in all. Each time the page
  said "Not authorized to add attachments." and nothing was saved.
- **Tag a photo to an enclosure ("I don't know")**: works. "All photos are tagged and saved." The photo waited in the approver's queue and could not be
  fetched from the public website.

## Major restrictions

- **The main job does not work.** The volunteer sees a red message and a "Try again" button that can never succeed. (From the code, not
  driven: the photo is sent to Drive before the save is tried, so each failed attempt probably leaves a stray file in the shelter's Drive.) The refusal comes from the save step
  (`record_attachment`), which since 0259 admits a resident's photo only for a holder of the *Medical photos* permission. The branch that was meant to admit a
  Shelter photo for this card sits behind that test and is never reached. This card and Approve photos are the two that were built to work as a pair, and
  the pair is broken on the first step.
- **The enclosure route is the only one that works**, and it hands every photo to an approver to name the animal, so a volunteer who knows the animal
  cannot say so.
- **It cannot publish.** Nothing here reaches the public website. The only way a photo from this card goes public is for the holder of Approve photos to
  press **Assign and approve** (see that card's report). Driven end to end: an enclosure-tagged photo was assigned to a public resident, approved, and
  was on the public Adopt list and the resident's public page within seconds.
- **Cannot see anything medical.** Clinic Visits and the other medical pages say "You don't have access". The Stocktake and Medication list are refused too.
- **Reads more than it needs.** A person who only needs to choose a resident is also offered the whole residents spreadsheet. A resident's page
  offers Edit resident details, which opens an empty-looking edit form (not saved here), and Send to hospital, Foster / adopt and Move enclosure.

## Recommendation

- **Fix (needed):** make the resident route save, or take it away. Either let the save step admit the Shelter folder for this card, as the code comments say
  it should, or leave only the enclosure route and say so on the page. Today the card promises one thing and does another.
- **Decrease:** a volunteer who needs to pick an animal is given the whole record and the spreadsheet. A look-up that returns only a name, code and
  enclosure would do the job.
- **Decrease:** stop offering buttons the card cannot use.
- **Nothing to increase.**
