import type { ManualRole } from "./types";

const MANUAL_ROLES: readonly string[] = ["admin", "management", "staff", "doctor", "volunteer"];

/** The signed-in role as the manual names it, or null for anything it doesn't (signed out, public viewer). */
export function asManualRole(role: string | null | undefined): ManualRole | null {
  return role && MANUAL_ROLES.includes(role) ? (role as ManualRole) : null;
}

/**
 * Whether something tagged with `roles` is for `role`. No tag means
 * everyone, so an untagged topic is never filtered out; no role (null) sees
 * everything. Kept apart from the page so anything else tagged by role —
 * release notes, next — can filter the same way.
 */
export function isForRole(roles: readonly ManualRole[] | undefined, role: ManualRole | null): boolean {
  return !role || !roles || roles.includes(role);
}
