/**
 * Date handling shared by every placement action that takes a date-only
 * input (move, send to hospital, …).
 */

/**
 * A date-only input has no time of day. Tie a same-day placement to the
 * current instant so it sorts after anything recorded earlier today (an
 * intake this morning, an earlier move); for back-dated placements use
 * midday so the row still lands on that calendar day in any timezone the
 * shelter is likely to read it from, and after a midnight-stamped intake on
 * the same date.
 */
export function placementStartDate(date: string, now: Date) {
  const today = now.toISOString().slice(0, 10);
  return date >= today ? now.toISOString() : `${date}T12:00:00.000Z`;
}

export function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * True when the date is more than a day ahead of UTC "today". The slack
 * means a date picked in Bangkok shortly after local midnight isn't
 * rejected as being in the future.
 */
export function isFutureDate(date: string, now: Date) {
  return (
    new Date(`${date}T00:00:00Z`).getTime() - now.getTime() >
    24 * 60 * 60 * 1000
  );
}
