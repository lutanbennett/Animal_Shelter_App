# Staff videos are read from the Pi's Drive mirror when it is there (2026-10-29)

Extends `2026-10-29-pi-file-cache.md` (photos) to `/api/videos/[fileId]`, the only other staff route that fetches Drive bytes.

## Design
- `openMirroredVideo(fileId, range)` in `src/lib/mirror-read.ts` shares the index lookup and path-escape guard with `readMirroredFile` (now one `resolveMirrored`). Extensions served: `.mp4 .m4v .mov .webm`. It streams from disk (`createReadStream`) and never loads the file into memory.
- Range: `bytes=a-b`, `a-`, `-n` answer 206 with `Content-Range`; a start past the end answers 416 with `bytes */size`; a malformed or multi-range header is ignored and the whole file sent (allowed by HTTP). Any other failure is a miss and the route goes to Drive as before.
- **Authorisation first, unchanged.** The mirror is consulted after `is_public_drive_file` / `can_see_drive_file`, and only for a non-public file (public ones stay on Drive, as photos do). Headers are the same `private, no-store`, `nosniff`, inline.
- Off unless `MIRROR_DEST` is set (the production Pi only). Worker and `next dev` are unaffected.
- Known limit, as for photos: `modifiedTime` is not compared.

## Documents and attachments: nothing to do here
Checked: `driveFileUrl()` (`src/lib/google/drive-client.ts`) returns a `drive.google.com/.../view` link and staff open PDFs and reports in Drive, so no app route serves their bytes. Serving them locally means a new proxy route and a change to how staff open documents, which is Lutan's decision, not a repair. Not built; filed as its own backlog item.
`downloadFile` in `archive-deceased-resident.ts` is a background job and is left alone.

## Verification
Unit tests cover whole file, ranges, suffix, over-long end, 416, escape/gone/missing/unknown ids and the unset case. Not exercised end to end: needs the Pi with the mirror running. Latency before/after is pending, as for photos.
