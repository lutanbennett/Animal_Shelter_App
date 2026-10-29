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

## Latency
Visible change: none until the Pi mirror is installed and has run; then a staff photo skips the Google call.
**pending:** before/after for opening a resident's photos on a phone over mobile data. Dev cannot reproduce it and the mirror
is not running anywhere yet; Lutan can take it after the Pi install (time the gallery with `MIRROR_DEST` unset, then set). The numbers also feed the Drive-mirror item's stage 2.

## Scope
Photos route only (originals and sizes). Documents / attachments served by other routes are left open as an item.

## Found, not fixed
- A check that `MIRROR_DEST` is set on the Pi after a deploy would be a `scripts/check-*.mjs`; not added (owned by other streams).
- `scripts/pi/drive-mirror.mjs` unchanged. If `modifiedTime` checks are wanted, it would need to expose them; not needed now.
