# 2026-11-07: the card count, and which figure is which (#c5nt2, #k2v8m)

**Measured 2026-11-07 on `claude/card-count-truth`.**

- `node scripts/check-cards-count.mjs`: `cards.ts has the fifty-three agreed cards` (53, from `CARD_KEYS`, `src/lib/permissions/cards.ts`).
- `node scripts/sync-home-icons.mjs --local <dir>`: **56** drawn, 448 images. (The `--env production` form could not run here: `.env.deploy.production` is absent in this worktree. The count is code, not data, so it is the same on any environment.) The release record's "55" was one page fewer then; it differs from 53 by **three** now, not two.

## What each counts

- `check-cards-count.mjs` counts **cards**: the keys of `CARDS` in `cards.ts`.
- `sync-home-icons.mjs` counts **pages**: `iconCatalogue()` (`src/lib/home-icons/catalogue.ts`) draws one icon per distinct page path: every route in `ROUTES` plus every page a card opens.

## Which explanation was true: not a divergence

It is the second kind, *pages the icon script correctly draws that are not cards' own*. By card: the 53 cards open **38 distinct pages** (several cards share one: Residents is opened by 7 cards, and website, memes, reels, translations and photo approval by 2-3 each), and the route registry holds **18 more pages no card opens** (appointments, clinics, feeding list, enclosures, zones, the type lists and similar). 38 + 18 = 56. No card opens a page the script fails to draw, so no card is missing from either registry.

## What now cites what

`sync-home-icons.mjs` reads the card set from `cards.ts` (via `cardOpens()` in `script-entry.ts`), prints `56 pages drawn (38 opened by the 53 cards in cards.ts, 18 registry pages no card opens) ... a page count, not a card count`, and **fails if a card opens a page with no icon**. `check-cards-count.mjs` says in its ok line that it is THE card count and the other counts pages. A change to the card set now moves both lines.

## The CLAUDE.md correction (#k2v8m)

**SUPERSEDED 2026-11-08: the claim below was false.** The edit never landed; `CLAUDE.md` still said "does not pass yet" until `claude/claude-md-card-coverage` made it (`docs/decisions/2026-11-08-claude-md-card-coverage.md`). Kept so the claimed-but-not-landed fault stays visible.

The "does not pass yet" sentence under *Hard-coded security is forbidden* now reads that it passes, measured on production 2026-11-07 after the `0.43.5` migrations, in card terms (no card grants nothing wherever it is held). The Admin passage is untouched. `docs/release-handover.md` and `docs/releases/2026-11-07-0-43-5.md` still quote the old sentence; they are dated records of what CLAUDE.md said then and were left.
