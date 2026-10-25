---
card: contacts
walked: 2026-10-25, driven in a browser on the test system as a login holding only this card (1 card, 7 permissions, all at edit)
---

## Purpose

Keeps the shelter's address book: the foster and adoptive carers, volunteers and suppliers the shelter works with, the list of vet clinics and the
doctors at each, and the Shelter Friends, the local businesses thanked on the public website. It is the one card for all of that.

## Gives access to

### Pages

- **Contacts** (Management): every contact, with an edit, archive and delete control on each row and a Show archived link.
- **The contact list** (Operations): the phone-book view, with call, LINE, email and map buttons. 9 contacts showed on the test system.
- **A contact's own page**: the details, and for a Shelter Friend their card and profile.
- **Clinics** and **Doctors at a clinic**: add, rename, merge, mark as left, bring back, delete.
- **Shelter Friends**: the ordered list of businesses, with Publish, Unpublish and move up or down.
- **Add a Shelter Friend**: five steps (who, how they help, logo and links, what the public may see, review).

### Tables

- **Contacts** (read, add, change, archive, delete).
- **Clinics** and **clinic doctors** (read, add, change, delete).
- **Shelter Friend profiles** (read, add, change, publish, unpublish, remove).

### Forms

- **New contact**: works. The contact showed in the list straight away.
- **Edit contact** (on the row): works. A phone number saved and showed.
- **Archive a contact**, **Show archived**, **Restore**: work.
- **Delete a contact**: works, and the box says it cannot be undone.
- **Add a clinic**: works.
- **Add a doctor, rename, mark as left, merge two doctors**: all work. The "also works here" list showed 13 doctors from other clinics.
- **Add a Shelter Friend** (saved as a draft): works.
- **Publish a Shelter Friend**: works, and **it reaches the public website at once**. Driven: a draft business was published, the public Friends page
  (read with no sign-in) then listed it, and Unpublish took it off again.

## Major restrictions

- **There is no read-only version.** All seven permissions are at edit, so anyone who only needs to look up a phone number also gets Delete, Archive,
  edit and Publish. Delete on a contact is permanent. This is the card's biggest restriction and it is the opposite of a wall: it does too much.
- **Publishes to the public website.** Publish and Unpublish on Shelter Friends act on the public site immediately, with no second person to approve.
  The card also decides which of a business's contact details may be shown (the "what the public may see" step).
- **Cannot give a resident to a carer.** That is done from the resident's page, which this card does not open (its menu still offers Residents, but see the
  resident cards).
- **Menu offers Residents although the card grants nothing there.** Seen again on this login; the same fault is already in the access fault log.
- **Cannot open** the medication list: the login is sent to "You don't have access". No other page was probed.

## Recommendation

- **Decrease (most important):** split the card into a read-only "Look up contacts" and the editing card, so a volunteer or door-staff role can find a phone
  number without being able to delete a carer. Nothing at all offers read-only today.
- **Decrease or split:** the Shelter Friends work (publishing a business on the public site) is a different kind of job from keeping an address book. Consider
  its own card so that publishing is held on purpose.
- **Increase:** none needed. Every step of the card's own job worked.
