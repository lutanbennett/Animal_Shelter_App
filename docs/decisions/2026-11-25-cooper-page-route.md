# Cooper's page: the route, the layout, and what it shows before he types (#cpstr)

Decided 2026-11-25 by the `product-site-finish` stream. Engineering, not Lutan's call; his call (recorded on the item) is that the photo and the story are his,
and that the item is not ticked until he has read the real content and said it is right.

## What was built

`/platform/cooper` (Thai: `/th/platform/cooper`), reading `loadProductPage(supabase, "cooper")`. It is registered in `PRODUCT_PAGES_EN`, so the Thai address,
the language switch, robots.txt's allow list and the sitemap know it, and in the public-path lists (`public-paths.ts`, both the open and locked lists, and the
Thai rewrite) and the platform host's keep list (`site-hosts.ts`, `/th/platform/cooper`). The lines are read by `src/lib/site/cooper-page.ts`.

## What it shows before he types: nothing, because it does not exist

**Not reachable-and-empty.** With no `heading` line (or a blank English one) the page answers not-found, exactly like an address that does not exist, and the
sitemap leaves it out (`platformSitemap(origin, open, cooperLive)`, `sitemap.ts` asks the rows). The moment `heading` is saved it is live in the sitemap
(when the search switch is open). Rejected: a "coming soon" shell (a page that says nothing is what he declined: *"Wait, then I fill it in"*); placeholder prose
(forbidden by his answer). Nothing was seeded and no prose was written.

## What he types where (console: Platform → Edit the product site's words and photos → Add a line)

Page name `cooper`, then one line per key, English and Thai each (a Thai left blank reads as the English):

| key | what | required |
|---|---|---|
| `heading` | the page's title (and its search title) | **yes, the page goes live when this exists** |
| `kicker` | a small line above the title | no |
| `story` | the words; a blank line starts a new paragraph | no |
| `photo` | his photo: upload it on this line; the English text is its alt text | no |
| `description` | the search snippet; else the start of the story | no |

## Photos on the feature pages

A feature page shows its `photo` line (page `feature-<slug>`, key `photo`) under the lead, 16:9, alt text from that line's English/Thai, served through
`/api/photos/<id>`, and nothing at all when there is no such line. The console needed no change (it already shows an upload control for a key `photo`); the
line is added with "Add a line" first, since the seed made no `photo` rows for the feature pages.

## Keywords: where the added phrase went (trap noted by the brief)

`platform_content` rows were seeded from the dictionary and do not follow later dictionary edits. So *rescue management* was put in a **new** dictionary key,
`whoMore`, which no row exists for: a missing row falls back to the dictionary, so it appears on the home page in both languages today. (Editing the existing `who`
text in the dictionary would have shown nothing, because its row overrides it.) The Thai wording (ระบบจัดการกลุ่มช่วยเหลือสัตว์ (rescue management)) is this stream's, not
one of his agreed Thai phrases; he can correct it in the console by adding a `whoMore` line.

## Found, not fixed

`bands.N.slug` rows are still listed by the editor and editing one does nothing (known from the console stream). Hiding them is a few lines in
`ProductContentEditor.tsx`, left because nothing in this brief depended on it.
