# 2026-10-08 — `'unsafe-inline'` stays in the CSP; HSTS stays at six months for now

Closes the backlog item "Drop `'unsafe-inline'` and lengthen HSTS". The item
said to drop `'unsafe-inline'` only if nonces could be shown working on both
render paths (the Pi's `next start` and the Worker's OpenNext render), and
otherwise to write down why not. This is the why not. Nothing in the policy
changed.

## `style-src`: a nonce cannot do the job at all

- CSP nonces apply to `<style>` and `<script>` elements, never to `style="…"`
  attributes. Once a nonce is in `style-src`, browsers ignore `'unsafe-inline'`
  there, so every style attribute on the page is blocked.
- The app has them on every page. Measured 2026-10-08 on `test.lannacare.org`
  (served by the Pi): `/` and `/login` each carry `style="color:transparent"`,
  which `next/image` writes itself. In the source, 24 files under `src/` use a
  React `style={…}` prop, which renders as the same kind of attribute.
- So `style-src` needs `'unsafe-inline'` (or `'unsafe-hashes'` with a hash of
  every distinct style value, which is unworkable for computed values such as
  zone colours) whatever is done about scripts.

## `script-src`: possible in principle, not worth what it costs here

The inline scripts Next emits are the page's React payload
(`self.__next_f.push(...)`, measured on `/` and `/login`). Their content is the
page's data, so it changes per page, per language and per signed-in person.
Hashes are therefore out; only nonces could work, and per the Next 16 guide
(`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`)
a nonce needs all of this:

1. **Every page rendered per request.** Next adds the nonce during
   server rendering only; a prerendered page has none and its scripts would be
   blocked.
2. **`src/proxy.ts` makes the nonce** and puts the policy on the request. That
   part would run on both paths, since both run the same proxy.
3. **The Worker stops setting its own fixed policy** on pages and passes on the
   one that came with the body. `withSecurityHeaders` sets the header *after*
   the body exists (`worker/security-headers.mjs`), so today it would overwrite
   the nonce and block every page.
4. **The edge cache stops storing public pages, or stops reusing them.** The
   Worker keeps `/`, `/adopt`, `/our-work` and the other public pages for 10
   minutes (`CACHE_TTL_SECONDS`, `worker/index.mjs`) and serves the same body to
   everyone. A cached nonce is one nonce for every visitor for 10 minutes,
   which is no longer a nonce. The only way to keep the cache is for the Worker
   to rewrite a fresh nonce into the cached HTML, and that stamps the nonce
   onto whatever inline script is in the page, including an injected one —
   exactly what the nonce was meant to refuse.
5. **Shown on both paths.** The Worker render only serves when the Pi is
   unreachable, so proving it means forcing that fallback on test and on
   production. A mistake there shows up only on the day the Pi is down, as
   blank public pages, which the 2026-10-01 decision already judged worse than
   `'unsafe-inline'`.

Against that, the gain is small. `'unsafe-inline'` in `script-src` matters only
if someone can get their own HTML into a page. React escapes text by default,
and the only raw-HTML insertion in `src/` is the JSON-LD data block in
`src/app/adopt/PublicHeader.tsx`, which browsers do not run. Even then, the
policy already refuses every outside script and every connection except this
site and Supabase, so injected code would have nowhere to load from and
nowhere to send to. The cost is the edge cache (which is what keeps public
pages fast and cheap and up), a per-request render for every page, and a
fallback path that can be tested only by switching off the Pi.

**Revisit if** the edge cache for HTML goes away, or a page ever needs to put
user-supplied HTML on screen. Either changes the sums.

## HSTS: not yet

- Now `max-age=15552000` (six months), no `includeSubDomains`, no `preload`.
- The backlog said "consider a year once the headers have been stable for a
  while". The CSP went enforcing on 2026-10-07, so "a while" has not happened.
- HSTS cannot be walked back quickly: every browser that sees a year's
  `max-age` keeps it for a year, whatever the site later sends. The real gain
  from six months to a year is small (a returning visitor is re-pinned on every
  visit either way).
- **Recommendation:** raise it to `max-age=31536000` (still without
  `includeSubDomains`, for the reason in `worker/security-headers.mjs`) no
  sooner than 2026-11-08, if nothing about HTTPS on `lannacare.org` has changed
  by then. That is a one-line change; it is on the backlog as its own item so
  this one could close.
