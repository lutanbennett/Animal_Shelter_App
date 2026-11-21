# 2026-11-21 — The shelter logo is served as the original, not a rendition (`#gyw6m`)

The brief called this item `#m52yp`; in `docs/backlog.md` that id belongs to a different item (public views). The transparent-logo item is `#gyw6m`.

## Which mechanism serves the logo

| Combination | Mechanism | Result |
|---|---|---|
| Public file, `?w=` (the old header call), dev | Drive's own rendition (`downloadThumbnail`) | **Measured now:** `image/webp`, 160x160, corner `40,40,40` alpha 255. Flattened onto black. |
| Public file, no `?w=`, dev | Original via `downloadFile` | **Measured now:** `image/png`, 538x537, corner `210,210,210` alpha 90. Alpha intact. |
| Header on the public page after the change | No width requested | **Measured now (headless Chrome, signed in as admin):** `<img>` src `/api/photos/<id>`, natural width 538. |
| Worker, Pi (disk cache or mirror) | not established | Not exercised: dev only. A no-width request skips the rendition, the disk cache and `resizeMirrored` (all gated on `width`), so it should serve the original, but that is read from the code, not measured. |
| Private file | `resizeMirrored` (sharp, `.jpeg()`) | Not exercised; a logo is always a public file (`site_content`), so it does not reach this path. |

## Can Drive serve an alpha rendition?

Not by anything this code asks for. `downloadThumbnail` rewrites `=s<size>` and optionally adds `-rw` (WebP); the WebP it returned for the logo had alpha 255, so even the WebP rendition is flattened. Google's `-rp` (PNG) suffix was **not tried**; it is undocumented, and betting a public header on it would be a guess.

## Shape chosen: ask for the original (no width)

Two call sites, one word each: `PublicHeader.tsx` and the admin `ShelterLogo.tsx` preview no longer pass `160`. Works on every path because the width path is never entered.

Rejected: **resize at upload** (needs sharp, which is not a dependency and does not run on the Worker); **alpha-aware width path** (same; and Drive's rendition is the one flattening, so we would have to stop using it); **special-case logos inside the route** (it cannot tell a logo from a photo without a database read per request).

Cost accepted: the header downloads the original. A logo is a small PNG (the test one is 120 KB) and the file is cached by the browser and edge for 24 h like any public photo. **A logo uploaded at 15 MB would be sent in full.** Not capped here (a cap needs a new dictionary string, and both dictionaries are another stream's this round); for the planner to file.

## Caches

The no-width URL is a different edge-cache key and a different request from `?w=160`, so an already cached black thumbnail is never asked for again by the app. It expires on its own (24 h); nothing was purged and nothing needs to be.

## Not proved

The Worker and the Pi serving the original were not driven. To settle: after release, open the public header on production and `curl -sI https://<host>/api/photos/<logo id>` should say `image/png`.

Controls added: none (no screen changed).
