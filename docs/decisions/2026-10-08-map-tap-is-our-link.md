# The map thumbnail is our link, and a dead map link shows no map

2026-10-08, `contacts-map-404` (parts (3) and (5) of the backlog item "Maps on
contacts and Shelter Friends", plus the 404 itself).

## What caused the 404

The backlog item listed three suspects: the tap opening the whole address field
(link plus trailing text), old `goo.gl/maps` links retired by Google, and a short
link that no longer resolves. The one failing production row, I Blue Paw (read
read-only on Lutan's say-so), held none of them: a clean
`https://maps.app.goo.gl/V5niTogBMv44An7k7`, which Google still redirects to the
exact pin. Our "Open in Google Maps" link to it worked.

What Lutan tapped was the **thumbnail**: Google's keyless embed in an iframe.
A tap inside it goes wherever Google's embed decides, which we neither build
nor see, and which came and went ("it seems to be working now").

## Decisions

- **The thumbnail is covered by our own link** (`src/components/MapThumbnail.tsx`):
  the iframe is `pointer-events: none` and an `<a>` over it opens the place.
  We lose panning and zooming the 200px frame, which on a phone was a scroll
  trap anyway, and gain a tap we control.
- **One lookup gives both the thumbnail and the tap** (`addressMap()` in
  `src/lib/contacts/map-preview.ts`, `AddressMap` in `contacts.ts`), so they
  can't point at different things. The contact hub, the contacts list's Map
  button, `/friends` and the hub's Friend preview all use it.
- **A link that leads nowhere counts as no link**: the text after it is searched
  instead, and with no text there is no map and no Map button — never a link
  that 404s. The hub says so under the address, so staff know to re-paste.
- **Old `goo.gl/maps` links are followed, not refused by their shape.** The item
  said they all stopped working in August 2025; Google in fact kept active
  `goo.gl` links working and retired only inactive ones. Only following a link
  tells which it is.
- **Only the first word of a pasted address is the link.** The text after it is
  printed as the written address. That makes "link, space, written address" a
  workable stopgap until separate Address and Map link fields exist (backlog,
  2026-10-08).
- **Management → Website refuses a map link Google answers 400/404 for**, and
  saves anyway when Google can't be reached, so a slow network never blocks a
  save. A link to any other site is still accepted, as before.
- `mapQueryFromUrl` no longer reads google.com's home page or a web search as a
  map; two dev contacts held `https://www.google.com` and their Map button
  opened Google's search page.

## Left for later

Storing a pin (item parts (1) and (2)) and the clean-up script (part (4)) need
a column, so they are schema-first and not in this PR. A full Maps URL still
embeds by the place *name* it carries rather than its coordinates — the
existing order in `mapQueryFromUrl` — and the tap opens the exact URL; storing
the pin is the fix for that.
