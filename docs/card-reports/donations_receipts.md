---
card: donations_receipts
walked: 2026-10-25, driven in a browser on the test system as a login holding only this card (1 card, 1 permission, at edit)
---

## Purpose

Records the gifts the shelter receives and issues the numbered donation receipt for each one. A receipt is filed on the shelter's Google Drive and is
what is sent to the donor.

## Gives access to

### Pages

- **Donations**: every gift in a date window (12 on the test system), with its receipt number and whether it has been sent, and the total in baht.
- **Record a donation**: who gave, the gift, what it is for, the receipt lines, and a Thai or US receipt.
- **A donation's page**: the receipt, with View, Download, Share, Email draft, "I've sent it" and "Void this receipt".
- **Donors**: the list of people who give, with Add a donor, a donor's page and Archive.

### Tables

- **Donations and receipts** (read, add, issue, void).
- **Donors** (read, add, change, archive).
- **Receipt files**, saved to Drive.

### Forms

- **Record a donation**: works for a donor typed in by hand. A receipt was issued with the next number and filed on Drive.
- **Add a donor**: works. The donor then showed in the Donors list.
- **Void a receipt** and **mark as sent**: offered on the receipt page. Not pressed.

## Major restrictions

- **A gift cannot be given to a named resident.** On "What it is for", choosing "A resident" opens the resident list and it says "No residents match".
  The card cannot read residents, so this choice is a dead end. "A project" and "An appeal" showed no list to choose from either.
- **One grant is enough for an ordinary gift, but not for a gift with a purpose.** A general gift from a typed-in donor went through end to end. A gift for a
  resident, a project or an appeal does not. This is the same fault as the other cards that need a resident picker.
- **Receipts go to real people.** The receipt names the donor and is filed on the shelter's Drive. Nothing stops a typo going out; the only guard is Void.
- **Menu offers Residents although the card grants nothing there.** Already in the access fault log; seen again on this login.
- **Cannot open** the medication list: "You don't have access".

## Recommendation

- **Increase (small):** let the card choose a resident, a project and an appeal for the "what it is for" step, for example by adding the resident look-up.
  Otherwise the gift's purpose has to be typed into a note and the shelter's per-resident giving figures go missing.
- **Keep as it is otherwise.** It is one narrow job and it does the whole receipt. Check who holds it: it writes the shelter's money record.
