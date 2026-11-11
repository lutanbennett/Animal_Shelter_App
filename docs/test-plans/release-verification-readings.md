# Feature test plan

## Header

| | |
|---|---|
| Feature | release-verification-readings |
| Backlog item | `docs/backlog.md` → #rv4qk |
| Branch / worktree | `claude/release-verification-readings` @ `C:\Development\Animal_Shelter_release-verification-readings` |
| Dev server | n/a: no browser surface |
| PR | see PR |
| Tested by / date | Claude, 2026-11-11 |
| Carries a migration? | no |
| Tested at SHA | 3f4eb35a |

## 1. Scope and risk

- [x] Change is described in one sentence: a read-only `supplier-vendor-rows` check and `--env uat` on `check-production.mjs`, as #rv4qk asked
- [x] Files touched: `scripts/check-production.mjs`, `scripts/lib/readonly-checks.mjs`, `docs/release-procedure.md`, decision file, backlog tick
- [x] Cards affected: none. Admin and signed-out public are unaffected (release tooling only)
- [x] Out of scope: running anything on production; changing `check-public-views.mjs`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with the four-gate line, all `0`:

```
=== gates: typecheck exited 0 after 197s
=== gates: lint exited 0 after 467s
=== gates: test exited 0 after 87s
=== gates: build exited 0 after 455s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable file — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Harness in begin/rollback — n/a: no migration; the new check runs inside the runner's own `begin read only` and `assertSelectOnly` covers it in `npm test`
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: `supplier-vendor-rows` run on test and on UAT, `--env uat` answers
- [ ] Data persists — n/a: read-only, writes nothing
- [ ] Create / edit / delete — n/a: read-only
- [x] Empty state: test has 0 Vendor contacts and prints 0, not an error
- [ ] Invalid input — n/a: no input; an unknown `--env` still exits 2 with its message
- [ ] Boundary cases — n/a: counts and booleans only

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no page | | |
| signed out | n/a: no page | | |

- [ ] Every login above tested — n/a: no page or route changed
- [ ] A login that should not have access is blocked — n/a: no page or route changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual updated — n/a: no UI
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI

## 6. Regression

- [x] Nearest scripts still work: `check-production.mjs` with no arguments lists checks; `npm test` includes `check-production.test.mjs` (8 pass)
- [ ] Shared file loaded from second page — n/a: no page; `readonly-checks.mjs` is read only by the script and its test
- [x] Nothing merged from `main` during `sync` was broken (sync was already up to date)

## 7. Documentation

- [x] Backlog item #rv4qk ticked on this branch
- [x] Decision file `docs/decisions/2026-11-11-release-verification-readings.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: release tooling and a procedure document, no shelter user would notice
- [x] Commit messages say why
- [x] Claims were measured: both runs pasted from real output; the pre-0348 side is stated as by construction, not run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: scripts only, nothing is deployed
- [ ] Smoke-tested — n/a: scripts only, nothing is deployed
- [ ] Timezone-sensitive — n/a: no date logic
- [ ] Boundary or banding — n/a: no thresholds
- [x] Evidence is the tool's actual output, unedited
- [ ] Public pages re-checked — n/a: public site untouched

### Deploy safety

- [ ] Supabase ref line — n/a: no deploy
- [ ] strip-baked-env — n/a: no deploy
- [ ] New secret/env var — n/a: none added

### Migration ordering

- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position — n/a: revert the commit; nothing deployed and no schema touched

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing: the first production use of `supplier-vendor-rows` happens at the next release that archives rows | |

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-11

### Manual verification

- [ ] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR opens
- [ ] Handed to the production release manager — pending: at the next release

Result: pass

Release manager acknowledgement: pending: next release
