# 2026-11-13: The three merchandise-shop pieces `0369` left for later (backlog `#m3kpq`)

One migration, `0373_merch_shop_deferred.sql`, and the small amount of code that uses it.

## What was built

1. **`place_merch_order()`**: the checkout's write as one database transaction. `src/lib/merch/checkout.ts` now makes
   one `rpc` call and the multi-statement path (read the variants, decrement stock, insert the order, parts and items,
   and put it all back by hand on failure) is gone, not left beside the new one. Currency and region validation, and
   the dated exchange rate, stay in TypeScript exactly as before (`src/lib/merch/shop.ts` is untouched: the rates are the
   next batch's stream). The function re-reads every name, price, postage figure and source itself, so only variant ids
   and quantities cross from the browser, as before.
2. **`page:shop-merch`**: a hide key of its own, restated on `site_content.hidden_public_pages` with the whole list as
   it stands after `0328` (not `0290`, which is no longer the latest) plus the new key. The merchandise page is a
   `PUBLIC_PAGES` entry of its own (`shop-merch`), so Settings → Website → Pages draws a card with its own Show / Hide
   switch, and the header menu, footer and sitemap list it only while a product is shown, as the affiliate shop does.
   **The three merchandise pages now check `page:shop-merch`, not `page:shop`:** hiding Shop for the shelter no longer
   takes the merchandise shop down with it, and the reverse.
3. **Audit triggers** on `merch_products`, `merch_orders` and `merch_order_parts` (`record_audit()`), with the entries
   `scripts/check-audited-tables.mjs` wants (`AUDITED_TABLES`, `NAME_FROM_IMAGE`, a label in both dictionaries).

## Which access path `place_merch_order()` takes, and why

**Security invoker, executable by `service_role` only. It is not a `security definer` function.** It is the public
checkout path and it grants nothing: the checkout already ran with the service role (no `merch_*` table is open to
anon, `0369`), and the service role already holds every privilege the function uses. `revoke execute … from public,
anon, authenticated` means a browser can never call it. A `security definer` version would have needed a
`has_permission()` call it has no honest card for (the buyer is signed out) or a declaration in
`docs/hard-coded-security-registry.json`; invoker avoids both and adds no way in. `check-hard-coded-security.mjs` still
prints `no coded security outside the Admin bypass`. Proven on dev: an anon call is refused (`permission denied for
function place_merch_order`).

## Behaviour reproduced from the old checkout, and the one deliberate difference

Same refusals: a hidden, archived or missing variant, or a shelf too short with no supplier, is `unavailable`; an empty
cart is `empty`; anything else (a check constraint) is `failed`. Same source rule: the shelter if its shelf holds enough,
else the product's supplier. Same totals and rounding. **The difference is the point:** before, two buyers racing for
the last item were separated by a conditional update and a hand-written undo; now the variant row is locked
(`for update`, in id order so two checkouts cannot deadlock) and a failure anywhere rolls the lot back, so no undo code
can itself fail. Proven on dev: a second order for more than the shelf holds is refused; an order whose insert
violates a check (`ship_country = 'zzz'`) leaves the stock exactly as it was.

## The audit log leaves the buyer out

`merch_orders` holds the buyer's name, email, phone, address and note. The trigger passes those five columns to
`record_audit()` as columns to omit (the function already takes them), so Recent changes can say who changed which
order and when without the buyer's details being copied into `audit_log`. Proven on dev: an order's audit row does not
contain the buyer's email. Cost: an undo of an order's deletion could not restore those columns, but `undo.ts` does
not list these tables, so none is offered.

## Found, not fixed

- `src/lib/merch/shop.ts` still holds `RATES_AS_OF` and five hard-coded rates: out of scope (the rate screen is its own
  stream).
- The merchandise pages' `PublicHeader current` is now `shop-merch`, so on those pages the Get involved menu marks
  Merchandise rather than Shop for the shelter. That is the intended reading.
- The Donate page's "Shop" mention (`ShopMention.tsx`) still follows `page:shop` only; it is about the affiliate shop.
