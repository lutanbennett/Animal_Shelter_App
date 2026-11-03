# Bills, one invoice with several items: the schema (`0308`)

2026-11-03, stream `bills-lines-schema`. Schema only. No screen reads any of this yet (`-- consumer: none`).
The app half is a separate, later stream and is **not built**.

## What was read first

- `stock_receipts_one_item` is at `0096_stock_receipts.sql:110` (the backlog item said `:97`; that line number was stale).
  It allowed exactly one of `medication_id` / `diet_type_id`. It is now **replaced** by `stock_receipts_one_shape`, not relaxed.
- `src/lib/management/delivery-lines.ts` handles several **sizes of one item** (`stock_receipts.entered`). Untouched, and unrelated.
- Photos today hang on the one row (`attachment_owner_type` `stock_receipt`, `0188`, `0189`).
- `0304`/`0305` already gave bills `premises_id`, `account_id`, `kind_id`. The new header carries all three, so the
  site/kind work is not done twice.

## Judgement 1: a delivery header row, not a shared id on the rows

`stock_deliveries` is a table; `stock_receipts.delivery_id` (nullable) points at it.

**Why a header and not a bare shared uuid:**

- **The photos need an owner.** An attachment is `(owner_type, owner_id)`. With a shared id and no table there is nothing for
  the id to be a foreign key to, nothing for `attachments` policies to resolve, and nothing to hold the bill's *amount*, which
  belongs to the bill and not to any line. The header is that owner. The new owner type `stock_delivery` is allowed by
  `stock.delivery`, exactly as `stock_receipt` is, through `bill_owner_can()` and `record_attachment()`. **The photos belong to
  the header, so they belong to every line at once**, and a line added later is covered with no photo to move.
- **The bill's total can be checked.** `stock_delivery_totals` puts the printed amount beside the lines added up
  (`difference`, null when the bill has no amount, no lines or an unpriced line). It is a view; nothing blocks a save.
- **One home for the site, kind and account** `0305` introduced, so the invoice carries them once, not per line.
- **Cost of the choice:** one more table and one more owner type. Old rows keep `delivery_id` null and stay deliveries of
  their own. The header is **optional**, so recording one item from a bill still works exactly as it does today.
- The header's `received_at` and supplier are copied onto each line by the stamp trigger on insert, so the lines of one bill
  cannot disagree about when goods arrived (the stocktake interval rule in `0096` needs one instant). Both are fixed once saved,
  as a delivery's are (`0235`). A header with lines cannot be deleted (restrict); deleting is Admin only, as for lines (`0265`).

**Described lines live in `stock_receipts` too** (`item_kind = 'described'`), not in a second table. One line list, one total,
one set of policies and triggers. The risk is a reader that forgets to filter: checked, and the one unfiltered reader,
`item_latest_delivery_cost` (`0199`), now excludes them; `stock_count_intervals` joins on `item_kind`, which counts never
carry as `described`. A described line names no `medication_id` or `diet_type_id`, so no `where medication_id = …` reader can match it.

## Judgement 2: does promoting one line promote the others with the same wording?

**No, not in the schema; the link is per line, and the app offers the rest as one confirmed step.**

- The link is two nullable columns on the line, `promoted_medication_id` / `promoted_diet_type_id` (at most one, set only on a
  described line), with `on delete set null`. The line **keeps its typed description**, so it is never a dead string and never
  loses what was written on the bill.
- Why per line: the same words can mean different things (is "dish soap" the Settings entry that was just added, or a different
  brand?), and a link a person did not look at is the one that is wrong later. The app half, when somebody accepts the offer,
  should show **"3 other lines say the same"** and link them together **in the same confirmed step**. The schema makes that one
  `update … where lower(btrim(description)) = …`: the matching index exists (`stock_receipts_described_idx`), and the
  update policy and the cost-only trigger allow exactly the two link columns on a described line and nothing else.
- **A linked line still counts toward no stock figure.** The link is provenance. History is not re-valued: stock starts from the
  next count of the new item. Linking never changes `stock_on_hand`, a stocktake, a reorder warning or the purchasing list.
  If Lutan wants past lines to count once linked, that is a decision and a schema change, not an accident of the link.

## Judgement 3 (report): does Cashflow read delivery costs?

**No.** `src/app/management/cashflow/page.tsx` reads `cashflow_forecast()` (`0072`), clinic visits, and `fixed_outgoings`.
`cashflow_forecast` mentions neither `stock_receipts` nor any bill table. Food and medicine in the forecast are priced from the
plan and (since `0211`) the latest real unit price through `item_latest_delivery_cost`, so a delivery changes the *price* the
forecast uses but is not itself an outgoing. Bills, maintenance bills and the new invoices do not appear in Cashflow at all.
Described lines are kept **out** of that price view on purpose (they have no unit price against an item).
*For the planner to file:* if actual spending on invoices (stock, described, maintenance, utilities) should appear in Cashflow,
that is an app-half or separate item. The totals to read are `stock_deliveries.amount` / `stock_delivery_totals` and the other
bill tables. Nothing was built for it here.

## Access (stated, not widened)

Recording and reading a header ask `stock.delivery` (reading also admits `stock.purchasing`, as lines do). Deleting is Admin only.
Described lines need no new card. **No card, no activity and no role grant was created.** `check-hard-coded-security.mjs` passes.

## Handed forward to the app half

- Recording from a bill: create one `stock_deliveries` row (amount, bill date, kind, site, account, supplier), then one
  `stock_receipts` row per line with `delivery_id`; `received_at` and supplier come from the header. Photos move once, to
  `owner_type = 'stock_delivery'`, `owner_id = <header>`. `src/app/bills/actions.ts`, `src/app/deliveries/*` and
  `src/lib/management/receipts-server.ts` are the readers/writers to change.
- Described lines: `item_kind = 'described'`, `description`, `quantity`, **`unit` (required, typed)**, `cost`.
- Show `stock_delivery_totals.difference`; do not block on it.
- Readers of `stock_receipts` that list every row (`stock-usage`, `deliveries/page`) must decide how to show described lines.
- The promote offer is the confirmed bulk update above.
- Existing rows with no header are legitimate; do not backfill.
- The `/api/bills/...` photo route and any listing of an attachment's owner need a `stock_delivery` case.
