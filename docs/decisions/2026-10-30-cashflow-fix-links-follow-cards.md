# Cashflow "fix N" links follow the destination's card (2026-10-30)

Stream `claude/cashflow-fix-links`. No migration. By card, not by role.

Found by `page-buttons-and-seam` (2026-10-29): the Not priced row's links (`CATEGORY_PRICE_PATH`,
`src/lib/management/cashflow.ts`) were drawn for any holder of `reports.cashflow` at read, though each leads to a page that asks
something else, so a view-only card was offered a link that ended on `/no-access`.

`/management/cashflow/page.tsx` now passes `canFix`, one boolean per category, each asking what the destination's own page and
action ask (read from those files, not guessed):

| Category | Destination | Asks |
|---|---|---|
| food | `/management/diets` | `stock.diets` edit |
| medication | `/management/medications` | `stock.medications` edit |
| immunization | `/admin/immunization-types` | `reference.types` |
| clinic | `/admin/website` | `website.content` edit |
| maintenance | `/maintenance` | `maintenance.jobs` edit |
| fixed | `/management/cashflow/fixed-outgoings` | `reports.cashflow` edit |

Without the activity the count is shown as plain text. `CashflowView` takes `canFix` defaulting to `{}`, so a caller that forgets
offers nothing. The "not priced yet" card (`notPricedTarget`) links to a category's page only when that is held; otherwise it
falls back to the in-page Not priced row, which is never a dead end. Admin sees every link through the `perms.isAdmin`
short-circuit. Page and server checks are unchanged; hiding is the courtesy.

Edit level is used where the page's own editing asks it: the link exists to enter a price, so a read-only holder gains nothing.
Found, not fixed: none.
