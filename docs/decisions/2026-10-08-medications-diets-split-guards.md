# 2026-10-08 — Medications and diets split: who opens each half, and what each half may write

PR 2 of 3 of `2026-10-07-management-settings-split.md` (AGREED). That file left one thing open:
*"two pages over the same table, both guarded by `stock.medications` / `stock.diets` today. The
guards must be decided with `admin-role`"*, proposing *"the existing activities at level `edit`,
Admin only, unless the Director's draft says otherwise."*

## The proposal contradicted itself

On dev, `role_permissions` holds `stock.medications` and `stock.diets` at Edit for **`management`
only**. So guarding the Settings halves with those cells would not be Admin only: every Management
login would open `/admin/medications` and `/admin/diets`, and the Settings section would appear in
its menu (`opensAnyIn("settings")`). Draft 2 does not settle it either: rows 40–41 ("prices,
labels, reorder levels"; "the diet list and the food forecast") are unticked for every drafted role,
and row 52 (`reference.types`, setup lists) names immunization, procedure and blood-test types and
frequencies, not medications or diets.

**Lutan chose Admin only** (in chat, 2026-10-08), over "Admin and Management".

## How it is built

- **Settings halves** (`/admin/medications`, `/admin/diets`) open with `requirePermission("reference.types")`
  and then `canEditItemSettings(perms, kind)` (`src/lib/permissions/item-settings.ts`): `reference.types`
  **and** the item's `stock.*` cell. The second cell is there because the tables' write policies
  (`0148`) ask it; a login granted `reference.types` alone would otherwise open the page and have
  every save refused by the database. Today only Admin holds both. The route registry lists them at
  `reference.types`, so the tile appears for exactly who opens the page.
- **Their actions** (`src/app/admin/{medications,diets}/actions.ts`) ask the same function.
- **Management halves keep `stock.*`**, and their actions were **narrowed**: `updateMedicationStockSettings` /
  `updateDietStockSettings` write cost, reorder lead and safety stock only. Create, rename, unit
  change, merge, delete and the standard diet are gone from them, because a server action is
  reachable whatever the page shows. Without this, Admin only would have been true of the screens
  and false of the system.
- **Unit conversions** (`saveConversion`, `deleteConversion`) are Settings, so Admin only. **The price
  per pack** (`setPricePerPurchaseUnit`) is a price, so it stays with the stock half and now asks the
  item's own cell; before, all three asked `stock.diets` whatever the kind.
- No migration. The database still lets Management write names and units (`stock.*` Edit); the app
  is narrower than the policy, which is the safe direction. Narrowing the policy too would be a
  schema change and is not needed for the decision to hold in the app.

## Found while building: the 2IC cannot open either stock half

The decision file calls the Management half "the 2IC's phone page". The 2IC holds neither
`stock.medications` nor `stock.diets` (dev, and `scripts/check-2ic-role.mjs` asserts "no price"), so
`/management/medications` refuses her today. Her stock work is Stocktake, Deliveries and Purchasing.
The halves are still built phone-first, for the Director on her phone by day. Whether the 2IC should
see prices is a grant for Lutan; nothing here grants it.

## Other choices

- **Cost to 4 places** on the stock halves only (`parseUnitCost`, `formatUnitCost` in `src/lib/format.ts`),
  because only the two `cost_per_unit` columns are `numeric(12, 4)` (`0161`); every other price keeps
  whole satang. `costPerBaseUnit` rounds to 4 too. Saving 4 places needs `0161` on the target database.
- **Cards, not a table, on the stock halves.** Eight columns do not fit 375 px; a card stacks. The
  Settings halves stay tables: the Director's, at her desk.
- **Notices untouched.** PR 3 removes `LargerScreenNotice` (and the tiles' Larger screen note) from
  `/management/medications` and `/management/diets`; the Settings halves keep theirs.
- **The cupboard-order screen** (batch 73, `sort_order` from `0161`) has a marked slot in the actions
  row at the top of each Settings half.
