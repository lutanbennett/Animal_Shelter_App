# 2026-10-16 — Pack sizes: the screens (parts a, b, c)

**Decision.** A delivery takes several sizes; the stocktake counts an item in several sizes at once; Purchasing shows the
same need in every size it is bought in. No migration: everything rides on `stock_receipts.entered`,
`stock_counts.entered` and `record_stocktake()`, which already took an array of lines (`0118`).

## (a) Record a delivery: several lines

- Each line is a size, how many and a cost. The server sums them in base units, each line against **its own** factor
  (`src/lib/management/delivery-lines.ts`, run by `scripts/check-delivery-lines.mjs`: 2 × 20 + 1 × 14 + 3 × 5 = 69 kg,
  1 box + 3 sleeves = 80 tablets). The browser's total is a preview only; the factor is stamped on the server from the
  live conversion, as before.
- **Priced all or none.** `item_latest_delivery_cost` divides a receipt's cost by its whole base quantity. A priced
  line beside an empty one would make the empty one look free and the price per kg look too low, which Cashflow and Diet
  stock would then trust. So a delivery with some lines priced and some blank is refused ("price every size, or none").
  0 on a line means that line was donated; all lines 0 is a donated delivery, as one 0 always was.
- **The receipt's cost is the sum of its lines**, and each line also keeps its own cost inside `entered`
  (`{quantity, unit, factor, cost}`). The `0118` check only reads quantity, unit and factor, so the extra key needs no
  schema change, and it is what lets Purchasing know what a *size* cost beside other sizes (see c).
- A line in the base unit, beside other lines, is written with factor 1 and the base unit's own name so the array still adds
  up to the total. A single base-unit line is still stored with `entered` null, exactly as every earlier delivery.
- The desk form and the phone steps share the same action. The phone's amount step lists the sizes with **Add another
  size**; the cost of each size is asked on the details step, one box per size (cost is optional, as it was).
- The old `cost` field on the action is gone: the form always sent one figure per delivery; it now sends one per line.

## (b) Stocktake: one whole-number row per size

- An item with any other size set up is counted in rows: its sizes (the one it is counted in first, then the one usually
  bought, then the rest biggest first), then **loose** stock in the base unit. Each row has big − / + buttons and a
  whole-number box. Nobody types a decimal or a weight, and the total is written under the rows ("Together: 287 kg").
  An item with no other size keeps the single figure box, unchanged.
- A size row left alone has no value (not counted). A size set to 0 is a real answer ("none of this size"); a row that was
  touched and counts to 0 is saved as a count of 0, the same as typing 0 before. **Clear this count** puts the item back
  to untouched.
- **Open bags, the place a stocktake goes wrong.** A part-used bag cannot be a whole number, and counting it as a whole one
  overstates stock, so the forecast says there is food for longer than there is. The screen asks, in its own box with a
  warning colour, *Is a bag or box already open?* and the answer is one of four levels, per open bag, with the size chosen:
  about full = 0.9, about half = 0.5, about a quarter = 0.25, nearly empty = 0.1 of that size. **"About full" is 0.9, not 1:**
  every wording is held at or below its middle so an estimate leans towards less stock, never more. The total then
  reads "about", and the review list names each open bag with its level. It is an estimate and says so.
- Saved through the existing `entered` array, one line per size (an open bag is a line with a fraction, e.g.
  0.5 × bag (20 kg)). The server restamps every line from the live conversion; a size the item does not have is refused,
  and an empty array is a count of 0.
- **Same as last time** now repeats the sizes the last count was made in, not only the total, when those lines still add
  up to the stored figure. If they do not (a correction, a changed factor) it falls back to the plain total rather than
  carrying lines that disagree with the number. The page reads each item's latest non-correction count for this; a failed
  read costs the repeat of the sizes only.
- Drafts kept on a phone before this change still restore: the old `{value, unit}` entries are read as they were.

## (c) Purchasing: the other sizes, rounded up

- Beside the usual size (the answer in the Buy column, unchanged) a line "Or about 4 × bag (14 kg) (56 kg)" gives the same
  shortfall in every other size the item is bought in.
- **It rounds up, in every size, and says by how much.** 3.4 bags of 20 kg is 4 bags, never 3: rounding down leaves an
  animal short at the end of the month. The amount in brackets is what those whole bags really hold, so a size that
  overshoots shows it. This is the same direction the usual-size answer already rounded; nothing here rounds in the
  shelter's favour.
- **Cheapest first**, by the cost of the whole bags (so a size that is cheaper per kg but overshoots pays for it), using
  each size's own latest priced delivery (`latestSizePrices`: a line's own cost, or a single-size delivery's whole
  cost). A size nobody has bought with a price yet comes after the priced ones, the closest fit first. A donation (0) is
  not a price.
- The order is the only place price shows. A baht figure beside each alternative was left out on purpose: it would
  be a number that looks exact and is the last price paid for one delivery, and Purchasing carries no money today (the
  list taken to the wholesaler has none). If the Director wants it, it is a small addition on the `cost` already
  computed.
- An older delivery that mixed sizes before lines carried a cost says nothing about any one size and is skipped.

## Check against the two pages that share a price source

The delivery cost still feeds `item_latest_delivery_cost` unchanged (the receipt's total cost over its total base
quantity), so Diet stock and Cashflow agree as they did after `0211`. A mixed delivery now prices at the blended
price per kg of all its lines, which is exactly the total paid over the total received.

## Not built

- Open bags on the single-figure box of an item with no other size (it takes a decimal as before).
- A per-size price shown in baht on Purchasing (see above).
- Browser proof at 375 px in English and Thai was **not** driven in this stream; it is listed under *Left for manual
  verification* in the test plan.
