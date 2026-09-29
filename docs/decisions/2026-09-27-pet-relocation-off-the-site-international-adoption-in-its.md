# 2026-09-27 — Pet relocation off the site; International adoption in its place

Reverses the Services half of the 2026-09-27 Pet relocation entry above,
which stays as the record of what shipped in 0.8.0.

- **Why.** Relocation is the Director's own private work, not something
  the shelter offers, so it does not belong on the shelter's site (Lutan).
  What the shelter does do is international adoption: an adopter abroad
  taking one of its animals home. The `site_pages` row was repurposed, not
  replaced (`0104`, above), so the starter-text plumbing carries straight
  over: `sitePages.internationalStarter` instead of `relocationStarter`.
- **A release note, not a deletion.** The item said to drop the relocation
  line from `unreleased` because no user had seen it. By the time the work
  started, 0.8.0 had been cut with that line in it and Lutan chose to deploy
  0.8.0 as it stood and fix this in 0.8.1. So the `0.8.0` entry is left as
  written — it is what shipped — and `unreleased` gains a line saying the
  page has been replaced.
- **`/relocation` redirects, permanently, from `next.config.ts`.** The page
  was live, so a shared or bookmarked link should land somewhere useful.
  A config redirect runs before `proxy.ts`, so the old path no longer needs
  a place on the public-path lists (`public-paths.ts`, `worker/index.mjs`)
  to work signed out, and there is no route file left to maintain. 308,
  because relocation is not coming back to this site.
- **Route `/adopt/international`**, not `/international-adoption`: it is
  adoption, so it lives under `/adopt`, and the existing `/adopt` prefix
  already makes it public and edge-cached. The static segment wins over
  `/adopt/[id]`.
- **Adopt became a menu group** — Meet our residents (`/adopt`) and
  International adoption — because the item asks for the page "under Adopt"
  in the header. The cost is one more click to the listing from a computer;
  the homepage's Meet the animals button and the footer still go straight
  there.
- **Services is hidden, not removed.** With relocation gone it has no
  entries; the header drops any group with no links and the footer drops
  its heading, so desexing drives only has to add a link to bring it back.
- **The illustration is sketch C, "Over the globe", in the orange pyjamas**
  (`PuppyOverGlobe`, shown to and approved by Lutan before wiring in). As
  in C, the cape is forest green (`--site-accent`) and the collar and route
  terracotta (`--site-action`), so it follows the dev recolour. The route
  draws itself in by animating a mask along it, since a dashed stroke's own
  dash offset is spent on the dashes; the mask starts drawn, so under
  reduced motion the whole route shows. **`PuppyFlying` (the crate) is
  deleted**, with its crate and speed-line keyframes: nothing else used it.
- **Starter text limits unchanged:** in outline and our own words —
  meeting the animal, the paperwork and health checks an overseas home
  usually needs, a journey arranged with the adopter — and no fees,
  timelines, countries served, partner names or licence claims. Costs are
  mentioned only as something talked through before anything is arranged.
