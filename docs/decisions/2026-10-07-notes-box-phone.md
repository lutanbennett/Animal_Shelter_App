# 2026-10-07 — Notes boxes on a phone: one shared class, 16 px type, and a check that taps

Two backlog items, one fault area: the Notes box on Rehome / foster looked too small to type in, and
tapping into it on Lutan's phone "resizes and then allows me to scroll left and right".

## One class, not ten edits

`field-sizing-content` was on ten resident forms, nine of them each declaring their own
`textareaClass` and the Intake form inlining it. They are now one export, `src/components/textareaClass.ts`.
The next form that wants a growing box gets the phone behaviour without anyone having to remember it.

## What the class does, and what is proven

- `text-base md:text-sm`. **Probable cause of the sideways scroll:** iPhone Safari zooms the page in when
  a field with type under 16 px is focused (these were `text-sm`, 14 px). The zoomed page can be panned
  left and right and a refresh clears it, which is exactly the report. Not reproduced on a real iPhone here
  (no iPhone on this machine), so Lutan's look is in the test plan's manual table.
- `w-full min-w-0`: `field-sizing: content` sizes the width as well as the height. Headless Edge at 375 px
  did **not** widen the page with the old class, so this is belt and braces, not a measured fix.
- `min-h-32 md:min-h-0`: starts taller below `md`; from `md` up `rows` sets the start as before.
- `resize-y`: a drag handle cannot widen it.

## The check now taps

`scripts/check-phone-width.mjs` measured a freshly loaded page and focused nothing. It now (1) focuses every
text box, select and textarea in `main` in turn and re-measures the page width, and (2) fails any visible
textarea whose type is under 16 px. Proved both ways on 2026-10-07: with the old class it printed
`FAIL … textarea notes has type under 16 px` for Rehome and five textareas for Edit; with the new class, clean
across Intake, Edit, Rehome, Move, Hospital, Return from hospital, Deceased and Adoption updates.
Check (1) found nothing to catch in Chromium, so it guards against a regression it could see, not this one.

## Not done

Single-line `<input>`s and `<select>`s are also `text-sm` and will zoom the same way on an iPhone. That is
every form in the app and a separate decision (a base-layer rule at 16 px below `md` would do it); filed on the
backlog rather than widened here.
