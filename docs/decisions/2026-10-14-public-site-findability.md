# 2026-10-14 — Public site findability: the configured host, the default share picture, the sitemap

Four backlog items from the public site review of 2026-10-13 (§8.1–§8.4), folded
into one stream (`claude/public-site-findability`). Three were built; the Thai
addresses item was left open with a status note, because it is sized L, needs
Lutan's decision on the shape, and the item itself says to do it after the
domain cutover.

- **Where the public host lives: nowhere new.** The brief asked for one
  configured value so the move to `lannacareforanimals.org` is a setting and not
  a sweep. That value already existed: `getSiteOrigin()` in `src/lib/site-origin.ts`
  returns `NEXT_PUBLIC_SITE_URL` when set and otherwise the host the request
  arrived on. Every absolute URL this change writes — the JSON-LD's `url`,
  `logo` and `image`, the sitemap's entries, robots.txt's `Sitemap:` line, and
  the Open Graph pictures through `metadataBase` — goes through it. So on
  cutover day nothing in these files changes: the Worker answers on the new
  host and every address follows. A second setting was deliberately not added;
  two sources of the same fact is what the domain item (backlog, 2026-10-10)
  forbids. A grep for either hostname in `src/` still finds only comments.
- **The default share picture is the hero photo, else the logo file.** A share
  picture is fetched anonymously by Facebook, LINE and Google, so it must need
  no session. The hero from Settings → Website is served by the photo proxy to
  anyone, because `site_content` is one of the sources `is_public_drive_file`
  (0084) reads; `/lca-logo.jpg` is the one static file the proxy lets through.
  Both were fetched signed out on the dev server and answered `200 image/jpeg`.
  The review suggested "the logo on a cream card" as an `/opengraph-image`
  route; that means `next/og`'s image renderer in the Worker bundle for a
  picture that is only ever seen when no hero is set. Not worth it: the plain
  logo (746 × 781) is sent as a `summary` card rather than `summary_large_image`,
  which is the shape that suits a near-square picture. The hero is also a
  photo of shelter grounds and dogs, not of an identifiable person, which
  matters because this repository is public.
- **One helper, every page.** `src/lib/site/share.ts` holds `defaultShareImage()`,
  `shareImageMetadata()` and `animalShelterJsonLd()`, and every public page's
  `generateMetadata` uses the first two, so a page with a picture of its own
  (an animal, a story, Friends' first logo) keeps it and a page without one
  gets the default. Before, seven pages and any animal without a photo shared
  with no picture at all.
- **The schema says only what Settings → Website says.** `AnimalShelter` is built
  from the same `site_content` row the footer reads: one `address` (the Thai
  address column of §5.5 does not exist yet), `telephone`, `email`, `hasMap`,
  `openingHours` and `sameAs`. Blank fields are left out rather than sent empty.
  `openingHours` carries the admin's lines as typed ("Every day 9:00–16:00");
  schema.org allows free text there, and inventing the `Mo-Su 09:00-16:00` form
  from prose would be a guess dressed as data.
- **The sitemap has no `lastmod` for animals.** Neither `public_resident_profiles`
  nor `public_projects` exposes `updated_at`, and adding it is a view change,
  which is a migration this stream was told not to carry. A story uses its
  `sort_date`, which the view does expose; an animal has no date rather than a
  made-up one. The follow-up, if wanted, is one schema PR adding `updated_at`
  to both views and two lines here.
- **`/sitemap.xml` is a public path in both states.** The session gate sent the
  first request to `/login`. It is now listed beside `/robots.txt` in
  `PUBLIC_PATHS` and `LOCKED_PUBLIC_PATHS`; locked, the route answers an empty
  list, which agrees with robots.txt's "disallow everything" and gives a
  crawler that already knows the address a valid file rather than a redirect.
- **The home title and "Meet our residents".** `home.metaTitle` in both
  dictionaries, used only for the window title and the share title; the header's
  `appName` is unchanged. The adoption list's heading went to sentence case only;
  the review's rewrite to "Dogs and cats looking for a home" belongs to §5.2's
  item, which the sibling copy stream may take.
- **What external checking is left.** The site is locked to signed-out visitors
  until go-live, so Facebook's and LINE's preview tools cannot fetch a page;
  the tags were verified by reading the rendered HTML on the dev server. The
  canonical tag and `hreflang` entries stay with the Search Console and Thai
  addresses items, both go-live work.
