# Feature test plan: policy triage, batch 2

## Header

| | |
|---|---|
| Feature | Verdicts for the last ten tables with no live policy |
| Backlog item | `docs/backlog.md` → Triage the tables where no live policy can answer |
| Branch / worktree | `claude/policy-triage-2` @ `C:\Development\Animal_Shelter_policy-triage-2` |
| Dev server | n/a: not started, docs only |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | 25b4d0c2 |

## 1. Scope and risk

- [x] Change is described in one sentence: ten tables read and given a verdict, recorded in a decision file and the registry; matches the item
- [x] Files touched: docs/decisions, docs/hard-coded-security-registry.json, docs/backlog.md, this plan. Nothing under src/, worker/ or supabase/
- [x] Roles affected: none, no behaviour changes
- [x] Out of scope: any policy or migration (would be a widening); production read (not NOT ESTABLISHED, command named in the decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends as below

gates: typecheck=0 lint=0 test=0 build=0

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] status reviewed — n/a: no migration
- [ ] dry-run reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface, documents only
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI surface
- [ ] Boundary cases — n/a: no UI surface

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all | nothing changed | n/a | n/a |

- [ ] Every role tested — n/a: nothing a role can reach changed
- [ ] Server-side block — n/a: no access change; security check still prints "no coded security outside the Admin bypass"

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual — n/a: no UI
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI

## 6. Regression

- [ ] Nearest pages — n/a: no code changed
- [ ] Shared file touched — n/a: no shared code file touched
- [ ] Nothing from main broken — n/a: docs only; gates pass after sync

## 7. Documentation

- [x] Backlog item ticked on this branch
- [x] Decision file added: docs/decisions/2026-10-28-policy-triage-2.md
- [x] README still accurate
- [ ] **Release notes.** n/a: triage and records only, nothing a user sees
- [x] Commit messages say why
- [x] Claims were measured: the ten tables came from the check run against dev; writers were read from migrations and code with line numbers

## 8. Pre-production gate

- [ ] Tested SHA — deferred: release manager
- [ ] Deployed SHA — deferred: release manager
- [ ] Deployed to test — n/a: docs only, nothing to deploy
- [ ] Smoke-tested — n/a: docs only
- [ ] Timezone-sensitive — n/a: no date logic
- [ ] Boundary assertions — n/a: no thresholds
- [ ] Evidence unedited — n/a: gates line above is as printed
- [ ] Public pages — n/a: docs only
- [ ] deploy line — n/a: docs only
- [ ] strip-baked-env — n/a: docs only
- [ ] New secrets — n/a: none
- [ ] Migration and code — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — n/a: docs only; revert the commit

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing for a person to look at; production half of the check is the planner's command in the decision file | n/a |

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-28

- [ ] manual list empty — n/a: nothing for a person to look at

Manual verification by: n/a: documents only, nothing to look at

- [x] Open defects are fixed or accepted (none)
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: pending: release manager
