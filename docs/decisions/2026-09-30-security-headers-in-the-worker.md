# 2026-09-30 — Security headers are set in the Worker, not next.config.ts

- **Why the Worker.** Since the Pi became the origin a response comes from
  either the Pi's `next start` or the Worker's own render (the fallback), and
  `x-lanna-served-by` says which. `headers()` in `next.config.ts` would be
  missing on every Worker-rendered response, the degraded path where losing
  protections matters most. The Worker sits in front of both, and of edge-cache
  hits, redirects and `/api/releases/*` too, so `worker/index.mjs` wraps its
  whole `fetch` in `withSecurityHeaders` (`worker/security-headers.mjs`). One
  list, one place. Cost: `next dev` sends none of them.
- **HSTS** was not being sent by the zone (checked with `curl -sI` on
  lannacare.org and test.lannacare.org), so the Worker sends
  `max-age=15552000` (six months) with no `includeSubDomains` or `preload`:
  nothing here commits other subdomains to HTTPS-only. Raise it after it has
  run a while.
- **CSP is report-only and stays so.** The backlog's suggested
  `default-src 'self'; img-src …; frame-src …` alone would flag every page's
  Next.js inline scripts and the browser's calls to Supabase, drowning real
  hits, so `script-src`/`style-src` allow `'unsafe-inline'` and `connect-src`
  allows `*.supabase.co`. **Nothing collects reports** (no `report-uri`); they
  appear only in a browser console. Tightening (drop `unsafe-inline`, add
  enforcement) is owed after a quiet week and is a backlog follow-up.
- **`camera=(self)`** stays for resident photos and QR scanning.
  `frame-src https://www.google.com` covers the only two iframes
  (ContactHub, FriendCard maps).
- **`secure` cookies:** all three Supabase factories (browser, server, proxy)
  take `authCookieOptions` (`src/lib/supabase/cookie-options.ts`),
  `secure` only when `NODE_ENV === "production"`, since a Secure cookie is not
  sent to `http://localhost`. Existing sessions are unaffected.
- **Photo proxy:** adds `nosniff` and `Content-Disposition`: `inline` for
  raster images and PDFs, `attachment` for anything else (HTML, SVG, text), so
  an uploaded file can't run as a page on our origin. What it serves and to
  whom is unchanged.
