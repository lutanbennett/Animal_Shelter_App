# Card re-pass: `view_medical` and `add_medical_photos`, driven again (2026-10-29)

Both cards had been driven on 2026-10-27 and were changed afterwards: `view_medical` by `0276` (it gained `photos.resident_medical`), `add_medical_photos` by `0276`, `0278` and `0279` (`0279` gave it the read on Medical photos). 13 and 6 steps, counted from `docs/card-walkthrough.md`. Each was driven on a login holding only that card (`dev-signin.mjs --cards <card>`), aal1, in the built-in browser.

## What was fixed, and why in this PR

The resident's Clinic Visits tab (`src/app/residents/[id]/[section]/sections/clinic-visits.tsx`) drew Log blood test, Add prescription, Log weight and Log procedure on every visit row with no check, so a login holding only `view_medical` was offered four links whose pages refuse it. Each link now asks the activity its target page asks (`medical.blood_tests`, `medical.prescriptions`, `medical.weight`, `medical.procedures`), the same ones `/clinic-visits/[id]` already used. This is a control gate inside one of the two cards, in one file, so it was fixed rather than logged. The server and database checks are untouched.

## Found, not fixed

1. A Medical-folder photo does not show on the resident's Photos tab for a `view_medical` login although the grant and the select policy both say it should. Not diagnosed (tab, gallery or a second condition). Backlog item filed.
2. `/medical/photos` still tells `add_medical_photos` it "does not show them again", decided on `resident.record` rather than `photos.resident_medical`. Wording is a decision, so it is recorded only.

## Method notes

- `/appointments` has no link from any page, so it was opened by address; the pane's `requestAnimationFrame` did not fire, which is the pane and not an app fault. The page is server-drawn and has no controls.
- The photo save was done with a 64-pixel PNG built in the page and handed to the file input, then read back with a service-key query: one `attachments` row, `sub_folder` Medical, approved.
- `walk-add_medical_photos` does not exist and the card cannot create a resident, so the existing disposable `walk-residents` record took the photo.
