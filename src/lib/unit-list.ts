/**
 * The units of measure (the `units` table, 0252): what an ingredient or a medicine is counted in. Pure and
 * client-safe. `diet_types.unit` and `medication.dose_unit` store a unit's NAME as text, so everything here
 * matches on the name, case-insensitively, as the write-time trigger does.
 */

export type UnitRow = {
  id: string;
  name: string;
  nameTh: string | null;
  forIngredients: boolean;
  forMedicines: boolean;
  sortOrder: number;
  archived: boolean;
};

export type UnitList = "ingredients" | "medicines";

export const UNIT_COLUMNS = "id, name, name_th, for_ingredients, for_medicines, sort_order, archived_at";

export type UnitDbRow = {
  id: string;
  name: string;
  name_th: string | null;
  for_ingredients: boolean;
  for_medicines: boolean;
  sort_order: number;
  archived_at: string | null;
};

export function toUnitRow(r: UnitDbRow): UnitRow {
  return {
    id: r.id,
    name: r.name,
    nameTh: r.name_th,
    forIngredients: r.for_ingredients,
    forMedicines: r.for_medicines,
    sortOrder: r.sort_order,
    archived: r.archived_at != null,
  };
}

export const unitKey = (name: string) => name.trim().toLowerCase();

/** The units a form offers for a list: tagged for it and not archived. */
export function offeredUnits(units: UnitRow[], list: UnitList): UnitRow[] {
  return units.filter((u) => !u.archived && (list === "ingredients" ? u.forIngredients : u.forMedicines));
}

/** The one unit that a save may use for a list, or null: unknown, archived or tagged for the other list. */
export function usableUnit(units: UnitRow[], list: UnitList, name: string | null | undefined): UnitRow | null {
  if (!name) return null;
  const key = unitKey(name);
  return offeredUnits(units, list).find((u) => unitKey(u.name) === key) ?? null;
}

/** Lower-cased name → what to print: the Thai name for a Thai reader when there is one, else the English. */
export function unitNameMap(units: UnitRow[], locale: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const u of units) map[unitKey(u.name)] = locale === "th" && u.nameTh?.trim() ? u.nameTh.trim() : u.name;
  return map;
}

/**
 * An amount with its unit. "each" counts things rather than measuring them, so "2.25 each" reads as just
 * "2.25" (Egg 2.25) — the ingredient's own name already says what is counted.
 */
export function withUnit(amount: string | number, unitLabel: string): string {
  return unitKey(unitLabel) === "each" ? `${amount}` : `${amount} ${unitLabel}`.trim();
}
