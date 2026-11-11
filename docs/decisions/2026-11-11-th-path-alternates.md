# `/th/…` slice C: language alternates (#t48xh)

- **Shape: one helper, not fourteen hand edits.** `src/lib/site/alternates.ts` exports `publicAlternates(barePath, locale)` and
  `ogAlternateLocale(locale)`. All 14 files (including `adopt/SitePageView.tsx`, which is a component but builds its own
  `generateMetadata`-style object, so the same call fits) call it. Built on `localizedHref`; no second URL builder.
- **Canonical now follows the render language.** `/th/adopt` is canonical to itself, not to `/adopt` (the old bare canonical
  would have told Google the Thai page is a duplicate). `languages` = `en` and `x-default` bare, `th` the `/th/` twin.
- **Sitemap lists both shapes**, each entry carrying the three `xhtml:link` alternates (`twin()` in `sitemap.ts`).
- **A new public page's author:** `alternates: publicAlternates("/path", locale)` and `alternateLocale: ogAlternateLocale(locale)`
  beside `locale:` in `openGraph`. Nothing else. A page that forgets simply has no alternates (not enforced by a check).
- **Not touched:** `worker/`, the cache key, `proxy.ts`. `openGraph.url` is still the bare path (not changed).
- **For slice D:** assert, per public page and per shape, one canonical equal to that shape's address, three hreflang links
  (en/th/x-default), and `og:locale:alternate` = the other language. Also: the Worker's real Cache API HIT/MISS for `/th/` is
  still unproven from slice A (needs a test.lannacare.org deploy, the planner's).
