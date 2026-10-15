# Inner pages take the home page's type scale (2026-10-15)

- **Applied, not redesigned:** `/adopt`, `/our-work` (+ `[id]`), `/friends`, `/privacy`, the five `SitePageView` pages, `/r/[code]` and `/e/[id]` now use the home page's `font-display` heading (40/48/60 px), 20 px card radius, and an 18-20 px intro where the page has one. No behaviour changed.
- **`/r/[code]` and `/e/[id]` use 32 px (36 px from `sm`)**, not 60: they are opened from a QR code on a phone and carry long animal or enclosure names, so they break words rather than overflow.
- **Left for the schema item:** the photo slot beside each `SitePageView` heading needs a photo per page stored in `site_content`; it is its own backlog item (schema PR first). The backlog item for this stream therefore stays open.
