import type { Permissions } from "./can";

export const WHO_DOES_WHAT_PATH = "/admin/who-does-what";

/**
 * Who may open Settings → Who does what: Admin and Management (the backlog item, 2026-10-10). There is
 * no activity for "see the roles grid" and this stream may not add one (it would need a migration), so
 * this asks the role key, the one role name the page carries. Kept to this one function so the stream
 * that gives it an activity (who-does-what-edit, or perm-role-lists) changes one line.
 * The landing tiles and the page all ask it, so a tile never offers a page that refuses.
 */
export function opensWhoDoesWhat(perms: Permissions | null | undefined): boolean {
  return !!perms && (perms.isAdmin || perms.roles.includes("management"));
}
