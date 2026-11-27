/**
 * The display name app mail is sent under: the shelter's own name, marked as carried by CooperJaidee, on the one
 * verified From address (#mlsnd, option (c), Lutan 2026-11-27). The recipient sees their own shelter and no shelter
 * needs DNS work. The name is always passed in (from shelterNames()), never written here.
 * docs/decisions/2026-11-27-shelter-sender-name.md
 */
export const PRODUCT_NAME = "CooperJaidee";

export function shelterSenderName(shelterName: string, qualifier?: string): string {
  const name = [shelterName.trim(), qualifier?.trim()].filter(Boolean).join(" ");
  return `${name} (via ${PRODUCT_NAME})`;
}
