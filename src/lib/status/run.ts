/**
 * The shape every Settings → System status check shares, and the wrapper
 * that runs one. Kept apart from the checks so a later "alert me when a
 * tile goes red" (email or LINE) can run the same functions on a schedule
 * and read the same results (docs/decisions.md, 2026-09-26).
 *
 *   ok    green: working
 *   warn  amber: working, but look at it (slow, stale, drifted)
 *   fail  red: broken, with `error` saying why
 *   off   grey: deliberately not in use here (release mail on the dev
 *         database, the Pi before it is live) — not a fault, so an alert
 *         would ignore it
 */
export type CheckState = "ok" | "warn" | "fail" | "off";

export type CheckResult<F> = {
  state: CheckState;
  /** ISO time the check finished. */
  checkedAt: string;
  durationMs: number;
  /** Plain English, never a secret's value: why it isn't green. */
  error?: string;
  /** What the tile shows; absent when the check threw before it knew. */
  facts?: F;
};

/** What a check function returns; runCheck adds the timing. */
export type CheckOutcome<F> = { state: CheckState; error?: string; facts?: F };

/** Long enough for Google's token endpoint on a bad day, short enough that a dead one can't hang the page. */
export const DEFAULT_TIMEOUT_MS = 8_000;

/**
 * Runs one check with a hard timeout, never throwing: a check that throws
 * or runs out of time is a red tile, not a broken page. The timeout races
 * the work rather than cancelling it — whatever is still waiting on a dead
 * dependency finishes in the background and is ignored.
 */
export async function runCheck<F>(
  check: () => Promise<CheckOutcome<F>>,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<CheckResult<F>> {
  const started = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<CheckOutcome<F>>((resolve) => {
    timer = setTimeout(
      () => resolve({ state: "fail", error: `No answer within ${timeoutMs / 1000} seconds.` }),
      timeoutMs,
    );
  });
  let outcome: CheckOutcome<F>;
  try {
    outcome = await Promise.race([check(), timeout]);
  } catch (err) {
    outcome = { state: "fail", error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
  return {
    ...outcome,
    error: outcome.error === undefined ? undefined : redactSecrets(outcome.error),
    checkedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
  };
}

/**
 * The environment variables whose values must never reach a tile. Error
 * text comes from Google, Supabase and Cloudflare, and none of them promise
 * not to echo a credential back, so every error is scrubbed on the way out.
 */
const SECRET_ENV_NAMES = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_DB_PASSWORD",
  "GOOGLE_OAUTH_CLIENT_SECRET",
  "GOOGLE_OAUTH_REFRESH_TOKEN",
  "ORIGIN_KEY",
  "CLOUDFLARE_ANALYTICS_TOKEN",
];

export function redactSecrets(text: string): string {
  let out = text;
  for (const name of SECRET_ENV_NAMES) {
    const value = process.env[name];
    // A very short value would redact ordinary words; real secrets are long.
    if (value && value.length >= 8) out = out.split(value).join(`[${name}]`);
  }
  // Bearer tokens and Google access tokens that aren't in the environment.
  return out.replace(/\b(Bearer\s+)[\w.~+/-]{16,}=*/gi, "$1[token]").replace(/\bya29\.[\w.-]+/g, "[token]");
}

/**
 * About a minute of memory per key, per server instance, so reloading the
 * page or several admins looking at once doesn't re-ask Google and
 * Cloudflare each time. The promise is stored, not the result, so two
 * requests in the same moment share one run.
 */
const CACHE_MS = 60_000;
const cache = new Map<string, { at: number; value: Promise<unknown> }>();

export function cached<T>(key: string, compute: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as Promise<T>;
  const value = compute();
  cache.set(key, { at: Date.now(), value });
  return value;
}

/** "Check now": the next read of every key runs fresh. */
export function clearStatusCache(): void {
  cache.clear();
}
