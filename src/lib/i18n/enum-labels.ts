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
