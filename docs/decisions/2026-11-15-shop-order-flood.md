# The public shop checkout's volume: needs bounding, and the read found a stock leak first

Date: 2026-11-15. Item `#py2b1`. Outcome: **answered, not built. The item stays OPEN** (a bound is wanted; the next stream builds it).
Reading and recommending only: no `src/`, `supabase/migrations/`, `worker/` or `wrangler.jsonc` change.

## Step zero
No bound exists. `grep rate|throttle|limit` over `src/lib/merch/checkout.ts` and `src/app/shop/merch/checkout/actions.ts` finds only
exchange-rate code. No `rateLimit`/`RATE_LIMIT` in `worker/` or `wrangler.jsonc`. No honeypot or Turnstile under `src/app/shop/merch`.
`place_merch_order` is `0373_merch_shop_deferred.sql`. The gap was still there.

## Two routes stay closed (not reopened)
A Cloudflare dashboard rule: the one free rule is spent on `Sign-in attempts` (`1/1 rules`). The Workers rate limit binding: free-plan
status NOT ESTABLISHED (`2026-11-15-worker-rate-limit-binding.md`); only proposable "conditional on Lutan establishing it is free".

## Deliverable 2: what happens to stock (0373, read line by line)
- **Stock moves at ORDER time, not at payment.** `if r.shelter_stock >= l.qty then v_source := 'shelter'; update merch_variants set shelter_stock = shelter_stock - l.qty`.
  Staff cancelling an unpaid order puts it back (`cancelOrder`, `src/app/management/merch-shop/actions.ts`). I found no expiry of unpaid orders in the code I read; **not established** whether anything else does.
- **Shortfall:** if the shelf is short and the product has a supplier, the line is sourced from the supplier and **nothing is decremented**
  (`elsif r.supplier_id is not null then v_source := r.supplier_id::text`). With no supplier the whole call returns `{"ok": false, "error": "unavailable"}`. Hidden, archived or unknown variants also return `unavailable`. The row is never written anyway.
- **One transaction for the order: yes** for the insert of order, parts and items (a raise rolls back).
- **BUT THE REFUSAL PATHS ARE `return`s, NOT RAISES, SO THEY COMMIT.** Lines are processed in id order and each decrements as it goes. If line 1
  is decremented and line 2 then hits `return jsonb_build_object('ok', false, 'error', 'unavailable')`, the function returns normally, the
  transaction commits, and **line 1's stock decrement stays with no order row to cancel and restore it.** The 0373 header's claim that
  "any failure rolls the lot back" holds only for raises. **A stranger can drain shelf stock with no order existing**, which also hides it from the staff list. This is a real defect, separate from volume. Not reproduced against a database (no migration/DB write allowed here); read from the SQL.
- **Double submit:** no idempotency key or unique constraint beyond `order_no` (a sequence), so a double press or replay makes two orders and takes stock twice.

## Deliverable 3: what a junk order costs, in what can be read
- Shelter-sourced lines: **real stock taken** until staff notice and cancel. Per line up to `MAX_QTY = 20`, cart JSON capped at 4000 characters, so a few requests can zero a variant. A real buyer then gets the supplier route or `unavailable`.
- Supplier-sourced lines: only a row. The daily supplier email selects parts of **paid** orders only (`.eq("order.payment_state", "paid")`), so junk reaches no supplier.
- No email, LINE message or alert at order time in the checkout path I read. A row appears in the staff list under "awaiting" (`/management/merch-shop`, latest 200), so junk pushes real orders down and each must be cancelled by hand. Consumes an `order_no` from `merch_order_no_seq`, so numbers gap (harmless).
- Buyer-side notification on order: not found. Anything else: not established.

## Deliverable 4: bounds that exist
Per line `MAX_QTY` 20; cart payload 4000 chars; field lengths trimmed; email must match `^[^@\s]+@[^@\s]+\.[^@\s]+$` (no verification); country two letters; prices and sources re-read server-side. **No** per-email cap, session check, honeypot, Turnstile or volume limit.

## Deliverable 5: options, with what each costs a real buyer
1. **Fix the leak first** (make the refusal paths undo, e.g. check availability for every line before decrementing, or raise). Costs a buyer nothing. Not volume control, but it is the cheapest real harm.
2. **Auto-cancel unpaid orders after N days, returning stock.** Costs a slow-paying overseas donor their order unless N is generous; N is Lutan's call.
3. **Cap open (awaiting) orders per email** inside `place_merch_order` (say 3). Real buyers rarely have more. A stranger changes the email, so it only slows them; a shared family email is the edge case.
4. **Global ceiling on awaiting orders per day / total reserved shelf units**, refusing with the existing `unavailable`-style message. Stops a flood but a flood can also block real buyers; fail with a "try again tomorrow" notice.
5. **Move stock reservation to payment confirmation.** Removes the stock cost entirely; but then an oversold shelf must be handled by hand, and the 0373 race-safety is lost. Biggest change.
6. **Staff "suspicious" flag.** Only helps clearing; does not stop anything.
7. **Per-session cooldown / honeypot.** A honeypot field costs a real buyer nothing; a cooldown by IP hurts shared networks (overseas donors, mobile carriers).
8. **Nothing.** Acceptable only if shelf stock is small and staff accept clearing rows, which is Lutan's call.
Closed: Cloudflare dashboard rule; Workers binding (unestablished).

## Deliverable 6: recommendation
It **does need a bound**, because stock is taken at order time without payment. Build, in order: option 1 (leak, a defect regardless), a honeypot plus option 3, and option 2 once Lutan says how many days an unpaid order may hold stock. These are a migration plus small `src/` changes: a later stream. No card (uncarded on purpose; bounding repetition grants no ability).
**His question:** when a junk order takes shelf stock, does a staff member have to cancel each one, would stock held by an unpaid order block a real sale, and how many days should an unpaid order hold stock before it is released automatically; or would he rather carry the risk?

## Not established
Whether any scheduled job expires unpaid orders; production stock levels and order volume; whether the leak has occurred in production; Workers binding pricing.
