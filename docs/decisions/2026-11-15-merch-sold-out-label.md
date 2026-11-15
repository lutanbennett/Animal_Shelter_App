# Merchandise shop: a visible sold-out label (#lkxwu)

2026-11-15. Display only: no migration, no new card, `public_merch_variants` untouched.

- **Card (deliverable 4): dim the photo and the price, yes.** A price you cannot buy at is the confusing part, so a sold-out
  product gets a Sold out badge on the photo corner, a 50% grey photo and a struck-through muted price. The grey paragraph where
  Add to cart was becomes a badge too, so a card with no photo still says it. The dropdown `(Sold out)` option is unchanged.
- **Cart (deliverable 5): both halves of the better option, not the wording.** The checkout page (server) reads
  `public_merch_variants` for the available ids and passes them to `CheckoutForm`. A cart line not in that set (sold out, hidden or
  archived) is struck through with a Sold out badge, a notice says to remove it, and Place order is disabled until it is gone. A
  failed read passes `null` and flags nothing, so a read error never blocks a buyer. `errUnavailable` is left as is: it is only reached
  by a race after the page loaded, and `place_merch_order()` stays the real guard.
- **Staff:** a Sold out on the shop marker beside the product name on `/management/merch-shop`, from rows the page already reads. No control.
- **The supplier rule, so nobody "fixes" it:** availability is `p.supplier_id is not null or v.shelter_stock > 0` (0369). A product
  with a supplier is NEVER sold out, however empty the shelf, because the supplier fulfils it. The staff marker applies the same rule.
