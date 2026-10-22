# Feature test plan

Filled from `docs/test-plan-template.md`.

---

## Header

| | |
|---|---|
| Feature | CI `audit` job: timeout, one retry, registry failure is a warning; delete the dead AppSheet importer and exporter |
| Backlog item | `docs/backlog.md` → the `audit` job HANGS item, and the `import-appsheet.mjs` has NO job at cutover item |
| Branch / worktree | `claude/tooling-audit-and-importer` @ `C:\Development\Animal_Shelter_tooling-audit-and-importer` |
| Dev server | n/a: not started, no app code changed |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-10-22 |
| Carries a migration? | no |
| Tested at SHA | `c959cb82` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the audit step gets a 90 s timeout and one retry and reports an unreachable registry as a warning, and the two AppSheet scripts are deleted.
- [x] Files/areas touched listed: `.github/workflows/ci.yml` (audit job only), deleted `scripts/import-appsheet.mjs` and `scripts/appsheet-export.mjs`, comments in `scripts/load-residents.mjs` and `scripts/fix-panda-placements.mjs`, `docs/data-migration.md`, `docs/backlog.md`, one decision file.
- [ ] Roles affected identified — n/a: CI and developer scripts; no role sees any of it.
- [x] Out of scope: `advisories.yml` (deliberately different), any dependency, `src/`, the cutover itself.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: the step's script extracted from the workflow and run with the real `audit:prod` exits 0 and prints `found 0 vulnerabilities`.
- [ ] Data persists — n/a: no data
- [x] Create / edit / delete all exercised: a stub `audit:prod` printing "found 2 vulnerabilities" and exiting 1 makes the step exit 1 (still red); a stub printing a registry error and exiting 1 twice ends in the `::warning` and exit 0.
- [ ] Empty state renders sensibly — n/a: no UI
- [x] Invalid input is rejected: a real finding is not retried and not downgraded.
- [x] Boundary cases: the timeout path itself (`timeout 90` exit 124) was not provoked; it takes the same no-summary branch as the registry-error stub.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all | n/a | CI and scripts, no app surface | n/a |

- [ ] Every role above tested — n/a: no app code changed
- [ ] A role that should not have access is blocked server-side — n/a: no app code changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no user-facing change
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] Nearest things still work: grep for the deleted names across scripts, src, docs, package.json and .github finds only historical prose and the decision/backlog records; no code imports them. `gates.mjs` including build passes.
- [ ] Shared file touched from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken: gates run after the sync.

## 7. Documentation

- [x] Backlog items ticked in `docs/backlog.md` on this branch (both)
- [x] Decision added: `docs/decisions/2026-10-22-audit-job-inconclusive-is-not-red.md`
- [ ] `README.md` still accurate — n/a: it names neither script
- [ ] **Release notes.** n/a: CI and a deleted developer script; no shelter user would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions.md were measured, not reasoned.** The three audit outcomes were run against a stub; the one thing not measured (npm's exact registry-error wording) is stated in the decision file.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — deferred: release manager (nothing here ships in the Worker)
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — deferred: release manager (no date logic)
- [ ] Boundary or banding change — deferred: release manager (none)
- [ ] Evidence pasted is unedited — deferred: release manager (the gates line above is verbatim)
- [ ] Public pages re-checked — deferred: release manager (no page changed)

### Deploy safety

- [ ] Deploy line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — deferred: release manager (none added)

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR. The deleted scripts are in git history. No migrations involved.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | pending: the first real registry hang on a PR run shows a yellow warning, not a red | the `audit` job log on a later PR |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-22

### Manual verification

Manual verification by: pending: the audit warning path can only be seen on a real registry hang

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is committed in the PR and the PR links it
- [ ] Handed to the production release manager — n/a: nothing deploys

Result: pass

Release manager acknowledgement: n/a: nothing deploys
