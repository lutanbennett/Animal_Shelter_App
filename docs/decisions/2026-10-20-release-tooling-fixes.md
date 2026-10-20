# Release tooling fixes: byte counts, `x-lanna-cache`, the cron check (2026-10-20)

## The 4-byte disagreement was in `purge-cache.mjs`
It measured `(await r.text()).length`, which is UTF-16 code units. A stylesheet with
non-ASCII characters is shorter in characters than in bytes (here by 4). `check-assets.mjs`
read an ArrayBuffer, so its 96239 was the real size and matched the build. Both now call
`scripts/lib/served-bytes.mjs`, and `scripts/pi/served-bytes.test.mjs` pins a fixture
that is exactly 4 bytes longer than its character count, plain and gzipped. Compression was
not the cause: `fetch` decodes before either tool counted. Not re-run against production.

## `x-lanna-cache: HIT` with `no-store` is by design, not a contradiction
From `worker/index.mjs`: the header says "this response came from the Worker's edge copy"
(`caches.default`), not "the browser may cache it". On a hit the Worker puts back the
origin's own `Cache-Control` (here `no-store`) for the browser, while the stored copy has
`public, max-age=600` at the edge. So HIT + no-store is the normal pairing for a dynamic
public page. The header is attached to a response from the cache lookup, and the gate page is a
200 from the app under a public path, so it is stored and served like any other.
Two things follow, left alone because `worker/` belongs to another stream:
- A just-purged zone can still show HIT: Cloudflare's purge-everything and the Worker's
  Cache API copy are separate stores, and I could not establish from code that one clears the
  other. Treat HIT right after a purge as unexplained, not as proof of anything.
- The gate page is cached up to 600 s, so unlocking `PUBLIC_SITE` may take up to ten
  minutes to show at an edge that saw the locked page. Worth knowing on unlock day.
The smoke-test HIT line now says what it will mean once the site is unlocked.

## The `0227` cron check
`scripts/check-cron-job.mjs --env production` is two SELECTs and no write path. It has NOT
been run on production by this stream; Lutan runs it. The backlog item stays open.
