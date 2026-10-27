# Website editor: live preview of unsaved edits (2026-10-27)

Lutan scoped it on 2026-10-26 as reading (i): see the page as the unsaved form would render it.
No draft state, no publish step, no new card, no migration.

## What was there

`/admin/website` only imported `sitePageStarter` from `SitePageView`, and each page's editor had a
small "Preview" that drew the body's paragraphs and bullets. It showed no heading, photo, contact
card, language or page layout, so it was an approximation.

## The split

`SitePageView` is a server component that loads its own data, so it cannot render form values.
Presentation is now separated from loading:

- `src/components/SitePageArticle.tsx`: the markup between the header and footer (heading and photo,
  text, "get in touch" card, Shelter Friends mention, "also see" links). Sync, no loading, no cookies.
  `SitePageView` still loads everything and now renders this with what it loaded.
- `src/components/SiteBodyView.tsx`: the body renderer, taking `newTabLabel` instead of calling
  `getT()`. `SiteBody` is now a thin server wrapper that looks the label up, so every existing caller
  is unchanged.
- `src/lib/site/starter.ts`: `sitePageStarter`, moved out so a client file can use it.
  `SitePageView` re-exports it.
- `src/app/admin/website/SitePagePreview.tsx` (client): renders `SitePageArticle` from the form's
  draft heading and text. `SitePageForm` holds the draft; the admin page passes what is *saved*
  (contact details, page photo, whether Friends exist, the saved Thai wording).

Header and footer are not drawn: they carry no page text. Donate's ways to give are not drawn
(they load their own data); the preview says so. English or Thai: Thai shows the saved
translation, because an English edit is not translated until saved, and the preview says so.

## For the next person

The seven routes (`about`, `adopt/international`, `donate`, `foster`, `friends/join`, `volunteer`
and the admin page) all go through `SitePageArticle` now. A change to the public page's markup goes
there and shows in the preview too. Never import `get-t`, `get-locale`, or `supabase/server` into
it, or the editor stops compiling.
