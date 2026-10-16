/**
 * The honest arithmetic of an appeal, with no framework in it so it can be
 * tested on its own (state.test.mjs). Every number a visitor sees on an
 * appeal comes through here.
 *
 *  - The percentage is ROUNDED DOWN: 99.6% reads 99%, never 100%. Only a
 *    raised figure that has actually reached the target reads 100% or more.
 *  - The drawn fill is capped at the full picture; the words say the truth
 *    ("฿2,500 over the goal"), so a 115% appeal is never a broken drawing.
 *  - "Goal reached" is a fact about the money, not only about the status
 *    staff set, so an appeal left live after it is funded stops reading
 *    "help needed" by itself.
 */

export type AppealStatus = "draft" | "live" | "funded" | "closed";

export type AppealProgress = {
  raised: number;
  target: number;
  status: Exclude<AppealStatus, "draft">;
  deadline: string | null;
};

/** Whole percent of the target raised, rounded down. 0 when nothing is raised. */
export function percentRaised(raised: number, target: number): number {
  if (!(target > 0) || !(raised > 0)) return 0;
  // In whole satang, so 17,250 of 15,000 is exactly 115 and not 114.99999999999999.
  return Math.floor((Math.round(raised * 100) * 100) / Math.round(target * 100));
}

/** 0..1, the part of the picture to fill. */
export function fillFraction(raised: number, target: number): number {
  if (!(target > 0) || !(raised > 0)) return 0;
  return Math.min(1, raised / target);
}

/** Baht raised beyond the target, 0 when not over. */
export function overBy(raised: number, target: number): number {
  return raised > target ? Math.round((raised - target) * 100) / 100 : 0;
}

export type AppealPhase =
  /** Taking gifts, goal not yet reached. */
  | "open"
  /** Raised has reached the target but staff have not marked it funded or closed. */
  | "goal-reached"
  /** Staff marked it funded: no longer asking. */
  | "funded"
  /** Over: shows the outcome, takes nothing. */
  | "closed";

export function appealPhase(p: AppealProgress): AppealPhase {
  if (p.status === "closed") return "closed";
  if (p.status === "funded") return "funded";
  return p.raised >= p.target ? "goal-reached" : "open";
}

/**
 * Whether to show the ways to give at all: not once closed or marked funded.
 * (A live appeal that has reached its goal still shows them, under a notice
 * that says where extra gifts go, because a gift may already be in transit.)
 */
export function showsWaysToGive(p: AppealProgress): boolean {
  const phase = appealPhase(p);
  return phase === "open" || phase === "goal-reached";
}

/**
 * Whole days from `today` to `deadline` (both YYYY-MM-DD): 0 on the day,
 * negative once passed, null with no deadline.
 */
export function daysLeft(deadline: string | null, today: string): number | null {
  if (!deadline) return null;
  const a = Date.parse(`${deadline}T00:00:00Z`);
  const b = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((a - b) / 86_400_000);
}

export type SocialKind = "facebook" | "instagram" | "line" | "other";

/** Which network a stored https link is, by host; null for anything unusable. */
export function socialKind(url: string): { kind: SocialKind; href: string; host: string } | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase().replace(/^(www|m|web|mobile)\./, "");
  const is = (...hosts: string[]) => hosts.some((h) => host === h || host.endsWith(`.${h}`));
  const kind: SocialKind = is("facebook.com", "fb.com", "fb.watch", "fb.me")
    ? "facebook"
    : is("instagram.com", "instagr.am")
      ? "instagram"
      : is("line.me", "lin.ee")
        ? "line"
        : "other";
  return { kind, href: u.toString(), host };
}
