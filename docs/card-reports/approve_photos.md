---
card: approve_photos
walked: 2026-10-25, driven in a browser on the test system as a login holding only this card (1 card, 3 permissions: approve photos, manage resident photos, and the resident read at read); the public site was read with no sign-in
---

## Purpose

Looks at the photos that are waiting, and decides which animals may be shown on the website. It is the card that "approves". It can also name the animal in a photo
that a volunteer filed against an enclosure only, and remove a photo that should not be seen.

## Gives access to

### Pages

- **Photos to approve** (the card's own page): the photos filed against an enclosure ("Taken in an enclosure, resident not chosen", with the animals that were in that
  enclosure that day to choose from), and any photos waiting under a resident, each with Approve, "Wrong animal?" and Remove.
- **The same resident look-up as View residents**: the Residents list, a resident's page and its Photos page, with a photo's own controls (Mark as posted,
  Remove photo, Current profile photo, Move to folder), and the "Download spreadsheet" button.

### Tables

- **Waiting photos** (those filed against an enclosure, and those under a resident): read, name the animal, approve, discard, remove.
- **A resident's photos**: read, remove, choose the profile photo, move to the Medical folder.
- **Residents**: the whole record, read only.

### Forms

- **Assign and approve** (an enclosure photo, one animal chosen): works. One click, no warning, and the photo was on the public Adopt list and the resident's public
  page within seconds, as that resident's profile picture. The resident had no public photo before and was shown on the website.
- **Assign, keep it private** (same form, "Keep it off the website" ticked): works. The photo then waited, could not be fetched from the public website (404) and
  did not become the profile picture.
- **Approve** (a photo already waiting under a resident): **does not work**, twice. "The photos could not be approved. Nothing was changed."
- **Wrong animal?** (move a waiting photo to another resident): **does not work.** "The photo could not be moved. Nothing was changed."
- **Remove** (a waiting photo): works, after a confirmation box. "Photo removed."
- **Remove photo** (on the resident's Photos page): works, after "Confirm remove". It also took the photo off the public site.
- **Move to folder**: the only folder offered is Medical, and it was refused for a profile photo ("Choose a different profile photo before moving it to Medical").
- **Upload on the resident's Photos page**: the box is offered, but the upload is refused ("Not authorized to manage attachments.").
- **Discard** (an enclosure photo) was not pressed.

## Major restrictions

- **Approval does gate: a waiting photo is private.** A photo that was filed and not approved came back 404 to a visitor with no sign-in and did not become the profile
  picture. That is true here, and the page's wording ("Approved photos can then be shown on the website") is honest about it.
- **One click is the whole control, and it publishes.** The approver sees a picture and a button. Nothing says that the photo will become the animal's public profile
  picture, or that the animal has to be showing on the website for it to appear. Driven: with the resident public and no profile picture, **Assign and approve**
  put that photo on the public Adopt list and page.
- **Approving and refiling a waiting resident photo do not work.** The database refuses any change to a Shelter photo from a login that cannot also publish
  (a rule from 0152 that only the Residents card clears). So this card can approve only through the enclosure form, not the plain Approve button, which the page
  shows for every waiting photo. The only thing that works on a resident photo that is waiting is to remove it. Combined with the add card, the two
  cards that were built as a pair cannot complete their job on the main path (see Add Shelter Photos).
- **Approval can be bypassed, and it was driven.** A login holding only the **Residents** card chose the Foster folder on a resident's Photos page and uploaded a photo.
  It was stamped approved by the person who uploaded it, became the resident's profile picture, and was on the public Adopt list and the resident's public page within
  seconds, with no approval from this card and no second person. The only warning was one line shown after the folder was chosen ("Photos in this folder can appear on
  the public website, on this resident's Adopt page"). That photo was removed again afterwards. So this card gates the Shelter folder and the enclosure route, and nothing else.
- **A photo from the Medical card does not need approving, and does not reach the public site.** Driven: a Medical photo added by a login holding only Add Medical Photos
  became a resident's profile picture on the staff side straight away, but the public Adopt page and list did not show it, and fetching it with no sign-in returned
  404. So that earlier question is answered: no, not through this route.
- **Cannot see medical pages** (Clinic Visits is refused), Stocktake and the Medication list are refused.
- **The resident's page offers buttons it cannot use** (Edit resident details, which opens a form, Send to hospital, Foster / adopt, Move enclosure) and the spreadsheet.

## Recommendation

- **Fix (needed):** make Approve and "Wrong animal?" work for this card, or remove them. A card named for approving cannot approve the photos that are waiting under a
  resident. This is a card that holds everything it needs on paper and is stopped by one older rule.
- **Add a warning:** the approve step should say what it will do: "This photo will appear on the website as {name}'s picture", and say so when the animal is not
  public, so the approver is told rather than guessing.
- **Decrease:** a person who approves photos needs a name, a code and a photo, not the whole record or the spreadsheet.
- **Decrease:** stop offering buttons it cannot use, including the upload box on the Photos page.
- **Nothing to increase.**
