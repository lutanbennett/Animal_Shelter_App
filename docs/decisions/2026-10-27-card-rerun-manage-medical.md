# Card re-run: `medical_records` (Manage medical), driven (2026-10-27)

`medical_records` was last driven 2026-10-25, before `0268`, `0269` and the #965 app half, so that pass was stale on both counts. No live role holds
the card (`staff` was its only holder and is gone); it was driven as one-card login anyway, because Lutan will reassign every role's cards and the card must work
the day it is given to somebody. Nothing fixed, no card proposed, no role named.

**How:** `node scripts/dev-signin.mjs --cards medical_records --port 3002`, aal1, dev schema 271 applied.

| walkthrough step | result |
|---|---|
| 0, 1 | tile on `/home`; `/residents` loads (91 residents, 9 deceased hidden) |
| 2 (`TODO`) | what I drove: visit opens, edit opens with 9 clinics, saves |
| 3, 4, 6, 8 | **form opened with its pick-lists populated; not saved** |
| 5 | prescription saved; listed under Current |
| 7 | weight saved; on the Weight page |
| 9 | removed, "1 removed hidden", Show removed, Restore: works |
| 10 | works now (the 2026-10-25 refusal is contradicted) |
| 11 (`TODO`) | not driven |
| 12 | `/medical/photos` to `/no-access` |

Rows added to `docs/card-access-faults.md` under `## Added 2026-10-27 by claude/card-rerun-manage-medical`.

## Not done, said plainly
Saves of procedures, blood tests, immunizations and diet; file attachments; the send-to-hospital step. The walkthrough heading still reads `Result: pending`
for that reason. The backlog item covers 14 cards and is not ticked.
