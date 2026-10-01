# Public photos are served at a fixed set of sizes, kept on the Pi's disk (2026-10-01)

Lutan's report from production, 2026-10-01: public pages load slowly. Cause
read from the code: every image was the phone-camera original (3-10 MB),
through `/api/photos/<id>` with no resizing, and `images.unoptimized: true`
means `next/image` does none either.

**Widths.** `?w=` takes exactly 160, 400 or 1200 (`PHOTO_WIDTHS` in
`src/lib/google/drive-client.ts`); anything else is a 400, so the caches
cannot be flooded with sizes. 160 = thumbnail strips and 64 px logos, 400 =
cards, home-page tiles and logos, 1200 = the large view, hero, featured
resident and share (og:image) images. Drive scales the *longer* side to that
many pixels. Without `?w=` the route serves the original exactly as before;
staff-only views are unchanged and still use it.

**Source.** `drive.downloadThumbnail(fileId, w)` (Drive's own rendition, so
phone HEIC arrives as JPEG). If Drive has no rendition, or the call fails,
the original is served instead, cached for 5 minutes rather than a day so the
rendition is picked up soon, and nothing is written to disk. Fixed on the way:
`downloadThumbnail`'s size rewrite was `/=sd+$/` (a literal "d"), so it never
rewrote anything and only the deceased-archive PDF's ~220 px default ever worked.

**Rules that did not change.** The route still asks `is_public_drive_file`
first and `canSeeInternalFile` for anything else. Internal files get a sized
response too (`private, no-store`) but never touch the disk or the edge cache.
Each size is its own Cloudflare edge-cache entry (`&w=` on the key).

**Pi disk cache** (`src/lib/photo-cache.ts`): `<PHOTO_CACHE_DIR>/<fileId>/<w>.jpg|png`.
- *Read only after the database check*, so a photo that stopped being public
  (resident hidden, project unpublished) is not served from disk. Written only
  when the file is public.
- *Optional.* Enabled only when `PHOTO_CACHE_DIR` is set; `write-env.mjs` sets
  it to `~/photo-cache` on the Pi (next to, not inside, `~/backups`). The Worker
  fallback and `next dev` have no variable, so every disk call is a no-op and the
  route goes to Drive exactly as it would without this feature. Every disk
  operation swallows its errors: a full or missing disk costs one Drive trip.
- *Cap and eviction:* 1 GiB by default (`PHOTO_CACHE_MAX_MB`). A sweep (at most
  every 10 minutes, or after 64 MB of writes) deletes oldest-written files
  until under 90% of the cap. At ~10-150 KB a size that is tens of thousands of
  images; the Pi's 2 TB disk is dominated by backups, which this never touches.
- *Disposable:* not backed up, `rm -rf ~/photo-cache` is always safe.
- *Invalidation:* a Drive file id never changes its bytes (a replaced photo is
  a new upload with a new id), so there is nothing to refresh. `trashFile` and
  `deleteFile` purge the file's folder on whichever host runs them (the Pi, or
  the Worker, where it is a no-op); a purge missed that way is cleaned up by
  eviction and the public check above, since an unreferenced id is never asked for.

**Known edge:** Drive upscales, so a *small* original (under 1200 px) can come
back slightly larger as the 1200 rendition. Real phone photos are well over
that; dev's tiny test images show it.

**Not done:** no `srcset`. With `unoptimized` images `next/image` emits none,
and a plain `<img srcset>` needs a decision per layout; each place picks the one
width that suits it. Cheap to add later, now that the sizes exist.

**The Pi spike** ("would serving the published photos from the Pi make them load
faster?") is subsumed: question (2) (does a smaller image fix most of it) is this change, with the
bytes before and after in the PR; question (1)'s phone-from-Thailand timing is
Lutan's to take, and the Pi disk cache is the pull-through cache it proposes, built for sized copies. The rest of
the spike's is this change, and the
pull-through cache it proposes is built for sized copies. Caching full-size
originals on the Pi is not worth doing now that nothing public serves them.
