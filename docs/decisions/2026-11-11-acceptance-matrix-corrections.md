# Acceptance matrix corrections (#k2llb)

Step zero: R001's wrong label was still present, so the work had not landed.

**The item's row numbers are five weeks old and do not map to the file.** `scripts/lib/acceptance-matrix-entries.mjs`
is keyed by activity; R-numbers are assigned by the generator in order, and the file has been rewritten since 2026-10-03.
Of the item's "about sixteen" rows I could place and correct only these (by wording, read against `src/lib/i18n/dictionaries/en.ts`):

- Sign in and sign out (R001): "Staff & Volunteer Login" now "Staff login" (`staffLogin`); "back to the public site" now "lands you on the sign-in page".
- "Manual" now "User manual" (`manual: "User manual"`), in the doctor and volunteer menu notes, the print-PDF row, the menu row, the roles row and the Getting help row (the item's R009/R013/R093 class).
- R019's R0042: already R-0042 in both rows. Correct on its own; nothing to change.
- R058/R085/R086: the file has no row saying staff must not add a contact or procedure type. The Staff pass is empty and the procedure-type and blood-test-type rows already read "Add or merge" (needs `reference.types`). Correct on their own. The decision (narrow the row, not tighten the app) therefore needs no edit; the app was not touched.

**Not reached, left unchanged, because I could not place them in the file or verify them against the app:**
R008, R026, R027, R029, R032, R034, R036, R039, R041, R049, R050 and the boundaries count. Left visibly as they are rather than corrected on a guess.
Of the sixteen, 2 were still wrong in a way I could fix, 2 had become correct on their own, 12 not reached.

**For the planner to file:** a second pass on the unreached rows, driven against the running app on a phone.
