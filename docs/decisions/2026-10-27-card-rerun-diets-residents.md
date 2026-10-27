# Card re-run: `feed_special_diets`, `view_residents`, `record_death`, driven (2026-10-27)

Nothing fixed and no card proposed (Lutan: the log is reviewed as a set; cards are Card review 2). One login per card made with
`node scripts/dev-signin.mjs --cards <card> --port 3003`, aal1, no page asked for a second step, code at `c439f911`, dev database.
All 15 numbered steps of `docs/card-walkthrough.md` (6, 5, 4).

## Which axis invalidated the earlier pass

| card | earlier pass | what changed after it |
|---|---|---|
| `feed_special_diets` | `card-report-daily`, 00:09 on 2026-10-26 | **migration**: `0265` (16:16 the same day) deleted `resident.record` and added `resident.who_and_where` at read; `0267` touched it too. App half: #965 |
| `view_residents` | `card-report-residents`, 2026-10-25 | **both**: `0265` (gained `facility.enclosures`), `0268`; and #965 changed `ResidentsTable.tsx`, `residents/page.tsx` and `ResidentHub.tsx` |
| `record_death` | none | none: the card was created by `0265` and never driven |

## The two questions, per step

| card / step | enough to finish the job? | nothing more than the label? |
|---|---|---|
| `feed_special_diets` 0-3 | yes: `/medical/diets` loads, a Morning/Evening choice, diets with amounts per enclosure, no add/edit/save control | yes |
| `feed_special_diets` 4 | **yes**: the assigned `walk-feed_special_diets job` was marked Done on My tasks and still read "Done today" after a reload (a job left assigned to this login by the 2026-10-26 pass; the walkthrough does not say how to create one) | yes |
| `feed_special_diets` 5 | refused: `/stocktake` to `/no-access` | yes. `/residents/export` is 403 |
| `view_residents` 0-1 | yes: `/residents` lists 94 rows with ID, name, enclosure, zone, status | one thing more: **Download spreadsheet** is offered and `/residents/export` returns 200 (still open as a judgement) |
| `view_residents` 2 | yes: the hub, Housing & Status ("Moved enclosure ... Unassigned to Brown Enclosure 4") and Photos open; no Edit, hospital, foster or move control | yes |
| `view_residents` 3 | yes: enclosure and zone names show in the list and hub | yes |
| `view_residents` 4 | refused: `/operations/medication-list` to `/no-access` | yes |
| `record_death` 0-1 | yes: Residents in the menu; the list opens | yes |
| `record_death` 2 | **yes, driven for real**: Record death on a living resident, date and cause, confirmation dialog, saved; the page then reads Deceased, "This record was closed on 27 Oct 2026", cause, Summary PDF, Offline index page, Drive folder | yes: no other write is offered on the page. Spreadsheet export is 200 (follows `view_residents`) |
| `record_death` 3 | refused: `/operations/medication-list` to `/no-access` | yes |

## My verdict on #981's `/residents` finding

**Not an over-grant of data; a leaf with a misleading display.** `/residents` does open by URL for `feed_special_diets`, whose grants do
not include it, but there is no Residents entry in its menu and the page shows "0 residents" (the card holds only `resident.who_and_where`,
so the list's read returns nothing). Nobody sees a resident they should not. The fault is that the page opens and says "0 residents" /
"No residents match" instead of refusing or saying "not allowed", which is the same shape as the "none counts" rows. Recorded as a row.
For `view_residents` and `record_death` the page is theirs and works.

## What happened to the earlier rows

Kept, none deleted; seven marked in place (lines 165-168 and 297-299 of the log). The driven pass **contradicted** the 2026-10-26
"93 residents / enclosure dashes" rows and **closed** the enclosure-blank and controls-offered rows; the export row still holds for
`view_residents`. As in #979, reading could not have told us the 2026-10-26 walk had gone stale.

## Created on dev, said plainly

- `walk-residents (R-5431)` (an existing disposable resident) is now **Deceased**, with a Drive archive folder, summary PDF and index.
- A `placement_history` row. Because of it the `record_death` login (`dev-signin-854c3584@example.invalid`) **cannot be deleted**
  (`placement_history.created_by`); its throwaway role was removed, so it holds no card. The other two logins were removed.
- One recurring job marked done.

## Not done, said plainly

`record_death` on a resident **in an enclosure** (the enclosure read was not exercised); the Photos page's controls and the lower
tiles of the resident hub as `view_residents`; Add diet on a resident's Diet page; the Skip button. `check-menu-coverage` is red by design.
**With these three and `claude/card-rerun-manage-medical`'s `medical_records`, the first 14 come down to `residents` alone.**
The backlog item is not ticked: it covers 14 cards.
