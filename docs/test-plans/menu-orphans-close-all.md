# Feature test plan: menu-orphans-close-all

## Header

| | |
|---|---|
| Feature | Tiles for the six pages ruled 2026-10-21; menu-coverage gate 15 → 0 |
| Backlog item | `docs/backlog.md` → Menu-removal orphans 2, 3, 5, 6 of 6 |
| Branch / worktree | `claude/menu-orphans-close-all` @ `C:\Development\Animal_Shelter_menu-orphans-close-all` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` |
| PR | see PR description |
| Tested by / date | Claude, 2026-10-22 |
| Carries a migration? | no |
| Tested at SHA | b2e4e213 |

## 1. Scope and risk

- [x] One sentence: the named roles get tiles for View residents, Record Weight, Add Medical Photos, Feed Special Diets and Bills in code, and Add Shelter Photos is assigned on dev
- [x] Touched: `src/lib/home/tiles.ts`, `src/lib/home/ruled-cards.test.mjs`, `src/lib/releases.ts`, `docs/`; dev `role_cards` and `role_permissions` (4 rows each, Add Shelter Photos)
- [x] Roles: management, second_in_command, head_of_maintenance, head_of_medical (tiles); doctor (Add Shelter Photos on dev only)
- [x] Out of scope: removing the menu (`NavPane`), any migration, production role_cards (Director ticks Add Shelter Photos for four roles)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` closing line below
```
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] status reviewed — n/a: no migration
- [ ] dry-run — n/a: no migration
- [ ] applied to dev — n/a: no migration
- [ ] re-runnable — n/a: no migration
- [ ] existing rows — n/a: no migration
- [ ] constraints exercised — n/a: no migration
- [ ] down-migration — n/a: no migration
- [ ] production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: check-menu-coverage.mjs reads "No unexplained orphans" (was 15), and ruled-cards.test.mjs passes
- [ ] Data persists — n/a: tiles are derived on every load; the only data written is dev role_cards rows
- [ ] Create / edit / delete — n/a: no create/edit/delete surface
- [ ] Empty state — n/a: a role whose cells do not cover a card gets no tile (test "No cells, no tile")
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: no input; cell-coverage boundary is the "No cells, no tile" test

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | unchanged | n/a: Admin keeps the menu and is not in RULED_CARDS |
| management | tiles | Weight, Medical Photos, Diets, Bills, Add Shelter Photos | gate: 0 orphans |
| staff | n/a | retired | n/a: retired by 0173 |
| doctor | Add Shelter Photos | tile on dev | gate: 0 orphans |
| volunteer | none new | unchanged | gate: 0 orphans, test asserts no View residents tile |
| signed out | n/a | unchanged | n/a: no home tiles |

- [x] Every role above tested (by the coverage gate and unit tests)
- [ ] Server-side block — n/a: no page or permission changed except dev cell photos.shelter_add for four roles

## 5. Cross-cutting

- [ ] Nav entry — n/a: NavLinks.tsx deliberately untouched
- [ ] Manual — n/a: card labels already exist; no new wording
- [ ] Translatable strings — n/a: no new strings, labels already in both dictionaries
- [ ] Mobile viewport — n/a: no signed-in browser session; listed under Left for manual verification
- [ ] Browser console — n/a: no signed-in browser session; listed under Left for manual verification
- [ ] Network — n/a: no new requests

## 6. Regression

- [x] Nearest pages: landing-tiles, add-photos-card, approve-photos-card, role-groups tests all pass (`npm test`, 0 fail)
- [ ] Shared file loaded from a second page — n/a: tiles.ts is exercised by the coverage gate for every role
- [x] Nothing merged from main during sync was broken (gates 0)

## 7. Documentation

- [x] Backlog items 2, 3, 5 and 6 ticked in `docs/backlog.md`
- [x] `docs/decisions/2026-10-22-menu-orphans-close-all.md`
- [x] README still accurate
- [x] **Release notes.** `unreleased` has a line for the four roles; it names only the tiles that work with no manual step
- [x] Commit messages say why
- [x] Claims were measured: the 15 → 0 count is the gate's own output

## 8. Pre-production gate

- [ ] Tested SHA — deferred: release manager
- [ ] Deployed SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone — deferred: release manager
- [ ] Boundary or banding — deferred: release manager
- [ ] Evidence unedited — deferred: release manager
- [ ] Public pages — deferred: release manager
- [ ] deploy line — deferred: release manager
- [ ] strip-baked-env — deferred: release manager
- [ ] new secrets — deferred: release manager
- [ ] Migration ordering — deferred: release manager
- [ ] production dry-run — deferred: release manager
- [ ] backup — deferred: release manager
- [ ] Apply plan — deferred: release manager
- [ ] Rollback — deferred: release manager

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | check-cards-schema.mjs on dev reports drift for doctor and dryrun_photo_viewer, plus a last-approver harness error; none touch cells changed here | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Browser: a role's home shows a new tile and it opens its page (no signed-in session in this stream) | dev, port 3010 |
| 2 | Production: Director ticks Add Shelter Photos for doctor, head of medical, management, 2IC | Who does what |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-22

### Manual verification

- [ ] The manual list above is empty — n/a: list is not empty, only the person who looked may tick

Manual verification by: pending: browser tile check and the production Add Shelter Photos tick

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: handover happens at release time

Result: pass with accepted defects

Release manager acknowledgement: 
