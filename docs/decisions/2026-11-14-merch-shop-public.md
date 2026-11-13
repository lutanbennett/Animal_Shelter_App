# The merchandise shop, public half (`shop-public`, backlog #cjxq0)

**What was built.** `/shop/merch` (catalogue, reads `public_merch_products` and `public_merch_variants`, works with
zero products), `/shop/merch/checkout` (cart kept in the browser, order form, server action), and
`/shop/merch/order/<id>` (status, payment instructions, tracking). Strings are `t.merchShop.*` in both dictionaries.
Specification followed: `docs/merch-shop.md`. Staff screens, Mark paid, tracking entry and the supplier email are
`shop-staff`, not here. `#cjxq0` is not ticked.

**Step zero.** The gap was real: `/shop/merch` did not exist, `/shop` was already a public prefix, and the six tables
and two views were on `main` (0369).

## Judgements

**Service role.** `src/lib/merch/checkout.ts` is the one new service-role site (it is on the `eslint.config.mjs`
allow-list and in `docs/hard-coded-security-registry.json`, `serviceRoleSites`). It writes the order for a signed-out
buyer and reads one order back by id. Its guard: only variant ids and quantities are taken from the browser; every
price, postage figure and name is re-read from the real tables; hidden and archived variants are refused. The status
read selects no name, address, email or phone. It grants nobody an ability, so it is not a card matter.

**Not a single database transaction (departure from the spec's "in one transaction").** supabase-js cannot hold a
transaction across calls, and a transaction function needs a migration, which this stream may not carry. The
substitute: the stock decrement is conditional on the value just read (a race refuses the loser, and the
`shelter_stock >= 0` check is the backstop); every later failure puts the stock back and deletes the order (parts and
items cascade). A process killed between steps could leave an order without items or stock taken. **For the planner to
file: a `place_merch_order()` function would make this one real transaction; it needs a schema PR.**

**Cache.** Adding the two prefixes to `NOT_EDGE_CACHED_PAGE_PREFIXES` was necessary but not enough: the cached list is
`PUBLIC_PAGE_PREFIXES` minus the not-cached ones by exact match, and `/shop` is cached, so `/shop/merch/checkout`
stayed cached by `underPrefix`. `isEdgeCachedPage` now also refuses any path under a not-cached prefix, with a test
(`src/lib/public-paths.test.mjs`). The catalogue stays cached, as the spec judged acceptable. Both per-buyer pages are
also `noindex`.

**Exchange rate.** The spec says "the staff-maintained rate", but no store for one exists and a migration is not ours.
`RATES_THB_PER_UNIT` in `src/lib/merch/shop.ts` is a dated constant (USD, EUR, GBP, AUD, SGD; **the figures are
placeholders and must be set by the shelter before anything is sold**). The buyer is shown the rate and its date.
**For the planner to file: a staff-edited rate belongs with `shop-staff`.**

**Hiding it.** The merchandise shop is hidden only together with the affiliate shop (`page:shop`). A separate
`page:shop-merch` switch needs a migration: **for the planner to file**, not done here.

**Not done on purpose.** No menu entry (the menu is driven by `PUBLIC_PAGES`, whose keys the hide switch uses; adding
"Merchandise" there is the same question as the switch above). The page is reachable by address only. No logo or
artwork. No payment processor.

**Wise payment link.** A Wise-link order tells the buyer a link will be emailed; the staff field that holds it has no
column yet, so staff paste it into an email for now.
