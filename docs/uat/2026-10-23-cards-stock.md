# Card walkthrough: stock cards, 2026-10-23

Stream `cards-run-stock`. Dev only, port 3009, 375 px wide, one throwaway login per card
(`scripts/dev-signin.mjs --cards <key>`). Cards: `do_stocktaking`, `do_purchasing`, `record_delivery`.
**Summary:** 3 cards walked, 3 pass. 12 steps run, all pass (2 with a slow first load). 3 `TODO:` steps answered by doing the job (2 of 3 read-backs on a later page not reachable by a card-only login); 0 left unanswered. 5 findings, filed as 3 backlog items.

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

## record_delivery: PASS (1 TODO answered, 3 findings)

Delivery recorded as `walk-record_delivery`: AMC 500, 5 tablet(s), today, no supplier, no cost.

| Step | Result | Note |
|---|---|---|
| 0 Home shows tile | pass | Signed in straight to `/deliveries`; the tile was not separately re-checked. |
| 1 Open `/deliveries` | pass, but slow | About 60 s before the page showed, and the form did not respond to taps until well after (first taps did nothing). Console: a hydration mismatch in `RecordDeliveryForm` (`delivery-line-1-quantity` on the server, `delivery-line-4-quantity` on the client). |
| 2 TODO: record a delivery | **answered** | See below. |
| 3 Refused: `/operations/medication-list` | pass | `/no-access`. |

**TODO 2 answer.** Six steps on `/deliveries`: what arrived (Medicine or Food), which item, how much,
when (with a question "was it already on the shelf when it was counted?" because AMC 500 had a
stocktake today), details (supplier, cost, photo, note), then a check screen and "Record this
delivery". It shows at the top of **Recent deliveries on the same page**: "AMC 500, 5 tablet(s),
23 Oct 2026, recorded by <the login>, After that day's stocktake, walk-record_delivery". The page
says it does not change the stock count; the next stocktake does, and it feeds the usage figures on
`/management/stock-usage` and the forecast on `/management/purchasing`, which this login is not
given (not driven, refused to a card-only login like the other management pages).

**Findings.** (1) Slow first load and a form that ignores taps until it finishes loading (a tap
before then fell back to a plain `GET /deliveries?` and wrote nothing). (2) Hydration mismatch on
the form's field ids. (3) The page offers **Bills** and a delete button on every recent delivery;
the card names neither. Deleting was not driven.
