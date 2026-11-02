import { can, type Permissions } from "@/lib/permissions/can";
import type { ActivityKey, LevelKey } from "@/lib/permissions/catalogue";

/**
 * May this login tag residents in a note it is saving? The link table's own policies ask the same two things: it may
 * save that note (any of the note's save activities, at edit) AND it holds resident.record at read, so a link never
 * shows a resident the login could not already open. Pass the activities the note's own save action asks, read from
 * that action, never guessed. Admin passes through can() as everywhere.
 */
export function canTagNote(perms: Permissions | null | undefined, saveActivities: readonly ActivityKey[]): boolean {
  if (!can(perms, "resident.record", "read")) return false;
  return saveActivities.some((activity) => can(perms, activity as LevelKey, "edit"));
}

export type { ActivityKey };
