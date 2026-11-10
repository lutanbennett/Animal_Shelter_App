# Refusal keys, group 3: photo folders and the website photo (#3nuwy)

`0351_refusal_keys_photo_folders.sql` converts five messages in four functions to keys:
`set_resident_drive_folder`, `shelter_photo_folder`, `set_shelter_photo_folder`, `set_hero_photo`.
The three callers that forwarded `error.message` now call `dbRefusal()`.

## The shared-sentence judgement
Three of the five were "Not authorized to add photos." Two of them (`shelter_photo_folder`,
`set_shelter_photo_folder`) check the same activity (`photos.shelter_add`), so they share ONE key,
`photo.add_shelter_not_allowed`. The third (`set_resident_drive_folder`, `photos.resident_add`) is a different
activity on a different page, so it has its own, `photo.add_resident_not_allowed`. A Thai reader is told WHICH photos
the access does not cover, at the cost of two strings instead of one. Rule used: one key per activity asked, not per sentence.
Other keys: `photo.folder_id_invalid`, `photo.website_not_allowed`.

## The unknown-key fallback proof (deliverable 1)
`dbRefusal()` sends a key-shaped message it does not know to `unexpectedFailure()`: the generic "something went wrong"
plus a reference, raw error in the server log. It never shows the key and never a narrower sentence.
Proved by `src/lib/db-refusal.test.mjs` (two tests: unknown key; unknown key with a privilege code), run and passing
in this stream. Not driven through the browser.
Live check that the four functions now raise keys on dev: called as service role, each returned its key (42501/22023).

## Caller changes beyond the swap
- `shelter_photo_folder` used to turn ANY error into "resident not found" (404). A key-shaped error is now answered with
  its wording (403); other errors are unchanged.
- `set_shelter_photo_folder`'s error was ignored. It is now returned (403), since it can only refuse for permission or a bad id.
- Only the two `set_hero_photo` calls in `src/app/admin/website/actions.ts` changed; other `refuse(error.message)` lines belong to other groups.

## Not done
The on-screen Thai refusal: every page checks the card before the call, so a legitimate login never reaches the
database refusal. Left as `pending` in the test plan.
