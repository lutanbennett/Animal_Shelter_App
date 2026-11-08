# `/photos/add` says why its picker is empty, and the queue names a photo for what it is

Backlog `#ay3d6` and `#nssnt`. Branch `claude/photos-add-messages`. No migration.

## Step zero

Checked on `main` at `a7f1ad84`: `/photos/add` passed no empty note, there was no `emptyKind` under `src/app/photos/`, and the
approval queue heading still read "tagged to an enclosure". The gap was there; built here.

## Deliverable 3: what an empty photo-category list does (a UI trap only, not a Drive fault)

`photoCategoriesFor` returns `[]` for a login holding neither `photos.resident_publish`, `photos.shelter_add` nor
`photos.medical_add`. The page itself opens on `photos.resident_add` OR `photos.shelter_add`, so a login holding only
`photos.resident_add` reaches the page with `[]`.

Of the three candidates: **it does not throw on the server and it does not write to the Drive root.** Every save path refuses
before Drive is touched: `/api/photos/pending` returns 403 when `photoCategoriesFor(perms)` lacks `"Shelter"` (line 44), and
`/api/residents/[id]/photos` refuses a category not in its own `photoCategoriesFor` list. So no photo can land in a wrong folder.
What was wrong is on screen: `AddPhotosFlow` set `folder` to `categories[0]` (undefined), drew "These go in the  folder", and let
the person pick photos and tag them, each save then failing with "You can't add photos". **Fixed:** the page shows `noFolders`
instead of the flow when `categories` is empty (nothing to file into, so nothing to offer). `HOLDING_FOLDER` was not needed: a
fallback folder would have turned a refusal into a quiet write.

## Deliverable 5: one shared helper, not the pattern copied

`residentsEmptyKind(perms, count, error)` now lives in `src/lib/medical/residents.ts` beside `loadPickableResidents`. The meme
screens already shared one loader (`loadMemeResidents`), so extracting touched one function, not three call sites, and its
behaviour is unchanged (same `can(...)` test, same "a failed read is never `none`"). Copying would have left two copies of a rule
whose whole point is not to say "no residents" when the truth is "your cards can't see them". Unit test:
`src/lib/medical/residents-empty-kind.test.mjs`.

## Strings

`addPhotos.noResidentsOnFile`, `cannotSeeResidents`, `noFolders` (en + th), naming no role and not saying "ask an admin". The
existing meme `cannotSeeResidents` does say "Ask an admin to check them"; left alone as out of scope, and it breaks the no-role-name
rule: for the planner to file. The Thai is unreviewed.

`photoApproval.pending.heading` is now "N photos waiting to be named" / `รอระบุตัวสัตว์`, true for an enclosure-tagged photo and a
no-place photo alike. Comments in `approve/page.tsx` and `ApproveQueue.tsx` described the queue as enclosure-only and were
corrected. **Found, not fixed:** `en.ts:1567` (a 30-day alert, "photos tagged to an enclosure have waited more than 30 days") has
the same imprecision for no-place photos; it is outside this item's files.

## What I saw on screen

Port 3002, login holding exactly `add_photos`, reached `/photos/add` by clicking from Home. With a photo chosen the picker listed
both dev residents, so neither empty state could be reached without deleting shared dev rows (forbidden), and no login holding
only `resident_add` was available. The two empty cases and the empty-folders case are covered by the unit test and by
type-checking, **not driven on screen**. The approval queue heading was not driven either.
