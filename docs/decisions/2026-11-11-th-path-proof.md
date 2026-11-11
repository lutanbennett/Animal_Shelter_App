# #t48xh slice D: the proof pass (2026-11-11)

## What is asserted, and where
- `src/lib/site/public-heads.test.mjs` (runs in `npm test`): driven off `PUBLIC_PAGE_PREFIXES` in
  `src/lib/public-paths.ts` (minus `/r` and `/e`, per-item card pages with no alternates by design) plus the
  home page. Every `page.tsx` under those prefixes must build its head through `publicAlternates`,
  `ogAlternateLocale` and a localized `og:url` (or through `sitePageMetadata`, which does), unless it declares
  `robots: { index: false }` (the two adoption-update pages). A page added next month under a public prefix is
  covered automatically, or the test fails naming it. It is a source-level guard because a Next page cannot be rendered in `node --test`.
- `scripts/check-public-heads.mjs` (needs a dev server; not in CI): reads the RENDERED `<head>` of every page
  `/sitemap.xml` lists, both shapes, and asserts one canonical equal to that shape's own address, the three
  hreflangs, `og:url` equal to the canonical, `og:locale:alternate` the other language. It also re-proves the hard
  constraint on every page: a bare address with `Accept-Language: th-TH` and no cookie renders Thai, and a
  `locale=en` cookie overrides it. The page list IS the sitemap, so the two cannot disagree. Result on dev: 13 pages x 2 shapes, 0 failures.

## The find: four detail pages shipped without alternates
`adopt/[id]`, `campaigns/[id]`, `events/[id]` and `our-work/[id]` imported `publicAlternates` but never called it:
they emitted `alternates: { canonical: <bare path> }` only, so the `/th/` twin declared the English page as canonical
and none had hreflang. Slice C's "all 14 files" counted importers. Fixed to call the helper.

## /foster, /volunteer, /donate, /about
Fine. Each exports `generateMetadata = () => sitePageMetadata(slug)`, which calls `publicAlternates`. Proved on the
rendered head (`/th/foster`: one canonical, three hreflangs, og:url, og:locale and alternate), not by reading the component.

## og:url follows the render language
Chosen: `og:url` = the page's own address in the render language, i.e. equal to the canonical. A social card then
resolves to the page in the language it was shared in. Rejected: keeping the bare path, which made a Thai page name
the English page as its share target while its canonical said the opposite.

## Not proved
- The four dynamic pages were NOT checked live: dev has no public animal, story, appeal or event rows (the sitemap lists none), so there
  is no real id. Covered by the source-level test only. `node scripts/check-public-heads.mjs <port> /adopt/<id> ...` takes real ids where they exist.
  Because of this `#t48xh` is not ticked.
- The Worker Cache API HIT/MISS is still unproven, and no host we have can give it: test sets `PUBLIC_SITE: "off"` (no
  public pages render), UAT is `"locked"` and a signed-in preview carries a session cookie, which the header-not-cookie design keeps out of the edge
  cache. It needs a host where the public site is open, which is the Director's call. Do not re-offer the test deploy.
