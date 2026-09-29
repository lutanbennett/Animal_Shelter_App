# 2026-09-27 — Become a Shelter Friend: its own page at `/friends/join`, under Get involved

The homepage band's **Become a Shelter Friend** button and **Your business
here?** tile pointed at `#contact`, so a business owner landed on the
footer's phone numbers with nothing about what joining means. They now open
`/friends/join`, the `shelter-friends-join` row (0099) rendered by
`SitePageView` exactly as `/relocation` is.

- **Its own page, not a section at the top of `/friends`.** `/friends` is a
  thank-you to the businesses already helping; a block of recruiting text
  above it pushes those cards below the fold for the supporters it is
  really for. A page of its own also has its own share preview, can be
  linked from the menu, and is one more `SitePageView` route rather than a
  second way of rendering a site page. `/friends` gets a one-line link.
- **Under Get involved, always** (Lutan, 2026-09-27). Services is what the
  shelter does for you; this is a way to help it. Unlike the Shelter
  Friends link, it does not wait for a published Friend — it is how the
  first one arrives. In the footer's Get involved column too.
- **Starter text in code, like relocation** (same entry, above): generic,
  from the Shelter Friends item's own description, and silent on fees,
  terms or how long a profile stays up — only the Director can say those.
  It states the consent rule plainly (each contact detail shown only if
  they agree), because that is what a business is most likely to worry
  about. `starterNote` on the admin form lost its relocation-only "licence
  details" wording so it reads right on both pages.
- **The contact card is made for a business asking to join**: a Call
  button (shown only here — a shop owner is as likely to ring), an email
  with the subject and a short fill-in form already written, and the same
  message prefilled in LINE **only when the shelter's LINE id is an
  Official Account** (typed with its `@`). LINE's `oaMessage` link exists
  only for Official Accounts; a personal id or a pasted URL gets the plain
  add-friend link and the visitor types. Still no sign-up form: nothing
  here writes to the database, so no spam handling or consent record is
  needed, and staff set the profile up with the business as before.
- **`SITE_PAGE_PATHS` in `src/lib/site/pages.ts`** replaces the admin
  page's private map. The Open Graph `url` was `/${slug}`, which is wrong
  the first time a slug is not its route; both now read the one map.
- **The Shelter Friends tiles are untouched** apart from their `href`:
  their look belongs to "Homepage polish", held to a later batch.
