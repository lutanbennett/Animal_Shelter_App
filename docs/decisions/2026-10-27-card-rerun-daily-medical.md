# Card re-run: `administer_medication`, `record_weight`, `add_medical_photos`, driven (2026-10-27)

These three were driven on 2026-10-25 (`card-report-medical`) and 2026-10-26 (`card-report-daily`), and the planner's first brief
said "never driven", which was wrong. The pass was still needed: those walks ran **before** `0265` (2026-10-26 16:16 +0700) took
`resident.record` off all three and gave each `resident.who_and_where` at read, and before `0267` gave `record_weight`
`recurring.do_own`. A narrowing is the likeliest way to break a save path, so each was driven again against today's grants.
Nothing was fixed and no card proposed (Lutan: the log is reviewed as a set; cards are Card review 2).

**How:** `node scripts/dev-signin.mjs --cards <card> --port 3002`, one login per card, aal1, code at `046455e2`, dev schema 270 applied.
All 16 numbered steps of `docs/card-walkthrough.md` (5, 6, 5).

## The two questions, per step

| card / step | enough to finish the job? | nothing more than the label? |
|---|---|---|
| `administer_medication` 0, 1 | yes: tile on Home; `/operations/medication-list` loads, names and enclosures show | yes |
| `administer_medication` 2, 3 | yes: prescriptions with dose and rounds; no add, edit or save control anywhere | yes |
| `administer_medication` 4 | refused: `/maintenance` to `/no-access` | yes. Beyond the steps: `/residents/export` is 403 |
| `record_weight` 0, 1 | yes: tile; `/medical/weight` loads with the pick list and "Last time" | yes |
| `record_weight` 2 | **yes**: 4.6 kg saved, "Saved: Capwarn Test 0924, 4.6 kg"; the resident then reads "Last time: 4.6 kg, 27 Oct 2026" and "Today already has 4.6 kg. Saving will replace it." | yes |
| `record_weight` 3 | yes: names and enclosures only, no edit control | yes |
| `record_weight` 4 | **yes**: My tasks in the menu; the job showed; Done persisted after reload ("Done today", with Undo) | yes. **Closes the 2026-10-26 fault, by 0267** |
| `record_weight` 5 | refused: `/stocktake` to `/no-access` | yes. `/residents/export` is 403 |
| `add_medical_photos` 0, 1 | yes: tile; `/medical/photos` loads with the resident picker | yes |
| `add_medical_photos` 2 | **yes**: photo uploaded, "1 photo saved"; with a `view_residents` login it is in Ong Thong's Photos as "Medical · 27 Oct 2026" | yes: the profile picture stayed empty (**0267 confirmed**) |
| `add_medical_photos` 3 | yes: names and enclosures only; a resident's own page now refuses this login | yes |
| `add_medical_photos` 4 | refused: `/maintenance` to `/no-access` | yes |

## What 0265 and 0267 changed, confirmed by driving

- **The three cards no longer read the whole resident.** The whole-record page, the "none" counts and the 95-line spreadsheet that the
  2026-10-25 rows describe are gone: the spreadsheet is 403 for all three, a resident's page refuses `add_medical_photos`.
- **`record_weight` can be handed its job.** My tasks, the job, Done: all working.
- **A Medical photo is no longer the profile picture.**

## What happened to the earlier rows

Kept, none deleted. Ten rows marked in place (CLOSED, PARTLY CLOSED or CONTRADICTED) in `docs/card-access-faults.md`: the "reads the
whole record" row (108), the six medical-neighbour rows (190 to 195), the daily pass's job, spreadsheet and menu rows (295, 298, 301).
**The driven pass contradicted several rows that reading could not have:** that is evidence about the method (the 2026-10-25 walk was
correct for its grants and false after them).

## New this pass (five rows, `## Added 2026-10-27 by claude/card-rerun-daily-medical`)

1. `/residents` opens as "0 residents" for `administer_medication` and `record_weight`.
2. The refusal page names "your role", not the card.
3. A blank thumbnail on the uploaded Medical photo: not established.
4. `administer_medication` cannot be handed a job by its grants: read, not driven.
5. Walkthrough step 4 for `record_weight` does not say how to create the job.

## Not done, said plainly

The Skip and Undo buttons, the camera path, the Scan card button, the four round tabs, a second same-day weight save, and the resident
page opened as `administer_medication` or `record_weight` were not driven. Test rows left on dev: a weight, a done job and a photo.
