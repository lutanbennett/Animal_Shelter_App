# 2026-11-09 — The website is off on Test: a third `PUBLIC_SITE` state, `"off"`

Backlog `#br3f3`. Lutan, 2026-11-09: *"Turn off the website for Test, we have someone who will be trying out
the system but the Director doesn't want them to see the website."*

## What was built

`PUBLIC_SITE` now has three states (`src/lib/public-site.ts`):

| State | Signed out | Signed in |
|---|---|---|
| open (unset) | the website | the website |
| `"locked"` | sign-in landing page at `/`; every website address goes to `/login` | the website, so staff can preview it before go-live |
| `"off"` | exactly as `"locked"` | **no website.** `/` and every website page go to `/home`; a login whose cards open nothing goes to `/no-access` |

`"off"` is set on the **test Worker only** (`wrangler.jsonc`). **uat and production stay `"locked"`**, and
`"locked"` means exactly what it meant before, measured below. `isPublicSiteLocked()` is true for both
`"locked"` and `"off"`, so robots.txt, the sitemap, the `noindex` header, the signed-out path list and the
landing page behave the same in both without being touched.

Where `"off"` is honoured:

- **The proxy** (`src/lib/supabase/proxy.ts`): a signed-in login gets the *locked* path list too, so a website
  page reaches the role check. There an app user is sent to `/home` (`isWebsitePageWhenOff()` in
  `src/lib/public-paths.ts`), and a login whose cards open nothing to `/no-access` instead of `/`. A signed-in
  `/` is sent where a fresh sign-in would land, as a plain 307.
- **`/` itself** (`src/app/page.tsx`): the same redirect, kept as a backstop. The proxy does it first because a
  page's own `redirect()` arrives only after the root `loading.tsx` has started streaming (measured: a 200 with a
  meta refresh rather than a 307).
- **`refuseFor()`** (`src/lib/auth/require-role.ts`) and **`signedInLandingPath()`**
  (`src/lib/auth/app-access.ts`): while off, neither sends anyone to `/`; both send to `/no-access`.
- **`/no-access`** draws its Home button only for a login whose cards enter the app. For one that does not, Home
  would only come straight back; the header's Sign out is its way on.

## Why not the obvious shapes

- **Not by changing what `"locked"` means.** Production is also `"locked"` today and its staff need to preview the
  website they are about to launch.
- **Not in Cloudflare.** Tried live the same day (the backlog item has the measurement): a zone redirect rule does
  fire in front of a Workers custom domain, but it looped the very login the tester will have
  (`/` → edge → `/home` → app → `/` …), and no edge rule can tell that login from the Director's.
- **Why the no-card login goes to `/no-access` and is let stay there.** `/no-access` was not reachable to that
  login before: the proxy sent it to `/` first. While off the proxy lets it through, and nothing on that page or
  in the proxy points back at `/`, so there is no cycle. `isWebsitePageWhenOff("/no-access")` is false, asserted
  in `src/lib/public-paths.test.mjs`, because that one line going wrong would be the loop again.

## What is deliberately left alone

- **The signed-out `/` stays the sign-in landing page**, not a redirect: Google's OAuth consent screen lists the
  homepage, and Test shares the dev project's Google client. Nothing about a signed-out visitor changes.
- **`/privacy` answers in every state, signed in or out** (Google's consent screen links to it).
- **`/r/<code>` and `/e/<id>`** (a resident's card, an enclosure's QR code) work as before for a login that can
  open the record or enclosure: their pages forward it into the app. A login holding no cards is sent to
  `/no-access` from them while off, since they are not on the locked list.
- **The Worker** (`worker/index.mjs`) needs nothing: it edge-caches only anonymous requests, and a signed-out `/`
  is the landing page in both states.
- **While off, `/api/photos/` and `/api/videos/` go through the role check for a signed-in login** (one
  `my_permissions()` call each), because they are not on the locked list. Test only, and every photo on an app
  page is for a login that enters the app anyway.

## How it was proved (dev, `next dev` on :3006, `PUBLIC_SITE` set per run)

The tester's case is a login **with no cards**. `entersApp()` is true for any role holding even one card (every
card grants something: `card-grants-applied`), so `dev-signin.mjs --cards <one card>` cannot model it; the
`public_viewer` login, which holds none, does. Each line is the redirect chain curl followed:

- **off, no-card login:** `/`, `/adopt`, `/our-work`, `/donate`, `/r/…`, `/e/…`, `/home`, `/residents`, `/login`
  → `/no-access [200]`, which stays put (checked in the browser five seconds later: one navigation, still there).
  `/privacy [200]`.
- **off, Admin:** `/`, `/adopt`, `/our-work`, `/donate`, `/login` → `/home [200]`; `/home`, `/residents`,
  `/privacy` 200.
- **off, signed out:** `/` 200 (sign-in landing page, one link, to `/login`); every website page and `/home` →
  `/login?next=…`; `/privacy`, `/robots.txt` (`Disallow: /`), `/api/version` 200.
- **locked (regression):** Admin `/` and `/adopt` 200; no-card login `/` and `/adopt` 200, `/home` → `/`;
  signed out `/adopt` → `/login`. As before.
- **open (regression, after a server restart):** signed out `/` and `/adopt` 200, robots `Allow: /`.

## Not live until Test is deployed — both halves

Test's pages are served by the Pi (`ORIGIN_HOST`), and the Pi's `PUBLIC_SITE` is written into its env file from
`wrangler.jsonc` by `scripts/pi/write-env.mjs` during a Pi deploy. So **after merge, Test needs both**: the test
Pi (`deploy-pi.sh --env test` in the test clone, which ships `origin/main`) and the test Worker
(`node scripts/deploy.mjs --env test`). Until then Test still shows the website to a signed-in login.
