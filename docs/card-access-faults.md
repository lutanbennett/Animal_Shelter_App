# Card access faults: the log to review at the end

**What this is.** Lutan's instruction, 2026-10-24: *"I want all errors to surface based on card only access. Please add these to a log that I can review at the end of the fix to the card access control work."*

**Who reviews it, and when.** Lutan, once, when the card-access work (the item *a card given to a role must carry its own access*) closes. **That review is the gate, not each fault.**

**How to use it.** A fault found while access is driven by cards only gets a **row here** instead of a one-off fix. Later streams **append a row rather than fixing a fault in isolation**, and held faults stay held until the review. If your work happens to fix one, say so in your PR and mark its row, rather than quietly removing it.

Roles, cards and activity names only. No personal data.

| role | card | fails at | missing | production | read at |
|---|---|---|---|---|---|
| doctor | `book_clinic_visits` / `medical_records` | saving a clinic visit (the clinic list is empty) | `clinics.list` | **LIVE** | 2026-10-24 19:53 (`check-production.mjs`) |
| three roles | `do_maintenance` | deleting a maintenance job (there is no delete control) | not established | **LIVE** | 2026-10-24 19:53 (`check-production.mjs`) |
| any role holding it | `residents` | move, hospitalise, foster/adopt, record a death | the enclosure lookup, refused by RLS from `0145` (not a card cell) | not live | 2026-10-24 19:53 (`check-production.mjs`) |

Not fixed by the stream that created this log (`claude/cards-grants-app`): none of the three rows above was touched.
