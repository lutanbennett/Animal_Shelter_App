import type { ManualRole } from "./types";

/**
 * Whether something tagged with `roles` is for `role`. No tag means
 * everyone, so an untagged topic is never filtered out; no role (null) sees
 * everything. Kept apart from the page so anything else tagged by role —
 * release notes, next — can filter the same way.
 */
export function isForRole(roles: readonly string[] | undefined, role: ManualRole | null): boolean {
  return !role || !roles || roles.includes(role);
}
