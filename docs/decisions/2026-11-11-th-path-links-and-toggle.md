# `/th/…` slice B: links and toggle (#t48xh)

- **(i) Toggle.** On a public page it writes the `locale` cookie client-side (`document.cookie`, as before) AND navigates to the
  other language's address (`otherLanguageHref`, `src/lib/public-paths.ts`). A client-written cookie is a request cookie, not a
  `set-cookie` on a response, so `/th/` pages stay edge-cacheable (slice A's trap is untouched). Keeping the cookie means bare
  addresses agree with the last choice. Off a public page it refreshes as before.
- **(ii) `/th` and `/`.** `/th` and `/th/` are both the Thai home (slice A's `thPathRest` returns `/`); no redirect. Bare `/` is
  unchanged and still follows cookie, then Accept-Language.
- **(iii) Links.** Applied at the link by the helper `localizedHref(href, locale)` in `src/lib/public-paths.ts`; the proxy is not
  involved. Returns the href unchanged for English, staff paths, external/hash hrefs and hrefs already under `/th`. Applied in
  `PublicHeader` (menu entries, logo, Donate, breadcrumb). Also the footer. **Not yet applied** to page bodies or other hrefs
  that bypass `pageLink`; slice D's pass should find them.
- **For slice C:** build a Thai URL with `localizedHref(path, "th")`; the English one is the bare path (`x-default`).
