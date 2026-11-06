# Reels follow-ups (`#8bz78`, remainder) — 2026-11-06

Branch `claude/reels-follow-ups`, on `docs/decisions/2026-11-06-reels-app.md`.

## Step zero
`loadResidentReels` did not exist; nothing read `reel_residents` on the resident page. The link from the meme library to `/reels`
**had already landed** in `2fc92f6d` (reels-app), so deliverable 3 needed no code. The gaps were otherwise present, so this was built.

## 1. `can_see_drive_file()` lists reels — `0324`
The live definition is **`0286`** (`0193` and `0218` are older versions of the same function; each was opened). `0324` is `0286`'s
body plus one `reels` branch, security invoker, so the reels row is answered by its own RLS (`reels_select_perm`, `social.library`
at Read). Dry-run ok, applied to dev. `check-can-see-drive-file.mjs` lists `["reels","drive_file_id"]`.

**`/api/reels/[id]/video` is REMOVED.** Two ways in is two decision points, and `0286` removed exactly that for memes. The player
and Download now use `/api/videos/<drive file id>` (`videoUrl()` in `drive-client.ts`). Nothing else called the route.
Release-order note: this PR needs `0324` live before the code, as all of reels needs `0322`.

## 2. The resident page lists its reels
`loadResidentReels` (`src/lib/reels/queries.ts`) copies `loadResidentMemes`; the page gates it with `canBrowseReels` =
`can(perms, "social.library", "read")`, which is the activity `reel_residents_select_perm` asks. A reel has no still image, so the
hub card lists the first line of the description, the date and where it was posted.

## 3. Way in
Already a Reels button on the meme library page (`2fc92f6d`). The card opens one page, so `meme_library` still has `opens: "/memes"`.
No card added.

## 4. The `#` picker — judgement: **meme_library is NOT widened**
Verified: `src/app/api/residents/tag-search/route.ts:12` asks `resident.record` at Read; `ReelForm.tsx:30-46,75,86` takes `canTag`
= the same. `meme_library` holds `resident.who_and_where` Read, not that. **`resident.record` Read opens behaviour, temperament and
past-story notes and the whole record; a social-media card should not carry it to make a search box fill.** The reel link write
itself asks only `social.library` (`reel_residents_write_perm`), so the real fault is the search asking a bigger activity than the
link needs. A holder of `meme_library` alone gets a plain description box; adding a card that carries `resident.record` Read (or
`view_residents`) restores the picker. **Finding for the planner:** a reel-specific resident search asking `resident.who_and_where`
Read would fix it with no card change (not done here: `tag-search` is shared with resident notes). Also for `#i7qkz`.

## 5. No split, no new card
`social.library` untouched; no Reels card.

## 7. Read-only view — NOT driven, and why
`social.library` is held by exactly one card, `meme_library`, at **edit**. `dev-signin --cards` builds a role from real cards, so no
login can hold the library at Read alone; making one would need a throwaway card in the shared dev `card_grants`, which I did not
do. The controls all read the one `canEdit` boolean (`reels/page.tsx`, `ReelView.tsx`). Still open on `#8bz78`.

## Release note: `n/a: needs 0322–0324 applied to production`. Draft wording is in `2026-11-06-reels-app.md`.

## Thai
`reels.hub.*` in `th.ts` is unreviewed (Claude's, not a Thai speaker's).
