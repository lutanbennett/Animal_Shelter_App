# 2026-10-04 — Record a delivery as steps on a phone, and Deliveries in the menu (`claude/2ic-delivery-steps`)

The last of the 2IC's three screens (§13): the card-by-card stocktake (#331),
Purchasing (#334), and now Record a delivery. P1 is answered — recording a
delivery is hers, "as part of ordering". It also folds in dry-run finding
F-15.

## What was decided

- **Two layouts of one page, as Purchasing is.** `/deliveries` renders
  `DeliverySteps` below `md` and the existing `RecordDeliveryForm` from `md`
  up. Same server action (`recordDelivery`), same fields, same sums; nothing
  about quantity, unit conversion, the before/after-count question or the
  `received_at` rule is re-implemented. A fourth wizard pattern for her was
  the thing to avoid, so the chrome is the stocktake cards': step counter and
  progress bar, `min-h-14` full-width buttons with an icon and a word, the
  same slide-in, the keypad (`inputMode="decimal"`) opened on the amount.
- **Six counted steps, then a saved screen.** What arrived (Medicine / Food)
  → which one (a type-to-filter list of big rows, label photo beside a
  medicine, one tap advances) → how much (unit if the item has conversions,
  "it came in packs" for packs × per pack) → when (Today / An earlier day; if
  the item was counted that day, the before/after question as two big
  buttons) → a few optional details (supplier, cost, note) → a sentence
  saying what will be recorded, and the one button that records it.
  Supplier, cost and note share one step because all three are optional and
  she can tap straight through.
- **Back loses nothing, and so does a refused save.** Every answer lives in
  `DeliverySteps`'s own state, not in a screen. Changing the kind clears the
  item (it belongs to the kind); going back to the same kind does not. A
  refused save shows the server's wording on the confirm screen and leaves
  every answer where it was, so this is not a third instance of F-10.
- **After a save, the next item keeps the day and supplier** — one van brings
  several things. The item, amount, cost and note clear, as on the desk form.
- **The confirm screen states the effect in words**, including "this does not
  change the stock count": the sentence names the quantity in the unit she
  typed, and if that unit is a conversion, what it comes to in the item's own
  unit (labelled approximate, as everywhere else).
- **Deliveries is a menu entry, next to Stocktake** (F-15). The route
  registry's `menu` is now `true` and `NavLinks` gets `canDeliveries`
  (`stock.delivery`). It was already a Home tile for staff. Stocktake's
  "Record a delivery" link stays, but as a full-height bordered button, not a
  20 px text link. Both, not either: the menu is where she will look, and
  Stocktake is where the box is in her hand.
- **Help text names only pages the reader can open.** The page's intro no
  longer says "Stock between counts" (a Management page) and the manual's
  steps no longer point at Management → Medications / Diets. The long intro
  is hidden on a phone: the confirm screen says the one thing that matters.

## What did not change

No migration. `stock_receipts`, its trigger and policies, `stock.ts`'s
expected-on-shelf sum (which already adds receipts since the last count) and
`safety_stock` are untouched. The guard is still `requirePermission(
"stock.delivery")`, held today by admin, management and staff; the route
already had its registry entry. When `2ic-role` lands she needs that cell and
nothing in this screen changes.

## Left open

- **The watched test.** "Tested by watching" is the done-when and no session
  can sign it: someone like her, on a phone, in Thai, recording a real
  delivery without help. It is in the test plan's Left for manual
  verification table.
- Thai strings under `deliveries.steps` are a first draft for a Thai speaker
  to read.
- The Foster or adopt page's reference to "Management → Contacts" (the second
  half of F-15's help-text complaint) is a different page and was not
  touched.
