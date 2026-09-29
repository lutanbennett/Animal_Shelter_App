# 2026-09-28 — Puppy loader showcase pause on `/adopt`: on in all three environments

`docs/backlog.md`: a deliberate pause on `/adopt`'s first load so the
puppy-at-a-laptop loader actually gets seen, instead of the page usually
arriving before its 300 ms delay ever shows it. The one open question the
item left for Lutan — whether real visitors on production get it too, given
that a slower page costs adopters and search ranking — he chose **yes**:
`SHOWCASE_LOADER_MS` is set to `1800` in `wrangler.jsonc`'s test, uat *and*
production blocks, so the showcase plays for everyone, not only staff and
demos.

It stays a config change, not a code one: `0` or unset turns it off per
environment without touching `src/app/adopt/page.tsx`, and
`src/lib/adopt/showcase-pause.ts` clamps whatever the var says to 3000 ms so
a typo can't hang the page. If real-visitor numbers ever argue against it,
shortening or zeroing production's value is a one-line `wrangler.jsonc`
change.

"First load from navigation, not a filter or paging change" (the same
component re-runs for both) is told apart two ways, either one enough to
skip the pause: `/adopt`'s own query params are present, or the request's
Referer is `/adopt` itself — which also covers clearing filters back to no
params via a same-route Link. A missing Referer (direct navigation, and most
back/forward hits, which Next's client-side router cache usually serves
without a server round trip at all) reads as a fresh arrival, the safer
default for a showcase feature.
