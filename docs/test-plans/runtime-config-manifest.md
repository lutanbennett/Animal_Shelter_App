# Feature test plan — runtime-config-manifest

## Header

| | |
|---|---|
| Feature | One runtime-config manifest that deploy, the Pi env writer, the status scrub list and `.env.example` agree with |
| Backlog item | `docs/backlog.md` → **Runtime configuration is four hand-kept lists** (ticked; generic status tile not built, noted there) |
| Branch / worktree | `claude/runtime-config-manifest` @ `C:\Development\Animal_Shelter_runtime-config-manifest` |
| Dev server | not started — no page changes |
| PR | TBD |
| Tested by / date | Claude / 2026-10-12 |
| Carries a migration? | no |
| Tested at SHA | see PR head |

## 1. Scope and risk

- [x] Change is described in one sentence — the lists of names pushed to the Worker, written to the Pi and scrubbed from tiles now derive from `scripts/lib/runtime-config.mjs`; the backlog's generic status tile is NOT built
- [x] Files/areas touched listed — `scripts/lib/runtime-config.mjs` (new), `scripts/check-runtime-config.mjs` (new), `scripts/deploy.mjs`, `scripts/pi/write-env.mjs`, `scripts/check-worker-origin.mjs`, `src/lib/status/run.ts`, `.env.example`, `package.json` (lint), `scripts/lib/optional-secrets.mjs` (deleted)
- [x] Roles affected identified — none
- [x] Out of scope written down — `setup.sh`, the Pi deploy path, audit workflows, tile wording, the generic status tile; `ORIGIN_KEY` still scrubbed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — see PR
- [x] `node scripts/gates.mjs` — closing lines pasted in the PR
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows — n/a: no schema change
- [ ] Constraints exercised — n/a: no schema change
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — the derived lists were compared with the old hard-coded ones: workerBuild, workerRequired, workerOptional, piRequired, piOptional, piWranglerVars and the scrub set all IDENTICAL (output in the PR); `check-runtime-config.mjs` passes
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete — n/a: no data
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: the check's failure path was seen once, when it reported three names missing from `.env.example` on its first run

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | unchanged | n/a |
| management | n/a | unchanged | n/a |
| staff | n/a | unchanged | n/a |
| doctor | n/a | unchanged | n/a |
| volunteer | n/a | unchanged | n/a |
| signed out | n/a | unchanged | n/a |

- [ ] Every role tested — n/a: no role-visible change
- [ ] Blocked server-side — n/a: no access change

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual updated — n/a: nothing a shelter user sees
- [ ] Translatable strings — n/a: none touched
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] Pages nearest the change — n/a: run.ts only changes where its scrub list comes from; the same seven names
- [ ] Shared file checked from a second page — n/a: the scrub set is proven identical by script
- [x] Nothing merged from `main` during `sync` was broken — gates cover it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision added — `docs/decisions/2026-10-12-runtime-config-manifest.md`
- [x] `README.md` still accurate — it does not name these lists
- [ ] **Release notes.** n/a: refactor of deploy scripts; the status tiles read and look the same
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned.** The name count and list equality come from running the code, not from reading it

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates
- [ ] Boundary or banding change — n/a: no thresholds
- [ ] Evidence is the tool's actual output — n/a: none pasted beyond the gates
- [ ] Public pages re-checked — deferred: release manager

### Deploy safety

- [ ] `deploy:` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret exists in production — n/a: no new name; the pushed set is identical

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager; revert the PR; a Pi not redeployed keeps its existing `.env.production.local`, which this PR does not touch

## Defects found

None.

## Left for manual verification

| What | Who |
|---|---|
| Nothing to look at: no page changes | n/a |

## Sign-off

Automated checks by: Claude  Date: 2026-10-12
Manual verification by: n/a: no surface a person needs to look at

Result: PASS
