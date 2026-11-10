# Feature test plan

## Header

| | |
|---|---|
| Feature | Move two testing items out of the backlog: acceptance testing into `docs/acceptance-testing.md`, the last meme-save check into the release smoke test |
| Backlog item | `docs/backlog.md` → `#mc6fu` and `#t3n9r` removed (Lutan, 2026-11-10) |
| Branch / worktree | `claude/testing-items-to-test-plan` @ `C:\Development\Animal_Shelter_testing-items-to-test-plan` |
| Dev server | n/a: not started, documentation only |
| PR | opened from this branch |
| Tested by / date | Claude (automated) / 2026-11-10 |
| Carries a migration? | no |
| Tested at SHA | the branch tip at the commit that adds this plan |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: two testing items leave the backlog and land in test documentation
- [x] Files/areas touched listed: `docs/backlog.md`, `docs/acceptance-testing.md` (new), `docs/release-smoke-test.md`, one decision file, this plan. No code
- [ ] Cards affected identified — n/a: documentation only, no card behaviour changes
- [x] Anything explicitly **out of scope** written down: `#79sqf`, `#7bd5u` and five infrastructure items stay, reasons in the decision file

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` closing lines, as printed:

  ```
  === gates: build exited 0 after 171s

  gates: typecheck=0 lint=0 test=0 build=0
  ```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 4. Functional checks

- [x] Happy path: `check-backlog-ids` and `check-backlog-sections` both ok (1061 ids, 52 open items); the new file holds the item verbatim
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: no input

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any | n/a | n/a: documentation only | n/a |

- [ ] Every login above tested — n/a: no app surface changed
- [ ] A login that should not have access is blocked — n/a: no access changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: none added
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] Nearest pages still work — n/a: no app code touched
- [ ] Shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates pass after sync

## 7. Documentation

- [x] Backlog items removed in `docs/backlog.md` on this branch
- [x] Decision file added: `docs/decisions/2026-11-10-testing-items-leave-the-backlog.md`
- [ ] `README.md` still accurate — n/a: it does not mention either item
- [ ] **Release notes.** n/a: moves backlog items into documentation; nothing a shelter user sees changes
- [x] Commit messages say why
- [ ] Claims measured, not reasoned — n/a: no behavioural claims, only moved text

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed to test and smoke-tested — deferred: release manager
- [ ] Rollback position — deferred: release manager

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing: documentation only | |

## Sign-off

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-10

- [ ] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: documentation only, nothing to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: after the PR opens
- [ ] Handed to the production release manager — pending: at release

Result: pass
