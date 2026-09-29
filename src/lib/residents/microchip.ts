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

/** Postgres unique_violation, as PostgREST reports it. */
export function isDuplicateChipError(error: { code?: string; message?: string }): boolean {
  return error.code === "23505" && /microchip/i.test(error.message ?? "");
}
