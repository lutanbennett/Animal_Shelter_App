# Acceptance matrix: the twelve unreached rows (#mz9ts)

Step zero: not built. `#1504` fixed R001 and "User manual" only; the twelve were left, and `docs/acceptance-testing.md` is a stub.

## The R-number mapping (the durable part)

October's R-numbers come from `docs/uat/dry-run-2026-10-03-staff.md`, which numbered the 2026-10-03 generated sheet. The generator numbers rows in order (`scripts/acceptance-matrix.mjs`, `R${i+1}`), so every insertion since shifts them. Today the matrix has 174 rows.

**Mapped BY: the row's title** (the report's table gives each R-number a title; each title was matched to an `activity:` in `scripts/lib/acceptance-matrix-entries.mjs`). Position drifted by +10 in the residents area, +13 for the maintenance board, +3 for the manual PDF, so position alone would have been wrong. Role columns are not used: the Staff role is retired and the matrix now has six other columns.

| October | October title | Today | Today's activity | Match |
|---|---|---|---|---|
| R008 | Print the manual as a PDF | R011 | Print the manual as a PDF | same title |
| R026 | Move to another enclosure | R036 | Move a resident to another enclosure | reworded |
| R027 | Send to hospital | R037 | Send a resident to hospital | reworded |
| R029 | Record a foster placement | R039 | Record a foster placement | same title |
| R032 | Record a death | R042 | Record a death | same title |
| R034 | Read placement history | R044 | Read a resident's placement history | reworded |
| R036 | Book a vet visit | R049 | Book a clinic visit | renamed |
| R039 | Stop a prescription early | R052 | Stop a prescription early | same title |
| R041 | Log a weight | R054 | Log a resident's weight | reworded |
| R049 | See the maintenance board | R086 | See the maintenance board | same title |
| R050 | Change a job's status on the board | R087 | Change a job's status on the board | same title |
| (boundaries) | "5 boundaries" in the brief vs 4 printed | see below | | |

Nothing is unmapped and nothing has split. Numbers will drift again: use the title, not the number.

## Verdicts

Method for every row: **read the app code** (no browser driving; nothing here needed a press). Generated matrix output is not tracked in git (only the generator, entries file and checks are), so nothing generated was committed.

| Today | Verdict | What the code shows |
|---|---|---|
| R011 Print manual PDF | **corrected** | `src/app/manual/page.tsx` shows the link at every width. Device `desktop` became `both`. |
| R036 Move enclosure | already correct | Housing card buttons always show their words (`StatCard.tsx`, `<span>{action.label}</span>`); the October "unlabelled icon" finding no longer holds. |
| R037 Send to hospital | already correct | Same. |
| R039 Foster placement | already correct | Same ("Foster / adopt"). |
| R042 Record a death | **corrected** | The button is labelled "Record death" on a phone (`ResidentHub.tsx`, `md:sr-only`); the step now says so instead of "the broken-heart icon". |
| R044 Placement history | already correct | The Housing & Status card links to `/housing`, which lists placements. |
| R049 Book a clinic visit | already correct | `ClinicVisitForm.tsx`: status is never changed for the user; a past date left on Scheduled stays Scheduled, with a hint. October's "saved as Completed" no longer holds. |
| R052 Stop a prescription early | already correct | Already says it stays under Current today (changed after October). |
| R054 Log a weight | **corrected** | `WeightChart` renders nothing under two readings; the page shows "Latest". Expected result now says so. |
| R086 Maintenance board | **corrected** | `MaintenanceBoard.tsx`: columns from `md`, chips + list below. Expected result now says both. |
| R087 Change a job's status | already correct | Already has the phone path (Move job on) and the desktop drag. |
| Boundaries count | **meaningless now, no edit** | October's "5 vs 4" compared a brief to the Staff sheet. Staff is retired; no count is typed anywhere. Boundaries are generated per role from `docs/role-walkthrough.md` (today admin 2, management 3, doctor 19, volunteer 8, public viewer 7, visitor 3). |

Not settled: nothing needed a phone. A real phone's handling of the PDF (R011) and a real mouse drag (R087) stay untested, as in October.
Role-keyed rows: none of the twelve is keyed on a role by this stream's edits; the matrix's role columns come from the generator and were not reshaped. App defects found: none.
