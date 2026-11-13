# Merchandise shop exchange rates: a table staff edit (#r4ktv)

2026-11-13. Migration `0374_merch_exchange_rates.sql`.

**What.** The five rates (USD, EUR, GBP, AUD, SGD) and their date were a constant in `src/lib/merch/shop.ts`. They are now one row per currency in `merch_exchange_rates` (baht per unit, `set_by`, `set_at`), seeded with the old figures dated 2026-11-13, so the shop behaved identically the moment the migration landed. Staff edit a rate on Management → Merchandise shop → Exchange rates.

**Access.** The screen and `saveRate` both ask `merch.manage` at `edit` (the activity `run_merch_shop` already carries; no card was added). The table's policies resolve through `has_permission('merch.manage')`: read at `read`, update at `edit`. `set_by` and `set_at` are stamped by a trigger from the session, never from the form. Closed to anon; the checkout reads it with the service role, inside `src/lib/merch/checkout.ts`, which is already recorded in `hard-coded-security-registry.json`.

**The fallback question: a failed read is an error, not the old constant.** A silent fall back to a stale figure is exactly the fault this item exists to remove, so the constant is gone from the code (the migration is its only home). The cost of an error is kept small: on the checkout page a failed read just leaves the overseas currencies out of the list (Thailand and PromptPay still work), and `placeOrder` returns its existing "failed" result for an overseas order. Nobody is quoted a wrong rate; a buyer sees a retry message for a short outage.

**Departures from the brief.** (1) The table also has a uuid `id`: `record_audit()` names the row by `id`, and without it the update failed (found in the browser check, fixed before merge). (2) The buyer's order page used to print the shop-wide `RATES_AS_OF`. It now prints the order's own date (`created_at`), which is the truth: the rate on an order is the one fixed when it was placed, and editing a rate does not change existing orders. (3) No insert or delete: adding a currency stays a migration, because nothing asked for a screen to do it.

**Found, not fixed.** The reader of "set by" resolves names through `app_users`; a login with no role shows "unknown" (the seeded rows too).
