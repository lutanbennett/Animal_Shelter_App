// Replaying a request against the Pi (the tunnel origin). Split out of
// index.mjs so scripts/check-worker-origin.mjs can drive it without the
// OpenNext bundle, which only exists after a build.

const DEFAULT_ORIGIN_TIMEOUT_MS = 20_000;

// Responses cloudflared / Cloudflare produce when the origin isn't there,
// as opposed to responses the app produced.
export const ORIGIN_DOWN_STATUSES = new Set([502, 503, 504, 521, 522, 523, 530]);
export const IDEMPOTENT_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** The Pi may or may not have acted on this write — say so rather than guess. */
function writeUnanswered() {
  return new Response(
    "The shelter's server did not answer in time. Check whether your change was saved before trying again.",
    { status: 503, headers: { "content-type": "text/plain; charset=utf-8", "retry-after": "10", "x-lanna-served-by": "pi-timeout" } },
  );
}

/**
 * Replay the request against the Pi; null means "fall back to local". Only
 * a GET/HEAD/OPTIONS ever gets null — a write that got no usable answer is
 * answered here with writeUnanswered() instead of being re-run locally.
 */
export async function fetchFromOrigin(request, env) {
  const url = new URL(request.url);
  const publicHost = url.host;
  url.host = env.ORIGIN_HOST;

  const headers = new Headers(request.headers);
  headers.set("x-origin-key", env.ORIGIN_KEY ?? "");
  headers.set("x-forwarded-host", publicHost);
  headers.set("x-forwarded-proto", "https");

  const idempotent = IDEMPOTENT_METHODS.has(request.method);
  const timeoutMs = Number(env.ORIGIN_TIMEOUT_MS) || DEFAULT_ORIGIN_TIMEOUT_MS;

  let response;
  try {
    response = await fetch(url, {
      method: request.method,
      headers,
      body: idempotent ? null : request.body,
      // Redirects (to /login, after a form post…) belong to the browser.
      redirect: "manual",
      signal: idempotent ? AbortSignal.timeout(timeoutMs) : undefined,
    });
  } catch {
    return idempotent ? null : writeUnanswered();
  }
  if (ORIGIN_DOWN_STATUSES.has(response.status)) {
    // A 502/504 can be cloudflared losing the origin mid-request, after the
    // Pi has already acted — so a write is no more replayed locally here
    // than when the fetch itself throws.
    return idempotent ? null : writeUnanswered();
  }
  return response;
}
