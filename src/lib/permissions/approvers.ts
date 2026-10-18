/**
 * Who approves photos, asked the way the database asks it (0221, 0222) so the screen and set_role_cards() cannot disagree.
 * An approver is a role that is not Admin (a fixed role holding no cells) and not retired (roles.archived_at set) and holds
 * photos.resident_publish at any level, through a card (Approve photos, Residents) or an extra. The test is the ACTIVITY
 * and the retired FLAG, never a card name and never the key 'staff': the next retired role drops out by itself.
 * Lutan, 2026-10-18: "exclude retired roles as this will future proof the system going forward."
 *
 * Pure and client-safe.
 */
import { CARDS, type CardKey } from "./cards";

export const APPROVE_ACTIVITY = "photos.resident_publish";

export type RoleCell = { roleKey: string; roleName: string; archived: boolean; activity: string; level: number };

/** The names of the roles that approve photos right now, in the order given. */
export function approverNames(cells: readonly RoleCell[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of cells) {
    if (c.activity !== APPROVE_ACTIVITY || c.level < 1 || c.archived || c.roleKey === "admin" || seen.has(c.roleKey)) continue;
    seen.add(c.roleKey);
    out.push(c.roleName);
  }
  return out;
}

/** Does giving this card need some role to approve photos first (requiresCardSomewhere names approve_photos)? */
export function needsApprover(card: CardKey): boolean {
  return !!CARDS[card].requiresCardSomewhere?.includes("approve_photos");
}
