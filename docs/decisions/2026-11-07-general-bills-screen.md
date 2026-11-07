# 2026-11-07 — A screen for filed general bills (`#k8r2n`)

**Branch `claude/general-bills-screen`. No migration, no new card.**

## What was built

- `/bills/general` lists every row in `general_bills` (newest first) with its kind, place, account, amount, date, note, the
  pages already on it, and an *add a page* control. It is linked from `/bills`.
- `general_bill` is now in `BILL_OWNER_TYPES` (`src/lib/bills/upload.ts`); the comment above it, which had said "left out on
  purpose", was rewritten so the next session does not read it as current. The upload route
  `src/app/api/bills/[kind]/[id]/route.ts` needed **no change**: it already accepts any owner in that array.
- `BillPhotosSection` (shared) takes `general_bill` as a kind.

## Shape copied

`src/app/bills/utilities/`: its own route, `requirePermission(<activity>)` for the whole page, the route entry in
`src/lib/permissions/routes.ts` (`menu: false`), `write-requests.ts` list, and a link from `/bills` drawn only when the card
allows it.

## Card and control list (each asked from the action's own check)

| Control | Drawn when | The check that actually decides |
|---|---|---|
| The page itself | `bills.general` | `requirePermission("bills.general")`; `general_bills` policy asks the same |
| Link on `/bills` | `can(perms, "bills.general")` | the page |
| Add a page / add another page | `can(perms, "bills.general")` | `mayFileBill(perms, "general_bill")` → `bills.general`; database `record_attachment` → `bill_owner_can('general_bill')` (0306) |

**One real defect fixed on the way:** `mayFileBill` had no branch for `general_bill`, so it fell through to the last line, which
lets a card holding *any* bill activity (deliveries, clinic visits, maintenance bills, utility bills) pass the route's first
check. The database would still have refused, but the control and the route disagreed. It now asks `bills.general` alone.
Server and database checks were not weakened.

## Proof (dev, one-card logins, not Admin)

- Login holding exactly `bills`: link on `/bills`, `/bills/general` lists two filed bills, the one with "No pages yet" took a
  page through the real control and read "1 page" after; `/management/expenses` (read-only, with `view_expenses` added) then
  showed a Receipt link on that bill's line, which had none before.
- Login holding exactly `website_photos` (no bills activity): no link on `/bills`, `/bills/general` redirects to `/no-access`,
  and a direct POST to `/api/bills/general_bill/<id>` returns 403.

## Found, not fixed

Nothing on this page was left ungated. The page is read-and-add only: no delete or re-file control exists for a filed bill's
pages here, so none is drawn (deleting a filed bill's page stays out of scope).
