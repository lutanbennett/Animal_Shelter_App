# Bills, one invoice with several items: the app half

2026-11-03, stream `bills-lines-app`. No migration (the schema half is `0308`, `docs/decisions/2026-11-03-bills-lines-schema.md`).

## What was built

- **`recordDelivery` records one item on a bill.** The first item creates the `stock_deliveries` header (amount, bill date,
  supplier, and kind / place / account copied from a bills-inbox card when recording from one); every later item sends the
  header id and joins it. The form and the phone steps keep the bill open between items (*Save this item* / *Record another
  item*) and close it with *Finish this bill*.
- **Why one item per save and not a basket of items saved at once:** each save is the same small, replayable write the
  Pi-failover wrapper already handles, a failure loses one item rather than a whole basket, and the shop's invoice is
  usually entered as the goods are unpacked. The cost is that a failure on the very first item after the header insert
  leaves an empty header behind (the header's delete is Admin only); nothing reads an empty header and the check
  `stock_delivery_totals` shows it as 0 lines.
- **Photos hang on the header** (`/api/bills/stock_delivery/<id>`; `stock_delivery` added to `BILL_OWNER_TYPES`,
  `mayFileBill` asks `stock.delivery`). A card recorded from moves its photos to the header (`attachCardToDelivery`). The
  recent list shows a bill's total and photos once, on its first line. `general_bill` was left alone, as briefed.
- **Described items** (*Something else*): description, quantity, a required typed unit, cost; `item_kind = 'described'`.
- **The amount check** reads `stock_delivery_totals` and only informs (`BillTotalsLine`): matches, part of the bill not on an
  item, items come to more than the bill, a line has no cost so it cannot be checked, or no total typed.
- **Promotion** (`promoteDescription`): offered on Deliveries for any wording on two or more lines with an unlinked line.
  One confirmed step names how many lines will be linked; it creates the item in Settings and sets
  `promoted_medication_id` / `promoted_diet_type_id` on **every unlinked line with that wording**, matched with spaces folded
  and case ignored. It uses the Settings unit list, so a typed unit that is not on it (for example `bottle`, `kg`) is refused
  with a plain message rather than silently invented.

## Thirteen-file sweep (every `src/` file naming `stock_receipts`)

Changed (6): `src/app/deliveries/actions.ts` (writes headers, lines and described lines), `src/app/deliveries/page.tsx`
(shows described lines and the bill block), `src/app/bills/actions.ts` (photos move to the header), `src/app/bills/page.tsx`
(a line on a bill is not offered as a card match, and a described line shows its words), `src/app/management/stock-usage/page.tsx`
(the "deliveries began" date ignores described lines), `src/lib/bills/upload.ts` (+ `photos.ts`, the route comment).

Not changed, and why (7): `src/lib/management/receipts-server.ts` filters `item_kind` to `medication` / `diet_type` and drops
a row with no item id, so a described line is excluded twice; `stock-receipts.ts` is pure date logic; `delivery-lines.ts` is
pure sizes-of-one-item arithmetic; `stock.ts`, `stock-usage.ts`, `units.ts`, `permissions/fixed-for-now.ts` and
`permissions/jobs.ts` mention the table only in comments.

## Answers asked for

**14. Does anything reach `stock_receipts` through a view or function rather than by name?** Asked of the live dev database
(`pg_views`, `pg_proc.prosrc`, `pg_policies`, each `ilike '%stock_receipts%'`): three views, no functions, no policies:
`item_latest_delivery_cost`, `stock_count_intervals`, `stock_delivery_totals`. `item_latest_delivery_cost` excludes described
lines (0308) and has 0 described rows on dev; `stock_count_intervals` joins on `item_kind`, which counts never carry as
`described`. So no screen is fed a described line through a view. (A client in `src/` could still read the table by a
view-less route only by naming it, and that is the thirteen.)

**15. `stock_delivery_totals` with a described line that has a cost but no stock item?** Read its body
(`pg_get_viewdef`): it joins every `stock_receipts` row with `delivery_id = d.id` with no kind filter, so **described
lines are inside the total**, as intended. `difference` is null when the bill has no amount, no lines, or any line has no
cost. Driven on dev: a bill of 700 with a medicine (300), a food (250) and a described line (150) reads difference 0.

## What was proved about a described line counting toward nothing

- `scripts/check-bills-delivery-lines.mjs` prints `HARNESS-OK` (section B: in no price view, names no item, has no
  stocktake interval).
- Read on dev after recording: `item_latest_delivery_cost` has 0 described rows; a line promoted to a new Food item
  (`test lentils 1103`) is in 0 price-view rows and 0 `stock_receipts` rows under that diet id, i.e. the link records what
  it became and counts nowhere.

## Found, not fixed (for the planner to file)

- A described line's unit has to be on Settings → Units to be promoted. A shop that buys "bottles" of something would see the
  refusal; adding the unit is a Settings job. Whether promotion should offer to add the unit is a small follow-up.
- On Deliveries the promote offer's wording shown is whichever line the database returns first, not the first typed.
- A line with no bill (recorded before 0308) is still matched by the Bills inbox as before; a header that never received its
  photo is not offered as a match for a card (lines on a bill are excluded from the likely matches because their photos
  belong to the header). A "match a card to an existing bill" route would be its own item.
- The Thai wording is ours, unread by a Thai speaker (stated in the release note).

## Access

Recording asks `stock.delivery`, as the table policies do. The promote button is drawn only when `can(perms, "stock.delivery")`
(the page itself) **and** `canEditItemSettings(perms, medication|diet)` pass, which is what `promoteDescription` asks. No card
was created, no policy widened, nothing granted to a role. `node scripts/check-hard-coded-security.mjs` reads
`no coded security outside the Admin bypass`.
