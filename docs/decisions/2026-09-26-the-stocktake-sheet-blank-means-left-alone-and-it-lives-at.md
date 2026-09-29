# 2026-09-26 — The stocktake sheet: blank means "left alone", and it lives at `/stocktake`

- **Blank vs unchanged, the rule.** The single stock cell on Management →
  Medications / → Diets keeps 0083's meaning: blank clears the count to Not
  counted, re-saving the same figure confirms it. On the sheet a blank row
  is **left out of the save entirely**, so `record_stocktake` never sees it
  and the row keeps its count and its date. Confirming an unchanged figure
  is a separate per-row toggle, "Same as last time", which sends the old
  figure (0083's trigger restamps it). Typing clears the toggle and the
  toggle clears the typing, so a row is always exactly one of left alone,
  counted or confirmed. The rule lives in one pure function
  (`rowOutcome`, `src/lib/management/stocktake.ts`) and is asserted by
  `scripts/check-stocktake-sheet.mjs`. The toggle is not offered on an item
  that was never counted: there is nothing to confirm.
- **Typing the same figure is a count, not a mix-up.** Someone who types 40
  over a last count of 40 has counted it, so it is saved like any other
  count. The toggle exists to save retyping, not as the only way to confirm.
- **A comma is refused rather than guessed.** "1,5" (a decimal comma) and
  "1,000" (thousands) are both plausible on a phone keypad, so either is
  flagged on the row and blocks the save until fixed.
- **`/stocktake`, not `/management/stocktake`.** The backlog suggested the
  latter, but staff and volunteers do the count (0091), and every
  `/management` page redirects them. The page sits in the menu's daily
  group; managers also reach it from a link under the title of both
  Management tables, outside the larger-screen notice so it works on a
  phone there too.
- **Both tabs, one save.** Entries live in the sheet across tab switches and
  one Save sends both lists in one `record_stocktake` call: one stocktake,
  one time. After saving, the sheet shows the new counts using the returned
  `counted_at` instead of reading them back.
- **Big change = half or more** of the last count either way, or anything
  from a count of 0. It only highlights a row (and sorts it first in the
  summary); it never blocks. A first count is never "big".
- **Leaving with unsaved counts** asks via `beforeunload` for reloads, closes
  and typed URLs, and via a document-level capture on link clicks for the
  app's own navigation, which does not unload. The browser's Back button
  inside the app is not caught: the App Router offers no hook for it, and a
  history trap would be worse than the gap.
