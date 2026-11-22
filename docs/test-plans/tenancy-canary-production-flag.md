# Feature test plan

## Header

| | |
|---|---|
| Feature | Tenancy canary: production opt-in behind a typed flag, plus the `canary-planted-triggers` check |
| Backlog item | `docs/backlog.md` → `#cnypd` (ticked); `#ykefa` NOT ticked, it waits on the production run |
| Branch / worktree | `claude/tenancy-canary-production-flag` @ `C:\Development\Animal_Shelter_tenancy-canary-production-flag` |
| Dev server | n/a: scripts only |
| PR | see the PR |
| Tested by / date | Claude, 2026-11-22 |
| Carries a migration? | no |
| Tested at SHA | 2698a1798 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the canary may run against production only behind `--i-understand-this-plants-rows-in-production` (with `--untrusted`, no `--prove-red`, not in CI), after a new live-schema check shows nothing a planted row sets off survives a rollback
- [x] Files/areas touched: `scripts/check-tenancy-canary.mjs`, `scripts/lib/readonly-checks.mjs`, `scripts/check-production.test.mjs`, `docs/decisions/2026-11-22-tenancy-canary-production-flag.md`, `docs/backlog.md` (one tick)
- [x] Cards affected: none; no app surface, no signed-in or public page changes, Admin unaffected
- [x] Out of scope: the production canary run and the production read of the new check (both for Lutan or the planner), `src/lib/google/*`, `scripts/lib/env.mjs`, the pull-request CI path

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, all `0`:

```
=== gates: typecheck exited 0 after 79s
=== gates: lint exited 0 after 322s
=== gates: test exited 0 after 80s
=== gates: build exited 0 after 164s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration (the new check is read-only; its red path was proved in a rolled-back transaction on dev, see the decision file)
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: all eight dev and UAT runs (with and without the flag, with and without `--untrusted`) exit 0 with 0 findings
- [ ] Data persists — n/a: nothing is saved; the canary always rolls back, and the resident-number sequence was measured unchanged across a run (dev 9499, UAT 454)
- [ ] Create / edit / delete — n/a: no UI
- [ ] Empty state — n/a: no UI
- [x] Invalid input is rejected with a readable message: four production refusals (no flag; flag without `--untrusted`; flag with `--prove-red`; flag under `GITHUB_ACTIONS`) each exit 2 with their own message before any network call
- [x] Boundary cases: `--prove-red untrusted-drop-restrictive` still goes red on dev (exit 1); the new check's red path was proved with a planted `pg_notify` two functions deep (flagged, then rolled back, nothing left)

### Role access matrix

n/a for the table: scripts only, no login holds or loses anything.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no app surface | n/a | n/a |
| exactly `<card key>` | n/a: no app surface | n/a | n/a |
| signed out | n/a: no app surface | n/a | n/a |

- [ ] Every login above tested — n/a: no app surface
- [ ] A login that should not have access is blocked server-side — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no user-facing change
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The nearest things still work: `node --test scripts/check-production.test.mjs` 10 pass 0 fail; the existing checks are unchanged
- [x] Shared file touched (`scripts/lib/readonly-checks.mjs`) checked from another consumer: `check-production.mjs --env test canary-planted-triggers` loads it through the real dispatcher on dev and UAT
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item `#cnypd` ticked in `docs/backlog.md` on this branch (and nothing else there)
- [x] Design choices recorded in `docs/decisions/2026-11-22-tenancy-canary-production-flag.md`
- [x] `README.md` still accurate (no README mention of the canary guard)
- [ ] **Release notes.** n/a: nobody at a shelter sees a canary flag
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned: the trigger list, the empty outbound list, the unchanged sequence and the red path were all read from live dev and UAT; the one reasoned claim (logical decoding emits only committed transactions) is labelled as reasoning in the decision file

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager (scripts do not deploy)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (no deployed surface)
- [ ] Timezone-sensitive behaviour — deferred: release manager (none involved)
- [ ] Boundary or banding change — deferred: release manager (none involved)
- [x] Evidence pasted into this plan is the tool's actual output, unedited
- [ ] Public pages re-checked — deferred: release manager (no public surface)

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — deferred: release manager (none)

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] `--env production --dry-run` clean — n/a: no migration
- [ ] Backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager (scripts only; revert the commit)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First draft of `canary-planted-triggers` lost the backslashes in its pattern and would have reported nothing for everything | fixed; a unit test now asserts the escapes are present |
| 2 | low | The brief said no trigger on `attachments` and one on `residents`; live there are 7 and 6 | recorded in the decision file; none reaches outside the database |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Run `node scripts/check-production.mjs canary-planted-triggers` on production, bare, and confirm 0 `REACHES OUT` | main checkout (Lutan or the planner) |
| 2 | Then the production canary with a write-capable token: `node scripts/check-tenancy-canary.mjs --env production --untrusted --strict --i-understand-this-plants-rows-in-production` | main checkout (Lutan) |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-22

### Manual verification

Manual verification by: pending: Lutan runs the production canary with a write-capable token, after the production read of canary-planted-triggers

Result: pass
