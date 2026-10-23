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
