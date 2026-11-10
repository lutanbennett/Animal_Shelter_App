# `/th/…` Thai addresses, slice A: the mechanism (#t48xh)

Written for slices B (links and toggle), C (alternates, sitemap) and D (proof pass).

## What it does

`/th/<public page>` serves the Thai twin of `/<public page>`. English keeps its bare addresses.
`thPathRest()` (`src/lib/public-paths.ts`) returns the bare path for a `/th/` address **only when the rest is
a public page** (`isPublicPage`); otherwise null. So `/th/bills`, `/th/login`, `/th/api/…`, `/thailand`,
`/th2/…`, `/TH/…`, `/th/th/…` are untouched (staff pages stay behind sign-in, redirect `next` is `/th/bills`).

## TRAP 1: a request header, not a cookie

The proxy rewrites `/th/x` to `/x` and sets the request header `x-locale-path: th`
(`localePathHeader`, `src/lib/i18n/locales.ts`). `getLocale()` reads the header first, the cookie second.
**No cookie is set on a `/th/` response**, because a response with `set-cookie` is never edge-cached
(`worker/index.mjs`); measured on dev: `/th/adopt` returns no `set-cookie`. The proxy **deletes any
client-sent `x-locale-path` first**, so only the path can set it (a spoofed header on `/adopt` still renders
English; tested).

## The distinction (the hard constraint)

- A path that **names** a language (`/th/…`) wins over the cookie and Accept-Language.
- A path that says nothing (every bare address) sets no header and falls through to exactly the old
  behaviour: cookie, else a first visit's `Accept-Language` seeds the cookie (`initialLocaleCookie`, unchanged).
  Measured on dev: bare `/adopt` + `Accept-Language: th-TH,th;q=0.9,en;q=0.8` + no cookie renders `lang="th"`
  and sets `locale=th`; the same with `Cookie: locale=en` renders English (toggle still overrides).
  Only the first Accept-Language entry counts, as before.

## Cache key (deliverable 3)

`<full URL, path as requested>?__locale=<L>` where `L` = `th` if the path is a `/th/` page address,
else cookie `locale`, else `localeFromAcceptLanguage(Accept-Language)`. Cacheability: `isEdgeCachedPage`
applied to the rest of the path, so `/th/adopt` caches like `/adopt` and `/th/campaigns`, `/th/services`,
`/th/r/…`, `/th/e/…` stay uncached like their bare twins (unit-tested).

## For later slices

- **B:** on a `/th/` page the toggle still writes the cookie, but the path wins, so **choosing English
  on a `/th/` page does nothing until B makes the toggle navigate** (to the bare address). Internal public
  links should carry `/th/` when the page is Thai. Not changed here.
- **C:** metadata still canonical to the bare path only; add `hreflang`, `og:locale:alternate`, sitemap.
- Not proved here: the Worker's real Cache API (not run locally). The key and cacheability logic are unit
  tested through `thPathRest`/`isEdgeCachedPage`; first real HIT/MISS check is on `test.lannacare.org`.
