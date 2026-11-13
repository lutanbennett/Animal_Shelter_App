# The merchandise shop, staff half (`shop-staff`, #cjxq0)

Built from `docs/merch-shop.md`. No migration, by the brief.

## The screens

`/management/merch-shop` (card `run_merch_shop`, activity `merch.manage`): three tabs in one page (Orders, Catalogue,
Supplier email) and `/management/merch-shop/order/[id]`. All writes are plain-form server actions in
`src/app/management/merch-shop/actions.ts`; every one asks `merch.manage` at edit, and every control is drawn only
when `can(perms, "merch.manage", "edit")`. The suppliers screen gained a delivery-method select (its own action
still asks `suppliers.directory`).

## The daily supplier email: a claim and an undo, not one transaction

The spec wants the log row, the part updates and the send to commit together. supabase-js cannot hold a transaction
across calls and a function would need a migration (deferred with `place_merch_order()`). So
`src/lib/merch/supplier-email.ts` does: insert the log row; **claim** the parts with an update conditional on
`status = 'new' and sent_to_supplier_at is null` (two runs cannot both claim a part: nothing repeats); send; on a
refusal **undo** the claim and delete the log row (nothing missed). Residual window: a crash between send and the end
leaves parts marked, and the log says what was meant to go. That is the departure from the spec; the real fix is a
SQL function in the deferred schema follow-up.

Runs from the existing Worker cron (every 15 minutes) but only on the 02:00 UTC tick (09:00 Thailand), through
`POST /api/merch/supplier-emails`, bearer-guarded like the calendar sweep. Service-role sites recorded in the registry.
It sends through the existing `STATUS_ALERT_MAIL` binding; Cloudflare may refuse a recipient that is not a verified
destination, which shows as a failed run and leaves the parts unsent. **Not yet proven on a deployed Worker.**

## The exchange rate: NOT done

A staff-edited rate needs somewhere to store it, and no existing table is card-governed for it (`site_content` is
website-content-only and needs a column). That is a migration, which this stream may not take. The dated constant in
`src/lib/merch/shop.ts` stays. For the planner to file: a one-table migration holding rates and their date, then
replace `RATES_THB_PER_UNIT` / `RATES_AS_OF` with a read.

## Other departures

- Audit triggers on the merch tables: not added (planner override; `check-audited-tables.mjs` passes without).
- No "send now" button: the spec says re-sending is not a feature.
- Photos are entered as a Drive file id, not uploaded: the upload plumbing is a separate piece. For the planner to file.
