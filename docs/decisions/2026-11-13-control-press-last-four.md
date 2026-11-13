# 2026-11-13 — The last four click-only controls of 25 (`#79sqf`)

Stream `claude/control-press-last-four`, Sonnet 5.5 at `low`. Every press by a login holding **exactly** the card
named, reached by **clicking through** from another page, with the result read back from the page or the database.

## The four, per row

| # | Control | Activity its action asks | Card held | Outcome |
|---|---|---|---|---|
| 8 | assistant record-death `ConfirmDialog` | `assistant.record`, `placement.death` | `assistant` + `medical_records` | **pressed.** Typed *"ZZ fixture mortal died last night, kidney failure"*; the preview asked for the date (the assistant never guesses it); after Confirm came the second dialog *"Record ZZ fixture mortal as deceased?"* and **Yes, record the death** saved: `is_deceased` read back `true`. |
| 11a | Shelter Friends page: Publish, Up/Down | `friends.manage` | `publish_shelter_friends` | **pressed.** Drawn for every row. Publish flipped the fixture to *On the website* and the button to Unpublish; Up moved it above the row that was first. |
| 11b | Diet tab row: Edit, End today (and Add diet) | `medical.diet` (edit) | `medical_records` | **pressed.** Edit, End today and Add diet all drawn. End today asked for a confirm, then the row read *6 Nov 2026 – 13 Nov 2026*. Edit and Add diet are links and were not followed. |
| 11c | `/operations/feeding-list`, `/operations/medication-list` | `medical.diet` read; `medical.prescriptions` read | `medical_records` | **drawn, nothing to press.** Both pages say *"nothing here is ticked off or recorded"*. Their only controls are links that switch the meal or round and the view (Batch / Plate, Stock-room / By resident). The fixture resident appears in each. No action control exists to gate, so this row closes as **no ungated action found**. |

## What the row 8 press proves, and what it does not

**Proves:** the confirm fires and saves, under a login holding only `assistant` and `medical_records`.
**Does not prove** that any model understood a sentence. No stand-in model was used: the **keyword** assistant
(`interpret.ts` → `deathIntent`) already reads a death sentence, and the stand-in only knows weights
(`scripts/dev-assistant-model.mjs`), so starting it would have added nothing. The brief's second dev server was not needed.

## Fixtures added to `scripts/dev-fixtures.mjs`

All dev-only, idempotent, named `ZZ fixture …`; `--status` reports each; `--remove` takes them.
- **`ZZ fixture friend`** — a Vendor contact plus its `shelter_friends` row. Re-running puts it back to an unpublished draft at the bottom.
- **`ZZ fixture diet and prescription`** — a living resident with a running diet (borrows dev's first recipe) and a live prescription (borrows its first medication). Re-running un-ends the diet.
- **`ZZ fixture mortal`** — a living resident to record a death for. A placement history cannot be un-ended
  (`enforce_placement_history_immutability`), so re-running renames a dead one to `ZZ fixture mortal (used …)` and makes a new one.
  The first attempt to un-end it was refused by that trigger; the rename is the fix, and re-running reported `is_deceased=false` (checked twice).

## Found, not fixed

Nothing. No control was offered that the server then refused, and none was hidden that it should have shown.
The fourth stream running on this item to find no fault: the gating holds where it is driven.

## Still open (not this stream's, for the planner)

The **allow-list four** on `check-control-activity.mjs` — `medical/ResidentPicker` and `components/ResidentPicker`
(a tab-array gate), `MyTaskList` (predicate implication), `UnitsPanel` (a prop conditional) — are false positives that
need the **check** taught, not code fixed. Untouched here. Row 10 `UndoDeathForm` was never pressed and has no card, as designed.
`#79sqf` is retitled so its title says only this is left.
