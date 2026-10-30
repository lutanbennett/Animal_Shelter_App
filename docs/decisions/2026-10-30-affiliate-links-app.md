# Shop for the shelter: the app half

Backlog: *Affiliate links get their own public page, and staff can add a Shelter Friend to it* (Fundraising). Schema half:
`2026-10-30-affiliate-links-schema.md` (#1100, `0285`, applied to dev only). This PR adds no migration.

## What was built

- **`/shop`** (`src/app/shop/page.tsx`): reads `public_shop_links` only. Photo (a shop's own, or a Friend's logo), name, translated
  note, optional price hint, link. A Friend's name and logo come from the view, so a Friend renamed in one place is renamed here.
  Empty table renders a plain "nothing here yet". A failed read says so; it never looks like an empty shop.
- **`/admin/shop`** (`src/app/admin/shop/`): the screen `manage_shop_page` opens. The card's `opens` now points at it and the
  `/admin/website` placeholder is gone. Add, edit, reorder, show/hide, delete, photo upload/remove, and a picker for a published
  Shelter Friend that is not already on the page. Routed in `routes.ts` (`shop.manage` at read, section management).
- Links: `checkHttpsUrl` (`src/lib/links/validate.ts`) in the action, `shop_links_url_https` as the database's last line. Every
  outbound link is `rel="sponsored noopener"`; `/shop` opens with a plain statement that the shelter earns a commission.
- Reached from: the header's Get involved group and a line under the ways to give on `/donate`, **both drawn only once an entry is
  shown**. A new entry starts Hidden (the column default), so nothing goes public by being typed.
- `en.ts` and `th.ts`: a `shop` block and `nav.shopLinks`. **The Thai is Claude's draft and wants a Thai reader.**
- Manual: a step in the existing Website topic (see "Found, not fixed").

## Decisions

**`/shop` is not on the public-pages list (`src/lib/public-pages.ts`).** That list drives the Pages hide switch, and `0256`'s
check constraint on `hidden_public_pages` refuses any key it does not know, so adding `shop` there means a migration, which this
stream may not add. The page is switched on and off by its entries' own `shown` flags instead, and joins the header menu by a
small, commented addition in `PublicHeader.tsx`. Cost: the Director cannot hide the whole page from Pages. She can hide every
entry. If she wants the switch, it is a one-line addition to the 0256 constraint plus the list entry.

**Click recording: none.** The item says record clicks only if a scheme does not already report them, and never put visitor data
in the link. The Director has not named the schemes. Amazon-style associate programmes, Shopee, Lazada and Involve Asia all
report clicks and orders in their own dashboards; recording our own count would duplicate that and would need either a
redirect through our server (a new way to fail on a link that earns money) or a client-side beacon (visitor data). **What would
change the answer:** a scheme that reports no clicks, or a Friend's own referral link with no dashboard. Then a counter row per
entry, incremented by a redirect route with no cookie, no IP and no referrer stored, is the minimal build. Not put to Lutan: it
is the Director's data and it blocks nothing.

**Catalogue probes stay empty for `shop.manage`.** Every neighbouring `settings` entry (`website.gallery`, `roles.view`, and the
rest) has `probes: []`; the probes in this file assert which tables a cell must reach, and the table's own harness
(`check-shop-links.mjs`) already proves that. Nothing to add.

**Publication on production waits on the Director's tax/status answer for commission income**, and on `0285` being applied
there. It does not block this code. The release that applies `0285` owes the release note.

## Action controls and the activity each one's action asks

Every action asks `can(perms, "shop.manage", "edit")` in `src/app/admin/shop/actions.ts` (the table's policies ask
`has_permission('shop.manage')`). The screen draws a control only when the page's `canEdit` is true, from the same call, and
`ShopLinksEditor` takes `canEdit` defaulting to **false**.

| Control | Action | Activity asked |
|---|---|---|
| Add a shop / Add a Shelter Friend (forms) | `saveShopLink` | `shop.manage` edit |
| Save on an entry | `saveShopLink` | `shop.manage` edit |
| Move up / Move down | `moveShopLink` | `shop.manage` edit |
| Show on the page / Hide | `setShopLinkShown` | `shop.manage` edit |
| Delete | `deleteShopLink` | `shop.manage` edit |
| Photo / Remove photo | `uploadShopPhotoAction`, `removeShopPhoto` | `shop.manage` edit |

A login holding only read sees the list as text and no control.

## Found, not fixed

- **No separate manual topic.** A topic with `activity: "shop.manage"` needs a row in `scripts/lib/acceptance-matrix-entries.mjs`,
  and `scripts/lib/` was off limits to this batch. The instructions are a step in the Website topic, which only holders of
  `website.content` see; a holder of `manage_shop_page` alone does not see it. Follow-up: its own topic and matrix row.
- **`/shop` is not in the sitemap** (`src/app/sitemap.ts` takes its list from `public-pages.ts`, see above).
- **`scripts/check-permission-catalogue.mjs`** gained one `EXEMPT` line for `/shop` (a public page needs one or `npm run lint` is
  red). That file is stream 2's this batch, so expect a one-line merge.
- **`src/lib/shop/upload.ts` repeats the website photo upload** (type, size, real bytes, read-back) rather than editing
  `src/app/admin/website/actions.ts`, which batch 2 rebuilds. Worth folding into one helper afterwards.
- The Friend picker lists published Friends only. A Friend unpublished after being added keeps its entry, shown on the screen as
  "—" with no name, and is absent from the public page by the view's own join.

## Proof

Dev, signed in as a login holding only `manage_shop_page`: the home shows the card's tile, the tile opens `/admin/shop`, an
`http://` link is refused with "Use a secure link that starts with https://", an `https://` shop is added Hidden, Show puts it on
`/shop` with the disclosure and `rel="sponsored noopener"`, the header gains the link, Delete (after confirm) removes it.
`check-shop-links.mjs` HARNESS-OK; `check-features-schema` green, so the orphan-row report is closed by this card opening a
screen. Not driven: photo upload (no Drive on dev), the Thai strings (no Thai reader), a read-only login.
