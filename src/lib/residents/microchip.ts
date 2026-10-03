/**
 * Microchip numbers (0113): exactly 15 digits (ISO 11784/11785), stored
 * digits-only, unique where set, staff-only. The column refuses anything
 * that was not stripped, so every writer goes through here.
 */
export const MICROCHIP_LENGTH = 15;

/** Spaces, dashes and every other non-digit removed — what a person types or a reader sends. */
export function stripToDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isValidMicrochip(digits: string): boolean {
  return new RegExp(`^[0-9]{${MICROCHIP_LENGTH}}$`).test(digits);
}

/**
 * The chip a search-box entry stands for, or null when it is a name or an ID.
 * Only digits, spaces and dashes count as a chip — a reader types the bare
 * 15 digits, a person may group them — so "R-0394" is never read as one. The
 * pattern once lacked its backslashes (`[ds-]`), matched no digit, and every
 * scan fell through to the name search (dry run 2026-10-03, F-02).
 */
export function chipFromSearch(q: string): string | null {
  if (!/^[\d\s-]+$/.test(q)) return null;
  const digits = stripToDigits(q);
  return isValidMicrochip(digits) ? digits : null;
}

export type MicrochipFields = {
  microchip_number: string | null;
  microchip_implanted_on: string | null;
};

/**
 * The chip columns as the intake and edit actions write them, read from the
 * fields MicrochipFields renders. Blank means not chipped or unknown (null).
 */
export function readMicrochip(
  formData: FormData,
): MicrochipFields | { invalid: true } {
  const raw = formData.get("microchipNumber");
  const digits = typeof raw === "string" ? stripToDigits(raw) : "";
  if (digits && !isValidMicrochip(digits)) return { invalid: true };
  const on = formData.get("microchipImplantedOn");
  return {
    microchip_number: digits || null,
    microchip_implanted_on:
      typeof on === "string" && on.trim() ? on.trim() : null,
  };
}

/**
 * What set_resident_microchip() (0116) refused, from the SQLSTATE PostgREST
 * reports. Each is a different thing for the person to do, so each gets its
 * own words rather than the raw database message.
 */
export type MicrochipRefusal =
  | "deceased" // restrict_violation: the 0026 lock
  | "notInScope" // insufficient_privilege: a vet outside their clinic, or a role that may not
  | "invalid" // check_violation: residents_microchip_number_iso
  | "duplicate" // unique_violation: residents_microchip_number_key
  | "notFound"; // no_data_found: the resident is gone

const REFUSAL_BY_SQLSTATE: Record<string, MicrochipRefusal> = {
  "23001": "deceased",
  "42501": "notInScope",
  "23514": "invalid",
  "23505": "duplicate",
  P0002: "notFound",
};

export function microchipRefusal(error: { code?: string }): MicrochipRefusal | null {
  return (error.code && REFUSAL_BY_SQLSTATE[error.code]) || null;
}

/** Postgres unique_violation, as PostgREST reports it. */
export function isDuplicateChipError(error: { code?: string; message?: string }): boolean {
  return error.code === "23505" && /microchip/i.test(error.message ?? "");
}

/**
 * The roles set_resident_microchip() (0116) lets through: admin, staff, and
 * a vet whose clinic holds the resident. Management may not. The function
 * checks scope itself; this only decides who is offered the form.
 */
export const MICROCHIP_WRITE_ROLES: ReadonlySet<string> = new Set(["admin", "staff", "vet"]);
