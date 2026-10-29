# Happy endings: every picture opens the animal's journey (stage 1)

2026-10-29, `claude/happy-endings-journey-page`. No migration.

- **Route:** `/adopt/journey/<resident id>`. Every picture in the Happy endings strip links to it (before, only animals with a published story linked, to `/adopt/stories/<id>`, which stays as it was).
- **Published means published.** The page reads `public_recent_adoptions` (the gate: public, adopted, not deceased, last 90 days), `public_resident_cards` (arrival date, bio, temperament) and `public_adoption_updates` (via `loadPublicStoriesFor`). An id not in the recent-adoptions view is a 404, so the page can never show an animal the strip would not.
- **Order:** arrival, with bio and temperament; the approved updates; adoption date last. The updates view carries no date column (decision 2026-10-16), so updates keep the view's order (newest first) and show no date of their own. Not changed: adding a date is a schema PR.
- **Nothing to show is still a page:** the heading, photo if any, and the adoption date, plus one line, "<name> is settling in at home. Any news the family shares will appear here." An animal with no arrival date skips that step instead of printing a blank one.
- **Both languages:** `adopt.journey` in `en.ts` and `th.ts`; bio and temperament use the approved translation when there is one.
- **Found, not fixed:** `happyEndings.readStory`/`seeStory` are now unused; left in place to keep the diff to this feature.
- **Outside the brief's folder:** one line added to `scripts/check-permission-catalogue.mjs` (the new public page must be listed), with Lutan's yes in chat on 2026-10-29.
- **Stage 2** (adopters and carers posting) is not built.
- **Not checked in a browser:** the Thai page and an animal with a bio and arrival date (the dev data has one adopted animal with a story).
