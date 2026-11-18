# Feature test plan

## Header

| | |
|---|---|
| Feature | Three more Worker stages (calendar sweep, merch supplier email, report-photo retention) report into scheduled_writer_runs |
| Backlog item | `docs/backlog.md` → `#rpwrt` |
| Branch / worktree | `claude/worker-writer-runs-adopt` @ `C:\Development\Animal_Shelter_worker-writer-runs-adopt` |
| Dev server | n/a: Worker and tile logic, driven by script against the dev database |
| PR | pending: number known once opened |
| Tested by / date | Claude, 2026-11-18 |
| Carries a migration? | no |
| Tested at SHA | 4c8d49cab |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: three Worker stages record their run outcome through the existing reporter
- [x] Files/areas touched listed: `worker/index.mjs`, `worker/writer-runs.mjs` (+ test), `src/lib/status/health.ts`, decision file
- [x] Cards affected identified: none; no access is granted or denied
- [x] Out of scope written down: a writer that dies before reporting stays invisible; the endpoints' own logic

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — pending: run before opening the PR
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`:

```
pending: filled in from the gates run
```
- [ ] CI green on the PR — n/a: checked at merge against the head SHA, not ticked here

## 3. Schema and data — skip if no migration

- [ ] n/a: no migration. 0408 already provides the table and RPC; job names are free text.

## 4. Functional checks

- [x] Happy path works: a 200 records `ok` and resets fail_runs to 0 (dev run in the decision file)
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [x] Invalid input is refused: a 500, a 401, a thrown error and an unrecognised line all record `failed` (unit test)
- [x] Boundary cases checked: `not due` records nothing; `skipped` is healthy

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a | nothing new | no page or action added | n/a |

- [x] Every login above tested — n/a: none
- [x] A login that should not have access is blocked server-side: n/a, no access added

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: nothing a user sees
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] Nearest checks still pass: `worker/writer-runs.test.mjs` 4/4; `finishHeartbeat` still receives every stage string
- [ ] Any shared file touched checked from a second page — n/a: none
- [x] Nothing merged from `main` during `sync` was broken by this branch — pending until sync

## 7. Documentation

- [x] Backlog item ticked: `#rpwrt`
- [x] Design choices in `docs/decisions/2026-11-18-worker-stages-report-themselves.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: internal visibility, no shelter user sees it
- [x] Commit messages say why, not just what
- [x] Claims were measured: the dev run output is pasted in the decision file

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: the due-hour logic is unchanged
- [ ] Boundary or banding change assertions — n/a: no banding
- [ ] Evidence pasted is the tool's actual output — n/a: decision file holds it
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering

- [ ] Both a migration and code that reads it? — n/a: none
- [ ] `--dry-run` run and clean — n/a: no migration
- [ ] Destructive migration backup — n/a: none
- [ ] Apply plan stated — n/a: none

### Rollback

- [ ] Rollback position stated — n/a: revert the PR; stray rows are harmless

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| none | | | |

## Left for manual verification

Nothing a person needs to look at.

Automated checks by: Claude  Date: 2026-11-18
Manual verification by: n/a: no UI surface

Result: pass
