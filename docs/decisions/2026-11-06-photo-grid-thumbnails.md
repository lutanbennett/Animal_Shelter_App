# 2026-11-06 — the resident photo grid asks for 400px thumbnails (`#prr9h`, `#g7m4q`)

## Step zero
Gap confirmed on `main` at `7456fe74`: `PhotoGallery.tsx:550` was
`driveImageUrl(id, video ? 400 : undefined)`, so still photos asked for the full original. Viewer
(`:685` 800 poster, `:696` original) untouched. The route honours `?w=` (`route.ts:122-134`).

## Change
One argument: the grid now asks `driveImageUrl(id, 400)` for every tile, photo or video.

## 160 or 400? 400.
Tiles are `aspect-square` in a 2-3 column phone grid, about 120-190 CSS px wide, so a 3x phone screen
needs 360-570 device pixels: 400 is about right and 160 would show soft. 160 is only ~1/6 of 400's
bytes after the jump already made from the original, so the saving left is small. Videos were already
400, so images and videos now match. Not compared on a real high-density screen (no phone here).

## Measured (dev, resident R-0002, 8 photos, bytes and request counts only, no timings)
| | requests | bytes |
|---|---|---|
| Before (grid asks for originals, fetched for the same 8 ids) | 8 | 4,988,846 |
| After, as the page loaded (`performance` resource entries, `?w=400`) | 8 (+1 other) | 339,458 body / 342,158 transfer |
| After, WebP via `Accept: image/webp` (fetched) | 8 | 168,214 |

About 15x fewer bytes (30x with WebP). **Request count did not change**, so count is not the cause.

## What this supports and rules out
- **Supported: payload.** Bytes drop by more than an order of magnitude with the request count equal.
  Consistent with Lutan's Pi-on = Pi-off reading, because the mirror changes where bytes come from,
  not how many cross the phone link.
- **Eliminated: "too many requests" as the mechanism** (8 before, 8 after on dev).
- **NOT eliminated: "requests are not reaching the mirror".** Dev has no mirror, so this was not tested.
  Nor is the phone link itself.
- Not established: the 78 s itself. That needs his phone.

## Phone re-time is Lutan's, and outstanding
Same phone, same data, Panda (R-0002), Photos tab. Expect the grid to finish in a small fraction of
78 s (roughly 1/15 of the bytes, so low single-digit seconds to tens of seconds at ~5 Mbps).
If it still takes about 78 s, payload is not the cause after all. One reading settles it.

## Not for stage 2
These figures must not feed `#svs6c` stage 2 until his phone reading confirms the mechanism.

## Also
No migration, no new strings. Release note added to `unreleased` (tagged `residents`).
`#prr9h` annotated, not ticked: the phone re-time is outstanding.
