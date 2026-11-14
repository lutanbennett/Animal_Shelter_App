# Staff can add and remove a merchandise-shop currency (#p8fwd)

2026-11-14. Migration `0379_merch_currency_add_remove.sql`.

**Step zero.** The item's framing was out of date: the currency list was already a table (`merch_exchange_rates`, 0374) and `RATES_THB`/`RATES_AS_OF` are gone from `src/`. The missing pieces were an insert policy, a delete policy and two controls. No insert policy existed, so the gap stood. The decision file `2026-11-13-merch-exchange-rate.md` says a failed rate read is an error, not a fallback; this change does not touch the reader.

**1. Should staff add a currency at all? Yes.** The first overseas buyer wanting CAD should not wait for a developer. What was weighed: a wrong rate quotes a wrong price, but staff already edit the rate and an order keeps the rate it was quoted at (`merch_orders.exchange_rate`), so that risk already exists; a currency the shelter cannot actually receive is the new one, and it is staff's call, shown on a screen they already own. Gated on `merch.manage` at `edit`, the activity `run_merch_shop` carries: no new card.

**2. Delete as well? Yes, a hard delete, no deactivate column.** `merch_orders` stores `currency` as plain text with its own rate and has no foreign key to this table (read in 0373), so a past order keeps what it was quoted in. A deactivate column would add state for no gain, and without a delete a mistyped code would sit in the buyer's list for good. The audit trigger (`record_audit`) records every insert and delete.

**3. Typo guard.** Server-side the code must match `^[A-Z]{3}$`, not be THB, and be in `Intl.supportedValuesOf("currency")` (the runtime's own ISO 4217 list: no dependency). Verified: `XQZ` is refused, `cad` is accepted as `CAD`. The table's own check stays as the backstop.

**4. Does the public shop need to know? No.** The checkout page lists `Object.keys(loadRates())` (`src/app/shop/merch/checkout/page.tsx:23`), so an added currency appears to buyers at once; measured: CAD present in `/shop/merch/checkout` after adding, gone after removing.

**Insert stamp.** `set_by`/`set_at` on a new row come from a before-insert trigger, never from the form (as 0374 does for update).

**Found, not fixed.** Dev's staff-name lookup shows "unknown" for logins without a role (already recorded in the #1575 decision). A login holding `merch.manage` at read only was not driven in the browser; the controls are gated by the same `canEdit` as the existing Save form.
