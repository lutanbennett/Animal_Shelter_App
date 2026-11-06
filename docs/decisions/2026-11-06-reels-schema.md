# Reels library, schema half (0322) — 2026-11-06

Backlog `#8bz78`, schema only. Nothing in `src/` reads these tables yet; the app half is next.

## What shipped

`supabase/migrations/0322_reels.sql`: `reels`, `reel_residents`; `social_shares` widened to `'reel'` (check, guard, cleanup
trigger, four policies); `video_uploads` made able to carry a reel's upload.

## Step zero

Nothing for a reel existed (no migration, no `src/` file, no decision). Gap present, built.

## The judgement: description and #tags

**One `description` column, `reel_residents` written by the app from the #tags in it, plus a `tags text[]` (cap 30) for
hashtags that match no resident.** Consistency with `memes` was the tie-breaker: a meme has `tags text[]` (free words)
and `meme_residents` (who is in it), and a reel now has exactly those two things. `reel_residents` is the source of truth
for *who* is in a reel; `tags` holds only the leftover words (`#adopted`). The app parses both from one text box, so a
person never keeps two lists. **A reel and a meme are now consistent** — same link table shape, same tag column, same
cap, same RLS, same activity (`social.library`). The only difference is that a reel's description is the free text a
person types (`memes` has a title and two captions).

## Not the notes mechanism

`resident_note_tags.from_resident_id` is NOT NULL and the registry names the owning resident's column; a reel has no
owning resident. Neither was loosened.

## Not public

Copied from `0223`: RLS on, every policy `to authenticated`, anon holds no grant, no public view selects from either table.
`check-public-views.mjs` now also lists `reels` and `reel_residents` (a script edit, no `src/`): anon GET/POST/PATCH/DELETE
refused on both, all `ok`. Nothing gives a reel a path to the website; if anything ever does it goes behind the Director's
approval (`#7j2qf`). Facebook posting from the app (`#vkswg`) stays on hold.

## `video_uploads` DID need a change (deliverable 6)

It was **not** "none": `video_uploads.resident_id` was `NOT NULL references residents`, and a reel has no resident. 0322
drops the NOT NULL and adds `owner_kind` (`'resident'` default, or `'reel'`) with a check that a resident upload still
names its resident. Existing rows are untouched. Still service-role only. The app half: a reel upload row is
`owner_kind = 'reel'`, `resident_id` null, `attachment_id` stays null, and on completion the app inserts the `reels` row
with the Drive file id.

## Found on the way

`0223` policies called `sees_all_residents()`; `0264` removed it from the live policies. The first draft of 0322 copied
`0223` verbatim and the dry run failed (`function sees_all_residents() does not exist`). The migration copies the **live**
(`0264`) policy shape. Lesson: copy the live definition, not the file that first created it.

## Permissions

Reels reuse `social.library` (Read browses, Edit changes), as the item says. Splitting it into add/update versus
archive/record, for memes and reels together, is `#i7qkz`.

## Proof

Harness `supabase/harness/0322_reels_harness.sql` (run by `scripts/run-harness.mjs`), `begin … rollback` on dev:
a reel share records; the guard refuses a non-reel owner; deleting a reel removes its shares and leaves another reel's;
`reel_residents` refuses a duplicate pair; the meme guard still refuses a non-meme owner; a reel upload needs no resident
while a resident upload still does. Result: `HARNESS PASSED (rolled back)`.
