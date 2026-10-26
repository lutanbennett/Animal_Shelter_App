import { can, type Permissions } from "./can";

export const WHO_DOES_WHAT_PATH = "/admin/who-does-what";

/**
 * Who may open Settings → Who does what: Admin, or a role holding the Who does what card (activity roles.view, 0262). Management
 * holds it by the migration, not by its name. Read only: editing stays Admin at 2-step.
 * The landing tiles and the pages all ask this one function, so a tile never offers a page that refuses.
 */
export function opensWhoDoesWhat(perms: Permissions | null | undefined): boolean {
  return can(perms, "roles.view", "read");
}
