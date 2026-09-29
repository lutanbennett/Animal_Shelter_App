# 2026-09-26 — Public site redesign, part 2: the homepage

Part 2 of 4 (`src/app/page.tsx`), built on part 1's `--site-*` tokens,
header and footer, against `docs/design/homepage-desktop.png`.

- **The impact band shows real counts, not the mockup's figures** (Lutan,
  2026-09-26). The mockup's "rehomed since [YEAR]", "sterilisations in local
  villages" and "temple and community dogs supported" have no data behind
  them. Rather than placeholders or no band, it shows the four counts
  `public_shelter_stats` already has: in care today (the mockup's first
  figure), adopted this year, in foster, in vet care. Lutan wants the
  mockup's three kept as the target, so the band is a list
  (`src/lib/site/impact.ts`): a figure is one entry there plus a column on
  the view. Getting those figures is on the backlog.
- **"Give monthly" goes to `/donate`** (Lutan, 2026-09-26), like part 1's
  "Sponsor a resident", until the `/donate` item gives monthly giving a flow.
  The label stays as designed. The Sponsor card's "[PRICE] baht a month"
  becomes "A monthly gift helps pay for their food and care", and its
  "Choose a resident →" becomes "Find out how →", because it lands on
  `/donate`, not on a resident.
- **"Become a Shelter Friend" and "Your business here?" go to `#contact`**,
  the footer's contact details. There is no sign-up flow and this part adds
  none. The band shows only once someone is published, as the old strip did,
  since a thank-you band with no one in it reads as a gap. It shows the
  first five Friends in staff order, then the tile, as the mockup's row does.
- **Terracotta text on the sand band uses `action-hover`** (6.6:1). Part 1
  measured plain `action` there at 4.46:1. That covers the "Your business
  here?" tile and "Meet all our Shelter Friends" link. The dashed border stays
  `action`, because it is decoration, not text.
- **The hero heading is fixed copy; the paragraph is the admin's tagline**,
  falling back to the mockup's paragraph without its hard-coded "more than
  300". The live count is in the band just below, so the paragraph does not
  need a number to go stale. With no hero photo, the text takes the full
  width instead of sitting beside an empty frame.
- **The four help cards use the mockup's short copy from the dictionary**,
  not the first paragraph of each `site_pages` body as the old cards did.
  Those bodies are pages long, and the mockup's cards are one line. The
  pages themselves are unchanged.
- **Pet of the week:** the facts line is sex · breed (or species) · age ·
  Desexed, each only when known; "Desexed" appears only when it is true. The
  mockup's hook is the first paragraph of the bio, cut at 160 characters,
  until part 3 decides whether a hook needs its own field.
- **Dropped from the old home page:** the "What we do" row of three recent
  project stories and the closing "Ready to meet everyone?" panel. The mockup
  has neither. Our work is reached from "See our work in the community →"
  and the header. The panel's "browse the residents" is the hero's Meet the
  animals button and the Adopt card's link.
  The gallery shows its first three photos, the mockup's row, instead of all.
- **Not changed:** "About & contact" in the header still goes to `#contact`.
  Pointing it at Our story would mean editing `PublicHeader.tsx`, which
  belongs to part 1.
