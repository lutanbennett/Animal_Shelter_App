# Assistant batch 2: death and foster/adopt (2026-10-16)

Both intents shipped. Neither needed information free text cannot carry:
cause of death is free text on the deceased page too, and a foster or
adoption needs a date, a kind and an *existing* carer.

## How a resident is chosen

The sentence is matched against residents who are not deceased, by code
first (a code is unique), then by name, longest name wins, whole words only.
"Lucky died" with a "Lucky" and a "Lucky Boy" picks "Lucky" and never
"Lucky Boy"; two residents both called "Bella" return no id and the card
shows the photo/code/enclosure picker. **For a death the name is matched
only against the words before the cause**, so "Bella died, bitten by Rex"
cannot also claim Rex. For a foster/adopt the carer's name is removed first,
so a carer who shares a resident's name is not mistaken for the animal.

## What is deliberately not accepted from free text

- **A date of "last night", "overnight" or "tonight"** stays blank: it could
  be either calendar day. A death or rehome never gets today's date by
  default, unlike hospital and weight.
- **A new carer.** Only a carer already on `picker_contacts` can be named;
  a new one needs contact details and is added on the foster/adopt page.
- **"Came back from foster"** is not claimed by any parser (it needs an
  enclosure and a different helper). It is left for a later batch.
- A kind (foster/adopt) is left blank when the sentence says both or neither.

## Safety

Confirm calls `recordResidentDeath` / `rehomeResident` under the caller's
own session, so `placement.death` / `placement.rehome` apply exactly as on
the pages, on top of the assistant's own `assistant.record` check. Nothing
was widened. The death card also opens the deceased page's own ConfirmDialog
(same strings) before writing, then runs the same Drive archive.

No migration: `assistant_actions.intent` is plain text.
