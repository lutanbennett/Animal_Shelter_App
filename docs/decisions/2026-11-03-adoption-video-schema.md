# 2026-11-03 — adoption-video schema half (migration 0303)

Lutan, 2026-11-02: *"Yes, show publicly"* — a video on an adoption update staff shared publicly shows on the website.

**Current exclusion (deliverable 1).** Last redefined in `0217_photo_approval.sql:357-376`; the non-image exclusion is a file-name test,
`0217_photo_approval.sql:373`: `att.file_name ~* '\.(jpe?g|png|webp|heic|heif|gif)$'`. (0245 and 0285 only restate `is_public_drive_file()`.)

**Change.** `0303_public_adoption_updates_videos.sql` restates the view with the one line widened to add `mp4|mov|m4v|webm`. Same columns, order, grants.
Every other guard is untouched: `share_publicly`, `is_public_visible`, not Deceased, `owner_type = 'resident'`, never the `Medical` sub-folder, `approved_at` not null.
The upload box accepts mp4 and mov (`PhotoUploader.tsx:308`); m4v and webm are included for safety.

**Proof (dev, `begin … rollback`, raising exceptions).** Shared video listed; shared image still listed; `is_public_drive_file()` true for the shared video;
absent: unshared update's video, medical-folder video, deceased resident's video, unapproved video, shared pdf; `is_public_drive_file()` false for the unshared, medical and deceased ones.
Harness notes: an insert trigger auto-approves adoption-update files (`0217:78-85`) so the unapproved case needed a follow-up update; and a test video must carry `media_kind = 'video'`
(default `photo`), otherwise `public_resident_photos` (`0231`) lists it — real videos are filed as `video`, so that was the harness, not the view.

**Answers.** Predicate: file-name regex, one-line change. Helper: `is_public_drive_file()` (`0285:164-`) already has a branch over this view, so no second predicate.
**Public path (deliverable 7, report only):** `/api/photos/[fileId]/route.ts:146` and `/api/videos/[fileId]/route.ts:31` both call `rpc("is_public_drive_file")`;
if true, anyone (signed out included) is served, otherwise `can_see_drive_file` (`videos/route.ts:36`). So **the video route DOES have the same public path**, and with 0303 a signed-out visitor
can stream exactly the listed videos. It also refuses non-`video/` Drive content (`videos/route.ts:~75`). Public videos skip the Pi mirror and stream from Drive.
Note: adoption-update attachments are always auto-approved on insert, so the approval guard is inert for them.

**Left for the app half (`adoption-video-app`).** The form (`accept`, resumable upload with the update id, dictionaries), and the public story/journey pages drawing a `<video>` with poster, no autoplay with sound
(the view's rows carry no media kind; the page must tell video from photo, e.g. by joining `attachments.media_kind` or the file name). No `src/` change here.
Release note: n/a — nothing a user can see changes until the app half ships.
