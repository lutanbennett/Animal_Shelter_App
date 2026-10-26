/** The 15-minute sweep is quiet if its poll has not written calendar_sync_state for this long (one missed run is normal). */
export const SWEEP_QUIET_AFTER_MS = 45 * 60_000;

/** True when the sweep has never run, or its last run is older than SWEEP_QUIET_AFTER_MS. */
export function isSweepQuiet(lastSweepAt: string | null, now: number = Date.now()): boolean {
  if (!lastSweepAt) return true;
  const at = Date.parse(lastSweepAt);
  return Number.isNaN(at) || now - at > SWEEP_QUIET_AFTER_MS;
}
