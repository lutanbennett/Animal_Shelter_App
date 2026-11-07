# 2026-11-06 — Website statistic switches: app half (`#jdoto`, and the code half of `#e7v1q`)

Reads `0328` (see `2026-11-06-website-switches-schema.md`). Adds no migration.

## What the app reads

- Lifetime figures: `impact_baselines.show_on_website` (the tick). `public_impact_figures` already filters on it.
- Live counts: `public_stat_switches` (`key`, `show_on_website`) for the tick. `public_shelter_stats` now returns **NULL**
  for a switched-off count.

## The screen

Settings → Website → Home, in the existing Impact figures card: a "Show on the website" tick under each lifetime
figure, and a new "Today's counts" block with one tick per live count. One action, `setStatisticShown(kind, key,
shown)`, writes only the flag; baseline, date and year are never in its update. It asks `website.content` at edit,
the same activity as `updateImpactBaseline`, and the page passes `canEdit = can(perms, "website.content")` to the
component, which draws **no tick at all** without it. Pressing a tick asks first (it changes a public claim), then
saves; both tables are audited, so it reaches Recent changes.

**The confirm is asked before the transition starts.** The first build opened it inside `startTransition` and the
box never rendered (the checkbox sat greyed out waiting for an answer nobody could give). Found by driving it.

## Two reasons a tile is absent, told apart on the screen

- **Switched off:** the row says "Switched off: this is not shown on the public site…". The count is NULL, so no
  number is shown there.
- **Switched on, under `LIVE_TILE_MIN` (2):** the row says the count is only N and counts under 2 are left off, so it
  appears by itself later. This needs the count, so the screen reads `public_shelter_stats`, which is only known while
  the switch is on.

`LIVE_TILE_MIN` stays in `impact.ts`. `impactStats` drops a tile when `value === null` or `value < LIVE_TILE_MIN`;
the two are independent.

## Readers of the two views (deliverable 3), and what each does with a null

- `src/app/page.tsx:155` `public_shelter_stats` → `impactStats()`: null is no tile. (Already true by accident of
  `null >= 2`; now explicit and typed `number | null`.)
- `src/app/page.tsx:161` `public_impact_figures`: the view drops a switched-off row, so there is nothing to handle.
- `src/app/admin/website/page.tsx:135` (new, this PR) `public_shelter_stats`: reads null as "unknown, off".
- `report.ts:351`, `place.ts:14`, `impact.ts` comments: prose only, no reads.
- No other `src/` or `worker/` reader. Scripts (`check-public-views`, `check-shelter-today`, `check-impact-baselines`,
  `check-community-dogs-schema`, `check-medical-soft-delete`, `check-app-access-gate`) read the views; they ran as
  part of this PR's checks.

## `#e7v1q`: dropping `noOwnSwitch`

Removed the one line `noOwnSwitch: true` from the events entry in `src/lib/public-pages.ts`. The flag itself (type
and its three uses in `isPageHidden`, `hideableEntries`, `PageCards`) stays: it is generic and now unused by any page.
`/events` therefore appears in `hideableEntries()` as `page:events` (accepted by the `0328` constraint) and gets a
Hide button in Settings → Pages. `/events` still also goes dark when *Get involved* is hidden.

## Not done here

`#s4t7q`: toggling a figure moves its "last set" stamp (`0328`'s trigger). Needs a migration; not touched.
Thai wording is new and unreviewed.
