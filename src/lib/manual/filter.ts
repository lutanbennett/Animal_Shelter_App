import type { SessionRole } from "@/lib/auth/app-access";
import { MANUAL_AUDIENCES, type ManualRole } from "./types";

/**
 * The audience the manual reads this login as: a built-in role is its own audience, a configured role (2IC,
 * Head of Maintenance, Head of Medical) reads as a volunteer, as it did while it borrowed that enum value, and
 * null — which sees everything — is a session that does not open the app (public viewer) or has no role.
 */
export function asManualRole(role: SessionRole | null | undefined): ManualRole | null {
  if (!role?.opensApp) return null;
  return (MANUAL_AUDIENCES as readonly string[]).includes(role.key) ? (role.key as ManualRole) : "volunteer";
}

/**
 * Whether something tagged with `roles` is for `role`. No tag means
 * everyone, so an untagged topic is never filtered out; no role (null) sees
 * everything. Kept apart from the page so anything else tagged by role —
 * release notes, next — can filter the same way.
 */
export function isForRole(roles: readonly string[] | undefined, role: ManualRole | null): boolean {
  return !role || !roles || roles.includes(role);
}
