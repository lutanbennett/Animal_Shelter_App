# 2026-11-03 — Poodle drawings fill an empty page-photo slot (Donate, Foster, Volunteer, About)

- **Lutan's request (2026-10-30):** new images for Page photos in the poodle theme of International adoptions
  and the loader; answered *"Built into the site"*. He was shown four sketches on 2026-11-03 and chose **all
  four as drawn**: Donate (a coin dropping towards a food bowl), Foster (curled up on a sofa, window and lamp),
  Volunteer (a lead in the mouth, paw-print badge), About (in front of the shelter, a tree beside it).
- **Where they live:** a new `src/components/PuppyPages.tsx`, not `PuppyLoader.tsx`. That file is a client
  component of 300+ lines holding the loader's animation; the four scenes are static and need no client code,
  so they can render on the server and the loader file does not grow. Same 240x160 viewBox as `PuppyOverGlobe`,
  the loader's head, fixed fur colours, `--site-*` tokens for the rest, `aria-hidden`. They are still pictures,
  so there is no motion to switch off under reduced motion.
- **How an empty slot resolves:** in `SitePageView.tsx`, an uploaded photo id wins as before; otherwise a page
  with a photo slot (those four slugs) gets `<PagePuppy slug>`; any other page gets nothing and its heading
  keeps the full width. Removing the photo clears the id, so the drawing returns. No migration, no setting.
- **Supersedes** the empty state in `2026-10-15-public-page-photos-empty-state.md` ("no placeholder art").
- **Crossing declared:** the admin page preview (`SitePagePreview.tsx`) now shows the drawing too, so the
  preview matches the live page.
- **Wording:** the Page photos card's subtitle said an empty slot gives a full-width heading; it now says the
  drawing shows (English and Thai). The Thai is ours and has not been read by a Thai speaker.
- **Stale path:** the backlog item named `src/app/admin/website/PagePhotos.tsx`; the file is `PagePhotoCard.tsx`.
