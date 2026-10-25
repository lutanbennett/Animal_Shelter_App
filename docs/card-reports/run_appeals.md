---
card: run_appeals
walked: 2026-10-25, driven in a browser on the test system as a login holding only this card (1 card, 2 permissions, both at edit); the public site was read with no sign-in
---

## Purpose

Runs a fundraising appeal for a sick resident: write the appeal, preview it, publish it on the public website, record the gifts that come in, and close it
with how it went. It also includes issuing a donation receipt, because gifts are recorded here.

## Gives access to

### Pages

- **Fundraising appeals**: every appeal with its status (Draft, Live, Closed), whether it is on the website, and how much has been raised.
- **An appeal's page**: Preview as visitors will see it, Publish on the website, Take off the website, Mark goal reached, Close the appeal, Delete this draft,
  the gifts so far, and the wording and goal (title, what is wrong, the treatment, what the cost covers, target, deadline, links, how progress is shown).
- **Start an appeal**: choose a resident, then Continue.
- **Record a gift for this appeal**: the Record a donation form, with the appeal already chosen.
- **A donation's page** with its receipt, as the Donations and receipts card.

### Tables

- **Appeals** (read, add, change, publish, take off, close, delete a draft).
- **Donations and receipts** (read, add, issue).
- **Donors** (read, add).

### Forms

- **Start an appeal**: **does not work.** The resident list says "No residents match", so an appeal cannot be started.
- **Save the appeal's wording**: works ("Saved.").
- **Publish on the website**: works, and **reaches the public site within seconds** (see below).
- **Take off the website**: works, after a confirmation box; the appeal left the public site.
- **Record a gift for this appeal / issue a receipt**: works end to end. The appeal was already chosen, and a numbered receipt was issued and filed on Drive.

## Major restrictions

- **It can put an appeal on the public website on its own.** Driven: a draft appeal was given its wording and Publish was pressed; the public
  Appeals page, read with no sign-in, then showed that appeal with the typed wording. No second person or card approves it. The only other condition is that the resident
  must already be showing on the website. Here the screen **said the resident was not public and that the appeal would not appear, but it did appear**: the card cannot read
  that setting, so its warning is wrong. This is the single most important thing the card does.
- **It cannot start a new appeal.** The resident list is empty (the card cannot read residents), so the only appeals it can work on are ones someone else started.
  The pages that show "For: (resident's name)" show it blank.
- **It cannot choose a photo.** The photo section says the resident "has no photos that can be used", because the card cannot read the photo gallery. An appeal can go public with no picture.
- **It cannot name the resident it is raising money for** on the appeals list or an appeal page; only the link to the resident's page is shown.
- **Menu offers Residents although the card grants nothing there.** Already in the fault log.
- **Cannot open** the medication list: "You don't have access".

## Recommendation

- **Decrease or add a check:** publishing an appeal puts words and a resident on the public website with nobody else looking. Consider requiring a second card for the Publish
  button, or a draft that someone with a publishing card approves, the same way photos have an Approve step.
- **Increase (needed, small):** give the card the resident look-up and the resident's photo gallery, so it can start an appeal, show the resident's name, see whether the resident
  is public and choose a picture. Today it can publish but cannot do the first or last steps of its own job.
- **Fix the warning:** the "resident is not shown" message is wrong for this card. Either it should read the setting or say nothing.
