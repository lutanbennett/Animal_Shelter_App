# Card re-run: `do_purchasing`, `do_stocktaking`, `record_delivery`, `do_maintenance`, driven (2026-10-27)

All four were driven on 2026-10-25 (`card-report-ops-stock`). The planner's brief said they needed driving again, and it was right, on
two different grounds. Nothing was fixed and no card proposed (Lutan: the log is reviewed as a set; cards are Card review 2).

**How:** `node scripts/dev-signin.mjs --cards <card> --port 3009`, one card-only login per card, aal1, code at `d63670ef`, dev schema 270.
All 21 numbered steps of `docs/card-walkthrough.md` (4, 4, 4, 9). One extra login holding `recurring_jobs` was used only to hand
`do_maintenance` a recurring job for step 4, because nothing else can.

## What invalidated each earlier pass, which is what the planner asked to be said

| card | steps | invalidated by | what actually changed, as driven |
|---|---|---|---|
| `do_maintenance` | 9 | **the migration, `0265`** (deletes `resident.record`), **and the app half** | Residents is gone from the menu, the spreadsheet is 403, the Assistant no longer names residents. The save paths (log, status, cost, photos, recurring Done) are unchanged and work |
| `do_purchasing` | 4 | **the app half only** (#965: the page itself, `NavLinks`, `NavPane`, `routes.ts`) | the page and its save-free job work as before; the dead "Count them in a stocktake" link and the Residents menu entry are gone; a Management doorway lists Purchasing |
| `do_stocktaking` | 4 | **the app half only** | the count saves and reads back as before; the menu is Home only |
| `record_delivery` | 4 | **the app half only** | the delivery saves and reads back as before; the menu is Home only |

For the three with no migration, the earlier walks described a **menu** that no longer exists, not a grant that moved. Their activity was
never broken. That is a weaker reason to re-drive than `0265` gave `do_maintenance`, and it still found something: the old rows about
dead links and an empty Residents entry were true on 2026-10-25 and are closed now, which only driving could say.

## The two questions, per card

| card / steps | enough to finish the job? | nothing more than the label? |
|---|---|---|
| `do_purchasing` 0 to 3 | yes: tile, page, 1 week, 2 weeks, 1 month, Print, CSV, never-counted warning | yes: medication list refused. Residents spreadsheet 403 |
| `do_stocktaking` 0 to 3 | **yes**: AMC 500 counted 42, "Last count 42 tablet, counted today" after reload | yes: medication list and `/management/medications` refused |
| `record_delivery` 0 to 3 | **yes**: 5 tablets of Dimen, first row of Recent deliveries | **mostly**: a delete button on every row including other logins' (seen, not pressed); `/bills` opens with Add, Save and Delete (opened, not driven) |
| `do_maintenance` 0, 1 | yes: tile, `/maintenance` board | yes |
| `do_maintenance` 2 | **yes**: 4-step wizard, assign, cost (฿500 and ฿450 read back). No delete, and the walkthrough no longer promises one | **no**: the assignee picker lists every login with its email, including a real admin address |
| `do_maintenance` 3 | **yes**: In progress, Blocked, Completed; the board's Completed column went 1 to 2 | yes |
| `do_maintenance` 4 | **yes**, but only with a second login's help to make the job | yes |
| `do_maintenance` 5 | yes: zones and enclosures read only, no add or edit control | yes: but "Browse residents" shows none |
| `do_maintenance` 6 | **yes**: photo added (Before 1), removed (Before 0). The remove × shows only on hover | yes |
| `do_maintenance` 7 | the panel answers, **wrongly**: "Cat Enclosure is empty" (it holds 5) | yes: no names. Its example prompts offer writes the card cannot do |
| `do_maintenance` 8 | refused: `/no-access` | yes |

## Reachability, which the brief asked about by name

**None of the four is locked out of its own page.** Each tile opens it, and each page loads. Doorways and leaves, said plainly:
`/management` is a **doorway** for `do_purchasing` (lists only Purchasing); `/operations` is a doorway for `do_maintenance` (Enclosures,
Maintenance); `/stocktake` and `/deliveries` are **leaves** reached from the Home tile alone, with no doorway behind them; `/residents`
is a **leaf that should not be reachable** for `do_maintenance` (opens by URL as "0 residents"). That last one is the only reachability
finding, and it is the opposite of the expected kind: a page that opens when it should not, not one that fails to.

## What happened to the earlier rows

Kept, none deleted. Eighteen marked in place in `docs/card-access-faults.md` (143 to 151, 229 to 237): five CLOSED or CLOSED in effect,
two PARTLY CLOSED, six CONFIRMED, four STILL TRUE, one NOW DRIVEN. The enclosures row (228) is not this stream's and was left untouched.

## New this pass

Eleven rows under `## Added 2026-10-27 by claude/card-rerun-ops-facility`. The ones worth the planner's eye: the false "Cat Enclosure
is empty" (a consequence of `0265`, the same root as the 2026-10-25 enclosures row); `/residents` opening by URL; and the walkthrough
gap for step 4.

## For the harness stream (`claude/harness-sweep-batch-5`)

No check script was run or edited. Nothing driven here contradicts a harness verdict I know of. What driving found that a grants-only
harness cannot: the assistant answers falsely rather than refusing, and `/residents` opens by URL although no card of these four
grants it.

## Not done, said plainly

Skip and Undo on My tasks, the camera path, the after-photo upload, deleting a delivery, the Bills page's controls, and the Food tabs.
The backlog item is **not ticked**: it covers 14 cards and this stream closes four of the re-pass group (`do_purchasing`,
`do_stocktaking`, `record_delivery`, `do_maintenance`). Counting what is driven overall, and which cards are still owed, is the
planner's, as #979 left it.
