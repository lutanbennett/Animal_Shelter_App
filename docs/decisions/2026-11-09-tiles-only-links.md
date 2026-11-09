# Release notes and Change password are tiles on every home

**2026-11-09, stream `tiles-only-links` (backlog `#5scf4`).**

## What changed

- `src/lib/home/tiles.ts`: `releaseNotesTile()` and `changePasswordTile()` sit beside `manualTile()`. `withManualTile()` now
  appends all three, in that order, last, to every function that builds a home. Independent of counts, so nothing can drop them.
- `hasJobTiles()` treats all three as "not a job", so a role with no jobs still gets its notice.
- `src/lib/home-icons/catalogue.ts` lists the two new tiles so every tile has an icon.

## Why tiles and not cards

Both pages are open to every signed-in login. No card opens them and none may, the same reason as the manual (`#ce6ec`).
They are gated on nothing: no card, no role, not `entersApp`. Anything narrower brings the bug back for the next role
someone sets tiles-only. `show_menu` is untouched (tiles-only is Lutan's decision of 2026-10-22).

## Where they sit

Last, after the manual: "now and then" pages, the same reason the sidebar footer held them.

## The account menu (found, not changed)

`AccountMenu` (`src/app/AccountMenu.tsx`) links Change password, the manual and Release notes for every login. The header
is drawn for every login whatever `show_menu` says (that flag only decides whether the header also carries a Home button).
So the account menu was already a reliable way in; the tiles are the one on the home screen, where a tiles-only login
looks first. `AppHeader.tsx` needed no change.

## Flagged for other streams

The manual's `release-notes` topic says "Release notes (bottom of the menu)", wrong for a tiles-only reader. That wording
belongs to `manual-topics-by-card` (`src/lib/manual/en.ts`).
