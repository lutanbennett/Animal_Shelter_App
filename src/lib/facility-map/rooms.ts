/**
 * The rooms on the map that are not enclosures (0157 `map_rooms`). A fixed list, as in the table's check
 * constraint: the Director asked for these three and no room editor. The label is not stored, it is in
 * both dictionaries (`t.enclosures.map.roomKinds`), so staff read it in Thai.
 */
export const ROOM_KINDS = ["medical", "kitchen", "storage"] as const;
export type RoomKind = (typeof ROOM_KINDS)[number];

export function isRoomKind(value: unknown): value is RoomKind {
  return typeof value === "string" && (ROOM_KINDS as readonly string[]).includes(value);
}
