# 2026-10-08 — The cupboard order is set on the stock half, on its own screen

`claude/stock-pages-finish` (batch 73) built the screens for `0161`'s `medication.sort_order` and
`diet_types.sort_order`, and finished the menu split's device-notice sweep. Three choices that are not
obvious from the code:

## 1. Management → stock, not Settings

The menu-split rule (`2026-10-07-management-settings-split.md`) says *"if editing it changes what a
dropdown elsewhere offers, it is Settings"*, and the cupboard order does change the order of another
list — the stocktake sheet. It still goes on the Management half (`/management/medications`,
`/management/diets`), because:

- The order follows the physical cupboard, which moves as stock comes and goes — dynamic, like the price
  (which the split put on Management for the same reason).
- It is done by whoever walks the shelves, on a phone. The Settings halves are Admin-only and keep their
  larger-screen notice; putting the order there would have made it a desk job for the Director at night.
- The backlog item and `0161`'s column comments already said "set on Management → Medications / Diets".
- The stock cell's update policy (`medication_update_perm` / `diet_types_update_perm`, `0148`) already lets
  `stock.medications` / `stock.diets` write the row, so no grant changes.

`#451` had left a marker for a link on the Settings page's actions row. It was not used: the Settings page
already links to the stock half, and one way in is enough.

**Who that is today:** Admin and Management. The 2IC holds neither `stock.medications` nor `stock.diets`
(found by `medications-diets-split`), so she cannot open the stock halves at all. Whether she should is a
grant decision for Lutan, not made here.

## 2. A view of the same page (`?view=order`), not a new route

The order screen is `/management/medications?view=order` and `/management/diets?view=order`: one job per
screen for a phone, with no forecast loaded, and it shares the page's guard. A new route would have needed a
registry entry in `src/lib/permissions/routes.ts`, which the Management landing reads, so it would have
grown a tile of its own — a second door into the same list for no gain.

## 3. Buttons, renumbered 1…n

Move up / Move down (`RowActionButton`, 44 px on phones), not drag: drag on touch is fiddly and the column
is a plain integer. Each press renumbers the whole list 1…n in its current order before swapping
(`src/lib/management/cupboard-order-server.ts`), as `moveFriend` does, so two rows that share a number —
`0161`'s insert trigger takes `max + 1`, so two adds at once can tie — still move by exactly one place. Only
the rows whose number changed are written. Readers sort by `sort_order` (nulls last), then name.

## The device-notice sweep (PR 3 of the split)

`LargerScreenNotice` came off the six Management pages the split names — medication stock, diet stock,
contacts, vets, a clinic's doctors, stock usage — and the **Larger screen** tile note came off those and
Purchasing (whose notice went in `#334`, but whose tile still carried the note). Each was earned, not just
deleted: `scripts/check-phone-width.mjs` now lists every one of them, plus both order views, and passes for
admin and management in English and Thai (no sideways scroll, every shared action ≥ 44 px, no input under
16 px). `/admin/medications` and `/admin/diets` keep theirs: Admin only.
