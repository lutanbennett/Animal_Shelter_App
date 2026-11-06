# Staff files are read from the Pi's Drive mirror when it is there (2026-10-29)

Drive stays the source of truth. `/api/photos/[fileId]` gained a read path: a file the caller may see, and that
is in the mirror, is served from disk; anything else goes to Drive exactly as before. Not stage 2 of the mirror item.

## Design
- `src/lib/mirror-read.ts` looks the id up in `<MIRROR_DEST>/_mirror/state.json` (`{ path, modifiedTime, gone? }`, as
  `scripts/pi/drive-mirror.mjs` writes it) and reads `<MIRROR_DEST>/<shelter>/<path>`. No second copy, no new directory.
- **Authorisation first.** The call sits after `is_public_drive_file` / `can_see_drive_file` / the memes check, in the
  `!isPublicFile` branch. No check moved. The disk holds bytes; the database decides who sees them.
- **Headers unchanged**: `private, no-store`, `nosniff`, same inline/attachment rule. No new edge or browser cache.
- **Off by default.** Only `MIRROR_DEST` switches it on; `write-env.mjs` writes it for the production Pi only (not the
  test instance, which does not mirror). The Worker and `next dev` have no variable, so they go to Drive. Unmounted drive,
  no `state.json`, a `gone` entry, a missing file, an unknown extension (videos fall through to their own route) or a
  path that resolves outside `<dest>/<shelter>` is a miss: one Drive round trip, never a failed request.
- **LUKS only.** The only root read is `MIRROR_DEST`, the encrypted mount; the clone half is never referenced. If the
  drive is locked, `/mnt/lanna-mirror` is an empty folder with no `state.json`, which is a miss.
- **Sized requests (`?w=`)** resize the mirrored original with `sharp` (Drive's thumbnail is smaller bytes than the
  original, and a phone camera original over mobile data would be slower than today). Any resize failure goes to Drive.
- **`modifiedTime` is not compared.** The app does not know Drive's current value without calling Drive, which is the
  cost being removed. A file edited in place is stale until the next mirror run (timer). Photos get a new id when replaced,
  so this matters for documents. Recorded as a known limit.

## Latency — measured 2026-11-06

**The mirror saves essentially the whole Drive fetch: 47 files (49.8 MB) in 25–31 ms from disk against
3.0–14.7 s from Drive, the same 49.8 MB each way.** Measured on the production Pi, read-only, by a
script that took one resident's 47 photo ids out of the mirror index and timed (a) reading them from
`/mnt/lanna-mirror` and (b) fetching the same ids from the Drive API with the app's own OAuth
credentials, alternating the two over several rounds:

| requests in flight | mirror | Drive | gap |
| --- | --- | --- | --- |
| 4 | 27 ms, 22 ms | 14.66 s, 11.15 s | 12.9 s |
| 16 (browser-like) | 32 ms, 29 ms | 3.71 s, 3.01 s | **3.3 s** |

**3.3 s is the figure that reaches a user**, because a browser requests the thumbnails more or less at
once and the Pi's Drive fetches then overlap.

### The phone readings, and why they needed the server-side run

Lutan timed one resident's Photos tab on his phone over mobile data, six readings, interleaved, with
`MIRROR_DEST` toggled and `lanna-care` restarted before each: **mirror on 13.1 / 9.47 / 9.14 s, mirror
off 13.99 / 12.17 / 11.67 s** (medians 9.5 and 12.2). Suggestive, never conclusive — two readings of
the *same* configuration differed by 3.63 s, which is more than the difference between the
configurations, and at three readings a side the sets did not separate. **The server-side run agrees
with them and can resolve what they could not: the phone was seeing the 3.3 s, buried in its own
noise.**

An earlier pair taken on 2026-11-05 — 1 min 18 s with the mirror on and 1 min 18 s with it off —
**measured nothing about the mirror and must not be cited.** The grid was still requesting full-size
originals then (about 47.8 MB), so the phone link dominated and any mirror saving was buried under it.
That was fixed separately (`docs/decisions/2026-11-06-photo-grid-thumbnails.md`), which is what made a
3 s effect measurable at all.

### Two caveats, neither of which changes the conclusion

- **49.8 MB in 25 ms is RAM, not disk.** The kernel's page cache held the files, and `drop_caches`
  needs a root the automation does not have. The coldest figure taken, the first round of the first
  run, was **664 ms** — still 20× faster than the quickest Drive round, so the conclusion survives the
  confound by an order of magnitude.
- **The first version of the script had a bug worth recording**, because a sanity check caught it and
  the timings did not: it accumulated bytes as `bytes += await worker(...)` across concurrent workers,
  which loses updates, and reported 1.5 MB and 13.6 MB where 49.8 MB was certain. The times were
  unaffected, but the byte totals were the only check that **both sides moved the same files**, so the
  run was redone with per-worker totals and both sides then read exactly 49.8 MB. A benchmark with no
  fairness check is not a benchmark.

These numbers also feed the Drive-mirror item's stage 2 (making the USB drive primary), which remains
Lutan's decision: about **3 s off a 12 s gallery**, from a copy that is already built, already serving,
and costs nothing.

The Pi was left as found: `MIRROR_DEST` restored, same file inode, owner and mode, both services
active, mirror mounted, benchmark script deleted.

## Scope
Photos route only (originals and sizes). Documents / attachments served by other routes are left open as an item.

## Found, not fixed
- A check that `MIRROR_DEST` is set on the Pi after a deploy would be a `scripts/check-*.mjs`; not added (owned by other streams).
- `scripts/pi/drive-mirror.mjs` unchanged. If `modifiedTime` checks are wanted, it would need to expose them; not needed now.
