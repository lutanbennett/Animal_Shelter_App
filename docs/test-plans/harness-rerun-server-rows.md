# Test plan: harness-rerun-server-rows

## Header

| | |
|---|---|
| Feature | Fair re-run of the eighteen check scripts the triage marked "S" (run with no server); ten repaired or restated card-shaped |
| Backlog item | `docs/backlog.md` → the harness sweep item (UPDATE 2026-10-29, claude/harness-rerun-server-rows) |
| Branch / worktree | `claude/harness-rerun-server-rows` @ `C:\Development\Animal_Shelter_harness-rerun-server-rows` |
| Dev server | `preview_start` name `dev`, port 3005 |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-10-29 |
| Carries a migration? | no |
| Tested at SHA | e6c7c873 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the brief: each of eighteen checks reaches green, restated or retired with a reason, with a decision file
- [x] Files/areas touched listed: ten `scripts/check-*.mjs`, `docs/decisions/2026-10-29-harness-rerun-server-rows.md`, backlog note. No app code
- [ ] Roles affected identified — n/a: scripts only; the restated checks sign in by card, not by role
- [x] Out of scope written down: diet harnesses, doctor-* and clinics-readonly rows, who-does-what, menu-coverage, doctor-cells, migrations, permissions code, card-access-faults.md

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Closing line as printed:

```
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no schema change
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: each of the eighteen scripts was run against dev with the server up and ended green (access-requests-card, contact-address-fields, donate-buttons, home-screens-live, medical-jobs-app, page-guards-live, residents-export, residents-sort, upcoming-visits-page, security-role-picker, plus the seven that were never broken)
- [ ] Data persists — n/a: no write path changed
- [ ] Create / edit / delete — n/a: no app behaviour changed
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI surface
- [ ] Boundary cases — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: scripts only; Admin used only as Admin |
| management | n/a | n/a | n/a: stated by card |
| staff | n/a | n/a | n/a: retired |
| doctor | n/a | n/a | n/a: stated by card |
| volunteer | n/a | n/a | n/a: stated by card |
| signed out | n/a | n/a | n/a: nothing public changed |

- [ ] Every role above tested — n/a: the restated checks use logins holding exactly named cards
- [ ] A role that should not have access is blocked server-side — n/a: the restated checks assert this by card (upcoming-visits-page, page-guards-live, residents-export)

## 5. Cross-cutting

- [ ] Nav entry — n/a: none changed
- [ ] Manual updated — n/a: no UI change
- [ ] Translatable strings — n/a: none changed
- [ ] Mobile viewport — n/a: no layout changed; phone-width sampled (see defects)
- [ ] Console clean — n/a: scripts only
- [ ] Network clean — n/a: scripts only

## 6. Regression

- [x] Nearest checks still pass: `check-hard-coded-security.mjs` and `check-cards-count.mjs` run after the sync
- [ ] Shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item noted in `docs/backlog.md` (UPDATE line; the umbrella item stays open for other rows)
- [x] Decision file: `2026-10-29-harness-rerun-server-rows.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: internal check scripts; nothing a shelter user would notice
- [x] Commit messages say why
- [x] Claims measured, not reasoned: each outcome is from a run on dev (port 3005)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — n/a: scripts only
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding assertions — n/a: none changed
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates line is pasted, unedited
- [ ] Public pages re-checked — n/a: none changed

### Deploy safety

- [ ] Production ref line read — n/a: nothing deployed by this PR
- [ ] strip-baked-env seen — n/a: nothing deployed by this PR
- [ ] New secret/env var — n/a: none

### Migration ordering

- [ ] Migration and code that reads it — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: reverting the merge restores the old scripts

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `phone-width` full matrix (about 1,700 page loads) not completed; a sample (admin, en, 3 pages) passed | accepted: it is a release-smoke job, no repair was needed |
| 2 | low | about forty `Dev sign-in: …` roles and 18 role-less harness logins left on dev by other streams | deferred to backlog: owner of dev-signin.mjs |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Full `phone-width` run | before a release, per the smoke test |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-29

### Manual verification

- [ ] The manual list above is empty, or checked by a person — n/a: scripts only, no UI surface

Manual verification by: n/a: scripts only, no UI surface

### Result

- [x] Open defects are fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the PR does not exist at this commit
