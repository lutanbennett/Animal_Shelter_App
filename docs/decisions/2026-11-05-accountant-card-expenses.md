# 2026-11-05 — the expense report and the View expenses card (0317)

Lutan, 2026-11-04: *"basic reports that show expenses by type and date / Month and links to the receipts"*, *"We can expand the reporting later"*, *"And could all be one card"*. So v1 is one read-only screen (`/management/expenses`), one levelled activity and one card.

**Activity: `reports.expenses`, a LEVEL, held by the card `view_expenses` at read.** Why levelled: `bills.utilities`, `bills.general`, `bills.sites` and `donation.receipt` are yes/no, so a card carrying one lets its holder write the money, never only read it. No read level was added to those four (it would widen the issue-and-edit screens). Copied from `reports.cashflow` (0132): `requirePermission("reports.expenses", "read")` on the page and `level: "read"` on the route.

**Why a security-definer report function.** The bill tables are readable only to the activities that write them, so a login holding only this card reads nothing from them. `expense_report(from, to)` and `expense_waiting_count()` each check `has_permission('reports.expenses','read')` first and raise otherwise. They read no resident, medical or personal column.

**What 0189 said about receipt owners (settled from 0189/0304/0305/0308).** The attachment owner types `utility_bill`, `general_bill`, `maintenance_bill` and `stock_delivery` all exist, so every bill table can hold a photo. `bill_owner_can()` allowed reading each only to the activity that writes it, so the receipt links would have been dead for this card. 0317 rebuilds it from 0308 with one addition: reading (`p_write` false) those four, and a headerless `stock_receipt`, is also allowed to `reports.expenses` read. Writing is unchanged. A row with no photo shows "no receipt". Known gap, not built: `general_bill` photos are only filed while the bill is an inbox card (see `src/lib/bills/upload.ts`), so a general bill usually shows "no receipt" until that is changed.

**How each source is counted, never twice.** `utility_bills`, `general_bills`, `maintenance_bills` by `bill_date` (a maintenance job bill is typed `maintenance` by construction, no schema). `stock_deliveries`, the invoice header, by `bill_date`, falling back to the day received when none was typed. A `stock_receipts` line only when it has no header (`delivery_id` null: every row older than 0308), by its own cost and day received, typed Food or Medicine from its item kind. A line under a header is never counted; its header is. A header or line with no cost is not in the total. `covers_month` is shown beside a utility bill and never grouped on.

**Out:** `fixed_outgoings` (a forecast; adding it to actuals would quietly misstate them), `donation_receipts` (money in), clinic visit costs (not one of the four tables the brief named; stated on the screen so the accountant is not misled), anything tax-shaped, the fuller financial report.

**Waiting bills, on the screen.** The count is Bills inbox cards plus invoices with no type chosen; none of them is in any figure.

**`stock.purchasing` level live.** Not relied on, so not measured beyond reading: 0257 grants it at level 2 and 0284 calls `has_permission('stock.purchasing')` with no level. This build uses neither.

**The button rule.** The page has no button, form, input or link that writes (checked in the running page: 0 of them). The only links are the year navigation and the receipt links, which ask `reports.expenses` read through the page guard and the attachment policy. Nothing found, not fixed.

**Admin and role:** Admin gets no card and the `isAdmin` line is untouched. The card is given to no role; the assignment is Settings → Who does what. The card count in `check-cards-count.mjs` is now 49.

**Not verified:** the Thai wording (unreviewed). **Outstanding before the card works in production:** 0317 applied to production.
