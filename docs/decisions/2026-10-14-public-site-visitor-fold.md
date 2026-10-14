# 2026-10-14 — Public site: not-found page, first language from the phone, "English for now", the list's name

Four items from the public site review of 2026-10-13 (§3.1, §4.4, §5.1, §5.2), one stream
(`claude/public-site-visitor-fold`). No migration.

## The not-found page never asks why an id is gone

`not-found.tsx` in `/adopt`, `/our-work`, `/r` and `/e` all render `PublicNotFound`: public
header and footer, "We couldn't find that page. If it was an animal, they may have found a home.",
three links (all dogs and cats, Our work, Home) and the Happy endings from `public_recent_adoptions`.

**Not built: a separate message for an id that exists but is adopted, hidden or deceased.** The item
asked for it, and the brief warned it could leak. It also cannot be done safely:
`public_recent_adoptions.id` is the *placement* id (`p.id`, migration 0123), not the resident's, so
the public views cannot match a URL's id to an adopted animal; and telling "hidden" from "never
existed" needs the `residents` table, which would reveal that a hidden animal exists. Every missing
id gets the same words, and nothing but `public_recent_adoptions` is read. If the shelter wants the
sharper wording it needs a public view that keeps a resident's id after adoption — a schema PR.

The status code stays 200. The root `loading.tsx` has already started the response when `notFound()`
runs, so Next cannot change it; it adds `noindex` instead, which the item accepted. An unmatched URL
outside those four sections still gets Next's own 404, because a root `not-found.tsx` would be
rendered inside the staff app's chrome as well.

## First language from the phone, and which routes now vary by language

`src/proxy.ts` gives a visitor with **no valid `locale` cookie** and Thai as the *first*
`Accept-Language` entry a `locale=th` cookie (on the request, so that very render is Thai, and on the
response). English phones get nothing. The toggle writes the cookie, so it wins from then on; the
rule is `initialLocaleCookie()` in `src/lib/i18n/locales.ts`, tested in `locales.test.mjs`.

**Cache.** The Worker caches signed-out HTML for `/`, `/adopt`, `/our-work`, `/foster`, `/volunteer`,
`/donate`, `/friends` and `/privacy`, keyed by URL and the `locale` cookie, with a missing cookie
read as English. That would have served a cached English page to a Thai phone arriving without a
cookie, and the proxy never runs on a HIT. So `cacheKeyFor()` now uses the cookie, and without one
the same `Accept-Language` rule. Two things keep it safe: a response that sets a cookie is never
stored (`!response.headers.has("set-cookie")`), so a first-visit Thai render cannot be served to
anyone else; and the cache key can only be `en` or `th`. Routes that now vary by language: the eight
cached ones above. `/r` and `/e` are not edge-cached (`2026-10-12-r-and-e-not-edge-cached.md`) and
are rendered per request; every other page is per request too.

## Two call sites, one note

The home page's story and `/adopt`'s "How adoption works" box now show `t.sitePages.englishOnly`
when `sitePageText()` reports `bodyIsOriginal`, in the same style as `SitePageView`.

## One name for the list

Heading "Dogs and cats looking for a home" with the review's intro (the guest-only "you're browsing
as a guest" sentence is gone; the signed-in subtitle is unchanged). The menu entry, which read "Meet
our residents", now reads "Meet the animals", matching the hero and the home card; "Adopt" stays
the section name and "All dogs and cats" the back link. The Thai strings were already in place or
are the review's.
