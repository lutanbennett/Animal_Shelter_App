# Adoption updates take videos: the app half (2026-11-03)

Item: *An adoption update cannot take a video* (`docs/backlog.md`). Schema half: `0303`, #1229. Lutan, 2026-11-02:
*"Yes, show publicly"*.

## The activity (deliverable 1)

The update form's **save** asks `resident.adoption_news` (`adoption-updates/actions.ts:73`, `:145`). Attaching a file is a
different act with its own check, and it is **not** the save's:

- Photo route `src/app/api/residents/[id]/photos/route.ts:44` asks `photos.resident_add`, and refuses a login with one
  folder (`:97-101`) when an update id is sent.
- **The database is stricter, and is the real gate:** `record_attachment` (0217, `Shelter folder only` exception)
  refuses an adopter's file to a login that cannot `can_publish_resident_photos()`, i.e. holds `photos.resident_publish`.
  I found this by trying it: a login with `residents` + `add_medical_photos` was offered the picker (the folder rule let it
  through), uploaded to Drive, and was then refused by the database with *"This login can add photos to the Shelter folder
  only."*

So the picker is drawn only when `can(perms, "photos.resident_add") && can(perms, "photos.resident_publish")`
(`AdoptionUpdatePage.tsx`, prop `canAttach`, default false), and the video **start** route refuses a missing
`photos.resident_publish` before it touches Drive (a 500 MB upload must not be wasted on a refusal).

**Found, not fixed (for the planner, `docs/card-access-faults.md`):** on dev **no card holds `photos.resident_publish`**
(`card_grants`: only `add_medical_photos` and `medical_records` hold `photos.medical_add`; none holds publish). The
`residents` card is the one that carries `resident.adoption_news`, yet a login holding only it cannot attach any photo or
video to an adoption update: the picker is now hidden for it, where before it was drawn and the database refused. `cards.ts`
(line 96-114) no longer lists publish either. Only Admin can attach files today. Which card should hold it is Lutan's.

## How video is told from photo (deliverable 6)

`public_adoption_updates` rows carry only `drive_file_id`, and a signed-out reader cannot read `attachments`, so neither
suggested method (join `media_kind`, test the file name) is available to a public page without a migration or the service
role. **Chosen: ask Drive for the file's `mimeType`** (`findVideoIds` in `src/lib/adoption-updates/public.ts`), only for ids
the view already listed, cached per process. A failed lookup counts as a photo (the photo proxy still serves a thumbnail),
never as a video that will not play. `PublicStory.videoIds` is that subset; `photoIds` is unchanged so the cover pictures on
`/adopt` and `/r/` still work.

## Video path

`start` and `finish` take an optional `adoptionUpdateId`. Start files the video under `Adoption updates/<YYYYMMDD>/`
(`ensureResidentAdoptionUpdateFolder`, the photo route's call); `finish` re-checks the update is this resident's and that
the folder start used is that update's dated one, then passes the id to `record_attachment`. Sizes unchanged: photos
15 MB (`MAX_UPLOAD_BYTES`), videos 500 MB (`MAX_VIDEO_BYTES`), MP4/MOV only. `video_uploads` has no update column and I
may add no migration, so the dated folder name is the carrier.

## Two faults found on dev that the brief did not name

1. **`/api/videos/` was not a public path.** The session proxy redirected a signed-out request to `/login`, so the
   public pages' videos could not have played, whatever the route's own `is_public_drive_file` check said. Added to
   `PUBLIC_PATH_PREFIXES` (`src/lib/public-paths.ts`, with test rows). The route still answers a signed-out visitor only
   for ids the view lists: measured, a listed video 206, an unshared update's video 404, a staff-only id 404, a malformed id 400.
2. **A video became a resident's public profile picture.** `record_attachment` makes a resident's first file their profile
   photo; `public_resident_cards.profile_photo_drive_file_id` then made the file public, so an **unshared, unapproved
   update video streamed to a signed-out visitor** (measured: 206). Pre-existing for any video uploaded as a resident's
   first file. `finish` now undoes it when `is_profile` is returned (service-role update scoped to that resident and that
   file id, after the permission check). The existing dev row was reset by hand. Re-measured after the fix: 404.
   The database should refuse this itself (a `media_kind` guard in `record_attachment`): a schema item for the planner.

## The auto-approval question (deliverable 8): REPORT ONLY, NOT CHANGED

**True.** `0217_photo_approval.sql:78-85`, `attachments_approval_stamp()` on INSERT stamps `approved_at` whenever
`new.adoption_update_id is not null` (line 82, among `owner_type <> 'resident'`, Medical, `auth.uid() is null`, or a login
that can publish). Measured on dev: a video uploaded to an update has `approved_at` set at upload (admin both times, but the
branch that fired is the update id, which holds for any login). So **sharing an update publishes its video the moment the
box is ticked, with no approval step**, exactly as it does for photos since 0217. The view still guards on `approved_at`,
which is therefore always true for update files. No code was changed. Nobody is recorded as having decided this; for the
planner to put to Lutan.

## Silent drop (deliverable 4)

`addFiles` no longer filters. Every picked file stays in the list; one the form cannot take (not an image, not MP4/MOV, over
its kind's limit) is marked with a reason (`form.notAccepted`, `form.fileTooLarge`, `form.videoTooLarge`) and is counted as
failed on save, never sent. Verified in the browser with a `.txt`, a `.avi` and a 16 MB jpeg.

## Not settled / not done

- Thai wording is new and unread by a Thai speaker (`photos`, `addMorePhotos`, `photosHint`, `videoTooLarge`,
  `notAccepted`, `photosFailed`, `savedRetryHint`, `videoAlt`). Not read in the browser either.
- A video on a **real phone** was not driven; the test videos were 2–3 MB random bytes (one 8 MB chunk, so progress jumped
  straight to done and the bar was not seen mid-way). The chunk loop is the existing, unchanged `resumable-video.ts`.
- Random bytes have no frame, so **the poster image was not seen**; the poster URL is the one the gallery already uses for
  staff and the markup was read (`poster=/api/photos/<id>?w=800`, `preload=none`, no `autoplay`).
- Playback of a real clip to a signed-out visitor from Drive (not the Pi mirror) was not timed.
- `PhotoUploader.tsx`'s own `addFiles` also silently drops a non-image, non-video file; it is a different component and not
  touched here.
- The `Medical` photo picker for adoption updates was not exercised.
