/**
 * The URLs printed into enclosure QR codes and resident RFID cards.
 *
 * They are short redirect routes rather than the hub pages themselves
 * (docs/decisions.md, 2026-09-22): a tag is programmed once and lives on
 * the kennel for years, so the address it carries must outlast any later
 * move of the pages behind it, and the fewer characters a QR code holds
 * the coarser — and more scannable from a distance — its modules are.
 * Residents use their R-code (30 characters end to end) rather than the
 * UUID; enclosures have no such code, so they carry their id. A resident
 * link is also the visitor's page — see src/app/r/[code]/page.tsx.
 */
export function residentTagPath(residentCode: string): string {
  return `/r/${encodeURIComponent(residentCode)}`;
}

export function enclosureTagPath(enclosureId: string): string {
  return `/e/${enclosureId}`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID.test(value);
}

const R_CODE = /\bR-?\s?(\d{1,6})\b/i;
const CARD_PATH = /\/r\/([^/?#\s]+)/i;

/**
 * The resident a typed or pasted thing names, as an R-code ("R-0042") or a raw UUID, or null when
 * it names none. Accepts the code as printed ("R-0042", "r0042"), a whole card link
 * ("https://…/r/R-0042?x=1") or an older link carrying a UUID. Used by the picker's search box and
 * by Scan card. Anything else returns null, so a name search is left alone; it never guesses.
 */
export function residentCodeFrom(text: string): string | null {
  const s = text.trim();
  if (!s) return null;
  const path = CARD_PATH.exec(s);
  let candidate = s;
  if (path) {
    try {
      candidate = decodeURIComponent(path[1]);
    } catch {
      return null;
    }
  }
  if (isUuid(candidate)) return candidate.toLowerCase();
  const whole = /^R-?\s?(\d{1,6})$/i.exec(candidate);
  if (whole) return `R-${whole[1].padStart(4, "0")}`;
  // A code inside a longer pasted line only counts when it came with a card link.
  if (path) return null;
  return R_CODE.test(candidate) && candidate.length <= 12 ? `R-${R_CODE.exec(candidate)![1].padStart(4, "0")}` : null;
}
