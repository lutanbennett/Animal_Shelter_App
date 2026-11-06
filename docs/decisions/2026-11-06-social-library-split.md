# Split `social.library` for memes (0326, backlog #i7qkz)

Lutan, 2026-11-05: *"No cards for adding Meme's and Reels, these should be separate cards and should allow add and update
permissions, not delete or publish permissions."* Recording where a post went stays with the add card (his words, same day).

## What was found (step zero)

- `social.library` was one level activity; Edit meant add, change, archive, record a post and remove a post record.
- `memes_write_perm` and `meme_residents_write_perm` were `for all` (0223), so Edit could delete a meme row. Only the missing
  button stopped it.
- **`social_shares` already had one policy per command** (0223, widened for reels in 0322). Insert, update and delete for the
  `meme` branch all asked `social.library`. So recording a post and removing a post record were not separable until now.

## What changed

- New activity `social.library_manage` (yes/no, sort 83): archive or restore a meme, delete a meme, remove a post record.
- `social.library` stays add-and-change: add, change, choose residents, **record a post**.
- `memes` and `meme_residents` policies become per command. `memes` delete asks `social.library_manage`. `meme_residents`
  delete stays on `social.library` because the change screen drops a resident link when an edit removes a resident.
- `social_shares` delete: only the `meme` branch moves to `social.library_manage`. The photo and `reel` branches are untouched.
- Archiving is an UPDATE of `memes.archived`, which a row policy cannot see, so `memes_archive_guard` (a BEFORE UPDATE trigger,
  the 0325 shape) refuses a change to `archived` without `social.library_manage`.
- Cards: `meme_library` (existing) gains `social.library_manage`, so nothing is taken from anyone holding it. New `meme_add`
  (`social.library` edit + `resident.who_and_where` read) and `meme_view` (`social.library` read only). `meme_view` exists so a
  Read-only login for the library can be built at all.
- Actions: `setMemeArchived` and `removeMemeShare` ask `social.library_manage`; `createMeme`, `updateMeme` and `recordMemeShare`
  stay on `social.library`. Each matches the policy it hits. The meme page hides Archive/Restore and the share Remove button
  without `social.library_manage`.

## Management is no worse off

By card: every login holding `meme_library` keeps everything it had, because that card gained the new activity (card_grants
trigger recomputes role cells). `check-card-grants` passes. Production holders were not re-read here; ask the planner for one
`check-production.mjs` reading if needed.

## Left for the Reels half

Reel screens and the `reel` policy branches still ask `social.library`. The Reels card should follow the same pattern: either
reuse `social.library_manage` for reel archive/delete or add a reel-specific one. The reel tag-search route asks
`resident.record` Read; a `resident.who_and_where` Read search belongs with that card (not built here, Reels is out of scope).
Nothing here gives any meme or reel a path to the website.

## Found, not fixed

None on the meme screens: Edit, Record a share, Archive/Restore and share Remove are all gated now. Thai labels for the two
new cards are unreviewed.

## Files outside the brief's list that were touched

`scripts/check-cards-count.mjs` (count 50 to 52) and `scripts/check-permission-catalogue.mjs` (the `/memes/[id]` pin now
decides with `social.library_manage` too). Both were required by the card and the page change.
