# Feature test plan

## Header

| | |
|---|---|
| Feature | control-listing-sweep |
| Backlog item | `docs/backlog.md` → "Re-list the action controls on the pages the Pi-failover sweep touched" and "ONE PLACE LEFT: THE WEBSITE PAGE EDITOR" |
| Branch / worktree | `claude/control-listing-sweep` @ `C:\Development\Animal_Shelter_control-listing-sweep` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | see PR |
| Tested by / date | Claude, 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | 34a9b759 |

## 1. Scope and risk

- [x] Change is described in one sentence: audit the header and the admin settings pages for controls drawn without the activity their action asks, and hide Undo on recent changes from a login without `audit.undo`
- [x] Files/areas touched: `src/app/admin/recent-changes/page.tsx`; `docs/decisions/2026-11-01-control-listing-sweep.md`; `docs/backlog.md`
- [x] Activities affected: `audit.undo` (draw only). No role is named.
- [x] Out of scope: resident, management, shared-module and tail pages (not reached; listed in the decision file section 1); the website page editor; no server or database check changed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branch cut from current main today; no later merge to bring in
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: the only code change hides one button for a login without `audit.undo`; not driven in a browser, see Left for manual verification
- [ ] Data persists — n/a: no write path changed
- [ ] Create / edit / delete — n/a: no write path changed
- [ ] Empty state — n/a: unchanged
- [ ] Invalid input — n/a: no input changed
- [ ] Boundary cases — n/a: single boolean gate

### Role access matrix

| Card held | Can reach | Expected | Result |
|---|---|---|---|
| `audit.view` and `audit.undo` | /admin/recent-changes | Undo drawn where the entry is the newest change | not driven, by reading the code only |
| `audit.view` only | /admin/recent-changes | log visible, no Undo and no undo notes | not driven, by reading the code only |

- [ ] Every role above tested — n/a: not driven in a browser; code-read only, listed under manual verification
- [ ] A login without access is blocked server-side — n/a: no server check changed; `undoChange` still asks `audit.undo`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no new behaviour users read about
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — n/a: not driven in a browser
- [ ] Network clean — n/a: not driven in a browser

## 6. Regression

- [ ] Nearest pages still work — n/a: typecheck and build only; recent-changes page not loaded
- [ ] Shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: branch is on current `main`

## 7. Documentation

- [x] Backlog items edited in `docs/backlog.md` on this branch; neither is ticked because both still have open parts, and both titles now say what is left
- [x] Decision file added: `docs/decisions/2026-11-01-control-listing-sweep.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a login holding only the log card no longer sees an Undo button that would have been refused; no shelter user would notice
- [x] Commit messages say why
- [x] Claims in the decision file were read from the code, not reasoned; where an action body was not re-read the file says so

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence pasted is the tool's actual output — n/a: gates output above pasted unedited
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] Production ref line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position stated — n/a: draw-only change, revert the commit

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Recent changes drew Undo to a login holding `audit.view` without `audit.undo` | fixed in this PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | `node scripts/dev-signin.mjs --cards <a card opening recent changes only> --port <port>`: Undo absent; with the undo card also, Undo present | /admin/recent-changes, reached by clicking through |

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the one listed item is still pending a person

Manual verification by: pending: dev-signin --cards check of Undo on /admin/recent-changes

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is in the repo
- [ ] Handed to the production release manager — n/a: nothing to hand over beyond the merge

Result: pass
