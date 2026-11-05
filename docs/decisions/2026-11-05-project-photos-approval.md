# Project photos wait for approval (#k7v2p, migration 0316)

**Status: built, applied to dev. Production needs 0316 applied before the deploy.**

## Step zero (brief)
The gap was real: `public_project_photos` (0109) had no `approved_at` condition, and `attachments_approval_stamp()` (0312) approved
every non-resident, non-event attachment on insert, so a project photo was public the instant it was saved.

## The back-fill: none is written, and nothing public disappears
0217 back-filled every attachment that existed, and from then until 0316 the stamp approved every project attachment on insert.
So **every project attachment that exists is already approved**. Measured on dev before seeding: zero project rows with
`approved_at is null`. Gating the view therefore hides nothing currently on the site, and only photos filed after 0316 wait.
This follows 0217's reasoning (what was already public counts as approved). A back-fill `update` would be wrong on a re-run (it
would approve a waiting photo), so 0316 has none. No change to what the shelter shows is Lutan's to decide here.

## What the fix needed (three paths, not one)
1. **Trigger:** a `project` *image* is approved on save only for a session with no login or a login holding `photos.approve`
   (`can_approve_photos()`). A non-image project file (PDF) stays approved on save: never public (0109), would only clutter the queue.
2. **Policies:** `attachments` select/update/delete gained an approver arm for `project` (as 0314 did for events). Without it an
   approver without `projects.photos` sees an empty queue and cannot act.
3. **Views:** `public_project_photos` gets `approved_at is not null`. **`public_projects` was a second leak the brief did not name:**
   its `cover_drive_file_id` (including an explicitly chosen `cover_attachment_id`) and `photo_count` read `attachments` directly, so a
   waiting photo could be the card cover and be served by the proxy through `public_projects`. Both now ask `approved_at`.

## The file proxy (deliverable 3)
`is_public_drive_file()` (live body 0314) reads `public_project_photos` and `public_projects.cover_drive_file_id`, so closing both
views closes the proxy; it is not redefined. Proved on dev with a distinct fake id: while waiting the function returned `false`;
after approval, `true`.

## Controls and the activity each asks
Tab "Project photos" on `/photos/approve` (`ProjectPhotoQueue.tsx`), drawn only when `photos.approve`.
- Approve: `approveProjectPhotos` asks `photos.approve`; the database asks `can_approve_photos()` (photos.approve and not medical-only).
- Remove: `removeWaitingProjectPhoto` asks `photos.approve`; delete policy asks `projects.photos OR can_approve_photos()`.
The component takes `canApprove`, **default false**, so a caller that forgets offers nothing.

## Proof (dev, one-card logins)
`approve_photos` only: tab visible with Approve/Remove; Approve stuck (`approved_by` stamped); proxy then true.
`view_residents` only: cannot read the waiting row; a direct update returned zero rows and the row stayed waiting.

## How a further tab plugs in (for #7j2qf)
Add a loader to `src/lib/photos/approval.ts`, actions beside `approveProjectPhotos`, a queue component taking a `can…` prop that
defaults to false, a `tabs.<key>` string in en/th, and one `tabs.push({ key, label, count, content })` in `page.tsx` under the
activity its actions ask. Add its count to `countPhotosWaiting()` so the home tile counts it.

## Found, not fixed
- The approver's update policy lets them write other columns of a project attachment (caption), as for events; the trigger only
  guards the approval columns.
- The waiting project photo shows "A project folder" for a login without project read (names are unreadable to it), like events.
- No card currently carries `projects.photos` in `cards.ts` that I could find by grep; I did not investigate how project uploaders are granted it.
