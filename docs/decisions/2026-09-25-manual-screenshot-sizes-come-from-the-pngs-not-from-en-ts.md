# 2026-09-25 — Manual screenshot sizes come from the PNGs, not from `en.ts`

Deep links into `/manual` landed short because every screenshot is a lazy
`<img>` with no size: zero-height until it loads, so the page jumps to the
anchor and is then pushed down as the pictures above fill in. Each `<img>`
now carries its intrinsic `width`/`height` (plus `h-auto`, so the width
classes still scale it and the attributes only fix the ratio).

- **Where the numbers live:** `src/lib/manual/screenshot-sizes.json`,
  written by `scripts/manual-screenshots.mjs` at the end of every capture
  and keyed by `src`. It reads the PNG header rather than working the size
  out from the viewport, because a full-page capture's height is only known
  once it is taken. The backlog item offered `width`/`height` fields on
  `ManualScreenshot` instead; those would be 39 pairs someone keeps in step
  with the files by hand, and they go wrong silently on the next re-capture.
  Generated, they are right by construction, and `en.ts` stays prose.
- **No re-capture needed:** `--sizes` writes just the JSON from the files on
  disk, which is how the existing 40 PNGs got their sizes (cross-checked
  against System.Drawing). The planned full re-run will rewrite it.
- **A `src` with no PNG gets no size** and renders as before. Four are in
  that state today: `diet-new`, `management-diets`, `management-cashflow`
  and `admin-blood-test-types` all 404.
- **Measured, and why Chromium hid it.** Chromium's scroll anchoring already
  compensates for images loading above the viewport, so on a cold load in
  Chromium `#weight` and `#frequencies` landed correctly even before the
  fix. Safari has no scroll anchoring, which is where the bug is real. With
  anchoring switched off (`html{overflow-anchor:none}`, temporarily) to
  stand in for Safari, a cold `/manual#weight` at 1400×900 went from 2546px
  below the top of the window to 24 (its `scroll-mt-6`).
- **`#getting-help` still reads 800, and that is not this bug.** It is the
  last topic on the page: `scrollY` equals the maximum scroll both at once
  and after the images load, so the window cannot scroll it any higher. It
  read 800 before the fix too, in Chromium, so the backlog item's 1279 did
  not reproduce on this build and was not explained. The remaining gap is
  page geometry, left as a backlog item (closing it means blank space under
  the manual, a design call).
