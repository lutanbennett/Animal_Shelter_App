# Videos of residents: stored in Drive, uploaded browser to Drive, played through our own range route

Decided and built 2026-10-20 (app half; the schema was 0229). Storage was settled by Lutan on 2026-10-18, 2026-10-19: the shelter's Drive, 1 TB. Not reopened.

- **Where a video is stored, and why:** the resident's own Drive folders, the same ones photos use (Shelter, Medical, Foster, Adoption). The 1 TB account is the shelter's existing one, so it costs the project nothing, and keeping videos beside the photos means the Medical, approval and posted-on-social rules apply to them with no copy. No YouTube or Facebook link route.
- **Upload:** `POST /api/residents/[id]/videos/start` checks the login, folder, type and size, opens a Drive *resumable* session and returns its address; the browser sends the file to Drive in 8 MiB chunks (`src/lib/uploads/resumable-video.ts`), asking Drive how much it holds after a dropped connection; `…/videos/finish` then reads the file back from Drive (size and type must match what `start` promised), calls the same `record_attachment` as a photo, and marks the row `media_kind = 'video'`. The video never passes through the app, so the 15 MB cap and the Worker's and Pi's body limits are untouched. The session address is the credential for that one file; it is never stored (`video_uploads` holds no address).
- **Cap:** 500 MB per video, about five minutes. MP4 and MOV only. Refused in the browser before any byte moves, and again by `start`.
- **Playback:** `GET /api/videos/[fileId]` streams from Drive with the browser's `Range` header passed through (206 with `Content-Range`), so iOS Safari, which refuses a video from a server that cannot answer a range request, plays it inline (`playsInline`). Chosen over Drive's own player because it keeps the page's sign-in and the access rule in one place. Access is the photo route's: `is_public_drive_file`, else `can_see_drive_file`; `private, no-store`; anything that is not a `video/*` answers "not found". The route is not in the public paths, so a signed-out visitor is redirected to sign-in.
- **Thumbnails:** Drive's own rendition through the photo route with `?w=`. A video with no rendition yet is *never* read into memory by the photo route (it answers "not found" and the tile shows its placeholder); that guard is the reason `downloadFile` is no longer reached for a video.
- **Never public (0230):** `public_resident_photos` is redefined with `media_kind = 'photo'`. `is_public_drive_file` reads that view, so a video file is no longer "public" either; the website cannot show one and neither proxy serves one to a signed-out visitor. A public video view is a deliberate later step.
- **Where videos are excluded from photo-only readers:** the meme maker's pickers, the deceased-resident archive PDF (`resident-record.ts`), and the profile-photo button in the gallery.
- **Service role:** the two upload routes use the service-role client, only after `photos.resident_add` is checked, for `video_uploads` (service role only, 0229) and to set `media_kind` after `record_attachment` (a login that may add a photo may not hold UPDATE on the row). Both are on the ESLint allow-list.
- **Drive space:** a tile on System status (`about.storageQuota`), amber at 80%, red at 95%, local to the page like the calendar tile: it never emails an alert.

## Not done, on purpose

- Real-device playback on an iPhone and an Android.
- Sweeping `video_uploads` rows left `started` for a day to `abandoned` (nothing reads them yet; the table is bookkeeping only).
- A public video view, and videos for the Head of Medical's own Medical-only uploader and the adoption-update form (`/api/medical/…`, `/api/photos/shelter`, `/api/photos/pending` remain image-only).
- A server-side refusal of a video as profile photo (the button is hidden; `setResidentProfilePhoto` does not yet check `media_kind`).

## Migration number

This PR's migration is `0230_public_photos_exclude_videos.sql` because `main` ends at 0229, which the pre-commit check enforces. **PR #763 (doctor medical cells) also carries `0230`.** Whichever merges second must run `worktree.mjs sync`, rename its file to `0231_…`, and fix its dev row (`update schema_migrations set filename = …`). Merge #763 first: this one's view change is small and re-runnable.
