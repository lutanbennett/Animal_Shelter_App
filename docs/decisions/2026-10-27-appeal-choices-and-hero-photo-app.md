# Appeal choices and hero photo, app half (2026-10-27)

App half of *Card review 2 schema follow-ups*; the schema half is `2026-10-27-appeal-choices-and-hero-photo-schema.md` (`0274`, #1000).

## What changed

- **Donation form** (`src/app/management/donations/new/page.tsx`) reads the `appeal_choices` view, not `appeals`. The Donations card
  (`donations_receipts`) now sees the open appeals; the raised figure still comes from `donations`, as before.
- **Hero photo.** `uploadHeroPhoto` / `removeHeroPhoto` ask `website.gallery` and call `set_hero_photo(...)`. They no longer ask
  `website.content` or update `site_content` directly. `HeroPhoto` takes a `canChange` prop that defaults to false; the Home tab passes
  `can(perms, "website.gallery")`.
- **A gallery-only login has no Home tab**, so the Gallery tab draws the hero control for a login that holds `website.gallery` but not
  `website.content`. A login with both sees it once, on Home.
- **`uploadHeroPhoto` no longer demands alt text.** It copied the gallery's "describe the photo" check on 2026-10-26, but the hero form
  never sent one, so Replace photo refused every time (seen when driving it). The hero's description is `site_content.hero_alt`, set on
  the Home tab under `website.content`; the gallery card cannot write it and no migration was allowed here. Found, fixed.

No role is named anywhere; Admin sees everything through `perms.isAdmin`.

## Controls on the pages touched, and the activity each action asks

| Control | Action | Activity asked | Gated |
|---|---|---|---|
| Replace photo, Remove (hero) | `uploadHeroPhoto`, `removeHeroPhoto` | `website.gallery` | yes, via `canChange` |
| Add / Move / Remove (gallery) | `uploadGalleryPhoto`, `moveGalleryPhoto`, `deleteGalleryPhoto` | `website.gallery` | already, `canEdit` |

## Found, not fixed

- Every other control on `/admin/website` (the Home, Contact, Pages, Donate and Projects tabs) asks `website.content`; they are only
  reachable by a login holding it, since a gallery-only login sees one tab. Not audited control by control; that is the buttons sweep.
- The hero **alt text** cannot be set by the Website photo card (it needs `website.content`). A new photo keeps the old description.
  If that matters, it is a card decision for Lutan, not a fallback.

## Driven on dev (port 3006, `dev-signin.mjs --cards <card>`, aal1)

- `website_photos`: Gallery tab shows Replace photo and Remove; Remove (confirmed) cleared the hero through `set_hero_photo(null)`;
  a generated JPEG uploaded through Replace photo set it, "Hero photo updated."
- `website`: Home tab shows the hero photo with no Replace photo or Remove.
- `donations_receipts`: "An appeal" on the form offers "Choose an appeal" plus the four open appeals.
