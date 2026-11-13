# Merchandise shop: schema, card and route (2026-11-14, #cjxq0)

Migration `0369_merch_shop_schema.sql`; specification `docs/merch-shop.md`. The inputs are the answers recorded in
`docs/decisions/2026-11-13-answers-receipts-shop-payments.md`, **given by Lutan in chat, not read from the Director in
writing**.

## The shape chosen

- **Six tables, all behind one activity** (`merch.manage`): `merch_products` (price and both postage prices on the
  product), `merch_variants` (size, colour, shelter stock), `merch_orders` (manual payment state, own-currency total),
  `merch_order_parts` (one order split by source: a supplier or the shelter's shelf, each with its own status and
  tracking), `merch_order_items` (lines with name, size, colour and price copied at the time of sale),
  `merch_supplier_emails` (the log of what was sent).
- **"No supplier yet" means no supplier chosen, not no suppliers.** `merch_products.supplier_id` is nullable; the
  per-supplier model stands. **The existing `suppliers` table (0335) is extended** with `delivery_method`
  (`daily_email` only, a checked text list that later widens), not duplicated.
- **Nothing in the sale is a payment-provider field.** Payment is manual (PromptPay; Wise transfer or link), staff
  mark an order paid and that stamps `paid_at` / `paid_by`. No gateway column, per `#ss2s0`(d).
- **No refund state.** Returns are exchange only.
- **Overseas currency**: the order stores `currency`, `exchange_rate` and `total_charged` beside the baht total. A
  rate service would cost money; staff set the rate.
- **Empty catalogue**: no rows inserted; products and variants default hidden/unshown.

## The route: `/shop/merch`

Recommended over renaming `/shop` (breaks live links, share metadata and the `page:shop` hide key) and over a new
top-level route (needs a new prefix, Worker cache entry and sitemap work). `/shop/merch` is already public and has a
Thai twin because `PUBLIC_PAGE_PREFIXES` matches `/shop` at a segment boundary. Costs `shop-public` must handle: add
checkout and order pages to `NOT_EDGE_CACHED_PAGE_PREFIXES`; add a `page:shop-merch` hide key if the Director wants
it switched off alone; keep strings in `t.merchShop.*`, apart from `t.shop.*`. Detail in `docs/merch-shop.md`.

## The card judgement

**One card, `run_merch_shop`**, one activity, `merch.manage` at edit. The answers name no catalogue/orders split, and a
second card nobody can say who holds would be the "card that does nothing" the checks forbid; splitting later is a
small migration because each table asks exactly one activity. It is not `manage_shop_page`, the affiliate card. The
card holds a real grant on six real tables from day one, so `card-grants-applied` is satisfied before any screen
exists. Admin was given no cards. Its manual topic is recorded as not yet needed (`docs/cards-without-topic.json`)
because its page is not built; `shop-staff` deletes that record and writes the topic.

`suppliers`' select and update policies gained `merch.manage` so the shop's staff can see and set a supplier's
delivery method; every other clause of 0335 is kept. The supplier insert and delete policies still ask only
`contacts.*`.

## Deliberately not modelled

- **A payment gateway or any provider field** (decided: manual for both).
- **An owner for "where is my order"** (undecided; not a blocker).
- **Print-quality logo files** (Lutan's to supply; not needed until a supplier starts).
- **Audit triggers.** Adding them needs entries and labels in `recent-changes.ts` and both dictionaries
  (`check-audited-tables.mjs`). This PR stamps `paid_by` / `paid_at` and keeps the supplier-email log; the full change
  log belongs with the staff screens, and `docs/merch-shop.md` tells `shop-staff` to add it. **Found, not fixed.**
- **Checkout's service-role write and the daily email job.** Both are `shop-public` / `shop-staff` work and each must be
  recorded in `docs/hard-coded-security-registry.json`.

## What changed outside the migration

`cards.ts` (the card), `catalogue.ts` (the activity), `routes.ts` (the `/management/merch-shop` entry, touched for this
one entry only), the two dictionaries (the card's label and description and the `nav.merchShop` label: strictly
labels, no screen), `check-cards-count.mjs` (59 to 60), the permission probes and the `check-who-does-what` fixture,
`check-public-views.mjs`, the security registry (one `grant to anon` record, same shape as 0285 and 0314) and
`docs/cards-without-topic.json`. The Thai wording is not checked by a Thai speaker.
