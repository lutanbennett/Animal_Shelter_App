# 2026-11-07 — approval flag, app half (`#7aev4`)

**What shipped.** A *Private only* answer on every approval stage that lives on `/photos/approve` and rides `attachments`:
resident photos, event photos, project photos, and the *who is in the photo* tab (its existing "keep it off the website" tick
now records Private only on the new resident rows instead of leaving them waiting). One server action,
`markPhotosPrivateOnly(ids, kind)` in `src/app/photos/approve/actions.ts`, writes only `private_only_at` (`approval` is generated;
who and when are stamped by the 0318 trigger). It asks `photos.approve`, the activity `can_approve_photos()` checks.
Each button is drawn under the same gate as the Approve button beside it (the page opens on `photos.approve`; the project tab also
takes `canApprove`). Every queue loader and `countPhotosWaiting` also filter `private_only_at is null`, so a refused photo leaves
the queue and the home tile. Proven on dev: count 2 to 1 after pressing it; the 0318 harness proves Private only is never public.

**Enumeration (deliverable 1), by reading what anon reads** (`PUBLIC_VIEWS` in `check-public-views.mjs`, then each view's
definition). Everything photographic ridden by `attachments`: resident photos, adoption updates, project, event and appeal photos.
**Three surfaces do NOT ride `attachments` and carry no approval at all**: `site_content_photos` (page management, so excluded by
Lutan's rule), `donation_channels.qr_drive_file_id` (owner-run, public while `shown`), `shelter_friends.logo_drive_file_id`.
They have no approval stage to put a third answer on; giving them one is schema, which this stream may not add. Reported for the
planner. Not checked: whether a resident profile photo can ever be a Drive file that is not an attachment (it is promoted from one).
The pattern was reading view bodies for `drive_file_id`/`photo`/`logo`/`qr`; a media column with another name would have been missed.

**Not done / found.** Page management left untouched (no code names a role). The resident gallery still captions any
`approved_at is null` photo "waiting for approval", so a Private only photo reads as waiting there; found, not fixed
(`src/components/PhotoGallery.tsx`). No change to `delete_resident_photo`, `set_resident_profile_photo` or `record_attachment`.
The three not-mine items (approve-on-save, ready/visible link, second gate) were not touched.

**Wording.** Thai is unreviewed (machine-written). English "Private only" kept as the user's own term.
