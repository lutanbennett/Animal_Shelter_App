# Feature test plan — pi-deploy-truth

## Header

| | |
|---|---|
| Feature | deploy-pi.sh probes with the origin key, builds beside .next and always runs the asset check |
| Backlog item | `docs/backlog.md` → **deploy-pi.sh reports DEPLOY FAILED on a deploy that succeeded** and **A Pi deploy can poison Cloudflare's cache** (both ticked) |
| Branch / worktree | `claude/pi-deploy-truth` @ `C:DevelopmentAnimal_Shelter_pi-deploy-truth` |
| Dev server | not started — no UI surface |
| PR | see the PR |
| Tested by / date | Claude / 2026-10-19 |
| Carries a migration? | no |
| Tested at SHA | 26d99cd4 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the Pi deploy sends the origin key on its version probe, builds into .next.new and renames it in, and runs the asset check however it ends
- [x] Files/areas touched listed — `scripts/pi/deploy-pi.sh`, `scripts/pi/build-lib.sh` and its test, `scripts/actions-key.mjs`, `next.config.ts` (NEXT_DIST_DIR switch), `docs/release-procedure.md`, backlog ticks, decision file
- [x] Roles affected identified — none; release manager running a Pi deploy
- [x] Anything explicitly **out of scope** written down — option (a) automatic purge (needs the token, #720) and option (c) assets from the Worker

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`

```
=== gates: build exited 0 after 190s

gates: typecheck=0 lint=0 test=0 build=0
```

- [x] CI green on the PR — all 8 checks passed on the synced commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to dev — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration — n/a: no migration in this PR
- [ ] Production apply plan — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — only as far as scripts can: `node --test scripts/pi/build-lib.test.mjs` passes 7/7, including a fake origin that answers only with the right `x-origin-key`; the real Pi deploy is left for manual verification
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete all exercised — n/a: no data
- [ ] Empty state renders sensibly — n/a: no UI
- [x] Invalid input is rejected — a refused or wrong probe still returns 1 and prints DEPLOY FAILED (tested)
- [ ] Boundary cases checked — n/a: no thresholds

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | nothing | no UI | n/a |

- [ ] Every role above tested — n/a: no UI surface
- [ ] A role that should not have access is blocked server-side — n/a: no UI surface; the origin gate in src/proxy.ts is unchanged

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no page
- [ ] Manual updated — n/a: release-procedure.md is the operator doc; /manual is for shelter users
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiled with the unchanged default distDir
- [ ] Any shared file touched checked from a second page — n/a: next.config.ts change is inert unless NEXT_DIST_DIR is set; the gates build proves the default
- [x] Nothing merged from `main` during `sync` was broken — nothing was merged

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-19-pi-deploy-truth.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: no shelter user would notice; and the swap is unproven on a Pi until the next Pi deploy
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — the probe behaviour is from the script tests; that next start serves a distDir build after the rename is stated as unproven

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: Lutan, first Pi deploy on the test clone
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted is unedited** — n/a: gates output above is verbatim; no deploy evidence yet
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no Worker deploy involved
- [ ] `strip-baked-env` seen — n/a: no Worker deploy involved
- [ ] Any new secret/env var exists in production — n/a: none; ORIGIN_KEY already exists

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup for destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — revert the PR; the script's own rollback is two mv commands from .next.prev, printed when the probe fails

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | none found | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Run `./scripts/pi/deploy-pi.sh --env test` on the test clone: the log shows a build into .next.new, the swap, `serving <version> as expected` and the asset check line, and the site renders styled | Pi test clone |
| 2 | On the next production deploy the probe line must read `serving <version> as expected` (no false banner) and end with `check-assets: ok`: `ssh lutan@lanna-pi.local` then the deploy per docs/release-procedure.md | Pi production |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-19

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items remain for Lutan (see the pending signature below)

Manual verification by: pending: Lutan, the two items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
