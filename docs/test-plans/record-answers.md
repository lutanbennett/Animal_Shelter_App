# Feature test plan — record-answers

## Header

| | |
|---|---|
| Feature | One decision file recording Lutan's 2026-11-13 answers on receipts, the online shop and shop payments |
| Backlog item | `docs/backlog.md` → none edited; the planner files each answer against #99zuk, #00e3u, #hj1c5, #5j6kj, #cjxq0 (#s0jgi unanswered) |
| Branch / worktree | `claude/record-answers` @ `C:\Development\Animal_Shelter_record-answers` |
| Dev server | not started — docs only |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-11-13 |
| Carries a migration? | no |
| Tested at SHA | `79282fabe` plus this change |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one decision file recording the answers, each marked for the planner to file
- [x] Files/areas touched listed — `docs/decisions/2026-11-13-answers-receipts-shop-payments.md` and this plan only
- [x] Cards affected identified — none; admin and the signed-out public are unaffected (docs only)
- [x] Anything explicitly **out of scope** written down — no backlog edits, no src, scripts, worker or supabase changes

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: branch was cut from `origin/main` minutes earlier; the closing sync is run before merge
- [x] `node scripts/gates.mjs`, closing lines exactly as printed:

```
=== gates: typecheck exited 0 after 63s
=== gates: lint exited 0 after 174s
=== gates: test exited 0 after 36s
=== gates: build exited 0 after 267s

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
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, a document
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input rejected — n/a: no UI surface
- [ ] Boundary cases — n/a: no UI surface

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing changed | unchanged | n/a: docs only |
| signed out | nothing changed | unchanged | n/a: docs only |

- [ ] Every login above tested — n/a: docs only, no access rule touched
- [ ] A login that should not have access is blocked server-side — n/a: docs only

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page changed
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates passed on a tree containing only this change

## 7. Documentation

- [ ] Backlog item ticked — n/a: the brief forbids backlog edits; the planner owns them
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — that file is the deliverable
- [x] `README.md` still accurate — untouched and unaffected
- [ ] **Release notes.** n/a: a decision record, nothing a shelter user would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the file records stated answers, labelled as given in chat, with unknowns marked not captured or not decided

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — n/a: docs only, nothing deploys
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the gates block above is unedited
- [ ] Public pages re-checked — n/a: public site untouched

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code reading it? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: a document; revert the commit, no database or Worker effect

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — documents only | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-13

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: documents only

Manual verification by: n/a: nothing to look at, a decision record

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links the plan
- [ ] Handed to the production release manager — n/a: docs only

Result: pass

Release manager acknowledgement: n/a: not yet released
