# Deceased archive: a profile photo that cannot reach the PDF is reported (2026-10-07)

Backlog gap 4 ("a HEIC profile photo is never embedded in the PDF") was stale
when the brief was written. `a1452515` (2026-09-24) already makes
`loadProfilePhoto()` try Drive's JPEG thumbnail first, and Drive renders HEIC, so
`EMBEDDABLE_IMAGE_TYPES` only gates the *fallback* original. Nothing in the tree
reads the item's old claim; the code simply was never re-checked against it.

## Options weighed

1. **Convert on upload.** Rejected: the Worker has no native codec, `sharp`
   cannot run there, a WASM HEIC decoder is a new runtime dependency (and
   `advisory-bump` owns `package.json` this batch), and Drive already does the
   conversion for free.
2. **Note it in the manual.** Done as well, but alone it leaves a silent
   failure in the file that is the lasting record of an animal.
3. **Say so at the moment it happens.** Chosen. The archive was already
   returning only `{ ok }` / `{ error }`; the "no picture" case ended in a
   `console.warn` nobody sees. `archiveDeceasedResident()` now returns
   `photoMissing` (a profile photo is set and could not be embedded), and the
   existing warning channels carry it: the upload response and
   set-profile/delete/move actions (`archiveWarning`), and the edit redirect
   (`?archive=nophoto`, rendered on the hub banner beside `?archive=stale`).

## What a HEIC profile photo does now

Unchanged: Drive's JPEG thumbnail is embedded. New: if Drive has no thumbnail
yet, or the file is too large, the editor is told the PDF has no picture and to
choose a JPEG/PNG or press Refresh archive.

## Not closed

The backlog item stays open on its manual half: only a real iPhone HEIC proves
Drive's rendition carries orientation and colour correctly. It is in the test
plan's Left for manual verification table.
