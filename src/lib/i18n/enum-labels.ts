import type { Dictionary } from "./dictionaries/en";

/**
 * Displays a fixed, known-vocabulary value (resident status, species, sex, ...)
 * in the current language while leaving the underlying stored/DB value (always
 * English) untouched. Falls back to the raw value for anything outside the
 * known set, e.g. free-text placement types.
 */
export function enumLabel<T extends Record<string, string>>(
  map: T,
  value: string | null | undefined,
): string {
  if (!value) return value ?? "";
  return map[value as keyof T] ?? value;
}

export function statusLabel(t: Dictionary, value: string | null | undefined) {
  if (!value) return t.enums.status.Unknown;
  return enumLabel(t.enums.status, value);
}

export function speciesLabel(t: Dictionary, value: string | null | undefined) {
  return enumLabel(t.enums.species, value);
}

export function sexLabel(t: Dictionary, value: string | null | undefined) {
  return enumLabel(t.enums.sex, value);
}

/** residents.size — the three feeding bands (0051). */
export const RESIDENT_SIZES = ["Small", "Medium", "Large"] as const;
export type ResidentSize = (typeof RESIDENT_SIZES)[number];

export function sizeLabel(t: Dictionary, value: string | null | undefined) {
  return enumLabel(t.enums.size, value);
}

/** residents.good_with_* — a tri-state; null (not set) shows nothing (0060). */
export const COMPATIBILITY_VALUES = ["Yes", "No", "Unknown"] as const;
export type Compatibility = (typeof COMPATIBILITY_VALUES)[number];

export function compatibilityLabel(t: Dictionary, value: string | null | undefined) {
  return enumLabel(t.enums.compatibility, value);
}

/** residents.energy_level (0060). */
export const ENERGY_LEVELS = ["Low", "Medium", "High"] as const;
export type EnergyLevel = (typeof ENERGY_LEVELS)[number];

export function energyLevelLabel(t: Dictionary, value: string | null | undefined) {
  return enumLabel(t.enums.energyLevel, value);
}

/** diet_types.unit — what a diet is bought and served in (0051). */
export const DIET_UNITS = ["g", "ml", "can", "sachet", "cup", "portion"] as const;
export type DietUnit = (typeof DIET_UNITS)[number];

export function dietUnitLabel(t: Dictionary, value: string | null | undefined) {
  return enumLabel(t.enums.dietUnit, value);
}

export function appointmentStatusLabel(
  t: Dictionary,
  value: string | null | undefined,
) {
  return enumLabel(t.enums.appointmentStatus, value);
}

export function roleLabel(t: Dictionary, value: string | null | undefined) {
  if (!value) return "";
  return enumLabel(t.admin.security.roles, value);
}

export function placementTypeLabel(
  t: Dictionary,
  value: string | null | undefined,
) {
  return enumLabel(t.enums.placementType, value);
}

export function doseUnitLabel(t: Dictionary, value: string | null | undefined) {
  return enumLabel(t.enums.doseUnit, value);
}

/** The medication.dose_unit vocabulary, in the order the form offers it. */
export const DOSE_UNITS = [
  "tablet",
  "capsule",
  "ml",
  "mg",
  "g",
  "mcg",
  "IU",
  "drop",
  "sachet",
  "application",
  "dose",
] as const;

export type DoseUnit = (typeof DOSE_UNITS)[number];

/**
 * "2 tablet(s)", "500 ml" — a prescription's dose in its medication's unit.
 * Null when the row predates the dose column (0027).
 */
export function formatDose(
  t: Dictionary,
  quantity: number | string | null | undefined,
  unit: string | null | undefined,
): string | null {
  if (quantity == null || quantity === "") return null;
  const n = Number(quantity);
  if (!Number.isFinite(n)) return null;
  return `${n} ${doseUnitLabel(t, unit)}`.trim();
}

export function contactTypeLabel(t: Dictionary, value: string | null | undefined) {
  return enumLabel(t.enums.contactType, value);
}

export function projectCategoryLabel(t: Dictionary, value: string | null | undefined) {
  return enumLabel(t.enums.projectCategory, value);
}
