# Photos to approve: the approval half of volunteer photos

2026-10-17. Closes the loop that `0217` (`2026-10-17-photo-approval-schema.md`) and #699 (`2026-10-17-add-shelter-photos-card.md`) opened: a login holding Add Shelter Photos can file, and Management can now approve, so the two backlog items are ticked. **No migration.** Approving is an `update` of `approved_at`; the trigger from `0217` stamps `approved_by` and refuses anyone who may not publish.

## The page

`/photos/approve`, gated on `photos.resident_publish` (the activity the database itself checks), registered in the route registry so `canOpen`, the permission catalogue check and the home agree. Each waiting photo is a card on its own: the picture at 800 px (up to 70% of the screen height, `object-contain`, never cropped), the resident's name and code (the name links to the resident), who added it and when, a tick box, **Approve** (the primary button) and **Remove** (a smaller red one, shown only to a login that also holds `photos.resident_manage`, because that is what `delete_resident_photo()` demands). One column on a phone, two on a wide screen, oldest first. The list is a plain `<ul>` of one card component fed by `loadWaitingPhotos()`.

## The thing that can hurt: approving without looking

- **No "approve all", no "select all".** Bulk approve is a sticky bar that appears only once photos are ticked one by one, labelled with the count ("Approve 3 ticked photos"). Pressing it opens a confirmation that names the residents and asks if each was looked at. The server also refuses more than 50 ids in one call.
- **Images are large** (not thumbnails), because a thumbnail grid is exactly what turns this into a rubber stamp.
- The server action updates only rows that are still waiting (`approved_at is null`), so a double tap or a stale page cannot re-stamp an approved photo with a new time and approver.

## Remove: the order, and why

`removeWaitingPhoto()` checks the photo is **still waiting** (a stale page must never delete a photo that is already on the website), then deletes the row through `delete_resident_photo()`, **then** trashes the Drive file. The same order as the resident's own Remove button. The alternative (Drive first) can leave a photo in the app whose file is gone, a broken picture on a resident's page. Row first fails the other way: a stray file in the resident's Drive folder that no screen shows, and the person is told so ("removed here, but its file is still in Google Drive"). `trashFile` moves to Drive's bin, which keeps the file 30 days, and the confirmation says so. The function is atomic, Drive is not (`2026-10-17-pending-photos-schema.md`), so one of the two orders had to leave a loose end, and this is the quiet one.

## The home tile

Not a card and not tied to a role key. `withApprovalTile()` in `tiles.ts` adds **Photos to approve** to the home of any login whose `photosWaiting` count is a number, and `countPhotosWaiting()` returns a number only for a login that may publish (`undefined` otherwise, as `countBillsWaiting` does). That is one rule at one point instead of a line in `managementDay()`, the card path, the jobs path and the derived path, and it follows the activity if a shelter later gives it to another role. With nothing waiting the tile is still there, with no number, so Management learns where the page is. The badge says "3 waiting"; the number is also on the resident's Photos section as a sentence and link when that resident has any waiting.

## The profile-photo guard (#699) survives

`setResidentProfilePhoto()` still refuses a photo whose `approved_at` is null and passes one that has a value, so approving makes a photo eligible and nothing sets it by itself. Unchanged by this PR.

## Where the pending (enclosure) photo attaches

The next stream, `enclosure-photos-app`, shows *"Taken in Blue Enclosure 3, resident not chosen"* rows on this same page. They do **not** fit the `WaitingPhoto` shape (no resident, a candidate list, a choose-the-resident step), so nothing here is shaped for them. They attach in `src/app/photos/approve/page.tsx`: a second loader (`pending_photos`) and a second card component rendered in its own list above or below the resident photos, and `countPhotosWaiting()` adds the pending count so the one tile counts both. Nothing was stubbed, no tab or disabled control exists. Cost of leaving room: none, because the page is already "load a list, render a card per row"; a refactor to a shared list type was judged worse than a second list.

## Not done on purpose

- **No role was given the card, and none was given the tile as data.** `role_cards` is data; Lutan, 2026-10-17: "Once I have the tile with the permissions I'll add it to the volunteer profile." Management and Admin see Photos to approve because they hold `photos.resident_publish`.
- **The service-role read in the Shelter upload route (#699) is untouched.** The planner session relayed that replacing it is assigned to the `enclosure-photos-app` stream (Lutan took the planner's recommendation, 2026-10-17), so this PR writes no migration and does not touch that route.
- **Approving a photo does not make it the profile photo**, and withdrawing an approval is not offered on this page (the database allows it; no screen asks for it yet).

## The release note

Written for what the app does now, not who has been given the card: someone who has been given Add Shelter Photos can file photos, and Management approves before the website can show them. It says the card is given in Settings, so it does not claim volunteers have it (`2026-10-11-release-note-truth-rule.md`).
