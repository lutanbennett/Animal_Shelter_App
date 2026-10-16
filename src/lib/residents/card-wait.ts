/**
 * The "waiting for a card" marker (docs/decisions/2026-10-16-name-card-scanning.md).
 *
 * An iPhone has no Web NFC and a tap always opens the card's link in a new Safari tab, so Scan card
 * leaves this marker in a cookie and the link does the work: /r/<code> opened with the marker, by a
 * signed-in person allowed that job, goes on to the job with the resident chosen, and the marker is
 * cleared. It names ONE job from a closed list, expires after five minutes, and is cleared by the
 * first card that arrives, whoever it was and whatever came of it. It holds no secret and grants
 * nothing: the redirect re-checks the permission, so a forged marker only ever sends an allowed
 * person to a page they could already open.
 *
 * No imports, so Node can load it under type stripping.
 */
export const CARD_WAIT_COOKIE = "card_wait";
export const CARD_WAIT_MINUTES = 5;

/** The jobs a card can be waited for, and the page each opens (`?resident=<id>` is added). */
export const CARD_WAIT_JOBS = {
  photos: "/medical/photos",
  weight: "/medical/weight",
} as const;
export type CardWaitJob = keyof typeof CARD_WAIT_JOBS;

export function isCardWaitJob(v: unknown): v is CardWaitJob {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(CARD_WAIT_JOBS, v);
}

export function encodeCardWait(job: CardWaitJob, now: number): string {
  return `${job}.${now + CARD_WAIT_MINUTES * 60_000}`;
}

/** The job a marker waits for, or null when it is missing, malformed, names another job or has expired. */
export function parseCardWait(value: string | undefined, now: number): CardWaitJob | null {
  if (!value) return null;
  const [job, until, extra] = value.split(".");
  if (extra !== undefined || !isCardWaitJob(job) || !/^\d{10,15}$/.test(until ?? "")) return null;
  const expires = Number(until);
  // Also refuse one claiming to outlive its purpose, so a hand-edited cookie cannot wait for a day.
  if (expires <= now || expires > now + CARD_WAIT_MINUTES * 60_000) return null;
  return job;
}
