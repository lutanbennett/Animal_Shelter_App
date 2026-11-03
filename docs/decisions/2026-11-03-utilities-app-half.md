# Utilities app half: record, file from the inbox, monthly list (2026-11-03)

Stream `utilities-app-half`, app only, no migration (schema `0304`/`0305`, attachments `0306`). Lutan's answer stands: **cost only**,
no units and no meter readings (2026-11-02).

**Where it lives: `/bills/utilities`.** One page, asked on `bills.utilities` (the activity the `utility_bills` policy asks). It
carries the record form, a month-by-month table (one row per month covered, one column per utility kind, a total) and every bill
under its month. The `utility_bills` card now opens it (`cards.ts`, was `/bills`), registered in `routes.ts` (menu: false) and in
`WRAPPED_WRITE_PATHS`. Without the `routes.ts` entry the card read "opens no page for you" on the Home screen: found by driving
a login holding only that card, which is why that check matters.

**The route already existed.** `kinds.ts` had `"utility"` and `mayFileRoute()`; nothing there changed. A utility kind is the
`utilities` kind or any child of it (Water, Electricity...). The kind list on the form is `kindsFor()` narrowed to the utility route,
and the action asks the same function, so control and action cannot disagree.

**`covers_month` is the first of the month, always.** The form uses a month input (`2026-10`); `coversMonthDate()` in
`src/lib/bills/utility.ts` turns it (or any day in it) into `2026-10-01` on the server, and refuses anything else, so the
`utility_bills` check constraint is never what a person meets. Unit-tested (`utility.test.mjs`).

**The inbox match.** A card whose kind is a utility shows a month field and *File as a utility bill*
(`fileCardAsUtilityBill`): make the bill, move the card's photos to `owner_type = utility_bill`, delete the card, and remove the
bill again if the photos fail to move (the same order `recordGeneralBill` uses). Cost is required.

**Deliverable 4, the photo move: IT WORKS, both ways, on dev, with a card-only login (`utility_bills` and no role).**
1. A real PNG posted to `/api/bills/new` made a card with a photo; filing it as a utility bill for September left one
   `attachments` row with `owner_type = utility_bill`, `owner_id` = the new bill, and the card gone (read back through the REST
   API as that login).
2. A direct upload to a utility bill went through `record_attachment` (`0306`, new `p_media_kind` default) and returned 200. To allow
   that, `utility_bill` is now one of `BILL_OWNER_TYPES` in `src/lib/bills/upload.ts` (a declared crossing: the brief's
   boundary lists the upload route's file nowhere, and without it the route 404s a type the database accepts), and `mayFileBill`
   asks `bills.utilities` for it, the same as the database.
Nothing needed a database fix. Not exercised: a general bill's photo move (`general_bill`), which is the same code shape and not
this stream's; for the planner to decide whether it wants it driven.

**Not done on purpose:** a photo button on the utility list rows (the upload route accepts it, the page does not draw one yet);
feeding the Cashflow forecast. **Money on the list is shown exactly** (`formatBahtExact`): a water bill of 812.50 reads 812.50.

**Thai wording** is ours, unread by a Thai speaker, and the release note says so.
