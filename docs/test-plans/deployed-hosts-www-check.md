# Feature test plan

## Header

| | |
|---|---|
| Feature | Hosts check: www. only if routed |
| Backlog item | `docs/backlog.md` → #wwwcb (#aucbk left open) |
| Branch / worktree | `claude/deployed-hosts-www-check` @ `C:\Development\Animal_Shelter_deployed-hosts-www-check` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | pending: opened after this plan |
| Tested by / date | Claude, 2026-11-21 |
| Carries a migration? | no |
| Tested at SHA | c77e6d5c4 |

## 1. Scope and risk

- [x] Change is described in one sentence: `check-deployed-hosts.mjs` counts an invented `www.` form only when wrangler routes it, so unrouted ones stop failing a release
- [x] Files touched: `scripts/check-deployed-hosts.mjs`, `scripts/lib/deployed-hosts.mjs`, `scripts/deployed-hosts.test.mjs`, decision file
- [x] Cards affected: none, it is a read-only release script; admin and the public unaffected
- [x] Out of scope: any Supabase setting, UAT and production runs, `choosePrimaries()`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly before the gates run
- [x] `node scripts/gates.mjs` ends with one line

```
=== gates: typecheck exited 0 after 103s
=== gates: lint exited 0 after 342s
=== gates: test exited 0 after 105s
=== gates: build exited 0 after 343s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

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

- [x] Happy path: real wrangler config gives test 1 address, uat 1, production 4 (www. forms routed)
- [ ] Data persists — n/a: read-only script
- [ ] Create / edit / delete — n/a: read-only script
- [ ] Empty state — n/a: an empty list is covered by a unit test (every address missing)
- [ ] Invalid input — n/a: no input; behaviour unchanged for errors
- [x] Boundary: unrouted www. dropped, routed www. kept and still fails when unlisted, literal host kept; three new tests in `scripts/deployed-hosts.test.mjs`

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a | no app surface | n/a | n/a |

- [ ] Every login tested — n/a: no app surface
- [ ] Blocked server-side — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual — n/a: no UI
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The nearest thing, the existing six tests in the same file, still pass (9 of 9)
- [ ] Shared file touched — n/a: only a script library shared with the hosts check, exercised by the same run
- [x] Nothing merged from `main` was broken by this branch

## 7. Documentation

- [ ] Backlog item note — n/a: #wwwcb ticked on the backlog branch by the planner; #aucbk stays open, production run outstanding
- [x] Decision file `docs/decisions/2026-11-21-deployed-hosts-www-check.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a release script, nobody at a shelter or an Admin would notice
- [x] Commit messages say why, not just what
- [x] Claims were measured: address counts come from the real `wrangler.jsonc`

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Boundary or banding — n/a: none
- [ ] Evidence is the tool's actual output — n/a: no timing or banding claim
- [ ] Public pages re-checked — n/a: no public change
- [ ] deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret or env var — n/a: none added
- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — n/a: scripts only, nothing deployed; revert the commit

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-21

### Manual verification

- [x] The manual list above is empty, so nothing is being signed for

Manual verification by: n/a: no surface a person needs to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is in the PR as a file
- [ ] Handed to the production release manager — pending: the planner runs all three environments after merge

Result: pass

Release manager acknowledgement: pending: release manager
