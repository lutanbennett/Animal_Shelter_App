/**
 * Routine blood-test interval (residents.blood_test_interval_months, 0064).
 * The choices offered on the intake and edit forms; the column itself takes
 * any positive integer, so a value migrated or set elsewhere still renders.
 */
export const BLOOD_TEST_INTERVALS = [1, 3, 6, 12] as const;
export const DEFAULT_BLOOD_TEST_INTERVAL = 12;

/** Form value → months, or null when it isn't a positive whole number. */
export function parseBloodTestInterval(raw: string | null): number | null {
  if (raw === null) return null;
  const months = Number(raw);
  return Number.isInteger(months) && months > 0 ? months : null;
}
