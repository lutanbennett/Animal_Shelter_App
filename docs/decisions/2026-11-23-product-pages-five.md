# The other five product subjects get pages, and the site gets a nav (#pfive)

**Date:** 2026-11-23. **Stream:** `claude/product-pages-five`. Follows `2026-11-23-product-site-feature-pages.md`.

## Navigation first
`ProductNav` (`src/app/platform/about/ProductNav.tsx`) is on the home page and every subject page: Overview, then one link per entry of `PRODUCT_FEATURE_SLUGS`, the current one marked (`aria-current`). Names come from the home bands matched by slug, so the nav is not a second list. Plain links, both languages. Measured signed in on dev: 7 links on `/platform/about`, `/platform/features/adoptions` and `/th/platform/features/website`, the right one current. `#psubp`'s lesson stands: a `Read more` nobody finds is not navigation, so the nav comes before the pages and the band link is now a bordered button.

## The five pages
`residents`, `medical`, `adoptions`, `volunteers`, `website`: two sections, a worked example and an "also" line each, English and Thai, built only from what the app does today (resident records and photos, movements, diet and weight, vet visits, vaccinations, blood tests, prescriptions, placements and approved carer updates, tasks and maintenance, per-activity access, the public site). Sample data in the existing mock style; no new pictures. Adding a page is still a slug plus two dictionary blocks.

## Judgement: no subject left as a band
Each of the five has real shipped features behind it, so none was left thin. They are shorter than the money page (two sections against three). Thai was written for this PR and has not been read by a Thai speaker; for the release manager's list.

## Home bands
They were already one or two sentences each, so there was no long detail to move; the item's premise that five bands held full detail was not what the code showed. What changed is that every band now links out.

## Search
`PLATFORM_SEARCH` untouched. `platform-seo.test.mjs` proves every page in both languages is in robots and the sitemap when open, with its own language links, and none when closed.

## Release note
Tagged `admin: true` per `2026-11-23-reel-picker-warning-and-product-site-notes.md`.
