/**
 * Where a tap on a resident's name card (/r/<code>) lands, as a pure answer so the page and
 * scripts/check-card-taps.mjs ask the same question (docs/decisions/2026-10-07-name-card-taps.md).
 *
 *   public       the public card: signed out, or signed in without app access
 *   public-plus  the public card plus where the resident lives and the person's own jobs: a login
 *                that may not open the full record (the 2IC, the Heads, a volunteer, a doctor outside
 *                their clinic). Never less than a stranger sees
 *   full         the resident's page, with the record the role may read
 *
 * No imports, so Node can load it under type stripping.
 */
export type CardLanding = "public" | "public-plus" | "full";

export type CardTapInput = {
  /** Signed in and the role opens the app (hasAppAccess). */
  appAccess: boolean;
  /** can(perms, "resident.record", "read"). */
  readsRecord: boolean;
  /** readsWhoAndWhereOnly(): the volunteer floor, which the 2IC and the Heads borrow (0134). */
  whoAndWhereOnly: boolean;
  /** The `residents` row came back for this login (a doctor sees only their clinics', 0108). */
  rowVisible: boolean;
};

export function cardLanding(i: CardTapInput): CardLanding {
  if (!i.appAccess) return "public";
  return i.readsRecord && !i.whoAndWhereOnly && i.rowVisible ? "full" : "public-plus";
}
