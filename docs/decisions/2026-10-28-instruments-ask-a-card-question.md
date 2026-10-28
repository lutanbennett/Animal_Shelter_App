# The analysis instruments ask a card question

**2026-10-28**, `claude/card-shaped-instruments`. Follows `2026-10-28-analysis-by-card-not-role.md`.

## What changed

- `scripts/check-menu-coverage.mjs` answers **per card** by default: a login holding exactly one card
  (its bundle from `bundleOfCards`, the list `set_role_cards()` applies) and nothing else. It no longer
  needs the database in this mode. `--roles` keeps the old per-role walk (dev only), printed under a
  *transient context* heading.
- It prints the figure nobody had: **distinct pages**, in three states. Measured today, 64 pages:
  **37 reached alone** by some card; **10 need two cards** (a card opens the page, no card reaches it
  alone: `/appointments`, `/clinics`, `/clinics/[id]`, `/management`, `/management/clinics`,
  `/management/desexing-drives`, `/operations`, `/operations/feeding-list`, `/projects`,
  `/projects/[id]`); **17 no card opens** (only Admin can: the `/admin/*` reference pages and four
  `/management` stock and report pages). The earlier "32" was role-page pairs and is not a page count.
- `readonly-checks.mjs`: two new checks, `card-lifecycle-enclosures` and `card-clinic-visit-save`, restate
  the two role-keyed `fault-*` checks as "does any card grant X without Y", after `fault-maintenance-delete`.
  The role-keyed checks stay (they answer "who holds what today") with a *TRANSIENT CONTEXT* prefix.

## Judgement calls

- **Exit 1 is deliberate.** Menu coverage is red on purpose (`CLAUDE.md`). It now fails on the 27 pages
  that no single card both opens and reaches, until someone looks at each. "Needs two cards" is reported
  as its own answer, not called an orphan. A page's landing (`/operations`, `/management`) shows here
  because it is reached from the menu, not from a tile.
- **Written by reading, not run on production**: worktrees have no production credentials. The two new
  SQL checks reuse the `card_closure` / `card_grants` shape of `cards-union` and pass the read-only lint.
  Run `node scripts/check-production.mjs card-lifecycle-enclosures` and `card-clinic-visit-save` from the main checkout.
- **Release note for `0279`** went into `0.40.10`'s own `notes`, not `unreleased`: the capability became
  real when `0279` was applied in that release. Nothing in `releases.ts` forbids amending (its comments
  only say pre-tagging lines stay untagged). A released version was amended; object in one line if unwanted.
  Its second `0.40.10` note, which says Add Medical Photos "can no longer look at them", is now superseded by the new line beside it.
- Left alone: the rest of `check-production.mjs`, `docs/card-walkthrough.md`, `docs/card-access-faults.md`.
