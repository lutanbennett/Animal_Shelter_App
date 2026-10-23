# 2026-10-23: the feature list, step 1 of rebuilding the cards

Lutan, 2026-10-23: *"all hard coding out, and we will rebuild the security from ground up using the feature review backlog"*, and *"the features should be generated in a pdf so that I can print and review"*.

## What was done

`docs/features.md` lists the system's features, written for Lutan and printed as `Lanna Care - features for review - 2026-10-23.pdf` (his Desktop). Paper only: **no change to the app, cards, roles or permissions.** Steps 2 (feature by card map) and 3 (a simpler card set) wait until he has marked this up.

## How it was built, so a later session can redo it

- Walked `CARDS` and `cardOpens` (`src/lib/permissions/cards.ts`), `ACTIVITIES` (66), `JOBS` (8), `ROUTES` (44), `OUTSIDE_REGISTRY` (`src/lib/home/tiles.ts`), the page list under `src/app` (142 pages), and the manual's topic list.
- A scratch script derived activity to card and route to card from the code. It then checked that **every one of the 66 activities and 44 routes appears in the document**: none missing.
- Who holds which card is the dev database's `role_cards` on 2026-10-23, so it shows cards only, not a role's single extra permissions. The document says so.

## Choices that were Claude's, open to change

- **Thirteen features** (the brief said about a dozen): housing and moves apart from resident information; feeding and diets apart from medical; photos and social media as its own area because three cards overlap there. All names are proposals; Lutan's words win.
- Pages that exist but no card opens, and activities no card gives, are listed in the document's cross-check rather than dropped. Several (`/volunteer`, `/home/group/[id]`, a second `/management/medication-list`, community dogs) were not placed with confidence and are named as such.

## Not done

No backlog tick: the item is three steps and this is only the first. The card walkthrough runs stay on hold.
