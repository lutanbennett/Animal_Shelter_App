# Public site phone polish: four items in one stream (2026-10-14)

From `docs/public-site-review-2026-10-13.md` §4.1, §3.2, §3.4, §3.5.

- **Phone menu.** The dialog no longer scrolls as a whole: the entries (plus Language and Staff login, now on one
  row) scroll in the middle and the Talk to us panel is pinned at the foot. Rows are 48 px, not 56. At 375 × 667
  the LINE and Call buttons are on screen with the menu open.
- **44 px.** Get in touch buttons, See also, Friend card buttons and "Open in Google Maps", the "→" links on
  `/adopt` and `/friends`, the Donate Shelter Friends links, a story's category link, the card pages' "sign in"
  and the gallery arrow are `min-h-11` on phones and `md:min-h-9` with a mouse. The existing staff-page check
  still *notes*, not fails, bare buttons; I did not change that. The public pages are checked by a new,
  separate pass in `check-phone-width.mjs` (signed out, en + th) which *fails* on any link or button in `main`
  under 44 px and on a phone menu whose Talk to us panel is off screen. The photo lightbox's last two controls
  are not in this item and stay person-blocked (need a real handset).
- **Badge and empty photo.** One `AvailableBadge` (soft pill, sentence case) with one dictionary key,
  `adopt.availableForAdoption`; `home.featured.availableForAdoption` is removed. Empty card photos show the
  puppy art (`PuppyAtLaptop`) at 64 px; the "Happy endings" circle shows a paw. Home gallery tiles that fail to
  load drop out (`GalleryTile`, `onError`).
- **Sticky band at `lg`.** "Ask on LINE" and "Book a visit" are in the right column under the quick facts from
  `lg` up, and the sticky band is `lg:hidden`. The phone is unchanged. The buttons are rendered twice (one hidden
  per width), so each screen reader sees them once.
