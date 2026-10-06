# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | A home belongs to the role: the curated home is a lookup (`CURATED_HOME`), a shelter-made role gets the derived home, and the decision is recorded |
| Backlog item | `docs/backlog.md` → Next up: A home screen belongs to a role, not to the string `management` |
| Branch / worktree | `claude/home-screen-belongs-to-a-role` @ `C:\Development\Animal_Shelter_home-screen-belongs-to-a-role` |
| Dev server | `http://localhost:3010` (not driven: no role's home changes) |
| PR | linked from the PR itself |
| Tested by / date | Claude (home-screen-belongs-to-a-role session), 2026-10-06 |
| Carries a migration? | no |
| Tested at SHA | recorded by the PR's head commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the backlog item: the decision (neither `home_path` nor a job list; the derived home is right for a shelter-made role until curated) is recorded, `management` is looked up in `CURATED_HOME` instead of compared as a string, and `check-home-screens.mjs` proves a shelter-made role with Management's cells gets the derived home
- [x] Files/areas touched listed: `src/lib/home/tiles.ts`, `scripts/check-home-screens.mjs`, `docs/decisions/2026-10-06-home-screen-belongs-to-a-role.md`, `docs/roles-and-permissions.md`, `docs/backlog.md`, this plan
- [x] Roles affected identified: none changes; Management's home is the same function reached by a lookup
- [x] Out of scope written down: a stored home (`home_tiles`), the Settings matrix, the vet's by-name redirect in `/my`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` run before the PR
- [x] `node scripts/gates.mjs` — typecheck, lint, build exit codes recorded in the PR
- [x] CI green on the PR — checked after pushing

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `node scripts/check-home-screens.mjs` is `all ok`, including Management's four tiles and the six new shelter-made-role assertions
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete all exercised — n/a: no data written
- [x] Empty state: a shelter-made role with every cell taken away still has Residents (asserted)
- [x] Invalid input / boundary: take `recurring.manage` or `recurring.do_own` away from a shelter-made role and exactly that tile goes (asserted)
- [x] Boundary cases: Intake is not offered to a shelter-made role (it belongs to the curated screen)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/home`, `/home/[role]` | unchanged | not driven: no code path for Admin changed |
| management | `/home` | the same four tiles | asserted by the checker, not driven |
| staff | `/home` | unchanged | asserted by the checker |
| vet | `/home` | unchanged | asserted by the checker |
| volunteer | `/home` | unchanged | asserted by the checker |
| signed out | `/home` | redirect to login | n/a: not touched |

- [ ] Every role above tested — n/a: the home function is pure and the checker runs it for each default role; no page or guard changed
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no wording changed
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport — n/a: no layout changed
- [ ] Browser console clean — n/a: no UI changed
- [ ] Network clean — n/a: no UI changed

## 6. Regression

- [x] The nearest things still work: `check-permission-parity`, `check-permission-catalogue` and `check-policy-role-names` run and are unchanged (no policy touched)
- [ ] Shared file checked from a second page — n/a: `tiles.ts` is read only by `/home` and `/home/[role]`, both through `homeTilesFor`, whose output the checker pins
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices recorded in `docs/decisions/2026-10-06-home-screen-belongs-to-a-role.md`, with the road not taken
- [ ] `README.md` still accurate — n/a: README does not describe home screens
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: no role's home changes; groundwork for roles nobody can create yet
- [x] Commit messages say why, not just what
- [x] Claims were measured: that the vet row has no `home_path` was read from `0132`, and the checker output is from runs

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — deferred: release manager at deploy
- [ ] Deployed SHA matches — deferred: release manager at deploy

### On the deployed build

- [ ] Deployed to test — deferred: release manager at deploy
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager at deploy
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: the boundary is a cell present or absent, both asserted
- [ ] Evidence pasted is the tool's actual output — n/a: no deployed evidence
- [ ] Public pages re-checked after cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager at deploy
- [ ] `strip-baked-env` seen — deferred: release manager at deploy
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR; no data or schema changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The backlog's premise that the vet uses `roles.home_path` is wrong (the vet is sent by scope); corrected in the decision file | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as Management (or Admin's switch at `/home/management`), the phone home still shows Recurring jobs, Intake, Residents, My tasks | `/home` at 375 px |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (home-screen-belongs-to-a-role session)  Date: 2026-10-06

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item outstanding, see the pending line below

Manual verification by: pending: Lutan looks at Management's phone home  Date: —

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: no deploy-visible change

Result: pass

Release manager acknowledgement:   Date:
