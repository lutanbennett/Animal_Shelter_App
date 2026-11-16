# Shop checkout: stock leak fixed, open orders capped per email (`#py2b1`)

Date: 2026-11-16. Outcome: **built** (migration 0384 plus a small `src/` change). It builds what
`2026-11-15-shop-order-flood.md` recommended; that file holds the reading and is not repeated here.

## Re-read of the path (deliverable 1)
Unchanged since yesterday: `submitOrder` (`src/app/shop/merch/checkout/actions.ts`) -> `placeOrder` (`src/lib/merch/checkout.ts`) ->
`place_merch_order()` (0373) as the service role. Nothing bounded volume. No later migration redefined the function.

## What was wrong, and what changed
1. **Leak.** In 0373 the shelf decrement ran inside the line loop while the refusal paths `return` (not raise), so a later
   unavailable line committed the earlier lines' decrements with no order. 0384 moves every decrement to after all lines have
   passed and the order row exists. A refusal now changes nothing.
2. **Cap.** An email (case-insensitive) may hold at most **3 unpaid (`awaiting`) orders**; the next gets `too_many`, shown as a
   new message ("pay or contact us before placing another", English and Thai). 3 is a judgement: a real buyer rarely has more.

## What this does NOT do, and why that is accepted
A stranger can change the email, so the cap only slows a flood. Nothing is built for the Cloudflare route (the one free zone
rule is spent; the Workers binding's free status is still not established) and nothing paid. Stock held by an unpaid order is
still held until staff cancel it. The honeypot and auto-expiry the earlier decision listed are **not** built: auto-expiry needs a
number of days that is Lutan's call (how long may an unpaid order hold stock?), and a honeypot adds little against a direct POST.
**No card:** the checkout is uncarded on purpose and bounding repetition grants no ability.

## What would flip this
If junk orders actually appear in production, add expiry of unpaid orders (Lutan sets the days) or a global awaiting ceiling.
Not reproduced against a database: read from the SQL; migration applied to dev only.
