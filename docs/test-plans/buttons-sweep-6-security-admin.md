# Test plan: buttons-sweep-6-security-admin

## Header

| | |
|---|---|
| Feature | Audit of /admin/security and /admin/who-does-what against their actions (slice 6, last); no gap found |
| Backlog item | `docs/backlog.md` → buttons follow cards (slice 6, ticked) |
| Branch / worktree | `claude/buttons-sweep-6-security-admin` @ `C:\Development\Animal_Shelter_buttons-sweep-6-security-admin` |
| Dev server | `http://localhost:3006` |
| PR | see PR |
| Tested by / date | Claude, 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | da8bdabd |

## 1. Scope and risk

- [x] Change is described in one sentence: both admin screens are Admin-only by `perms.isAdmin` and every control matches its action guard, so no code changed
- [x] Files touched: a decision file with the audit table, the backlog tick, this plan; no `src` change
- [x] Roles affected: none changes; Admin is the only role that uses these screens and sees everything
- [x] Out of scope: every other screen (slices 1-5), all server and database checks (unchanged)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends clean:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: aal2 required, no authenticator; correct by inspection, see decision
- [ ] Data persists — n/a: no code changed
- [ ] Create / edit / delete exercised — n/a: no data change
- [ ] Empty state renders sensibly — n/a: no list changed
- [ ] Invalid input rejected — n/a: no input
- [ ] Boundary cases checked — n/a: no input

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | both screens | everything (page loads; actions need authenticator) | inspection only |
| management | both screens | refused or read-only | not driven |
| staff | n/a: retired role | none | n/a |
| doctor | both screens | refused or read-only | not driven |
| volunteer | both screens | refused or read-only | not driven |
| signed out | both screens | login | not driven |

- [ ] Every role above tested — n/a: both screens are Admin-only and aal2 needs an authenticator; inspection matrix in the decision is the proof
- [ ] A role without access is blocked server-side — n/a: guards read: hasAdminRole() then hasTwoStep() on every action

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no new behaviour to document
- [ ] Translatable strings — n/a: no new strings
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — n/a: not driven
- [ ] Network clean — n/a: not driven

## 6. Regression

- [ ] Nearest pages still work — n/a: not driven; no code changed
- [ ] Shared file touched checked from a second page — n/a: `releases.ts` is the only shared file, an added line
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked on this branch (docs/backlog.md)
- [x] Decision added: `docs/decisions/2026-10-28-buttons-follow-cards-admin-screens.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: Admin sees all of both screens, so no login's view changes
- [x] Commit messages say why, not just what
- [x] Claims in commit messages were measured, not reasoned

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary/banding assertions — n/a: not a boundary change
- [ ] Evidence is the tool's actual output — n/a: only the gates block, pasted unedited
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] Deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Both migration and code — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — n/a: pure UI gating; revert the commit

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none: nothing to look at, no code changed | |

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-28

- [ ] The manual list is empty or checked — n/a: list is empty

Manual verification by: n/a: no code changed, nothing to look at

### Result

- [ ] Open defects fixed or accepted — n/a: no defects
- [ ] Checklist pasted into the PR — n/a: PR does not exist yet
- [ ] Handed to the release manager — n/a: handed over on merge

Result: pass

Release manager acknowledgement: n/a: not yet
