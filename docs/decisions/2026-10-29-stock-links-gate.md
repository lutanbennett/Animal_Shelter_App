# Stock links on the diets and medications pages follow the card their page asks (2026-10-29)

Stream `claude/stock-links-gate`. No migration. Eight gates in
`src/app/management/{diets,medications}/page.tsx`, plus the two subtitles.

## The activity each link asks

Read from the destination page's own `requirePermission(...)`, not guessed from the label. All four
match the backlog item's list, so nothing differed.

| Link | Leads to | The page asks | Link now drawn when |
|---|---|---|---|
| Stocktake | `/stocktake` | `requirePermission("stock.count")` | `can(perms, "stock.count")` |
| Stock between counts | `/management/stock-usage` | `requirePermission("stock.usage")` | `can(perms, "stock.usage")` |
| Purchasing | `/management/purchasing` | `requirePermission("stock.purchasing")` | `can(perms, "stock.purchasing")` |
| Record a delivery | `/deliveries` | `requirePermission("stock.delivery")` | `can(perms, "stock.delivery")` |

Server and database checks are untouched; hiding is the courtesy.

## Subtitles: proposed wording

The sentence "Count it, price it, set when to reorder" (medications: "... add a photo of the label")
promised actions a read-only forecast card cannot do. **Proposal, applied: drop that sentence** in
English and Thai. The links beneath are labelled, and the page still says what it shows and where the
food or medicine list lives. Wording is easy to change if Lutan prefers a card-aware variant.

## Driven (port 3001, one-card logins, reached by clicking through)

- `food_forecast` alone: Diet stock loads, no action links, new subtitle.
- `medicine_forecast` alone: Medication stock loads, no action links, new subtitle.
- `food_forecast` + `do_stocktaking` + `do_purchasing` + `record_delivery`: Diet stock draws exactly
  Stocktake, Purchasing and Record a delivery.
- Not drawn for anyone but Admin: **Stock between counts**, because no card carries `stock.usage` yet.
  That is the existing backlog position ("stock usage is Admin too"), not something this change did.
- Medications was not separately driven with the stock cards; its four gates are the same code as diets.

## Found, not fixed

None seen in the pages driven. Nothing else was opened.
