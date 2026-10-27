# Buttons follow cards, fourth slice: the operations pages (2026-10-28)

Same rule and pattern as the earlier slices; server and database checks untouched; no role named; Admin unchanged. No migration.

## Fixed

On `/maintenance/[id]` the photo controls were drawn for `maintenance.jobs` (Remove) or for everyone (the Add-photo buttons). The upload route (`api/maintenance/[id]/attachments`) and the attachments delete policy (`has_permission('maintenance.photos')`, 0264/0269) both ask `maintenance.photos`. Add and Remove now ride on `canPhotos = can(perms, "maintenance.photos")` (prop defaults to false).

## Every action control on the five areas, and what it asks

- `/stocktake`: page `stock.count`, save action `stock.count`; Deliveries link `stock.delivery` (gated). Fine.
- `/deliveries`: page `stock.delivery`; record and delete actions `stock.delivery`; bill photo add `stock.delivery` (`bills/actions.ts`); stock-usage link gated `stock.usage`. All behind the page guard. Fine.
- `/maintenance`: New job `maintenance.jobs` (gated); drag/move `maintenance.progress` (gated). `/new`, `/[id]/edit`: need `maintenance.jobs`. Fine.
- `/maintenance/[id]`: Edit details `maintenance.jobs`, status buttons `maintenance.progress`, Delete `maintenance.delete`, bills `maintenance.bills` (all gated); photos: fixed above.
- `/enclosures`, `/enclosures/[id]`, map: Add job `maintenance.jobs`, Manage in admin `facility.enclosures` (admin page asks the same); both gated. The map panel passes `canWriteMaintenance={false}`. Fine.
- `/management/purchasing`: Stocktake link `stock.count` (gated); Print and CSV are local to data the page already reads.

## Found, not fixed

- `MaintenanceJobView` links to `/enclosures/[id]` for any reader of a job; that page asks `facility.enclosures` read. It is navigation, not an action, but a login without it lands on a refusal.
- `deleteMaintenanceAttachment` has no `can()` of its own; it relies on RLS. Left as is.

## Not done

Driven in both directions: **no.** pending: a login with `maintenance.jobs` but not `maintenance.photos` (hidden side) and one holding both. Needs a card edit on the shared dev database.

## Guard

`src/app/maintenance/photo-controls-follow-cards.test.mjs`. Narrow: asserts the gate is present and matches the route; cannot find a new ungated control.
