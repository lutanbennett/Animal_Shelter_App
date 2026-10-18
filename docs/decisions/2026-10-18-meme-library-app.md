# Meme library, stage 1: the app half (`meme-library-app`)

2026-10-18. The half a user can see of the meme library, on the tables `0223` landed (`docs/decisions/2026-10-18-social-shares-schema.md`): `/memes`, a meme's own page, Add a meme, the resident page's Memes list, the `meme_library` card, the Memes folder in Drive. **No migration.** Stage 2, the meme maker, is a separate backlog item and is not started here.

## The one thing that could hurt someone, and where the gate is pinned

A meme is a joke made from a named animal's photograph, possibly a medical or sad one, and the repository and website are public. Every surface that can show a meme asks `social.library`:

| Surface | Gate |
|---|---|
| `/memes`, `/memes/[id]` | `requirePermission("social.library", "read")`; Add, Record a share, Edit, Archive drawn at Edit, and the actions ask `can()` again |
| `/memes/new`, `/memes/[id]/edit` | `requirePermission("social.library")` |
| The image | the photo route serves a meme's file only to a session whose own `select` on `memes` returns the row (RLS: `social.library` at Read); `private, no-store`, never edge-cached |
| The resident page's Memes list | the server loads it only when `canBrowseMemes(perms)`; a login without the library gets `null` and no list is drawn, so a role that can open the resident's page learns nothing |

`is_public_drive_file()` is untouched and no public view reads the tables (`check-public-views.mjs` refuses anon on all three since `0223`). Proved in the browser: a signed-out `GET /api/photos/<meme file id>` is `404 Photo not found.`, the same answer as a made-up id.

## Decision (a): the image route asks the `memes` table, not `can_see_drive_file()`

`can_see_drive_file()` (`0193`) is the one function the photo route asks for internal files, and the rule is that a new table carrying a Drive id is added there. This stream carries no migration (the batch's one migration slot is `role-home-is-tiles`), so the route asks `memes` directly as the caller, exactly as it already asks `public_adoption_updates` for a story photo (the `0214` stream, same constraint). Same security model: RLS decides, as the caller, and an error is "no". **Fold `memes` into `can_see_drive_file()` in the next schema PR** and drop the extra query; a backlog note says so.

## Decision (b): filtering and search happen in the page, not in SQL

The library is a few hundred memes at most. The server hands every non-archived meme with its residents and shares (three queries, however many memes), and the page filters by resident, tag, platform and not-shared-yet and searches the title and both captions in memory. A phone on shelter wifi gets an answer per keystroke with no round trip, and the brief's scope guard ("if search needs more than a straightforward query, report it") never came up. If the library outgrows this, a `tsvector` on the captions and server-side filtering is the change, and nothing in the page's contract moves.

## Decision (c): the image is fixed once saved

Edit changes the title, captions, tags and residents; it does not replace the picture. A different picture is a different meme, and a replaced image would silently rewrite what every recorded share said was posted. Archive is `update memes set archived = true`, as the schema file says: the shares stay, the page still opens, Bring back restores it.

## Decision (d): one card, at Edit, bundling nothing else

`meme_library` (card twenty-five) gives `social.library` at Edit and nothing more. It is not folded into Residents or Approve photos: a meme is not a resident's photo, and whoever runs social media is not necessarily someone who manages records (the schema file's reasoning). Browse-only is the activity at Read, given as an extra in Settings. **Granted to no role here**: who gets it is Lutan's Settings step, and the release note says so rather than promising every user a library they cannot open.

## Download

A same-origin `<a download>` on the photo route's original (not a rendition): the phone saves the file instead of opening it, and what is posted is byte-for-byte what was uploaded.

## What was created on dev while testing

Two memes with plainly fake test images (solid-colour PNGs with the word TEST drawn on them), tagged to two residents, with a Facebook share (with a link) and an Instagram share on one of them. Dev test data is disposable; they are left in place.

## Not done

- `social.library` is still held by Admin alone (Lutan's step).
- `can_see_drive_file()` does not know `memes` (next schema PR, above).
- No nav entry: the page is a Management tile and a home card, as the item asked for a card.
- Stage 2, the meme maker.
