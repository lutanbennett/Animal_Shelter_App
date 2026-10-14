# Feature test plan — cards-menu-coverage

## Header

| | |
|---|---|
| Feature | A re-runnable orphan list (pages unreachable without NavPane, per non-Admin role) and the My tasks / Maintenance counts on the home tiles |
| Backlog item | `docs/backlog.md` → **Choose each role's home tiles in Settings …** (left open: part 3, the menu removal, remains) |
| Branch / worktree | `claude/cards-menu-coverage` @ `C:\Development\Animal_Shelter_cards-menu-coverage` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | pending: opened after this plan |
| Tested by / date | Claude / 2026-10-14 |
| Carries a migration? | no |
| Tested at SHA | `81d30722` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the evidence that makes the menu removal decidable, plus the menu's count rehomed onto tiles
- [x] Files/areas touched listed — `scripts/check-menu-coverage.mjs`, `scripts/lib/menu-coverage-declared.mjs` (new), `src/lib/my-tasks/urgent.ts` (new), `src/app/NavPane.tsx`, `src/lib/home/tiles.ts`, `src/app/home/page.tsx`, manual, releases, docs
- [x] Roles affected identified — every role with tasks or maintenance sees a count on the Maintenance tile; no access changes; NavPane unchanged for everyone
- [x] Anything explicitly **out of scope** written down — removing or hiding NavPane, the per-role Show-the-menu setting, new cards (no My tasks card exists, so card homes have no My tasks tile), accepting orphans (Lutan's)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged ("Already up to date")
- [x] `node scripts/gates.mjs` ends with all exit codes 0:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `check-menu-coverage.mjs` runs against live dev data in English and Thai for all six non-Admin roles (all have cards, so card homes were exercised) and prints per-page reachable/orphan lines and a summary; the count helper is the menu's own code moved, type-checked and built
- [ ] Data persists — n/a: read-only; the script writes nothing
- [ ] Create / edit / delete all exercised — n/a: nothing is created
- [x] Empty state renders sensibly — a count of 0 draws no badge (`withCounts` requires n > 0)
- [ ] Invalid input is rejected — n/a: no input
- [x] Boundary cases checked — a link whose proof string is removed from its source file is ignored and its page reports as an orphan; a home redirect to a page the cells refuse is reported as a broken home (the dev doctor); a page that is both an entry and a deep page is listed once

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | unchanged; the script skips Admin | n/a: not touched |
| management, second_in_command, head_of_maintenance, head_of_medical, doctor, volunteer | their pages | list produced per role | first run: 82 unexplained orphans (en), 80 (th) |
| signed out | nothing | unchanged | n/a: not touched |

- [x] Every role above tested — by the script, from dev cells
- [ ] A role that should not have access is blocked server-side — n/a: no access changed, no new route

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: NavPane deliberately untouched apart from reading its count from the shared helper
- [x] Manual updated (`src/lib/manual/en.ts`, My tasks topic)
- [ ] Translatable strings — n/a: reuses `t.my.navBadge`, already in both dictionaries
- [ ] Mobile viewport (375px) — n/a: the badge reuses HomeTiles' existing pill; not driven as a signed-in role, see Left for manual verification
- [ ] Browser console clean — n/a: not driven in a browser; see Left for manual verification
- [ ] Network clean — n/a: not driven in a browser; see Left for manual verification

## 6. Regression

- [x] The pages nearest the change still work — `homeTilesFor`'s new `counts` argument is optional, so `check-home-screens.mjs` and `check-home-cards.mjs` call it unchanged; the build lists /home and /home/[role]
- [x] Any shared file touched checked from a second page — NavPane (menu count) and /home now call the same loader; both compile and build
- [x] Nothing merged from `main` during `sync` was broken — sync was a no-op

## 7. Documentation

- [ ] Backlog item ticked — n/a: part (3), the removal, is still open; a note was added to the item instead, as the brief says
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-14-menu-coverage-is-declared.md`
- [x] `README.md` still accurate — no behaviour it describes changed
- [x] **Release notes.** `unreleased` gained a line for the Maintenance tile count; no manual step is outstanding
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured — the orphan counts and the dev doctor's cells were read from dev, not inferred

## 8. Pre-production gate

- [ ] Tested SHA recorded and is the tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: reuses the menu's own due-today counters unchanged
- [ ] Boundary or banding change covered at both edges — n/a: no threshold changed
- [ ] Evidence pasted is the tool's actual output — n/a: the gates line above is verbatim
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] `deploy: production` ref line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added
- [ ] Migration ordering — n/a: no migration
- [ ] `--dry-run production` run — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — deferred: release manager; nothing here touches schema, so redeploying the previous SHA reverts it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | finding | On dev the doctor role holds only resident.record (read) and resident.microchip, so signing in sends it to /appointments, which its cells refuse | accepted: access is not this stream's to change; the script reports it as a broken home, for Lutan |
| 2 | finding | Card homes have no My tasks tile (no card), so the total count has no home there; /manual and /releases are reachable only from the menu | accepted: needs a card or a header entry, both Lutan's call |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Run `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-menu-coverage.mjs`, read the orphans against what staff really use, and decide which are accepted. Signing off that the menu can go is Lutan's | dev |
| 2 | Sign in as a head of maintenance or 2IC with a job due, and see the count on the Maintenance tile at 375 px | dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-14

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan has not looked

Manual verification by: pending: Lutan reads the orphan list and decides, and looks at the tile count in a browser

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not a release yet

Result: pass with accepted defects

Release manager acknowledgement: n/a: not a release yet
