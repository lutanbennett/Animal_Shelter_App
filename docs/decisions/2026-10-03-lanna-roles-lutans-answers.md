# 2026-10-03 — Lanna's roles: Lutan's answers on who does what, and that it is built role by role

**These are Lutan's rulings, given in chat on 2026-10-03, in his words.** They
settle *who may do what* at Lanna. They do not settle *how it is built*. The fork was decided separately the
same day (`2026-10-03-configured-roles-not-enum-values.md`); the remaining
details in `docs/roles-and-permissions.md` are still proposed, and its §17 lists
what is still asked of him. **The Director has not yet seen the table these answers
produce** (`docs/roles-director-table.md`); it is hers to confirm.

He writes "Manager / Director" for the two roles the Director holds. In the
system those are **Management** and **Admin**.

## The roles

"The director will do management on her mobile during the day, the 2ic will do
her duties on the mobile during the day and admin is done at night. One thing to
think about is that admin and management will probably be the same person."

So the 2IC is her own role and not Management, which the backlog item had
assumed. Lanna needs three roles the system lacks: **2IC**, **Maintenance**,
**Medical**.

## The answers

| | Lutan | Ruling |
|---|---|---|
| Medication | "We will not record medication given, the head of medical can purely just view what medicine should be given" | **No medication round.** The system keeps no record of a dose being given. The Head of Medical gets a read-only list of who gets what and how much |
| 1 | "Only Manager and Admin can perform those tasks" | Moving a resident, hospital, foster, adoption and recording a death are Management's and Admin's alone |
| 2 | "The 2IC only does those three tasks" | Stocktake, Purchasing, Maintenance tasks |
| 3 | "Head of maintenance can only view resident info, only update is the Maintenance tasks and recurring tasks" | Views residents; changes only maintenance jobs and recurring tasks |
| 4 | "No their only job is to administer medicine and we will not be recording it so all they need is a reference system to tell them who and how much" | The Head of Medical writes nothing: no prescriptions, no bookings, no weights, no stock count |
| 5 | "Just Who and Where - Read only" | A volunteer sees who a resident is and where it lives. Not its medical records, and nothing to change |
| 6 | "Put vets on hold for now" | The vet role stays exactly as it is |
| 7 | "Manager / Director book vet visits, the 2IC will create maintenance tasks along with Manager / Director" | Booking a vet visit is Management's and Admin's. The 2IC creates maintenance tasks |
| 8 | "Only Manager Director should be allowed to publish photos" | Putting a resident's photo on the public website is Management's and Admin's alone |
| Building | "I suggest that when we implement we take it role by role" | Implementation goes one role at a time, not one database area at a time |

## What follows from them

- **The medication round in the backlog item is not built**, and its schema PR
  is not needed. What replaces it is one screen over the prescriptions that
  already exist. That the system has no record of a dose given is now a decision
  and not a gap.
- **Volunteers lose what they can read as well as what they can change.** Today
  a volunteer reads every medical record. "Who and where" needs a narrower view
  of a resident, enforced in the database, since a volunteer's own login is the
  real boundary.
- **Publishing a photo becomes its own permission.** Today it is not a separate
  act: filing a photo anywhere but Medical puts it on the website for a resident
  on the Adopt page (`0101`).
- **Staff is unused at Lanna**, as far as these answers go: they name nobody but
  Management and Admin for the work Staff does today. Staff stays in the product
  for other shelters. Which of today's staff logins becomes which role is still
  to be asked.
- **Vets on hold** agrees with the parked *Clinics and doctors* item. Nothing in
  the roles work changes what a vet can do.

## Taken as read, until Lutan says otherwise

Four points the answers leave open. Each is marked `?` on the Director's table.

- "Those three tasks" are the whiteboard's. The backlog item also gave the 2IC
  **recording a delivery**; it is treated as part of ordering, and hers.
- The Head of Maintenance's "recurring tasks" means **marking their own done**.
  Setting recurring tasks up stays Management's.
- The 2IC and the Head of Maintenance see a resident as a volunteer does: **who
  and where**.
- The 2IC marks **her own** recurring tasks done.
