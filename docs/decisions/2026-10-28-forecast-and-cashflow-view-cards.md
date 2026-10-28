# Three view-only cards: the food forecast, the medicine forecast and cashflow (0280)

**Lutan, 2026-10-28**, answering the six questions of Card review 2 (`2026-10-28-card-review-2-report.md`): the medicine list, the
diet list and stock usage are Admin tasks; the forecast and the cashflow are to be seen; *"Go with 2 cards for now"*; and *"Keep
dashboard and cashflow separate"*. Admin sits outside the card system, so the three Admin pages need no card.

## What was built

| Card | Grants | Opens |
|---|---|---|
| `food_forecast` | `stock.diets` at read | `/management/diets` |
| `medicine_forecast` | `stock.medications` at read | `/management/medications` |
| `view_cashflow` | `reports.cashflow` at read | `/management/cashflow` |

- **The page guards now ask read.** `requirePermission(activity)` defaults its level to `"edit"` (`require.ts:25`, read with the eyes
  before building), so a read-level card would have opened nothing. The three pages and their `routes.ts` entries ask `"read"`.
- **Every control is drawn only at edit**, the level its own action asks (`can(perms, "<activity>")` defaults to edit in `can.ts`):
  - diets and medications: the Count and Price-and-reorder buttons (and the label-photo buttons) on each card, the cupboard-order link
    and the `?view=order` screen, and the price panel (`units/actions.ts` asks `stock.diets` / `stock.medications` at edit). A
    `?view=order` request without edit falls through to the ordinary read-only page.
  - cashflow: the link to the fixed-outgoings editor (its page and its three writes ask `reports.cashflow` at edit, unchanged) and the
    link to the website settings where the clinic estimate is changed (asks `website.content` at edit).
  - `DietStockCards`, `MedicationStockCards` and `CashflowView` take their `canEdit…` props **defaulting to false**, so a caller that
    forgets offers nothing.
- **No server or database check was weakened.** The fixed-outgoings page guard still asks edit.
- **`reports.cashflow` came off the `dashboard` card** in `cards.ts` and in `0280` together. A grep of `src/app/management/dashboard/`
  shows nothing reads it, so no panel changes; the grant was already inert for a dashboard holder because the cashflow guard asked edit.

## Not built, on purpose

`medicine_stock_list`, `diet_stock_list` and `stock_usage_report` (Admin tasks, no card). No role is given any of the new cards: who holds
them is a Settings → Who does what assignment. Nothing is granted to Admin.

## Driven, by card (dev, 2026-10-28; HTTP with each login's own session, not clicked in a browser)

Each login held exactly one card (`dev-signin.mjs --cards <card>`). Opened means the page's own heading rendered.

| Login holds only | Opens | Refused (`no-access`) | Edit controls drawn |
|---|---|---|---|
| `food_forecast` | `/management/diets` (forecast figures loaded) | medications, cashflow, dashboard, fixed-outgoings | none; `?view=order` falls through to the read-only page |
| `medicine_forecast` | `/management/medications` (figures loaded) | diets, cashflow, dashboard, fixed-outgoings | none |
| `view_cashflow` | `/management/cashflow` (figures loaded) | diets, medications, dashboard, fixed-outgoings | none: no fixed-outgoings link, no website link |
| `dashboard` | `/management/dashboard` in full | diets, medications, **cashflow**, fixed-outgoings | none |

Positive control: an Admin login on the same pages drew every control (Price and reorder ×8 and Count ×8 on diets, ×25 on medications,
the order links, both cashflow links), so the absences above are the gating and not an empty page.

## Found, not fixed

- **Links to other pages stay drawn on the diets and medications pages** (stocktake, stock usage, purchasing, deliveries). They are
  navigation, not an action of this page, but a holder of only a forecast card meets a refusal at the far end. The activity each should
  ask is that destination's own (`stock.count`, `stock.usage`, `stock.purchasing`, `stock.delivery`). Out of this stream's boundary.
- **The medicine page's vaccine section** is server-rendered and has no control of its own to gate; nothing was found there.
- **`check-card-grants.mjs` already differs on dev before this change**: the database holds `photos.resident_medical` and
  `photos.medical_add` grants on `view_medical`, `medical_records` and `add_medical_photos` that `cards.ts` on this branch does not
  list. That is `0279`'s side and not touched here.
- **Not driven:** the click-through of Count / Price and reorder as an editor (an Admin page load proved they are drawn, not that a save
  runs), and the Thai wording of the three descriptions was written by the session, not read by a person.
