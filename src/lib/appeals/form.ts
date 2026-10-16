import { checkHttpsUrl } from "../links/validate";
import { parseBaht } from "../donations/donations";

/**
 * What the staff form sends to make or change an appeal, and the one check
 * both the form and the server action run. Pure and client-safe, so the form
 * can show a problem as it happens and the action applies the same rule
 * before the database's own checks (0210) get a say.
 */

export const APPEAL_STYLES = ["bar", "thermometer", "gauge"] as const;
export type AppealStyle = (typeof APPEAL_STYLES)[number];

/** The same ceiling appeal_links_ok() enforces in the database. */
export const MAX_APPEAL_LINKS = 10;

/** Strings, as the inputs hold them. */
export type AppealFields = {
  residentId: string;
  title: string;
  whatIsWrong: string;
  treatmentNeeded: string;
  costCovers: string;
  /** Baht as typed: "15,000". */
  target: string;
  /** yyyy-mm-dd or blank. */
  deadline: string;
  displayStyle: AppealStyle;
  /** One link per line. */
  socialLinks: string;
};

export type AppealProblem = "resident" | "title" | "target" | "deadline" | "style" | "link" | "tooManyLinks";

export type CleanAppeal = {
  resident_id: string;
  title: string;
  what_is_wrong: string | null;
  treatment_needed: string | null;
  cost_covers: string | null;
  target_amount: number;
  deadline: string | null;
  display_style: AppealStyle;
  social_links: string[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const blankToNull = (v: string) => {
  const s = v.trim();
  return s ? s : null;
};

export function checkAppeal(
  f: AppealFields,
): { ok: true; appeal: CleanAppeal } | { ok: false; problem: AppealProblem; line?: number } {
  if (!UUID.test(f.residentId.trim())) return { ok: false, problem: "resident" };
  const title = f.title.trim().replace(/\s+/g, " ");
  if (!title) return { ok: false, problem: "title" };
  const target = parseBaht(f.target);
  if (target == null || target >= 1e9) return { ok: false, problem: "target" };
  const deadline = f.deadline.trim();
  if (deadline && (!ISO_DATE.test(deadline) || Number.isNaN(Date.parse(`${deadline}T00:00:00Z`)))) {
    return { ok: false, problem: "deadline" };
  }
  if (!APPEAL_STYLES.includes(f.displayStyle)) return { ok: false, problem: "style" };

  const lines = f.socialLinks.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const links: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const c = checkHttpsUrl(lines[i]);
    if (!c.ok || !c.url) return { ok: false, problem: "link", line: i };
    if (!links.includes(c.url)) links.push(c.url);
  }
  if (links.length > MAX_APPEAL_LINKS) return { ok: false, problem: "tooManyLinks" };

  return {
    ok: true,
    appeal: {
      resident_id: f.residentId.trim(),
      title,
      what_is_wrong: blankToNull(f.whatIsWrong),
      treatment_needed: blankToNull(f.treatmentNeeded),
      cost_covers: blankToNull(f.costCovers),
      target_amount: target,
      deadline: deadline || null,
      display_style: f.displayStyle,
      social_links: links,
    },
  };
}

/**
 * What publishing needs beyond a valid form: the page must say what is wrong
 * or what the treatment is, otherwise it asks strangers for money with no
 * reason given. Returns the missing piece, or null.
 */
export function publishBlocker(a: { what_is_wrong: string | null; treatment_needed: string | null }): "story" | null {
  const has = (s: string | null) => !!s && s.trim() !== "";
  return has(a.what_is_wrong) || has(a.treatment_needed) ? null : "story";
}
