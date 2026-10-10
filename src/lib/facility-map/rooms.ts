/**
 * The rooms on the map that are not enclosures (`map_rooms`): the Medical room, the Kitchen, Storage, and
 * any room Settings → Facility map adds. Since 0175 a room has a stored name in both languages (a label,
 * so a paired `name_th`) and a description (prose, so its Thai is in `translations`); the fixed list of
 * three and its dictionary words are gone (docs/decisions/2026-10-10-map-rooms-editor.md).
 */

/** Long enough for "Quarantine room (cats)"; a name is read on a phone in one line. */
export const ROOM_NAME_MAX = 60;
/** A few lines: what the room is for, not a manual. */
export const ROOM_DESCRIPTION_MAX = 1000;

/** A typed name, trimmed, with inner runs of space folded; null when nothing is left. */
export function cleanRoomName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.replace(/\s+/g, " ").trim();
  return name ? name : null;
}

/**
 * A typed description: plain text with line breaks. Windows line ends become `\n`, each line loses its
 * trailing space, and more than one blank line in a row becomes one. Null when nothing is left.
 */
export function cleanRoomDescription(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text ? text : null;
}
