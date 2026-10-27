# Test plan: harness-cleanup-removed-mechanism

## Header

| | |
|---|---|
| Feature | Delete eight check harnesses that test a removed mechanism; cloudflared self-update in Pi setup |
| Backlog item | `docs/backlog.md` → harness sweep (batch 6 leftovers); "Put cloudflared's self-updating into `scripts/pi/setup.sh`" |
| Branch / worktree | `claude/harness-cleanup-removed-mechanism` @ `C:\Development\Animal_Shelter_harness-cleanup-removed-mechanism` |
| Dev server | n/a, no running app involved |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | 1cb85ccb |

## 1. Scope and risk

- [x] Change is described in one sentence: eight red role-cell harnesses deleted (each run first), plus cloudflared self-update steps in `scripts/pi/setup.sh`
- [x] Files touched: `scripts/` (8 deleted, 3 comments reworded, `pi/setup.sh`), `docs/pi-hosting.md`, one decision file, this plan
- [x] Roles affected: none, no runtime code changed
- [x] Out of scope: `src/`, migrations, the other red harnesses, `check-features-schema`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` closing lines below

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number one above main — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File re-runnable — n/a: no migration
- [ ] Existing rows still read — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: all eight harnesses were run on dev before deletion and every one was red (25/410, 10/149, 19/256, 1/518, 38/261, 10/86, 15, 1/134 failed)
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete — n/a: no feature surface
- [ ] Empty state — n/a: no UI
- [ ] Invalid input — n/a: no UI
- [ ] Boundary cases — n/a: no UI

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all | n/a | no runtime change | n/a |

- [ ] Every role tested — n/a: no runtime code changed
- [ ] Blocked server-side — n/a: no access rules changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual updated — n/a: no UI
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI

## 6. Regression

- [x] Nearest scripts checked: `grep` finds no remaining reference to a deleted file outside records; `bash -n scripts/pi/setup.sh` passes; no `package.json` script or workflow named any of the eight
- [x] Shared files touched (`permission-probes.mjs`, `check-permission-parity.mjs`) are comment-only edits, gates run over them
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked on this branch — n/a: the backlog is edited only on the `backlog` branch; the planner ticks both items there
- [x] Decision file `docs/decisions/2026-10-28-harness-cleanup-removed-mechanism.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a developer check and a Pi provisioning script, neither seen by a shelter user
- [x] Commit messages say why
- [x] Claims were measured: failure counts come from running each harness today

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — n/a: no app code changed
- [ ] Smoke-tested on test — n/a: no app code changed
- [ ] Timezone-sensitive behaviour — n/a: none involved
- [ ] Boundary/banding assertions — n/a: none involved
- [ ] Evidence is tool output — n/a: no pasted evidence beyond the gates block
- [ ] Public pages re-checked — n/a: no app code changed
- [ ] Deploy line read — n/a: nothing deployed by this change
- [ ] strip-baked-env seen — n/a: nothing deployed by this change
- [ ] New secrets exist in production — n/a: none added
- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup fresh — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback stated — n/a: a revert of this commit restores the files; setup.sh only matters on a fresh Pi build

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | `check-perm-convert-residents` noted two policies that may over-grant | deferred to backlog: a card-system question, recorded in the decision file, not acted on |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The new setup.sh step 2a was never run on a Pi (none here); it copies the live Pi's three files, so review by eye | `scripts/pi/setup.sh`, step 2a |

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-28

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item is listed and Lutan has not looked yet (see the pending signature below)

Manual verification by: pending: Lutan to review setup.sh step 2a (cannot be run without the Pi)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the file is in the PR itself
- [ ] Handed to the production release manager — n/a: no deploy step

Result: pass with accepted defects
