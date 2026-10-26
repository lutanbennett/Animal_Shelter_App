# Card re-run: `residents`, driven (2026-10-26)

DRAFT, written as the steps are driven. Dev schema at the time: 268 applied (0267 is applied on dev but not yet a file on
`origin/main`, `card-review-schema-all` is applying 0268 mid-batch). Code at `8894515f`. Login: `dev-signin.mjs --cards residents`,
aal1. Disposable record `walk-residents` (R-5725). Nothing was fixed and no card proposed.

## Steps driven so far

| step | job | verdict |
|---|---|---|
| 1 | Open `/residents` | opens; 90 residents; the Enclosure and Zone columns now show names (the 2026-10-25 "blank enclosure" row is closed) |
| 2 | Edit details, housing and history | saved; hub shows new breed and bio at once; `/housing` lists the Intake row with its enclosure name |
| 3 | Register (intake) | all six steps work; zone and enclosure pickers filled; over-capacity warning shown, "Register anyway" saved; R-5725 appears with the chosen enclosure |
| 4 | Microchip | entered at intake and shown in the hub header with Correct (correction itself: see below if driven) |
| 6 | Move | saved; hub shows the new enclosure. **The 2026-10-25 "That enclosure no longer exists" fault is closed** |
| 7 | Hospital and back | both saved; hub reads In hospital then Resident again, with "Returns to Front Zone 0". **The old "status enclosure is missing" fault is closed** |
