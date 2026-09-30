// Security headers for every response the Worker returns.
//
// They live here rather than in next.config.ts because a response comes from
// either the Pi's `next start` or this Worker's own render (the fallback,
// `x-lanna-served-by: worker`), and only the Worker sits in front of both. A
// header set in next.config.ts would vanish exactly when the site is
// degraded. docs/decisions/2026-09-30-security-headers-in-the-worker.md.

// Report-only until a quiet week has shown nothing legitimate is blocked.
// Broader than `default-src 'self'` alone because a policy that would flag
// every page's own inline scripts and Supabase calls would bury real hits:
// Next.js emits inline bootstrap scripts and styles, and the browser talks
// to Supabase directly. Nothing collects violation reports yet (no
// report-uri); the browser console shows them, which is the known gap.
export const CSP_REPORT_ONLY = [
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
  "content-security-policy-report-only": CSP_REPORT_ONLY,
};

/** A copy of `response` with the security headers set. */
export function withSecurityHeaders(response) {
  // A WebSocket upgrade can't be re-wrapped (the app has none).
  if (response.status === 101) return response;
  const out = new Response(response.body, response);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
  return out;
}
