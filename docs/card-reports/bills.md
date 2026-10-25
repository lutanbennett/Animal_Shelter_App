---
card: bills
walked: 2026-10-25, driven in a browser on the test system as a login holding only this card (1 card, 1 permission, at edit)
---

## Purpose

Collects photos of purchase bills and clinic invoices in one waiting pile ("Bills"), so they can be matched to a delivery, a vet visit or a maintenance
job later. It is the money-out side of the shelter's records.

## Gives access to

### Pages

- **Bills**: the waiting pile. Each bill shows its photo, who added it and when, and has cost, date and note boxes, Add another page, Save details and
  Delete this bill.

### Tables

- **Bill photos waiting to be matched** (read, add, change, delete).
- **Maintenance bills** (written when a bill is matched to a maintenance job).

### Forms

- **Add bills**: works. A photo was added and the pile went from 1 to 2 waiting.
- **Save details** (cost): works. "123" was saved and read back.
- **Delete this bill**: works. The pile went back to 1.
- **"What is it for?"** (match a bill to a job): **does not work**. See below.

## Major restrictions

- **Cannot match a bill to anything.** The "What is it for?" list is empty and says "Nothing from the last two weeks is missing a bill", although the test
  system holds 11 maintenance jobs that are not completed. The card cannot read the jobs, so its own last step has nothing to pick. A bill can be
  photographed and its cost typed, but never attached to the job it paid for, which is the point of the card. One grant is not enough.
- **Anyone with the card sees and can change every bill in the pile**, including ones another person added (the waiting bill belonged to a different login).
  That looks intended, since it is a shared pile.
- **Cannot open** the Maintenance page or the medication list: both say "You don't have access".
- **Menu offers Residents although the card grants nothing there.** Already in the fault log.

## Recommendation

- **Increase (needed):** give the card the maintenance-job read it needs to fill its own list, or the card should say plainly that it only collects photos. As
  it stands the holder is left with a pile that cannot be cleared.
- **Keep as it is otherwise.** Collecting and deleting a bill photo is a small, safe job.
