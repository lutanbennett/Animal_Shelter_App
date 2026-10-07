# 2026-10-07 — The CSP is enforced; `'unsafe-inline'` stays

- **What changed.** `worker/security-headers.mjs` now sends
  `content-security-policy` instead of `content-security-policy-report-only`.
  The policy text is unchanged, so `frame-src https://www.google.com`,
  `img-src 'self' data: blob:` and `camera=(self)` (a separate header) are as
  they were. The `report-uri` / `report-to` lines stay, so any new violation
  is still logged at `/api/csp-report`.
- **The gate was read from the live logs, not assumed.** Workers Logs for the
  production Worker, last 7 days (collector live from 2026-10-01): 190 reports
  matched `directive`, and the same 190 matched `cloudflareinsights`. Every
  one is `script-src-elem` (a few `script-src`) for
  `https://static.cloudflareinsights.com/beacon.min.js`, with and without
  `:443`. Nothing about pages, photos, maps, forms, sign-in, fonts or
  Supabase. Of the 190, 19 rows were read individually and the other 171 were
  counted by search, not read one by one; the log view also warned results
  "may be incomplete due to high data volume". The week is six days, not seven.
  That was a judgement call, made with Lutan on 2026-10-07, because the one
  pattern was so uniform.
- **What the one blocked thing is, and why blocking it is right.** Cloudflare's
  Web Analytics beacon. Nothing in this repo loads it (no
  `cloudflareinsights` in `src/`), so Cloudflare is injecting it at the edge.
  `/privacy` promises "no analytics tracking", and the 2026-09-26 decision
  chose zone totals over Web Analytics for exactly that reason. Enforcement
  therefore makes the privacy page true; it does not remove a feature.
- **The dashboard's visitor counts are unaffected.** `src/lib/status/usage.ts`
  reads `httpRequests1dGroups` from Cloudflare's GraphQL Analytics API:
  server-side zone totals, no script in the browser. Not verified against the
  live tile (it is grey until `CLOUDFLARE_ANALYTICS_TOKEN` and
  `CLOUDFLARE_ZONE_ID` are set; 2026-09-26 decision).
- **Not changed, on purpose.** `'unsafe-inline'` stays in `script-src` and
  `style-src` for the reason in 2026-10-01: nonces would need to reach every
  inline script on both render paths (the Pi's `next start` and the Worker's
  OpenNext render). HSTS stays at six months. Both remain open on the backlog.
- **What the logs cannot tell us.** Report-only only reports pages somebody
  loaded that week. A page nobody opened (a rarely used admin screen) would
  not have shown up. That is why the manual list after deploy covers public
  pages, a staff page or two and the camera.
- **Rollback.** Revert this PR, or `npx wrangler rollback --env production`.
  Nothing persistent was written. If a page breaks, the console names the
  blocked address and the `csp-report` log line says the same.
