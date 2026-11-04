import { checkHttpsUrl } from "../links/validate";

/**
 * What the staff form sends to make or change a fundraising event, and the one check both the form and the server
 * action run, before the database's own checks (0312) get a say. Pure and client-safe. An event stores no money figure:
 * the gifts stay on the campaign it links to.
 */

export const EVENT_STATUSES = ["planned", "held", "cancelled"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

/** The same ceiling appeal_links_ok() enforces in the database (0312 reuses it for social_links). */
export const MAX_EVENT_LINKS = 10;

/** Strings, as the inputs hold them. */
export type EventFields = {
  title: string;
  summary: string;
  description: string;
  /** yyyy-mm-dd. */
  eventDate: string;
  /** yyyy-mm-dd or blank for a single day. */
  endDate: string;
  location: string;
  status: EventStatus;
  /** A campaign id, or blank. A link, never ownership. */
  appealId: string;
  /** A project folder id, or blank. */
  projectFolderId: string;
  /** One link per line. */
  socialLinks: string;
};

export type EventProblem = "title" | "date" | "endDate" | "endBeforeStart" | "status" | "link" | "tooManyLinks" | "appeal" | "project";

export type CleanEvent = {
  title: string;
  summary: string | null;
  description: string | null;
  event_date: string;
  end_date: string | null;
  location: string | null;
  status: EventStatus;
  appeal_id: string | null;
  project_folder_id: string | null;
  social_links: string[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (v: string) => ISO_DATE.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

const blankToNull = (v: string) => {
  const s = v.trim();
  return s ? s : null;
};

export function checkEvent(
  f: EventFields,
): { ok: true; event: CleanEvent } | { ok: false; problem: EventProblem; line?: number } {
  const title = f.title.trim().replace(/\s+/g, " ");
  if (!title) return { ok: false, problem: "title" };
  const eventDate = f.eventDate.trim();
  if (!validDate(eventDate)) return { ok: false, problem: "date" };
  const endDate = f.endDate.trim();
  if (endDate && !validDate(endDate)) return { ok: false, problem: "endDate" };
  // Same rule as fundraising_events_dates: said in words here instead of raised by the database.
  if (endDate && endDate < eventDate) return { ok: false, problem: "endBeforeStart" };
  if (!EVENT_STATUSES.includes(f.status)) return { ok: false, problem: "status" };
  const appealId = f.appealId.trim();
  if (appealId && !UUID.test(appealId)) return { ok: false, problem: "appeal" };
  const projectFolderId = f.projectFolderId.trim();
  if (projectFolderId && !UUID.test(projectFolderId)) return { ok: false, problem: "project" };

  const lines = f.socialLinks.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const links: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const c = checkHttpsUrl(lines[i]);
    if (!c.ok || !c.url) return { ok: false, problem: "link", line: i };
    if (!links.includes(c.url)) links.push(c.url);
  }
  if (links.length > MAX_EVENT_LINKS) return { ok: false, problem: "tooManyLinks" };

  return {
    ok: true,
    event: {
      title,
      summary: blankToNull(f.summary),
      description: blankToNull(f.description),
      event_date: eventDate,
      end_date: endDate || null,
      location: blankToNull(f.location),
      status: f.status,
      appeal_id: appealId || null,
      project_folder_id: projectFolderId || null,
      social_links: links,
    },
  };
}
