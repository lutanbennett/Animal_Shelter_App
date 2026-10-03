/**
 * Date handling shared by every placement action that takes a date-only
 * input (move, send to hospital, …).
 */

import { todayIso } from "@/lib/format";

/**
 * A date-only input has no time of day. Tie a same-day placement to the
 * current instant so it sorts after anything recorded earlier today (an
 * intake this morning, an earlier move); for back-dated placements use
 * midday so the row still lands on that calendar day in any timezone the
 * shelter is likely to read it from, and after a midnight-stamped intake on
 * the same date.
 */
export function placementStartDate(date: string, now: Date) {
  return date >= todayIso(now) ? now.toISOString() : `${date}T12:00:00.000Z`;
}

/**
 * The start for a placement that follows `previousStart`, or null when the
 * chosen date is a day *before* the previous placement began. Replaces a bare
 * `placementStartDate(...) <= previousStart` refusal, which turned a same-day
 * change into an error in two ways (dry run 2026-10-03, F-04):
 *
 * - intake stamps the placement `p_intake_date::timestamptz`, i.e. 00:00 UTC
 *   = 07:00 Bangkok. A move made on the intake day before 07:00 is stamped
 *   "now", which is *earlier* than that, so it was refused until the clock
 *   passed 07:00;
 * - two back-dated changes on one day both land on `T12:00:00Z`, and
 *   `end_date > start_date` (0001) forbids a tie.
 *
 * The rule is by shelter calendar day: the same day as the previous
 * placement, or later, is allowed. When the natural stamp does not fall after
 * the previous start, the new one is put one second after it, which keeps the
 * order (and the prior row's end) correct and the day unchanged.
 */
export function placementStartAfter(
  date: string,
  now: Date,
  previousStart: string,
): string | null {
  const previous = new Date(previousStart);
  if (date < todayIso(previous)) return null;
  const natural = placementStartDate(date, now);
  if (new Date(natural) > previous) return natural;
  return new Date(previous.getTime() + 1000).toISOString();
}

export function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * True when the date is after today at the shelter. This used to compare a
 * date-only value against the current instant and carry a day of slack, so
 * that a date picked in Bangkok shortly after local midnight was not
 * rejected as being in the future — the slack was covering for a UTC
 * "today" (backlog d98695a). With a shelter-timezone today it is a plain
 * calendar comparison, and genuinely-tomorrow is rejected again.
 */
export function isFutureDate(date: string, now: Date) {
  return date > todayIso(now);
}
