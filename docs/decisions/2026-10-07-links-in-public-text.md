# Links in public text: what becomes a link and what is refused

2026-10-07, stream `site-page-links`.

**Decision.** Text that staff type and the public reads is split into plain
text and link parts (`src/lib/site/links.ts`) and rendered as React elements
(`src/components/LinkedText.tsx`). No HTML is ever built from the text and
`dangerouslySetInnerHTML` is not used.

**Allowed targets**, checked by `safeHref`: `https:`, `http:` (host must
contain a dot), `mailto:`, `tel:` (digits, `+`, `-`, brackets only), and a
path on this site starting with a single `/`. Everything else, including
`javascript:`, `data:`, `ftp:`, `//host` and anything with spaces, control
characters, `<`, `>`, quotes or a backslash, is left as the plain text it was
typed as. An allow-list, not a block-list.

**Forms.** `[words](target)`; a bare `https://…` or `www.…`; a bare email
address (becomes `mailto:`). A bare phone number is **not** auto-linked
(too many false matches on dates and numbers); use `[Call](tel:+66…)`.
Bare addresses use ASCII characters only, so a Thai sentence running straight
on from an address is not swallowed. Trailing `. , ; : ! ? ' *` and an
unbalanced `)` are not part of the link.

**External links** get `target="_blank"`, `rel="noopener noreferrer"` and a
screen-reader-only "(opens in a new tab)" in both languages. Site paths,
`mailto:` and `tel:` open normally. Tap target: vertical padding of 0.75rem
gives at least 44 px; `overflow-wrap:anywhere` lets a long address wrap.

**Where.** `SiteBody` (information pages and home story) and project stories
on `/our-work/[id]`. Not resident bios on `/adopt/[id]`: they are written for
the animal, no outside link is natural there, and keeping the surface small
is safer. Shelter Friend blurbs on `/friends` are likewise left for a later
change, if wanted; their renderer was not touched.

**Translations.** `approveTranslation` refuses a version whose link targets
(sorted) differ from the source's (`sameLinks`), in both languages' wording.

**Not done here.** A *Donate on DonorBox* button driven by a Website
setting needs a settings column (schema) and belongs to the Fundraising
items; this stream has no migration.
