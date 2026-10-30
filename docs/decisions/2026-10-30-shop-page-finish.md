# Shop for the shelter: the four things the app half left

2026-10-30, stream `shop-page-finish`. Closes the backlog item *SHOP FOR THE SHELTER: FOUR SMALL THINGS THE APP HALF
LEFT*. Parents: `2026-10-30-affiliate-links-schema.md` (0285) and `2026-10-30-affiliate-links-app.md`. Two PRs:
`0290` alone (#1119), then the app lines.

## (1) and (2): one `PUBLIC_PAGES` entry, after one migration

`0256` refuses any hide-key it does not list, on purpose. `0290` re-states its list with `page:shop` added, in 0256's
own drop-and-add shape; nothing else in 0256 changes. Then `/shop` gets one entry in `src/lib/public-pages.ts`, and
everything follows from the list: `hideableEntries()` offers `page:shop` on Settings → Website → Pages,
`isPageHidden` takes it out of the header, phone menu, footer and sitemap, and `/shop` calls
`requirePageVisible("shop")` like every page on the list. The Donate page's shop line (`ShopMention`) asks
`isPageHidden` too, so a hidden page is not linked from there either.

**The header's special case is gone.** Until now the header pushed a Shop link into Get involved by hand *because*
the page was not on the list. It now comes from the entry, with one rule in the same filter as Shelter Friends': shown
once an entry is shown (`hasPublicShopLinks`), or while the visitor is on `/shop` so the page stays marked. Its place
in the menu is unchanged (last in Get involved).

## (2b) Menu group and footer column: Get involved, and the Help column

The brief asked whether `/shop` wants a `menu` group and a `footer` column. **Both, yes.** It is a way to give, so it
belongs beside Donate and Appeals: `menu: { group: "get-involved" }` (where the header already put it) and the
footer's Help column, which lists every Get involved page. Footer order puts it right after Donate (Donate 8, Shop 9,
Appeals 10, Desexing 11). The rejected alternative, no footer entry, would make Shop the only Get involved page the
footer leaves out, for no reason a visitor could see.

**The "only once an entry is shown" rule now holds everywhere the page is linked**: menu, footer, the Donate line and
the sitemap. The sitemap is the one place that rule is new. On production the page will exist with nothing in it until
the Director adds shops, and an empty page offered to search engines is worse than none, which is the same reason the
menu already hid it. Hiding with the switch and having no entries are independent: either one removes the links.

Sitemap: order 12 (before Privacy, now 13), `monthly`, priority 0.5, as Shelter Friends.

## (3) The manual: its own topic, not a Website step

`id: "shop"`, *Shop for the shelter*, `activity: "shop.manage"`, `path: "Settings → Shop for the shelter"`. **A topic is
right and the step was not:** the manual decides who sees a topic from its `activity`, and the step sat in the Website
topic (`website.content`), so a login holding only *Manage the Shop for the shelter page* was never shown the
instructions for the one page it can open, and every website editor was shown instructions for a page they cannot.
The Website topic keeps a one-line pointer. The new topic's row is in `scripts/lib/acceptance-matrix-entries.mjs`
(`node scripts/acceptance-matrix.mjs --check`: ok, 96 topics). The hide-pages topic's tip now says Shop hides itself
when no entry is shown.

## (4) `shop.manage`'s probe: added, in `permission-probes.mjs`, NOT in the catalogue

**The catalogue's `probes: []` is not the gap, and filling it would make a second list.** All 72 activities in
`src/lib/permissions/catalogue.ts` have `probes: []`; the field's own comment says it is filled by the parity check,
and `scripts/lib/permission-probes.mjs` says *"There must never be a second list: when the catalogue takes the field
over, this file is deleted, not kept alongside."* So the catalogue is unchanged, and nothing about it needs a database
row (`npm run lint`'s comparison is untouched).

**The real gap** was that `shop.manage` was in neither `PROBES` nor `NO_DB_PROBE` in that file, whose header asks that
"not probed" be a stated fact and not an absence. Its neighbours under *Settings* (`website.content`,
`reference.types`, `audit.view`) are probed, and `shop_links`' four policies (0285) ask `shop.manage` and nothing else,
so a probe is right. Added: an `edit` probe, `insert into shop_links (title, link_url) …`. **Read is not probed**: a
read probe passes only by returning a row, dev has no `shop_links` row, and the fixtures live in
`check-who-does-what.mjs`, a file this stream does not own. Worth adding with a fixture whenever that file is next
opened.

Measured with `node scripts/check-who-does-what.mjs` before and after: 52 → 53 activities probed, 252 → 258 boxes
OBEYED, `shop.manage` no longer in the unprobed list. The run is red both times for the same pre-existing reasons
(one STICKY `recurring.do_own` box and five `clinicRule` entries the grid would over-mark), unchanged by this line.

**Declared crossing:** `scripts/lib/permission-probes.mjs` belongs to `claude/assistant-local-model-reachable` this
batch. Three lines appended at the end of `PROBES`, nothing else.

## Verified in the browser (dev, port 3003)

Signed in as a disposable login holding exactly *website* and *manage_shop_page* (`dev-signin.mjs --cards`), with
one shown test entry seeded: Settings → Website → Pages lists *Shop for the shelter /shop* under Get involved with a
Hide switch. Hide stored `{page:shop}` (so `0290` accepts it); signed out, `/shop` then served the Not found page
with `noindex` and without the entry, and the sitemap, the Donate page and the home page had no `/shop` link. The
editor still saw the page with the *hidden from the public* bar. Show restored all of it. With no entry shown the
sitemap and the links dropped `/shop` again. The test entry was deleted.

In `next dev` a hidden page answers HTTP 200 with the Not found body, as every hidden page does (checked on a hidden
`/friends` the same way); that is how a streamed `notFound()` reports under dev and is not new here.
