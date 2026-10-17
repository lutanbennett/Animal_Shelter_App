# Photos tagged to an enclosure: the app half

2026-10-17, `claude/enclosure-photos-app`. App half of *Add resident photos: tag a photo to an ENCLOSURE when you do not know which resident it is* (schema half: `2026-10-17-pending-photos-schema.md`, `0218`). **No migration.** Backlog item ticked.

## The volunteer's side

`/photos/add` gains two buttons once a photo is picked: **I know who it is** (as before) and **I don't know, tag the enclosure**. The enclosure side is zone chips, then that zone's enclosure chips, the same shelter order as everywhere, as large tap targets rather than dropdowns. The enclosures this person tagged last are listed first (browser storage, like the resident shortcuts), because a walk round one zone files several photos in one place. "All to the same resident" works for it too. It is offered only while the folder is Shelter, and never to the Head of Medical.

**Which enclosures are offered.** A volunteer holding only Add Shelter Photos cannot read `enclosures` (that needs `facility.enclosures` Read, which the card deliberately does not carry). The picker therefore reads the facility directly where it can (Management, Admin) and otherwise falls back to the enclosures somebody is living in now, from `resident_who_and_where`. The one thing that path cannot offer is an empty enclosure; the manual says so. The alternative (a narrow migration, or adding the activity to the card) was a decision for Lutan and a schema PR, so it was not folded in here.

## The upload route

`/api/photos/pending`: no resident, **no service-role client at all**. Authorised first (`photos.shelter_add` or the right to publish, and the Shelter folder), file checked by its bytes, enclosure checked through the login's own reads, then `Unsorted/<enclosure>` is found or made, the file uploaded, and the `pending_photos` row inserted **as the login** (RLS and `can_file_pending_photo()` decide). Not `record_attachment()`. If the row is refused the file just uploaded is trashed, so a refused photo leaves nothing behind. The existing Shelter route and its service-role read were not touched (they are the next schema PR).

## The approval page

Pending photos are a second list above the resident photos, with a second card, as `2026-10-17-photo-approval-queue.md` planned; nothing was unified. Each card: the picture at 800 px, **"Taken in Blue Enclosure 3, resident not chosen"**, then the residents `pending_photo_candidates()` returns for that day, **each with their own profile photo** so the approver compares faces, then a search (the same photo-tile picker as the rest of the app) for anyone else. The approver taps one or several; two animals in one shot is two taps. `countPhotosWaiting()` adds the pending count, so the one tile counts both.

**Design, not a gate** (Lutan, 2026-10-17): choosing the wrong animal is an existing risk, anyone with photo rights can already do it from the hub, and the remedy exists. So assigning has no confirmation step; the short, illustrated list is the mechanism. Discard keeps its confirmation, as Remove does.

## Assigning, and the order (the function is atomic, Drive is not)

`assignPendingPhoto` does: (1) make a Drive copy for every resident after the first, straight into that resident's `Shelter/<yymm>` folder; (2) call `assign_pending_photo()`; (3) move the original into the first resident's folder. The function needs every resident's file id and a copy only has one once it exists, so copies must come first. If step 2 fails the copies are trashed and nothing else has changed: the photo is still pending, still in Unsorted, still never public. If step 3 fails the database is already right and the photo shows (the proxy follows the id, not the folder), and the person is told the file was left in Unsorted. The reverse order could leave a resident's photo whose file had gone. The month folder uses the Bangkok day of `taken_at`, the same day the function dates the row with (`dates.test.mjs`).

## Keep it private

A tick box, **Keep it off the website**, passes `p_approve = false`. The new `attachments` rows are then waiting like any volunteer photo: `0217`'s trigger and views keep them off the public site, and the profile photo is not set. `scripts/check-public-views.mjs` is unchanged and still covers this by shape.

## Reassigning

On a waiting resident photo, **Wrong animal?** opens the same picker and moves it. The owner changes first (the database allows a login with `photos.resident_manage` to change a waiting photo's owner; it refuses an approved one, and so does the action), then the Drive file moves to the new resident's folder. If Drive fails the photo is right in the app and the person is told its file is in the old folder. Shown only to a login that can both publish and manage, because that is what the database asks.

## Discard

Row first, then the file to Drive's bin (30 days), the order of Remove; the person is told if Drive failed.

## System status

**Photos with no resident**: pending rows filed more than 30 days ago, amber when any, linking to Photos to approve. Read as the signed-in admin (RLS), not cached, not in the health report, so no alert mail. `pending_photos` has no `uploaded_at` index; with a handful of rows the scan is irrelevant.

## Not done on purpose

- No role was given the card or the tile; that is Lutan's, in Settings.
- The Shelter route's service-role folder read, and giving volunteers a real enclosure list, remain the separate schema PR.
- Browser verification as Management and as a volunteer was not done in this session; it is the manual list in the test plan.
