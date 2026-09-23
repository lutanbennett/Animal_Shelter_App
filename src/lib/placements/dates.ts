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
