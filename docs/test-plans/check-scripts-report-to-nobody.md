# Test plan: check-scripts-report-to-nobody

## Header

| | |
|---|---|
| Feature | check-scripts-report-to-nobody |
| Backlog item | `docs/backlog.md` → `scripts/check-medical-role.mjs` is RED on `main` and is in neither CI nor `gates.mjs` |
| Branch / worktree | `claude/check-scripts-report-to-nobody` @ `C:\Development\Animal_Shelter_check-scripts-report-to-nobody` |
| Dev server | n/a |
| PR | see PR |
| Tested by / date | Claude / 2026-10-23 |
| Carries a migration? | no |
| Tested at SHA | 18fd53ca |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `check-medical-role.mjs` corrected and green, the CI decision made (no), the unwired scripts swept, four green ones wired into `lint`
- [x] Files touched: `scripts/check-medical-role.mjs`, `package.json` (lint chain), `docs/decisions/2026-10-23-check-scripts-report-to-nobody.md`, `docs/backlog.md`, this plan
- [x] Roles affected: none, developer scripts only
- [x] Out of scope: wiring the other 162 scripts, fixing the red ones found (filed on the backlog), any migration, `check-card-walkthrough.mjs`, both audit workflows

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Run before the change (all four 0) and after (below)

gates: typecheck=0 lint=0 test=0 build=0

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end. `node scripts/check-medical-role.mjs` against dev: before, `83 checks held, 5 failed. RESULT: RED`; after, `88 checks held, 0 failed. RESULT: GREEN`. The four wired scripts each exit 0 and `npm run lint` exits 0 with them in the chain
- [ ] Data persists — n/a: no stored data; the harness rolls back
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI surface
- [x] Boundary cases: the bundle check stays exact. It reads the cards the role holds from `role_cards` and requires `role_permissions` to equal their expansion plus the draft's cells, so an extra power with no card still fails. The extra power on dev (`photos.shelter_add`) was traced to the Add Shelter Photos card held by the role

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a: no UI surface | n/a |

- [ ] Every role tested — n/a: no UI surface (the harness itself exercises admin, management, volunteer, doctor, a no-role login and the Head of Medical under their own JWTs)
- [ ] Blocked server-side — n/a: no UI surface

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual — n/a: developer scripts
- [ ] Translatable strings — n/a: no UI surface
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console — n/a: no UI surface
- [ ] Network — n/a: no UI surface

## 6. Regression

- [x] Nearest code, the other lint-chain checks, still pass (`npm run lint` exit 0)
- [ ] Shared file touched — n/a: `package.json` lint chain only appended to; loaded by running `npm run lint` and `node scripts/gates.mjs`
- [x] Nothing merged from main during sync was broken (gates after sync all 0)

## 7. Documentation

- [x] Backlog item ticked on this branch; two follow-ups filed on the `backlog` branch
- [x] Decision file added
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: tooling and checks — nothing a shelter user would notice changed
- [x] Commit messages say why
- [x] Claims were measured: every script's status in the sweep comes from running it on 2026-10-23, not from reading its header

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — n/a: scripts, not deployed
- [ ] Smoke-tested — n/a: scripts, not deployed
- [ ] Timezone-sensitive — n/a: no dates
- [ ] Boundary/banding — n/a: no thresholds
- [ ] Evidence is actual tool output — n/a: the quoted lines are the scripts' own output
- [ ] Public pages — n/a: no public change
- [ ] Deploy line read — n/a: not deployed
- [ ] strip-baked-env — n/a: not deployed
- [ ] New secret — n/a: none
- [ ] Migration and reader — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — n/a: revert the commits; nothing to undo in data

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | Medium | 52 of 109 runnable database harnesses are red or cannot run; three suggest a doctor can write outside their own clinic | Filed on the backlog, not fixed here |
| 2 | Low | `check-worker-origin` stale; `check-backup-prune` flaky on random input | Filed on the backlog, not fixed here |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether Add Shelter Photos belongs on the Head of Medical in production | Lutan; production was not read |

## Sign-off

- [x] Everything verifiable was run, not assumed
- [x] Nothing is ticked that was not executed

Automated checks by: Claude  Date: 2026-10-23
Manual verification by: pending: Lutan to decide the Head of Medical's Add Shelter Photos card in production

Result: pass
