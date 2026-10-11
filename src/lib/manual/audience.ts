import type { SessionRole } from "@/lib/auth/app-access";
import type { ManualRole } from "./types";

/** Who the manual is written for: its four audiences. A tag on a topic, not a gate on anything. */
const MANUAL_AUDIENCES: readonly ManualRole[] = ["admin", "management", "doctor", "volunteer"];

/**
 * The audience the manual reads this login as: a built-in role is its own audience, a configured role (2IC,
 * Head of Maintenance, Head of Medical) reads as a volunteer, as it did while it borrowed that enum value, and
 * null — which sees everything — is a session that does not open the app (public viewer) or has no role.
 */
export function asManualRole(role: SessionRole | null | undefined): ManualRole | null {
  if (!role?.opensApp) return null;
  return (MANUAL_AUDIENCES as readonly string[]).includes(role.key) ? (role.key as ManualRole) : "volunteer";
}
