/**
 * Who approves photos, asked the way the database asks it (0221, 0222) so the screen and set_role_cards() cannot disagree.
 * An approver is a role that is not Admin (a fixed role holding no cells) and holds photos.approve at any level, through a card
 * (Approve photos). The test is the ACTIVITY, never a card name or a role key. (0222 also excluded retired roles; role
 * archiving was removed in 0272, so there are none to exclude.)
 *
 * Pure and client-safe.
 */
import { CARDS, type CardKey } from "./cards";

export const APPROVE_ACTIVITY = "photos.approve";

export type RoleCell = { roleKey: string; roleName: string; activity: string; level: number };

/** The names of the roles that approve photos right now, in the order given. */
export function approverNames(cells: readonly RoleCell[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of cells) {
    if (c.activity !== APPROVE_ACTIVITY || c.level < 1 || c.roleKey === "admin" || seen.has(c.roleKey)) continue;
    seen.add(c.roleKey);
    out.push(c.roleName);
  }
  return out;
}

/** Does giving this card need some role to approve photos first (requiresCardSomewhere names approve_photos)? */
export function needsApprover(card: CardKey): boolean {
  return !!CARDS[card].requiresCardSomewhere?.includes("approve_photos");
}
