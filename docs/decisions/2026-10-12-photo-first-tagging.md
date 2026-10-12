# 2026-10-12 — Photo first, then the resident (/photos/add)

A third way to file a resident photo, beside the hub's Photos tab and Add Medical Photos: take or
choose the photos, then say who is in each. No migration, no new route handler.

## What was reused, and the one change to it

- **Upload routes.** `/api/residents/[id]/photos` and `/api/medical/residents/[id]/photos` are untouched.
  `uploadResidentPhoto()` (PhotoUploader.tsx) gained an optional `route` argument so the new page can post
  to either; its other callers pass nothing and behave as before.
- **Which route.** Chosen on the server from the login: a login whose only folder is Medical and whose
  clinical scope is `any` (the Head of Medical, who cannot read `residents`) files through her own route;
  everyone else through the hub's. A doctor (Medical only, own clinic) therefore uses the hub's route, as
  on the hub today. Both routes still refuse a folder the login may not use.
- **Folders.** `photoCategoriesFor(perms)`: all four for a login that may publish, Medical alone
  otherwise. Default Shelter; a one-folder login sees a sentence, not a choice.
- **The picker.** `src/app/medical/ResidentPicker.tsx` is generalised, not copied: new optional props
  `onPick` (tile is a button), `onQueryChange` (live search, no form) and `before` (a slot). With none of
  them it renders exactly what /medical/weight and /medical/photos used. It has no hooks, so it renders
  from server or client. Tiles now also show the R-code, and `matchesQuery` matches R-code and
  enclosure name as well as name; `PickableResident` gained `code` (the view already had it).

## How several photos are tagged

Photos stay in browser memory. Tagging a photo to a resident uploads it at once. A tap tags the picked
photo; **All to the same resident** makes the tap tag every photo that has nobody yet. After a tap the
next untagged photo is picked. Tapping an already-tagged photo and then a second dog adds a second tag:
one upload per resident, as uploads are today (no shared file). Uploads run one at a time because the
first upload for a resident may create their Drive folder and two at once would make two.

The count is photos with at least one tag ("3 of 5 tagged"). A failed upload keeps its tag, shown red
with Try again, and the page still counts as unsafe to leave.

## Leaving the page

While any photo is untagged, saving or failed: `beforeunload` (tab close, reload) and a capture-phase
click listener that `confirm()`s on any in-app link to another path. Browser back is not intercepted
(no history trap); the `beforeunload` prompt covers it only for a full unload.

## What "recent and nearby" reads

Recent: the last 8 resident ids this person tagged, in this browser's `localStorage` (so per device, not
per account; wrapped in try/catch and absent in a private window). Nearby: the other residents in the
enclosure of the most recent one. Both are filtered by the search box and capped at 8. Nothing is stored
server-side.

## Home tile and permission

Route `/photos/add`, activity `photos.resident_add`, no scope. A role with no jobs gets the tile from the
registry like any page. A role *with* jobs (2IC) gets it appended after its jobs in `homeTilesFor`, not
as a new job: adding a job would make `check-2ic-role.mjs` compare a second bundle against the 2IC's
stored cells. The Head of Medical already has Add Medical Photos and gets no second tile; her URL works
and files to Medical only. A login without the activity gets no tile and `requirePermission` refuses the URL.

## Scan card

Not built. `ScanCardSeam.tsx` is rendered beside the search and returns nothing; the *Pick the resident
by scanning their name card* item replaces its body and calls `onFound(resident)`.

## Not done

Date taken is today's date (as Add Medical Photos does), not the file's date; the hub's date field is not
offered here.
