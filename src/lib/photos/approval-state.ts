/**
 * Which of the three answers a resident photo is in (0318). `approval` is generated from approved_at and
 * private_only_at: 'public_ok', 'private_only', or NULL when nobody has reviewed it.
 *
 * Widen, never narrow: approved_at is what every public view admits, so a timestamp always reads as public;
 * a value this code does not know is described as "other" (not on the website) rather than called waiting.
 */
export type PhotoApprovalState = "public" | "private" | "waiting" | "other";

export function photoApprovalState(p: { approved_at?: string | null; approval?: string | null }): PhotoApprovalState {
  if (p.approved_at != null) return "public";
  if (p.approval === "private_only") return "private";
  if (p.approval == null) return "waiting";
  if (p.approval === "public_ok") return "public";
  return "other";
}
