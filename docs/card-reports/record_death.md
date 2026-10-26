---
card: record_death
walked: 2026-10-26, as a login holding only this card on the test system (dev: 266 applied, 0 pending). Schema half only: the grants were read back and the page opened; the death itself was inserted inside a rolled-back transaction and nothing was kept. Not yet walked in a browser with the app half.
---

## Purpose

Lets a person record that a resident has died, which closes the resident's record from that day. It was part of the Residents card until Card review 1 (2026-10-26, migration 0265) split it out, so that the heavy, hard-to-undo job can be given on its own.

## Gives access to

### Pages

- **Record death** (`/residents/<id>/deceased`): date of death, cause, notes and an explanation of what recording a death does. It opens and shows the resident's current location.
- **The Residents list and each resident's page**, read only, because the card includes View residents (the page needs the resident and the Deceased enclosure).

### Tables

- **Where a resident has lived** (placement history): one new row, the Deceased placement.
- **Residents and enclosures**: read only.

### Forms

- **Record a death**: the Deceased placement is written (driven in a rolled-back transaction as this login; the Drive archive step was not run).

## Major restrictions

- **Cannot withdraw a death.** Undoing it is a separate power, `placement.death_withdraw`, which this card does not hold. Admin can.
- **Cannot edit a resident, move one, foster, adopt or send to hospital.** Those stay on Residents.
- **The Residents list and its buttons are offered** (edit pencil, Send to hospital, Foster / adopt, Move enclosure) and refuse. Hiding them is the app half of Card review 1.
- **Every role that could record a death before was given this card** by 0265, so nobody lost the ability.

## Recommendation

- **Keep as is** once the app half hides the buttons it cannot use.
- **Decide (yours, small):** whether Residents should also lose `placement.hospital`, since *Send to hospital* is being hidden from it.
