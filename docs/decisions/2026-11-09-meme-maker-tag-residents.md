# The meme maker offers the resident picker (`#0awyj`)

**Found.** `/memes/make` never rendered a resident picker, so a meme made from a shelter, website or uploaded photo arrived with no
residents and had to be saved and then edited. A meme from a resident's own photo was tagged by `createMeme` merging
`source.residentIds`, which is why it looked intermittent. #1380 fixed how the other two screens read residents; it did not touch
`MemeMaker.tsx`.

**Chose.** Reuse `ResidentPicker` and `loadMemeResidents` (the #1380 reader and its `none`/`cannot` empty notes) rather than a second
picker. The page now loads the list on every maker route (photo and upload) and passes `residents`, `initialResidentIds` and
`residentsEmptyNote` down. The picker's label, button, hint and both empty notes are the existing `memes.form` strings, so there is
no new text and no Thai to review.

**Pre-filled and removable.** The photo's own residents show as already chosen so a person can take one off. For that to be true the
server must not add them back, so the maker sends `residentsChosen=1` and `createMeme` then skips the merge with `source.residentIds`.
Any other caller (no flag) behaves as before. The merge was a set union, so nothing was double-counted.

**Measured 2026-11-09 on dev.** Login holding only `meme_add`, upload source: picker offered 4 residents, "Test 1" tagged, saved; the
`meme_residents` row exists with no edit step, and Admin's view of the meme lists "Test 1". The photo-with-residents (pre-chosen,
removable) path was **not** driven: dev's only resident photo route was not exercised. It is covered by reading and typecheck only.

**Found, not fixed.** The meme page reads tagged residents from the `residents` table (`src/lib/memes/queries.ts`), so a login holding
only `resident.who_and_where` saves a tag and then sees "No resident is tagged." It is the same on all three routes. For the planner to
file; the fix is to read through `resident_who_and_where`.

**Controls on the page.** The picker button and Save both ask `social.library` at edit, the activity the page and `createMeme` already
require, so none shows to a login the action would refuse.
