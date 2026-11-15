/**
 * The donor's 13-digit tax ID for e-Donation (0381, #99zuk). Pure and client-safe:
 * the form and the server action check with the same function, and the database
 * (thai_national_id_ok(), the 13-digit check) is still the enforcer.
 */

export const TAX_HOLDER_KINDS = ["person", "juristic"] as const;
export type TaxHolderKind = (typeof TAX_HOLDER_KINDS)[number];

/** What the form sends: the tick, the digits as typed and who holds the number. */
export type TaxIdFields = { wanted: boolean; taxId: string; holderKind: TaxHolderKind };

export const NO_TAX_ID: TaxIdFields = { wanted: false, taxId: "", holderKind: "person" };

/** Digits only: people type dashes and spaces (1-2345-67890-12-3). */
export function taxIdDigits(raw: string): string {
  return raw.replace(/[\s-]/g, "");
}

/** The Thai national ID check digit: weights 13..2 over the first twelve digits, mod 11. */
export function thaiIdCheckOk(digits: string): boolean {
  if (!/^[0-9]{13}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(digits[i]) * (13 - i);
  return (11 - (sum % 11)) % 10 === Number(digits[12]);
}

export type TaxIdProblem = "length" | "checksum";

/** null when fine. A company number has no public checksum, so only its length is checked. */
export function checkTaxId(raw: string, kind: TaxHolderKind): TaxIdProblem | null {
  const digits = taxIdDigits(raw);
  if (!/^[0-9]{13}$/.test(digits)) return "length";
  if (kind === "person" && !thaiIdCheckOk(digits)) return "checksum";
  return null;
}

/** Nine bullets then the last four, as the schema's specification says. */
export function maskTaxId(digits: string): string {
  return "•".repeat(9) + digits.slice(-4);
}
