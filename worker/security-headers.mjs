// Security headers for every response the Worker returns.
//
// They live here rather than in next.config.ts because a response comes from
// either the Pi's `next start` or this Worker's own render (the fallback,
// `x-lanna-served-by: worker`), and only the Worker sits in front of both. A
// header set in next.config.ts would vanish exactly when the site is
// degraded. docs/decisions/2026-09-30-security-headers-in-the-worker.md.

// Enforced since 2026-10-07, after a week of report-only collection showed one
// blocked thing: Cloudflare's Web Analytics beacon, which the site never chose
// to load (the dashboard's visitor counts come from Cloudflare's zone totals,
// not from a script) and which /privacy's "no analytics tracking" rules out.
// docs/decisions/2026-10-07-csp-enforced.md.
// Broader than `default-src 'self'` alone because Next.js emits inline
// bootstrap scripts and styles and the browser talks to Supabase directly, so
// 'unsafe-inline' stays and `*.supabase.co` is allowed. Violations are still
// reported to /api/csp-report, which the Worker answers itself and logs
// (worker/csp-report.mjs): report-uri for browsers that only know the old
// mechanism, report-to + Reporting-Endpoints for the rest.
export const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-src https://www.google.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "report-uri /api/csp-report",
  "report-to csp",
].join("; ");

export const SECURITY_HEADERS = {
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  // camera stays (self): resident photos and microchip/QR scanning use it.
  "permissions-policy": "camera=(self), geolocation=()",
  // No includeSubDomains/preload: pi.* and any future subdomain are not
  // ours to commit to HTTPS-only for a year from here.
  "strict-transport-security": "max-age=15552000",
  "reporting-endpoints": 'csp="/api/csp-report"',
  "content-security-policy": CSP,
};

/** A copy of `response` with the security headers set. */
export function withSecurityHeaders(response) {
  // A WebSocket upgrade can't be re-wrapped (the app has none).
  if (response.status === 101) return response;
  const out = new Response(response.body, response);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
  return out;
}
