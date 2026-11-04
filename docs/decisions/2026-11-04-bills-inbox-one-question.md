# 2026-11-04 — Bills inbox: a wall of thumbnails, one question per bill

Backlog items `#h9ble` (Lutan's rank 2) and `#kcswm` (rank 3). App only: no migration, no new card, no policy change.

## The screen's new shape

- `/bills` shows one **tile per waiting bill**: its first page as a picture, a document mark with the file name for a PDF
  (a PDF has no picture), and a number badge when the bill has more than one page. Three tiles across on a phone, up to six on a
  wide screen, so all of them are in view at once.
- Pressing a tile opens a **dialog** over the wall (state is in `BillsInbox`, no new route). It shows **every page full size**, the
  Add-another-page button, then the single question *What type of bill is this?* The rest of the form (cost, date, note, place, account,
  utility month, the likely matches, Save, Delete) appears once a type is chosen, or at once for a bill that already carries a cost, date
  or note, so a half-done bill never hides its own figures. Filing a bill refreshes the page, the bill is no longer in the list and its
  dialog closes by itself.
- **Dialog, not a route (`/bills/<id>`).** The brief asked to decide and say why. A route is linkable, but it would need its own page, its
  own load of the suggestions and kinds, and a second place that must refuse an unauthorised login; the dialog reuses the data the page
  already loaded and keeps the wall in view, which is the point of the item. Nothing here needs a link to one bill.
- The kind dropdown, `kindsFor`, `tailoringOf`, the per-kind form and every server action are **unchanged**. Which kinds a login may pick
  is still derived from its cards in one place.

## The five cases

Several photos: tile badge plus all pages in the dialog. PDF: document mark on the tile, large mark linking to the file in the dialog.
"Not chosen yet": still the first option, and saving with it clears nothing. A kind the login can no longer pick: the page still passes
the kinds a card holds, shown disabled, so saving keeps it. Matching: unchanged; the chosen type still narrows the suggestions to its route.

## `router.refresh()` step (deliverable 4)

Tested on dev with a login holding only `general_bills`: choosing Other and pressing Record this bill removed the tile, the waiting count
went from 2 to 1 and the dialog closed. No code was written for it.

## `general_bill` and `BILL_OWNER_TYPES` (`#kcswm`): deliberate omission

A general bill should **not** carry a second page after it is filed, because nothing shows a filed general bill: it is a row in
`general_bills` used for totals, and no screen lists it or its photos, so no control could offer "add a page". All the pages a general bill
needs are added while it is still an inbox card (`bill_inbox` is on the list), and `recordGeneralBill` moves them all across. Adding the
owner would only unlock a route nothing calls. Recorded as a comment beside the list. Add it together with a screen that shows the bill.

Who else gates on `BILL_OWNER_TYPES`: only `src/app/api/bills/[kind]/[id]/route.ts`. The type `BillOwnerType` is derived from it and is used by
`mayFileBill`, `refuseUnlessAllowed` and `fileBillPhoto` in the same file as a parameter type. No second runtime gate.

## Found, not fixed

- The page hint still says each photo "becomes a card below" (`bills.page.addHint`); it now becomes a tile. Left to avoid more Thai churn.
- Thai strings for this change are unreviewed by a Thai speaker.
