# Feature test plan

## Header

| | |
|---|---|
| Feature | `shelter_calendar_status()`: Admin's status-only view of a shelter's calendar (schema half, piece 2) |
| Backlog item | `docs/backlog.md` → `#calsh` |
| Branch / worktree | `claude/calendar-status-rpc` @ `C:\Development\Animal_Shelter_calendar-status-rpc` |
| Dev server | n/a: schema only, none started |
| PR | pending: number known once opened |
| Tested by / date | Claude, 2026-11-18 |
| Carries a migration? | yes: 0410 |
| Tested at SHA | f3b74615e |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a security definer function returning a shelter's calendar connection status to Admin only, never a secret
- [x] Files/areas touched listed: `supabase/migrations/0410_shelter_calendar_status_rpc.sql`, decision file, this plan
- [x] Cards affected identified: none; Admin is decided by `is_admin()`, outside the card system
- [x] Out of scope written down: the Admin status display, the save screen, the poll, import and tile check

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`:

```
gates: typecheck=0 lint=0 test=0 build=1
(build: twice stopped on Next SecurityFatalError advisory halt, the known environment fault; this PR changes no src/ file; CI's build is the arbiter)
```
- [ ] CI green on the PR — n/a: checked at merge against the head SHA, not ticked here

## 3. Schema and data — skip if no migration

- [x] Migration number is one above the highest on `main`: 0410 over 0409, `check-migration-numbers.mjs` ok
- [x] `--status` reviewed: 410 applied before, 1 pending (this file)
- [x] `--dry-run` reviewed: `dry-run 0410_shelter_calendar_status_rpc.sql … ok`
- [x] Applied to dev: `applying 0410_shelter_calendar_status_rpc.sql … ok`; status then lists it as applied here
- [x] File is re-runnable: `create or replace`, guarded owner change
- [x] Existing rows still read correctly: n/a in effect, no table changed; `shelter_calendar_credentials` was empty
- [x] Constraints and defaults exercised: harness planted rows for two shelters and rolled back
- [x] Down-migration written: `TO UNDO:` line in the header
- [x] Production apply plan stated: with the release; no data change, function only, empty table returns no row

## 4. Functional checks

- [x] Happy path works: Admin of shelter A saw exactly planted-a
- [ ] Data persists — n/a: no UI surface, function is read-only
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [x] Empty state renders sensibly: empty table returns no row (fallback shelter)
- [x] Invalid input is refused: non-Admin 0 rows; no shelter header 0 rows; Admin under another shelter's header 0 rows
- [x] Boundary cases checked: result type has no secret column

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| Admin (outside cards) | function | own shelter's status row | pass |
| a non-Admin login | function | 0 rows | pass |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side: yes, by `is_admin()` in the function

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: nothing a user sees
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] Nearest checks still pass: tenancy catalogue `--tenant-role rls_definer --strict` flags 0 functions
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked — n/a: `#calsh` stays open, three pieces remain
- [x] Design choices in `docs/decisions/2026-11-18-shelter-calendar-status-rpc.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a database function with no reader yet, nobody would notice
- [x] Commit messages say why, not just what
- [x] Claims were measured: harness output and lint are live runs

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no banding
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates block
- [ ] Public pages re-checked — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering

- [ ] Both a migration and code that reads it? — n/a: no code reads it yet
- [ ] `--dry-run` run and clean — deferred: release manager
- [ ] Destructive migration backup — n/a: additive function only
- [ ] Apply plan stated — deferred: release manager

### Rollback

- [ ] Rollback position stated — n/a: drop the function, per the `TO UNDO:` line

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| none | | | |

## Left for manual verification

Nothing a person needs to look at.

Automated checks by: Claude  Date: 2026-11-18
Manual verification by: n/a: no UI surface

Result: pass
