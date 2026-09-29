# 2026-09-25 — UAT and test are locked behind sign-in by a Worker var, `PUBLIC_SITE`

lannacare.org is UAT for good and test.lannacare.org is staff testing; until
go-live strangers should not browse the public pages on either (Lutan).

- **A per-Worker var, not `getAppEnv()`.** `"PUBLIC_SITE": "locked"` is set on
  the `test`, `uat` and `production` blocks of `wrangler.jsonc`. An
  environment check would not fire where it is needed: lannacare.org reports
  "production" until the cutover sets `UAT_PROJECT_REF`. **The cutover must
  drop `PUBLIC_SITE` from the `production` block** when it moves to
  lannacareforanimals.org, or the live site opens on a sign-in page; the
  comment on that block says so. Local `next dev` has no var and stays open.
- **Read from `process.env` per request.** OpenNext's `init.js` copies every
  string Worker var onto `process.env` on the first request — the same route
  the Drive and service-role secrets take — so `src/lib/public-site.ts` reads
  it there, never at module scope. `scripts/pi/write-env.mjs` copies it from
  `wrangler.jsonc` into the Pi's env file, so a Pi origin locks the same host
  the Worker does rather than serving it open behind the tunnel.
- **The gate shrinks the public list rather than adding a second gate.**
  `isPublicPath(pathname, locked)` in `src/lib/public-paths.ts` returns only
  `/`, `/login`, `/login/forgot`, `/auth/callback`, `/robots.txt` and
  `/privacy` when locked, so everything else takes the existing redirect to
  `/login?next=…` — which is also why a scanned `/r/` card or `/e/` QR code
  resumes after sign-in with no new code. `/privacy` stays open because
  Google's OAuth consent screen links to it; the consent screen also lists
  the homepage, so `/` is a real page (`src/app/LockedLanding.tsx`, rendered
  by the home page for a signed-out visitor) rather than a redirect.
- **`/api/photos/` is not public while locked.** The landing page shows only
  the static logo, and every page that renders Drive photos is behind
  sign-in, so its image requests carry the session cookie.
- **The temporary-password check keeps the open list.** The lock is about
  strangers; a signed-in account on a temporary password is still left alone
  on the public pages as before.
- **`noindex` in the proxy, not per page.** Every response on a locked host
  gets `X-Robots-Tag: noindex, nofollow`, redirects included, and
  `src/app/robots.ts` (dynamic, since the var is only known at request time)
  disallows everything. Unlocked, robots.txt allows everything — the same as
  having none, which is what the site had.
- **Expected costs.** Open Graph previews of locked pages stop working on UAT
  and test (the landing page has none on purpose — it would describe a site
  the visitor can't see). The Worker's edge cache may hand out a public page
  cached just before the deploy for up to its 10-minute TTL.
