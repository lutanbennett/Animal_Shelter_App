# Card walkthrough: stock cards, 2026-10-23

Stream `cards-run-stock`. Dev only, port 3009, 375 px wide, one throwaway login per card
(`scripts/dev-signin.mjs --cards <key>`). Cards: `do_stocktaking`, `do_purchasing`, `record_delivery`.
**Summary:** (filled in at the end)

Pages stream slowly on first hit (10 to 25 s); a header-only page is still loading.

## do_stocktaking: PASS (1 TODO answered, 1 finding)

One count saved: AMC 500, 41 to 40 tablets. A stocktake has no free-text name, so the `walk-` label
could not be used; the row is the AMC 500 count dated 2026-10-23.

| Step | Result | Note |
|---|---|---|
| 0 Home shows tile | pass | Signed in and opened `/stocktake` directly; the header offers Home, Residents, Operations. |
| 1 Open `/stocktake` | pass | Medications / Food tabs, one-at-a-time cards (25 medications), "See the whole list". |
| 2 TODO: count the stock | **answered** | Type a count, tap Save (keeps it on the phone), then "Review and save" lists "41 to 40 tablet(s)" and "Save 1 count" writes it. Read-back: the same page shows "AMC 500 · Last count 40 tablet(s) · counted today". |
| 3 Refused: `/operations/medication-list` | pass | Redirects to `/no-access`. |

**TODO 2 answer.** The count shows on `/stocktake` itself (the row's "Last count ... counted today").
The page that should show it next, the stock figure and history on `/management/medications`
(and the forecast on `/management/purchasing`), is refused to this login (`/no-access`), so the
read-back there could not be checked.

**Finding.** The top menu offers Residents and Operations, which this card does not grant.

## do_purchasing: PASS (1 TODO answered, 1 finding)

This page writes nothing, so there is no `walk-do_purchasing` row to make.

| Step | Result | Note |
|---|---|---|
| 0 Home shows tile | pass | Signed in straight to `/management/purchasing`; the tile was not separately re-checked. |
| 1 Open `/management/purchasing` | pass | **Slow: about 60 to 70 s** before content appeared (server log said 3 s per request; header only until then). Then 1 week / 2 weeks / 1 month, a "Not counted yet (22)" warning, Medicines (6) and Food (5) lists. |
| 2 TODO: work out what to buy | **answered** | See below. |
| 3 Refused: `/operations/medication-list` | pass | `/no-access`. |

**TODO 2 answer.** Nothing is saved: this is a shopping list for the period chosen, with Print and
Download CSV, and "The app does not place the order". There is no row to find afterwards. The page
reads the counts from the stocktake, and links back with "Count them in a stocktake". The 22 never
counted items are named so nobody trusts "nothing to buy". The AMC 500 count of 40 saved in the
stocktake card is not on the buy list, which fits 40 being enough, but the working was not opened
to confirm.

**Finding.** The page took about a minute to show anything on first load (see step 1).
