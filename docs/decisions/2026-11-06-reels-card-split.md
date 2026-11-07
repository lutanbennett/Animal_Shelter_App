# Split `social.library` for reels (0329, backlog #i7qkz, Reels half)

Lutan, 2026-11-05: *"No cards for adding Meme's and Reels, these should be separate cards and should allow add and update
permissions, not delete or publish permissions."* Recording where a post went stays with the add card (his words, same day).
The meme half is `0326` (`2026-11-06-social-library-split.md`); this is the other half.

## Step zero

The gap was open: every reel screen, upload route, action and policy still asked `social.library`
(`grep -rn "social.library" src/app/reels`), no card held `social.library` at Read alone before `meme_view` (0326), and the migration
number read `0329` after `0328_website_statistic_switches.sql` with no open PR. `check-migration-numbers.mjs` named only the two
recorded pairs (`0191`, `0324`).

## Decision: reels get their own two activities, not a reuse of the meme ones

`social.reels` (level, sort 84) is add-and-change plus recording a post; Read browses. `social.reels_manage` (yes/no, sort 85) is
archive, restore, delete a reel and remove a post record. Reusing `social.library_manage` was the other option 0326 left open. It
was refused because a Reel card and a Meme card must be holdable independently (Lutan: *separate cards*), and one shared
activity would make "can archive memes" and "can archive reels" the same switch.

## What changed

- **Policies per command.** `reels` and `reel_residents` were `for all`, so a login at Edit could delete a reel row; only a missing
  button stopped it. `reels` delete asks `social.reels_manage`. `reel_residents` delete stays on `social.reels` (an edit that drops a
  resident drops its link, which is changing a reel). `social_shares`: only the `reel` branch of each policy moves (select/insert/
  update to `social.reels`, delete to `social.reels_manage`); the attachment and meme branches are copied exactly from 0326.
- **Archive flag.** `reels_archive_guard` (BEFORE UPDATE, the 0326 shape) refuses a change to `reels.archived` without
  `social.reels_manage`.
- **Cards** (`main` is at 50 after 0327; three new makes 53): `reel_library` (reels edit +
  manage + `resident.who_and_where` read), `reel_add` (reels edit + who_and_where read), **`reel_view` (reels read alone)**.
- **Actions** (each asks what its own policy asks): `updateReel`, `recordReelShare` → `social.reels`; `setReelArchived`,
  `removeReelShare` → `social.reels_manage`. `/api/reels/start` and `/finish` → `social.reels`.
- **Resident search.** New `/api/reels/resident-search` asks `resident.who_and_where` Read and reads the `resident_who_and_where`
  view (no behaviour or past-story notes). `TagNoteField` gained a `searchUrl` prop defaulting to the general
  `/api/residents/tag-search`; the reel form passes the new one and draws the `#` picker on `resident.who_and_where` Read. No card
  was widened and `/api/residents/tag-search` is untouched.

## The Read-only card

**`reel_view`** holds `social.reels` at Read and nothing else. `node scripts/dev-signin.mjs --cards reel_view --port 3006` builds
a login that can open `/reels` and a reel, and change nothing. Batch 3's `reels-readonly-drive` is briefed against this key.

## Management is no worse off

Before this file the reel screens asked `social.library`, so any login holding a meme card could use Reels. The migration gives
each holder of `meme_library`, `meme_add`, `meme_view` the matching `reel_library`, `reel_add`, `reel_view` (`role_cards`), so no
holder loses the Reels screens on the day. This is a data copy, not code that names a role; Lutan rebuilds the card assignments
later and these two sets can then be separated. The migration's report block prints any role that lost an activity level; none printed on dev.

## What the meme half did not provide, and this did

A Read-only card existed only for memes, the reel `#` picker came up short for a `who_and_where` login, and the reel policies
were still `for all`.

## Found, not fixed

- `/api/residents/tag-search` (resident notes) still asks `resident.record` Read. That is right for notes; unchanged.
- Thai labels for the three cards and two activities are unreviewed; nobody has read them.
- `scripts/check-social-shares-schema.mjs` and `scripts/lib/acceptance-matrix-entries.mjs` mention `social.library` only for memes
  and attachments; no reel rows exist in either, so nothing was changed.

## Files outside the brief's list that were touched (declared crossings)

`scripts/check-cards-count.mjs` (50 → 53), `scripts/check-permission-catalogue.mjs` (the three `/reels` pins),
`src/lib/permissions/cards.test.mjs` (the count), `src/components/TagNoteField.tsx` (`searchUrl` prop, default unchanged),
`src/lib/permissions/routes.ts` (`/reels` asks `social.reels`). Each forced by the new activity or the narrowed search.
