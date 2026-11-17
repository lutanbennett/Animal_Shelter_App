# Test plan: usage-chain-transcript-rule

## Header

| | |
|---|---|
| Feature | Check for the stream-usage comment before clearing a batch's worktrees (plan-day step (e), clean-streams) |
| Backlog item | `docs/backlog.md` → `#trnsc` (ticked), `#3qmzt` (retitled, still open) |
| Branch / worktree | `claude/usage-chain-transcript-rule` @ `C:\Development\Animal_Shelter_usage-chain-transcript-rule` |
| Dev server | n/a: no UI surface |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-11-17 |
| Carries a migration? | no |
| Tested at SHA | SHAHERE |

## 1. Scope and risk

- [x] Change is described in one sentence: planner reads each merged PR for its usage comment before clearing, in two skill files
- [x] Files touched: `.claude/skills/plan-day/SKILL.md`, `.claude/skills/clean-streams/SKILL.md`, `docs/backlog.md`, a decision file. No app code
- [ ] Cards affected — n/a: no app behaviour; admin and signed-out public unaffected
- [x] Out of scope: bands table, ci.yml, measurement itself

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in, already up to date
- [x] `node scripts/gates.mjs` ran; its build step stopped on the known Next advisory halt (SecurityFatalError, not reachable here), and `npx next build` re-run inside the five-minute window exited 0. Lines as printed:

```
=== gates: typecheck exited 0 after 80s
=== gates: lint exited 0 after 260s
=== gates: test exited 0 after 73s
=== gates: build exited 1 after 293s
gates: typecheck=0 lint=0 test=0 build=1
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no schema change
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: `gh pr view` run on #1659, #1660, #1661; each carries one stream-usage comment
- [ ] Data persists — n/a: no write path
- [ ] Create / edit / delete — n/a: no app behaviour
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI surface
- [ ] Boundary cases — n/a: no UI surface

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: no app change |
| signed out | n/a | n/a | n/a: no app change |

- [ ] Every login above tested — n/a: no app change
- [ ] A login that should not have access is blocked — n/a: no app change

## 5. Cross-cutting

- [ ] Nav entry — n/a: none changed
- [ ] Manual updated — n/a: no UI change
- [ ] Translatable strings — n/a: none changed
- [ ] Mobile viewport — n/a: no layout changed
- [ ] Console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] Nearest pages still work — n/a: no app pages touched
- [ ] Shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision file `2026-11-17-usage-comment-check-before-clearing.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: the planner's own instrument, nothing a shelter user would notice
- [x] Commit messages say why
- [x] Claims measured, not reasoned: transcript survival is stated as not established

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — n/a: skill files only
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding assertions — n/a: none changed
- [ ] Evidence pasted is the tool's actual output — n/a: only gates lines pasted, unedited
- [ ] Public pages re-checked — n/a: none changed

### Deploy safety

- [ ] Production ref line read — n/a: nothing deployed by this PR
- [ ] strip-baked-env seen — n/a: nothing deployed by this PR
- [ ] New secret/env var — n/a: none

### Migration ordering

- [ ] Migration and code that reads it — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: reverting the merge restores the old skill text

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | none | no defect; build halt is the known Next advisory, not reachable here | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | none | n/a |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-17

### Manual verification

- [ ] The manual list above is empty, or checked by a person — n/a: skill files only, no UI surface

Manual verification by: n/a: skill files only, no UI surface

### Result

- [x] Open defects are fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: n/a: not yet — the PR does not exist at this commit
