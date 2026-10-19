# Role home tiles: the schema half (`0225`)

2026-10-19. Part (1) of *Choose each role's home tiles in Settings* (Admin section of `docs/backlog.md`). **The feature is not usable when this merges.** There is no Settings panel, no tile picker, and `NavPane` is untouched. The backlog item is **not** ticked; the app half closes it. Release note: `n/a`, no surface a shelter user can reach.

## What exists

`role_home_tiles (id, role_id → roles on delete cascade, path text, position int, unique (role_id, path))`. `path` is a route-registry path (or `/residents`, `/bills`, `/assistant`, which sit outside it). Fixed roles are refused (`check_violation`, trigger `role_home_tiles_guard`, same as `role_cards_guard`). Writes: Admin only (`is_admin()`), plus a restrictive aal2 policy on insert, update and delete, the pattern of `role_cards` (`0194`). Audited by `audit_role_home_tiles` (`record_audit()`), created after the seed so the seed is not logged.

## Finding: the brief's seed source was out of date

The brief says to seed from `JOBS_OF_ROLE` and `CURATED_HOME`. On dev **those are no longer what draws a home**: `homeTilesBase` returns the role's `role_cards` first, and every configured role has cards (`0194` onward). Management's curated four (`managementDay`) are dead code for Management, which now holds `recurring_jobs, residents, approve_photos`. Seeding from jobs or the curated list would have *changed* those homes. The seed is therefore **today's role_cards**: one tile per held card in `position` order, the page being the card's `opens` (or `opensAny` unless the role's clinical scope is `own_clinic`), a page two cards share kept once at its first position. This covers View residents under Residents, and matches `cardTilesFor`.

**Admin: no rows.** **A role with no cards** (only the disposable `dryrun_photo_viewer_*` on dev) **gets no rows and keeps the derived home**; SQL cannot run the derivation, and the app half must keep it as the fallback for a role with no rows.

The card → page map is copied into the migration as a `values` list. `scripts/check-role-home-tiles.mjs` fails if it differs from `cards.ts` at either scope, so a card added later without a seed row is caught.

## Proof the seed changes nothing

`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-role-home-tiles.mjs` (dev, read-only): for every role with cards, in English and Thai, the seeded paths in position order equal the hrefs `homeTilesForRoles()` draws; Admin and the public viewer have no rows; a role without cards has none; positions run 0..n-1. All green on dev. **Not covered:** the extra tiles `withCounts` adds (Approve photos for whoever may publish, My tasks), which are not role choices.

## `roles.home_path`

Read by `can.ts` (`role.homePath`) and passed through `who-does-what` and `home/roles.ts`, but nothing uses it to draw or redirect (`src/app/home/page.tsx` says so; #726 left it unread). **The new table supersedes it.** Not dropped here: dropping is the app half's or a later clean-up.

## What the app half must do

- **Read:** tiles for a role = `role_home_tiles` rows ordered by `position`, each passed through the existing tests (`canOpen` / `OUTSIDE_REGISTRY` `open`); a path the role cannot open draws no tile. Rows exist, use them; no rows, use `homeTilesBase` as today. Read for the signed-in role with the service role (as `loadRoleCards` does); the table is Admin-only under RLS.
- **Write shape:** replace a role's set in one call, `{ role_id, tiles: [{ path, position }] }` with positions 0..n-1. There is no SQL function yet (unlike `set_role_cards`); the app half adds one so the replace is atomic, or deletes and inserts in one transaction. Admin at aal2 only, via the authenticator-app step already used for the matrix.
- **Validate** every `path` against `routeFor()` or the three outside-registry paths before writing; the table does not know the registry (it only checks the shape `^/[a-z0-9/_-]*$`).
- **Permission condition:** the picker may offer a path only if some activity-holder could open it; the home still checks `canOpen`, so a tile never grants access. Writing needs the Admin role (`is_admin()`); Settings access is the existing Who does what activity.
- **Audit:** add `role_home_tiles` to `AUDITED_TABLES` in `src/lib/audit/recent-changes.ts`, its label to both dictionaries, and `undo.ts`'s `permissions` group. Not done here: those touch dictionaries and the Recent changes screen.
- **Part (3)** (removing `NavPane` for non-Admin) stays held on Lutan's menu-orphans question.
- **Checks:** extend `check-role-home-tiles.mjs` with a rolled-back write harness (aal2 required, fixed role refused) once a function exists.

## What I did not do

No UI, no `src/app/` change, no SQL write function, no change to `home_path`, no backlog tick, no release note. `check-home-cards.mjs` untouched.

## Production

Apply `0225` with the release. Production's `role_cards` seeds it, so production homes are unchanged; re-run the check against production's data before relying on it, because it is dev-only by design.
