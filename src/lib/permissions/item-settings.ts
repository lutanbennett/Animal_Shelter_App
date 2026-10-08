/**
 * Who may change the option-list half of a medicine or a food: its name, unit, sizes, the standard
 * diet, merging duplicates and the unit conversions (Settings → Medications / Diets, split from
 * Management on 2026-10-08, docs/decisions/2026-10-07-management-settings-split.md).
 *
 * Admin only, asked as activities rather than a role (§8): `reference.types`, the setup-lists
 * cell, which only Admin holds, and the item's own stock cell, because the table's write policies
 * (0148) ask that one and a login with the first but not the second would open the page and have
 * every save refused. Lutan chose Admin only in chat on 2026-10-08 over reusing `stock.*` alone,
 * which the Management role holds and which would have put a Settings section in its menu.
 *
 * Pure and client-safe, like can().
 */

import { can, type Permissions } from "./can";

export type ItemSettingsKind = "medication" | "diet";

export function canEditItemSettings(perms: Permissions | null | undefined, kind: ItemSettingsKind): boolean {
  return can(perms, "reference.types") && can(perms, kind === "medication" ? "stock.medications" : "stock.diets");
}
