# One list of public pages (part 2 of "Show or hide public website pages")

Lutan, 2026-10-24. The same pages were written out by hand in four places: the header menu, the footer's
Help column, the home page's links and the sitemap. This puts them in one list. **A refactor: a visitor sees no
change.** Nothing here hides a page; part (3) does, by filtering this list once.

## Where it lives

`src/lib/public-pages.ts`, beside `public-paths.ts` and `public-site.ts`. It imports only the dictionary
*type*, so the header, the footer, the home page and the sitemap (all server code) and the next stream's Not
found check and Admin → Website list can import it without pulling in a component. The header used to own
the `PublicSection` type; it is now defined in the list and re-exported by `PublicHeader.tsx`, so
`SitePageView.tsx` keeps importing it from where it did.

## Shape

`PUBLIC_PAGES: PublicPage[]`, one entry per page:

| Field | Meaning |
|---|---|
| `key` | `PublicSection` (below). Also what a page passes as `current`. |
| `href` | The address. |
| `label(t)` | The page's name from the dictionaries (footer, Donate button). No English is hard-coded. |
| `neverHidden` | `true` on Home and Privacy. **Recorded only; nothing acts on it yet.** |
| `menu?` | In the header and phone menu. `group` is a `PublicMenuGroup`, left out for a top-level link. `label` overrides `label(t)` (Adopt's entry is "Meet the residents"). `navKey` is the nav key when it differs (Donate's entry is `care`). |
| `footer?` | `{ column: "help" \| "foot", order }`. Help is the column of links; foot is the small links at the bottom (Privacy). |
| `sitemap?` | `{ order, changeFrequency, priority }`. Left out for About, which is not in the sitemap today. |

Helpers: `PUBLIC_MENU_GROUPS` (group keys with their heading), `pageHref(key)`, `footerPages(column)`,
`sitemapPages()`.

## Vocabulary

**Page keys (`PublicSection`)**: `home`, `adopt`, `adopt-international`, `foster`, `volunteer`, `donate`,
`appeals`, `friends`, `friends-join`, `desexing`, `our-work`, `about`, `privacy`.
`privacy` is new to the type; the others were there. Part (1)'s record uses `page:<key>` for every key except
`home` and `privacy`, which can never be hidden (the database refuses them).

**Menu groups (`PublicMenuGroup`)**: `adopt` [adopt, adopt-international], `get-involved` [foster, volunteer,
donate (shown as "care"), appeals, friends, friends-join], `services` [desexing]. Top level: `our-work`, `about`.
These are the `section:<key>` values in the record. `PUBLIC_MENU_GROUPS` is in menu order and a group's first
page fixes where it sits among the top-level links.

## What deliberately stayed where it was

- **The page's own rules for Appeals and Shelter Friends.** The header still decides, by its data, whether
  Shelter Friends is shown and whether Donate's entry reads "care" or Appeals leads; the footer still hides
  Shelter Friends when there is nobody to thank. Part (3) decides whether they move onto the hidden mechanism.
- **The home page's wording and its extra links.** The home page takes every *address* from `pageHref`, but
  its cards, buttons and strips keep their own words and placement; a hidden page's cards will be dropped by
  part (3), which owns what a home-page block means.
- **`public-site.ts`, `public-paths.ts`, the migrations and everything under `admin/`** — other streams' files.

## How the "nothing changes" claim was checked

On the dev server, every `<a href>` and its text on the home page, Adopt, Foster, Donate, Appeals, About and
Desexing, in English and Thai, plus `/sitemap.xml`, before the change (the four original files) and after:
identical as sets of links (the phone menu's block streams in a different order from run to run), and
the sitemap byte for byte.
