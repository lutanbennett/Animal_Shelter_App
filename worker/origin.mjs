// Replaying a request against the Pi (the tunnel origin). Split out of
// index.mjs so scripts/check-worker-origin.mjs can drive it without the
// OpenNext bundle, which only exists after a build.

import { isWrappedWritePath, ORIGIN_ATTEMPT_MS } from "../src/lib/write-requests.ts";

const DEFAULT_ORIGIN_TIMEOUT_MS = ORIGIN_ATTEMPT_MS;

// Responses cloudflared / Cloudflare produce when the origin isn't there,
// as opposed to responses the app produced.
export const ORIGIN_DOWN_STATUSES = new Set([502, 503, 504, 521, 522, 523, 530]);
// Of those, the one that proves the request never reached the Pi: 530 is the
// edge finding no tunnel connector to hand the request to (error 1033),
// before anything is forwarded, so a write may be replayed locally without
// duplicating anything. The rest are left out on purpose. 502/503/504:
// cloudflared can answer those after the Pi has acted. 522: also returned
// when an origin accepts the connection and then never acknowledges the
// request. 521/523: a tunnel origin does not produce them, and nothing here
// has checked them. A thrown fetch is not a status at all, and workerd throws
// the same "Network connection lost." for a refused connect as for a
// connection dropped after the body was sent
// (docs/decisions/2026-10-02-origin-write-fallback.md).
export const NEVER_ARRIVED_STATUSES = new Set([530]);
export const IDEMPOTENT_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * PI FAILOVER (C): which writes may now be replayed here although the Pi may
 * already have acted on them.
 *
 * Everything above is about not being able to TELL whether the Pi wrote. That
 * is still true -- what changed is that it no longer has to be told apart.
 * Since 0292 every wrapped write carries a client-generated request id and the
 * database refuses the second use of it (supabase/migrations/0292_write_requests.sql,
 * src/lib/action-result.ts runWriteAction), so a replay of a write the Pi
 * already applied comes back as that first write's own answer instead of
 * writing again. The Pi and this Worker write to the same database, which is
 * why the duplicate can be closed there rather than guessed at here.
 *
 * It is a PATH test and not a header or a cookie, because a Server Action's
 * POST is made by React's own fetch: the app cannot add a header to it, and a
 * cookie left from an earlier save would mark an unwrapped write replayable,
 * which is the #250 double write. WRAPPED_WRITE_PATHS in
 * src/lib/write-requests.ts carries the rule for adding a path, and the list
 * grows with (D)'s sweep. A path that is not on it behaves exactly as before.
 */
function mayReplayWrite(url) {
  return isWrappedWritePath(url.pathname);
}

/** The Pi may or may not have acted on this write — say so rather than guess. */
function writeUnanswered() {
  return new Response(
    "The shelter's server did not answer in time. Check whether your change was saved before trying again.",
    { status: 503, headers: { "content-type": "text/plain; charset=utf-8", "retry-after": "10", "x-lanna-served-by": "pi-timeout" } },
  );
}

/**
 * Replay the request against the Pi; null means "fall back to local". A
 * GET/HEAD/OPTIONS gets null on any failure. A write gets null when the edge
 * says it never reached the Pi (NEVER_ARRIVED_STATUSES) or when its path is on
 * WRAPPED_WRITE_PATHS, where the database makes a second application
 * impossible; any other failure is answered here with writeUnanswered()
 * instead of being re-run locally. The attempt consumes the request's body
 * either way, so a caller that may go on to render a write locally uses
 * originOrLocal().
 */
export async function fetchFromOrigin(request, env) {
  const url = new URL(request.url);
  const publicHost = url.host;
  const idempotent = IDEMPOTENT_METHODS.has(request.method);
  // A read always has somewhere to go when the Pi fails; a write only has when
  // its path is wrapped, because only then can the database refuse a second
  // application of it.
  const canFallBack = idempotent || mayReplayWrite(url);
  url.host = env.ORIGIN_HOST;

  const headers = new Headers(request.headers);
  headers.set("x-origin-key", env.ORIGIN_KEY ?? "");
  headers.set("x-forwarded-host", publicHost);
  // cloudflared rewrites Host and x-forwarded-host to its own ingress values, so the
  // app could not tell which address the visitor used. This one survives
  // (src/lib/site-hosts.ts requestHost).
  headers.set("x-lanna-public-host", publicHost);
  headers.set("x-forwarded-proto", "https");

  const timeoutMs = Number(env.ORIGIN_TIMEOUT_MS) || DEFAULT_ORIGIN_TIMEOUT_MS;
  // A wrapped write is time-bounded like a read. An unwrapped one is not: it
  // has nowhere to go when the time is up, so cutting it short would turn a
  // wait into a refusal and nothing else. The wedged-Pi hang on an unwrapped
  // path is real and is named in the (C) decision file as found, not fixed; it
  // closes as (D) sweeps each path onto WRAPPED_WRITE_PATHS.

  let response;
  try {
    response = await fetch(url, {
      method: request.method,
      headers,
      body: idempotent ? null : request.body,
      // Redirects (to /login, after a form post…) belong to the browser.
      redirect: "manual",
      signal: canFallBack ? AbortSignal.timeout(timeoutMs) : undefined,
    });
  } catch {
    return canFallBack ? null : writeUnanswered();
  }
  if (ORIGIN_DOWN_STATUSES.has(response.status)) {
    if (canFallBack || NEVER_ARRIVED_STATUSES.has(response.status)) return null;
    // A 502/504 can be cloudflared losing the origin mid-request, after the
    // Pi has already acted — so an unwrapped write is no more replayed
    // locally here than when the fetch itself throws.
    return writeUnanswered();
  }
  return response;
}

/**
 * The Pi if it answers, else `renderLocal`. A write is cloned before the
 * origin attempt, because the attempt consumes the body and the local render
 * needs it when the edge says the request never arrived. The clone holds the
 * body in the Worker's memory (uploads are capped at MAX_UPLOAD_BODY_BYTES,
 * 16 MB) — the price of a write surviving the Pi being off.
 */
export async function originOrLocal(request, env, renderLocal) {
  if (!env.ORIGIN_HOST) return { response: await renderLocal(request), servedBy: "worker" };
  const forLocal = IDEMPOTENT_METHODS.has(request.method) ? request : request.clone();
  const fromPi = await fetchFromOrigin(request, env);
  if (fromPi) return { response: fromPi, servedBy: fromPi.headers.get("x-lanna-served-by") ?? "pi" };
  return { response: await renderLocal(forLocal), servedBy: "worker" };
}
