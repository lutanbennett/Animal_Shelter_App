# The Worker serves the website and refuses the app (#dxjz2)

2026-11-12, `claude/worker-cpu-fallback-paper`. Not yet live: it ships with the next Worker deploy, which is Lutan's.

## Cause

When the Pi does not answer, the Worker used to render the request itself. The power-pull drill (2026-11-12 03:47–03:51 UTC, `wrangler tail --env test` beside `drill-probe.mjs power-2 180`) showed what that costs: 180 saves, 60 by the Pi, 7 by the Worker, then **113 by nothing**. The tail says the Worker ran for all 113 and Cloudflare killed it for exceeding its CPU limit (`exceededCpu`, error 1102). A proxied request costs about 10 ms; the failing renders cost 299, 470 and 1562 ms. The Worker was serving the app itself.

The website is different. On 2026-11-12 08:02–08:04 UTC, `wrangler tail --env production` beside a visitor probe, with the Pi off: 40 of 40 website requests answered by the Worker, 41 invocations, 41 `ok`, zero `exceededCpu`, median 33 ms, max 837 ms, twenty concurrent cold renders of `/` all succeeded.

## Lutan's direction, 2026-11-12

> "can we keep serving the website and have a page on the app saying it's offline"

That is the cheap arm with a split. The paid-plan arm breaks the zero-ongoing-cost rule and he declined it by choosing this one.

## The rule

The Worker renders locally only what the public website serves, and refuses everything else (`src/lib/pi-only-paths.ts`, `isRefusedByWorker`). "The website" is built on `isPublicPath()` from `src/lib/public-paths.ts` (pages, sign-in, robots.txt, sitemap.xml, logo, `/api/version`, photo/video proxy) plus `thPathRest()` for the `/th/` twin of a public page. No second path list was written.

- **Not `isWebsitePageWhenOff()`**: that is the signed-in go-live gate and returns false for `/`, `/privacy`, `/r/…`, `/e/…`. `/` must keep working in an outage.
- **Not `isPublicPage()` alone**: it excludes sign-in, robots.txt, sitemap.xml, `/api/version` and the photo proxy, which the measured website run included or the pages need.
- The open list is used even while the site is locked: the locked list is a subset, so locking refuses nothing extra.
- `/manual/pdf` stays an explicit Pi-only path with no time limit (`2026-11-05-manual-pdf-prebuilt.md`).

Refused requests get `piUnavailable()`: a small self-contained 503 page (inline CSS, no external request, English and Thai together because the app's language is unreachable from the Worker), keeping `retry-after: 60` and `x-lanna-served-by: pi-unavailable`. An app read keeps its origin timeout, so a wedged Pi gets the page too. An app write is answered with the page only when it provably never arrived (530); otherwise it keeps the existing "check whether your change was saved" answer, because the Pi may have acted. This is a behaviour change from before: a wrapped save no longer replays on the Worker when the Pi is down; it is refused, which is what the drill shows the Worker could not afford.

The Thai text is the stream's own and has not been reviewed.

## NOT ESTABLISHED

1. **Where the ceiling is.** `exceededCpu` at 299 and 470 ms while website renders passed at 837 ms: it is not a simple per-request CPU threshold. The drill was a sustained POST once a second; the website run was about sixty GETs in ninety seconds. A real outage is neither. **The website path is built to degrade, not to be guaranteed.** If it bites, serving the website from the edge cache is the free next step (a plain GET of `/` was seen as `cf-cache-status: HIT` while the Pi was off), and is a separate change.
2. Why the first 7 saves got through before the limit bit.
3. **Production's Worker is inferred from test, not measured**: the drill ran on test.

A loose observation, not explained: right after the drill a GET of `/login` on test answered 503 with `x-lanna-served-by: worker`. Not investigated further here.

## Outstanding

The production Worker deploy, which is Lutan's. Until it is done nothing here is live, so no release note was written (the test plan's release-notes line is `n/a` for that reason). The public website is still locked on production, so today only `/` benefits; this is built for go-live.
