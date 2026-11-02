# Test plan: sql-readers-string-literals

## Header

| | |
|---|---|
| Feature | three SQL readers read through sqlCodeOnly |
| Backlog item | `docs/backlog.md` → Security, three more SQL readers blind to string literals |
| Branch / worktree | `claude/sql-readers-string-literals` @ `C:\Development\Animal_Shelter_sql-readers-string-literals` |
| Dev server | n/a: no UI surface |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-02 |
| Carries a migration? | no |
| Tested at SHA | 6dab597c |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: assertSelectOnly, new-policy-role-names and check-rpc-inputs.test read SQL through `sqlCodeOnly`, so a `--` inside a string cannot hide a write keyword or a role
- [x] Files/areas touched listed: `scripts/lib/readonly-checks.mjs`, `scripts/check-new-policy-role-names.mjs`, `scripts/check-rpc-inputs.test.mjs`, `scripts/lib/sql-code-only.mjs` (option strings), `scripts/sql-readers-string-literals.test.mjs`, one fixture, a decision file, backlog, this plan
- [ ] Roles affected identified — n/a: a check script, no role sees it
- [x] Out of scope written down: not added to CI, other blind readers only reported, what the check asserts is unchanged

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Evidence:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 67s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 194s
=== gates: test — npm test
=== gates: test exited 0 after 18s
=== gates: build — npm run build
=== gates: build exited 0 after 315s
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
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: new-policy-role-names ok on the real repo; the new test passes
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete — n/a: no data
- [ ] Empty state — n/a: no UI
- [ ] Invalid input — n/a: no input
- [x] Boundary cases checked: a `--` inside a string before a write keyword or role; all three new tests fail against the old readers

- [ ] Every role above tested — n/a: no role-visible surface
- [ ] A role that should not have access is blocked server-side — n/a: no route or action

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The nearest things still work: check-production.test, sql-code-only.test, check-rpc-inputs.test; new-policy-role-names over every migration, findings identical to before
- [ ] Shared file touched — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added: `docs/decisions/2026-11-02-three-sql-readers-know-string-literals.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a check script, no shelter user would notice
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: keep-vs-blank compared over every migration, outputs identical

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary or banding change — n/a: no threshold
- [ ] Evidence pasted is the tool's actual output — n/a: gates output pasted above unedited
- [ ] Public pages re-checked — n/a: no public page changed
- [ ] `deploy:` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none added
- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position — n/a: a script not shipped to the Worker or Pi; revert the commit

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-02

- [x] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: no UI surface, a check script

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: pasted when the PR opens
- [ ] Handed to the production release manager — n/a: nothing to hand over, not a deploy change

Result: pass
