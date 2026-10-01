# 2026-10-01 — The manual PDF reads its screenshots from disk on the Node origin

Backlog item: "`/manual/pdf` on the Node origin fetches its screenshots
unauthenticated and gets the login redirect."

- **Cause: a latent branch, not a regression.** `loadImage` used the Worker's
  `ASSETS` binding when present and otherwise `fetch(origin + src)`. On
  Cloudflare the binding always exists, so the fallback never ran. The Pi
  (`next start`) has no binding, so since it became the production origin on
  2026-09-30 the fallback ran, `proxy.ts` redirected each request to `/login`,
  and react-pdf was handed HTML ("Incomplete or corrupt PNG file", once per
  image). The Next 16.3.8 bump only surfaced it.
- **Fix: read `public/manual/<file>` with `fs` when there is no binding.** That
  is what `ASSETS` does anyway. Forwarding the caller's cookie was rejected: it
  makes the route an authenticated fetcher of its own origin, one proxied
  round trip per image, carrying a session cookie into an internal request.
- **The path is confined.** `src` comes from the static `Manual` data, but the
  reader still requires the `/manual/` prefix and that the resolved path stays
  inside `public/manual/`. `proxy.ts` and the `getUser()` check are untouched.
- **Remember the asymmetry:** `ASSETS` exists only on the Worker. Any server
  code that fetches its own static files will take a different path on the Pi.
- `node:fs` is imported dynamically inside the fallback, so it is not on the
  Worker's path.
