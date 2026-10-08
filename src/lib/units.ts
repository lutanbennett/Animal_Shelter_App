/**
 * Units of measure (0118): an item keeps its base unit (medication.dose_unit,
 * diet_types.unit) and may have other units it is bought, received or
 * counted in, each worth some number of base units.
 *
 * The rule this file serves: THE FACTOR IS STAMPED AT SAVE TIME. A delivery
 * or count stores `entered = [{quantity, unit, factor}]` beside its base-unit
 * total, so correcting a factor later never re-values a past row. Nothing
 * here reads a factor to interpret history; resolveEntered() is called when
 * a row is written, with the conversions as they are at that moment.
 *
 * One unit per line (no "3 bags and 4 kg"): `entered` is an array, so mixed
 * entry needs no schema change, but a phone sheet with two boxes per row is
 * a bigger decision than this feature.
 *
 * Pure: no database, no i18n. scripts/check-units.mjs runs it.
 */

export type ItemKind = "medication" | "diet";

export type UnitConversion = {
  id: string;
  unit: string;
  /** Base units in ONE of this unit. */
  basePer: number;
  isPurchase: boolean;
  isCount: boolean;
  note: string | null;
};

/** One line of stock_receipts.entered / stock_counts.entered. */
export type EnteredLine = { quantity: number; unit: string; factor: number };

/** The item_unit_conversions columns as PostgREST returns them. */
export type ConversionRow = {
  id: string;
  medication_id: string | null;
  diet_type_id: string | null;
  unit: string;
  base_units_per: number | string;
  is_purchase_unit: boolean;
  is_count_unit: boolean;
  note: string | null;
};

export const CONVERSION_COLUMNS =
  "id, medication_id, diet_type_id, unit, base_units_per, is_purchase_unit, is_count_unit, note";

export function conversionOf(row: ConversionRow): UnitConversion {
  return {
    id: row.id,
    unit: row.unit,
    basePer: Number(row.base_units_per),
    isPurchase: row.is_purchase_unit,
    isCount: row.is_count_unit,
    note: row.note,
  };
}

/** Rows grouped by item id, each item's conversions sorted by size. */
export function groupConversions(rows: ConversionRow[]): Record<string, UnitConversion[]> {
  const byItem: Record<string, UnitConversion[]> = {};
  for (const row of rows) {
    const id = row.medication_id ?? row.diet_type_id;
    if (!id) continue;
    (byItem[id] ??= []).push(conversionOf(row));
  }
  for (const list of Object.values(byItem)) list.sort((a, b) => a.basePer - b.basePer);
  return byItem;
}

/** Collapses runs of whitespace; the database compares case-insensitively on the trimmed name. */
export function normaliseUnitName(raw: string | null | undefined): string {
  return (raw ?? "").trim().replace(/\s+/g, " ");
}

const sameName = (a: string, b: string) => normaliseUnitName(a).toLowerCase() === normaliseUnitName(b).toLowerCase();

export type ConversionInput = { unit: string; factor: string; note: string };

export type ConversionParsed =
  | { ok: true; unit: string; basePer: number; note: string | null }
  | { ok: false; reason: "unitRequired" | "factorInvalid" | "sameAsBase" | "duplicate" };

/**
 * A conversion as typed. `baseNames` is every spelling of the item's base
 * unit worth refusing — the stored value ("cup") and its label in the
 * reader's language — because 1 base unit = 1 base unit is implicit and the
 * schema cannot check it across tables. `others` are the item's other
 * conversions, `selfId` the one being edited.
 */
export function parseConversion(
  input: ConversionInput,
  baseNames: string[],
  others: { id: string; unit: string }[],
  selfId: string | null,
): ConversionParsed {
  const unit = normaliseUnitName(input.unit);
  if (!unit) return { ok: false, reason: "unitRequired" };
  const factor = Number(input.factor.trim());
  if (!input.factor.trim() || !Number.isFinite(factor) || factor <= 0) return { ok: false, reason: "factorInvalid" };
  if (baseNames.some((name) => name && sameName(name, unit))) return { ok: false, reason: "sameAsBase" };
  if (others.some((o) => o.id !== selfId && sameName(o.unit, unit))) return { ok: false, reason: "duplicate" };
  const note = input.note.trim();
  return { ok: true, unit, basePer: factor, note: note || null };
}

/** The base-unit total of lines, rounded to the 6 places the CHECK (0118) tolerates. */
export function enteredTotal(lines: EnteredLine[]): number {
  return roundBase(lines.reduce((sum, l) => sum + l.quantity * l.factor, 0));
}

export function roundBase(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

export type Resolved =
  | { ok: true; base: number; entered: EnteredLine[] | null }
  | { ok: false; reason: "unknownUnit" | "quantityInvalid" };

/**
 * What to write for `quantity` typed in `unitName`, against the item's
 * conversions AS THEY ARE NOW. A blank unit, or the base unit's own name,
 * means the quantity is already in base units: `entered` stays null, which
 * is what every row written before this feature looks like.
 *
 * The factor in the returned line is the stamp. Callers store it and never
 * look it up again.
 */
export function resolveEntered(
  quantity: number,
  unitName: string | null | undefined,
  conversions: UnitConversion[],
  baseNames: string[] = [],
): Resolved {
  if (!Number.isFinite(quantity) || quantity < 0) return { ok: false, reason: "quantityInvalid" };
  const name = normaliseUnitName(unitName);
  if (!name || baseNames.some((b) => b && sameName(b, name))) {
    return { ok: true, base: quantity, entered: null };
  }
  const conversion = conversions.find((c) => sameName(c.unit, name));
  if (!conversion) return { ok: false, reason: "unknownUnit" };
  const line: EnteredLine = { quantity, unit: conversion.unit, factor: conversion.basePer };
  return { ok: true, base: enteredTotal([line]), entered: [line] };
}

/** The unit a form should open on: the purchase unit for deliveries, the count unit for counts. */
export function defaultUnit(conversions: UnitConversion[], use: "purchase" | "count"): UnitConversion | null {
  return conversions.find((c) => (use === "purchase" ? c.isPurchase : c.isCount)) ?? null;
}

/** A base-unit figure in one conversion's unit, to 2 places: 480 cups at 200 per bag → 2.4. */
export function inUnit(base: number, conversion: UnitConversion): number {
  return Math.round((base / conversion.basePer) * 100) / 100;
}

/** A base-unit figure in the purchase unit: 480 cups at 200 per bag → 2.4 bags. Null with no purchase unit. */
export function inPurchaseUnit(
  base: number | null,
  conversions: UnitConversion[],
): { quantity: number; unit: string } | null {
  const purchase = defaultUnit(conversions, "purchase");
  if (base == null || !purchase) return null;
  return { quantity: Math.round((base / purchase.basePer) * 100) / 100, unit: purchase.unit };
}

/**
 * Price per purchase unit → cost per base unit, to the column's 4 places
 * (both cost_per_unit columns are numeric(12, 4) since 0161, so 35 baht a kg
 * is kept as 0.035 a gram). Still refused when rounding would move the
 * figure by more than 1%: 1 baht for 100 kg is 0.00001 a gram, which four
 * places would save as 0.
 */
export function costPerBaseUnit(
  pricePerPurchaseUnit: number,
  basePer: number,
): { ok: true; value: number } | { ok: false; reason: "priceInvalid" | "tooCoarse" } {
  if (!Number.isFinite(pricePerPurchaseUnit) || pricePerPurchaseUnit < 0 || !(basePer > 0)) {
    return { ok: false, reason: "priceInvalid" };
  }
  const exact = pricePerPurchaseUnit / basePer;
  const value = Math.round(exact * 10_000) / 10_000;
  if (exact > 0 && Math.abs(value - exact) / exact > 0.01) return { ok: false, reason: "tooCoarse" };
  return { ok: true, value };
}

/** How a base-unit cost reads in the purchase unit, for display next to the cost cell. */
export function pricePerPurchaseUnit(costPerBase: number | null, conversions: UnitConversion[]) {
  const purchase = defaultUnit(conversions, "purchase");
  if (costPerBase == null || costPerBase <= 0 || !purchase) return null;
  return { price: Math.round(costPerBase * purchase.basePer * 100) / 100, unit: purchase.unit };
}
