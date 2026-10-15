# WebP photos for browsers that ask, and a 160 px header logo

**Logo.** `PublicHeader` draws the logo in a 40 px box, so it now loads
`/lca-logo-160.jpg` (5,492 bytes) instead of the 781 px original (33,032).
The new path is on `PUBLIC_PATHS` and `LOCKED_PUBLIC_PATHS`, with the tests.

**WebP.** `/api/photos/<id>?w=N` serves Drive's WebP rendition when the request's
`Accept` contains `image/webp`. Drive ignores the Accept header for this;
the thumbnail URL's size suffix has to be `=sN-rw`. Measured on dev, 8 public
photos: 526,106 bytes as JPEG, 329,292 as WebP (37% less; small thumbnails save
little, 1200 px photos up to 56%). Lighthouse's "roughly half" was for larger sizes.

**The cache rule (the one that can hurt).** The same URL now has two bodies, so
every layer is keyed by format:
- edge cache key adds `&fmt=webp`, and the namespace moved to `public-v3` so
  nothing written before this is ever matched;
- disk cache is `<width>.webp` beside `<width>.jpg|png`, and `readCachedPhoto`
  returns a WebP only when asked for one and never offers it otherwise;
- sized responses carry `Vary: Accept` for browsers and any proxy in between.

**The archive stays JPEG.** It calls `drive.downloadThumbnail(fileId, size)`
directly, not this route, and `webp` defaults to off there. Only the route passes
`{ webp }`, and only for a sized request. A request with no `?w=` is never negotiated.
Proved: the same photo fetched with `Accept: image/jpeg` and with no Accept
returned `image/jpeg`; with `Accept: image/webp` it returned `image/webp`.
