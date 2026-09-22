// The Worker in front of lannacare.org: edge cache, then the Pi, then itself.
//
// Cloudflare's free plan gives a Worker 10 ms of CPU per request and a
// Next.js page render costs 30–40 ms, so rendering here throws the
// occasional 1102 "Worker exceeded resource limits" (2026-09-22, the first
// evening with real data on the home page). Rendering somewhere with real
// CPU — the Raspberry Pi in Suphan Buri, reached through a Cloudflare
// Tunnel — fixes that; keeping this Worker as the fallback means a power
// cut at the Pi degrades the site to "what it was before" rather than to
// nothing. docs/pi-hosting.md is the runbook.
//
// Per request, in order:
//
//   1. Edge cache. An anonymous GET for a public page (the home page,
//      /adopt, /our-work, /foster, /volunteer, /donate, /privacy — the list in
//      src/lib/public-paths.ts) is answered from the Cache API for
//      CACHE_TTL_SECONDS without touching any origin. Keyed by URL and the
//      `locale` cookie, skipped when a Supabase auth cookie is present (a
//      signed-in visitor sees a different header) and for RSC payload
//      requests (same URL, different body). ~1 ms of CPU.
//
//   2. The Pi. When ORIGIN_HOST is set, the request is replayed against it
//      with a shared secret header (a WAF rule on that hostname rejects
//      requests without it) and the response streamed back. ~2 ms of CPU.
//      Tunnel down (530), app down behind the tunnel (502) or a gateway
//      timeout → step 3. A GET that gets no answer at all within
//      ORIGIN_TIMEOUT_MS → step 3. A POST that has no answer is NOT
//      retried — the Pi may have already recorded the intake, and a second
//      copy is worse than an error the user can see.
//
//   3. Itself: the OpenNext handler that has served the site so far, at
//      full CPU cost. With ORIGIN_HOST unset this is the only step, and the
//      Worker behaves exactly as before this file existed.
//
// `x-lanna-served-by` (pi | worker) and `x-lanna-cache` (HIT | MISS | BYPASS)
// on every response say which path a request took.

import openNext from "../.open-next/worker.js";

// OpenNext's Durable Object classes must stay exported from the entry module.
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "../.open-next/worker.js";

const CACHE_TTL_SECONDS = 600;
const DEFAULT_ORIGIN_TIMEOUT_MS = 20_000;

// Mirrors isPublicPage() in src/lib/public-paths.ts — the pages a signed-out
// visitor can see. Not /login (forms), not /api/photos (already edge-cached
// by its own Cache-Control headers, and not HTML).
const PUBLIC_PAGE_PREFIXES = ["/adopt", "/our-work", "/foster", "/volunteer", "/donate", "/privacy"];
const isPublicPage = (pathname) =>
  pathname === "/" ||
  PUBLIC_PAGE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

// Responses cloudflared / Cloudflare produce when the origin isn't there,
// as opposed to responses the app produced.
const ORIGIN_DOWN_STATUSES = new Set([502, 503, 504, 521, 522, 523, 530]);
const IDEMPOTENT_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function cookieValue(request, name) {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

function hasAuthCookie(request) {
  // @supabase/ssr stores the session in cookies named sb-<ref>-auth-token(.N).
  return /(?:^|;\s*)sb-[^=]*=/.test(request.headers.get("cookie") ?? "");
}

function isCacheable(request, url) {
  return (
    request.method === "GET" &&
    isPublicPage(url.pathname) &&
    !request.headers.has("rsc") &&
    !hasAuthCookie(request)
  );
}

/** One cache entry per URL per language. */
function cacheKeyFor(request, url) {
  const key = new URL(url);
  key.searchParams.set("__locale", cookieValue(request, "locale") ?? "en");
  return new Request(key.toString(), { method: "GET" });
}

function withHeaders(response, extra) {
  const out = new Response(response.body, response);
  for (const [k, v] of Object.entries(extra)) out.headers.set(k, v);
  return out;
}

/** Replay the request against the Pi; null means "fall back to local". */
async function fetchFromOrigin(request, env) {
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
    if (idempotent) return null;
    // The Pi may or may not have acted on this write — say so rather than guess.
    return new Response(
      "The shelter's server did not answer in time. Check whether your change was saved before trying again.",
      { status: 503, headers: { "content-type": "text/plain; charset=utf-8", "retry-after": "10", "x-lanna-served-by": "pi-timeout" } },
    );
  }
  if (ORIGIN_DOWN_STATUSES.has(response.status)) return null;
  return response;
}

async function serve(request, env, ctx) {
  // A write is cloned before the origin attempt so its body is still
  // readable if the fallback has to render it.
  const forLocal = IDEMPOTENT_METHODS.has(request.method) ? request : request.clone();

  if (env.ORIGIN_HOST) {
    const fromPi = await fetchFromOrigin(request, env);
    if (fromPi) return withHeaders(fromPi, { "x-lanna-served-by": fromPi.headers.get("x-lanna-served-by") ?? "pi" });
  }
  const local = await openNext.fetch(forLocal, env, ctx);
  return withHeaders(local, { "x-lanna-served-by": "worker" });
}

const worker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cacheable = isCacheable(request, url);
    if (!cacheable) {
      return withHeaders(await serve(request, env, ctx), { "x-lanna-cache": "BYPASS" });
    }

    const cache = caches.default;
    const key = cacheKeyFor(request, url);
    const hit = await cache.match(key);
    if (hit) {
      // Hand the browser the caching policy the app chose, not the edge TTL.
      const out = withHeaders(hit, {
        "x-lanna-cache": "HIT",
        "cache-control": hit.headers.get("x-lanna-origin-cache-control") ?? "private, no-store",
      });
      out.headers.delete("x-lanna-origin-cache-control");
      return out;
    }

    const response = await serve(request, env, ctx);
    // Only a complete, cookie-free success is worth keeping; Next marks its
    // dynamic pages no-store for the browser, so the stored copy carries
    // its own edge TTL while the browser keeps re-asking.
    if (response.status === 200 && !response.headers.has("set-cookie") && response.body) {
      const [toClient, toCache] = response.body.tee();
      const stored = new Response(toCache, { status: 200, headers: response.headers });
      stored.headers.set("x-lanna-origin-cache-control", response.headers.get("cache-control") ?? "private, no-store");
      stored.headers.set("cache-control", `public, max-age=${CACHE_TTL_SECONDS}`);
      stored.headers.delete("x-lanna-cache");
      ctx.waitUntil(cache.put(key, stored));
      return withHeaders(new Response(toClient, response), { "x-lanna-cache": "MISS" });
    }
    return withHeaders(response, { "x-lanna-cache": "MISS" });
  },
};

export default worker;
