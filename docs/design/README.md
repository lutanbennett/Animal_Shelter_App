# Public site mockups — "Lanna Care for Animals"

Lutan's design of 2026-09-25, copied from the live canvas
https://claude.ai/artifact/4FSnZawH9a6p9KqohXu2RK (version `1790386010-1e99`)
so the repo keeps the version the redesign was built against — the canvas
can change after this.

| Artboard | Source | Render |
|---|---|---|
| Homepage — desktop (1280 px) | `homepage-desktop.dc.html` | `homepage-desktop.png` |
| Mobile menu, open (390 px) | `menu-mobile.dc.html` | `menu-mobile.png` |
| Resident profile — mobile (390 px) | `resident-profile-mobile.dc.html` | `resident-profile-mobile.png` |

The `.dc.html` files are the canvas's own sources, byte for byte: every
colour, size and word is in them. The PNGs were rendered from those sources
with headless Chrome, not screenshotted from the canvas, so **the photos are
grey "photo" placeholders** — the canvas's images are uploads that only load
inside it. Everything else (type, colour, spacing, copy) is as designed.

The redesign is built in four parts (backlog, "Public site redesign"):
(1) visual system, header/footer and navigation — `public-site-shell`;
(2) homepage; (3) resident page; (4) sponsor and stats. Deviations from
these mockups are recorded in `docs/decisions.md`.
