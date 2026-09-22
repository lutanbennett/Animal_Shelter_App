/**
 * The URLs printed into enclosure QR codes and resident RFID cards.
 *
 * They are short redirect routes rather than the hub pages themselves
 * (docs/decisions.md, 2026-09-22): a tag is programmed once and lives on
 * the kennel for years, so the address it carries must outlast any later
 * move of the pages behind it, and the fewer characters a QR code holds
 * the coarser — and more scannable from a distance — its modules are.
 * Residents use their R-code (30 characters end to end) rather than the
 * UUID; enclosures have no such code, so they carry their id.
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
