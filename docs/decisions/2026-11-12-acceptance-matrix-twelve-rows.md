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
