# 2026-09-26 — Public site redesign, part 1: the visual system and the shell

Part 1 of 4 of "Public site redesign" (Lutan's mockups, 2026-09-25, copied to
`docs/design/`): the visual system, `PublicHeader`, `PublicFooter` and the
navigation. The homepage, resident page and sponsor/stats are parts 2–4.

- **Tokens, named `--site-*`, in `globals.css`.** `cream` (ground), `paper`
  (header, cards), `sand` (soft bands), `line` / `line-strong` (borders; strong
  is for outlines that must be seen, 4:1), `ink` / `ink-soft` / `ink-muted`
  (text), `action` / `action-hover` / `on-action` (terracotta: Donate and every
  call to act), `accent` / `accent-soft` / `on-accent` / `on-accent-soft`
  (forest green: talk-to-us, status), `footer` / `on-footer` /
  `on-footer-soft` / `footer-link`. Tailwind utilities `bg-site-paper`,
  `text-site-action` and so on, plus `font-display` (Fraunces) and
  `font-site` (Source Sans 3). Parts 2–4 build on these rather than on hexes.
- **The theme switches on `:root:has([data-public-site])`**, the attribute on
  the public header. The alternative was wrapping every public page (eight
  of them, including `src/app/page.tsx`, which is part 2's), or deciding in
  the root layout, which can't see the path. `:root` rather than `<main>` so
  the body behind the page, overscroll included, is cream too.
- **The scope also re-points the app's generic tokens** (`--background`,
  `--surface`, `--foreground`, `--muted`, `--border`, `--primary`…) at the
  `--site-*` values. Every public page body is built on those, so they all
  turn cream with the header instead of showing a dark page under a light
  one until parts 2–4 reach them. h1–h3 on public pages get Fraunces the
  same way. Only a handful of hard-coded colours exist on public pages
  (white text over the hero photo, badges over photos), and all still read.
- **Dev keeps its signal.** Under `data-env="dev"` the `--site-*` values turn
  the action colour teal (`#0f6b63`) and give the cream a green cast, as the
  app's dev theme does. The forest accent stays: it means "talk to us", not
  the environment. Checked on :3004: the Donate button is teal.
- **Contrast** (measured): ink on cream 14:1, ink-muted on cream 6.7:1, white on
  action 5.5:1, action text on cream 4.9:1, white on accent 7.7:1, footer text
  10–14:1; dev teal on its paper 6.2:1. One mockup pair fails narrowly:
  terracotta as normal-size text on the sand band (the homepage's "Meet all
  our Shelter Friends" link) is 4.46:1. Part 2 should use `action-hover` or ink
  there.
- **Fonts are declared in the root layout with `preload: false`.** The CSS
  variables have to sit on `<html>` for the `:root` tokens to reach them, and
  preloading would make every staff page fetch two faces it never uses.
  Public pages pay a font swap on first paint instead.
- **"Sponsor a resident" goes to `/donate`** until the sponsor flow exists; it
  waits on the `/donate` item under Fundraising. `/donate` already says how
  to give, so the link is honest, and nothing sponsor-specific was invented.
  It is never marked as the current page; Donate is.
- **"About & contact" goes to `#contact`, the footer**, on whatever page the
  visitor is on. There is no About page. The footer is where the address and
  contact details are. Part 2 can point it at the homepage's Our story instead.
- **Staff login moved to the footer**, as the mockup draws it. The
  `public-viewer-login` behaviour (#135) is kept in the header: staff
  signed in see "Open the app", a public viewer sees "Sign out", and a
  visitor who isn't signed in sees neither.
- **Deviations from the mockup:** the header's Facebook icon is gone (the
  mockup has none; Facebook and Instagram are under Follow us in the footer).
  The "Registered foundation no." line is left out: there is no data for it.
  The footer column "Get involved" drops "Our work" (it's in the header).
  The mockup's language toggle is ~36px tall and is 44px here. "Get
  involved" opens on click, not hover, so mouse, keyboard and touch behave
  the same. Below 1024px (not only on phones) the four entries live in the
  full-screen menu; a tablet's width can't hold them beside the name.
