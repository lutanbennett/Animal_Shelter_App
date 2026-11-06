/**
 * The machine-readable half of System status: what GET /api/status/health
 * returns to Home Assistant (docs/home-assistant-monitoring.md).
 *
 * Deliberately a whitelist. It copies states, times and a handful of numbers
 * out of the health report and nothing else: never a check's `error` text
 * (which can name tables, hosts or settings), never a host name, a Drive id
 * or a file name. Pure and free of path aliases so scripts/check-status-health.mjs
 * can import it directly.
 */

export type FeedState = "ok" | "warn" | "fail" | "off";

type Result = { state: FeedState; checkedAt: string; durationMs: number; facts?: unknown };

/** Structural subset of HealthReport, so this file imports nothing from the app. */
export type FeedInput = {
  report: Record<string, Result>;
  /** Result of database_health() (0324); null when it could not be read. */
  databaseHealth: { sizeBytes: number; connections: number } | null;
  environment: string;
  now: Date;
};

/** Supabase's free tier. Size is judged against this. */
export const FREE_TIER_DB_MB = 500;
const SIZE_WARN = 0.8;
const SIZE_FAIL = 0.95;

const finite = (n: unknown): number | null => (typeof n === "number" && Number.isFinite(n) ? n : null);
const round = (n: number | null, places = 1): number | null => (n === null ? null : Math.round(n * 10 ** places) / 10 ** places);

export function databaseSizeState(percent: number | null): FeedState {
  if (percent === null) return "fail";
  if (percent >= SIZE_FAIL * 100) return "fail";
  return percent >= SIZE_WARN * 100 ? "warn" : "ok";
}

export function buildHealthFeed({ report, databaseHealth, environment, now }: FeedInput) {
  const checks: Record<string, { state: FeedState; checkedAt: string; durationMs: number }> = {};
  for (const [key, r] of Object.entries(report)) {
    checks[key] = { state: r.state, checkedAt: r.checkedAt, durationMs: Math.round(r.durationMs) };
  }

  const facts = (key: string) => (report[key]?.facts ?? {}) as Record<string, unknown>;
  const sizeMb = databaseHealth ? databaseHealth.sizeBytes / 1_048_576 : null;
  const sizePercent = sizeMb === null ? null : (sizeMb / FREE_TIER_DB_MB) * 100;
  checks.databaseSize = { state: databaseSizeState(sizePercent), checkedAt: now.toISOString(), durationMs: 0 };

  const newest = facts("backup").newest as { ageDays?: unknown } | null | undefined;
  const origin = facts("origin");
  const release = facts("release");

  return {
    generatedAt: now.toISOString(),
    environment,
    checks,
    numbers: {
      databaseResponseMs: finite(facts("database").latencyMs),
      databaseSizeMb: round(sizeMb),
      databaseSizeLimitMb: FREE_TIER_DB_MB,
      databaseSizePercent: round(sizePercent),
      databaseConnections: databaseHealth ? databaseHealth.connections : null,
      newestBackupAgeDays: round(finite(newest?.ageDays), 2),
      releaseVersion: typeof release.version === "string" ? release.version : null,
      originInUse: origin.drawnByPi === true || typeof origin.host === "string",
    },
  };
}

/* ---- the guard: its own bearer token, and a limit --------------------- */

/** Constant-time comparison without node:crypto, so the Worker and the checks both run it. */
export function tokenMatches(header: string | null, expected: string | undefined): boolean {
  if (!expected || expected.length < 16) return false; // an unset or toy token opens nothing
  const given = header && header.startsWith("Bearer ") ? header.slice(7) : "";
  let diff = given.length ^ expected.length;
  const len = Math.max(given.length, expected.length);
  for (let i = 0; i < len; i++) diff |= (given.charCodeAt(i) || 0) ^ (expected.charCodeAt(i) || 0);
  return diff === 0;
}

/** Fixed-window counter. Per server instance, which is plenty to blunt guessing and runaway polling. */
export function makeLimiter(max: number, windowMs: number, clock: () => number = Date.now) {
  let start = 0;
  let count = 0;
  return () => {
    const t = clock();
    if (t - start >= windowMs) {
      start = t;
      count = 0;
    }
    count += 1;
    return count <= max;
  };
}
