# Feature test plan

## Header

| | |
|---|---|
| Feature | website-contact-form (diagnosis only) |
| Backlog item | `docs/backlog.md` → Contact tab SAVES NOTHING |
| Branch / worktree | `claude/website-contact-form` @ `C:\Development\Animal_Shelter_website-contact-form` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | n/a: opened after this commit |
| Tested by / date | Claude / 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | e006cfc4 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the report was diagnosed as the built-in browser pane's broken requestAnimationFrame, not an app fault; docs only
- [x] Files/areas touched listed: docs/decisions, docs/backlog.md, docs/test-plans only
- [ ] Roles affected identified — n/a: no code changed, no role sees anything different
- [x] Out of scope written down: no fix, no loud-failure change to forms, production not loaded

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: docs-only branch cut from current main, merge done by the PR flow
- [x] `node scripts/gates.mjs` ends as below

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] status reviewed — n/a: no migration
- [ ] dry-run reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: every /admin/website tab loaded directly in real Chrome hydrates (101 of 101 buttons; contact 13 of 13 Save buttons)
- [ ] Data persists — n/a: no Save was pressed, diagnosis only
- [ ] Create / edit / delete — n/a: no feature change
- [ ] Empty state — n/a: no feature change
- [ ] Invalid input — n/a: no feature change
- [ ] Boundary cases — n/a: no feature change

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | /admin/website all tabs | hydrates | pass in Chrome |
| management | not tried | n/a | n/a: no code changed |
| staff | retired | n/a | n/a: retired role |
| doctor | not tried | n/a | n/a: no code changed |
| volunteer | not tried | n/a | n/a: no code changed |
| signed out | not tried | n/a | n/a: no code changed |

- [ ] Every role above tested — n/a: no access logic changed
- [ ] A role that should not have access is blocked — n/a: no access logic changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI change
- [ ] Manual updated — n/a: no UI change
- [ ] Translatable strings — n/a: no UI change
- [ ] Mobile viewport — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change; only the extension's own getComputedStyle error was seen
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [ ] Nearest pages — n/a: no code changed
- [ ] Shared files — n/a: none touched
- [ ] Nothing merged from main broken — n/a: docs only

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision added: docs/decisions/2026-10-28-website-contact-tab-not-an-app-fault.md
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [ ] **Release notes.** n/a: diagnosis only, nothing a user can see has changed
- [x] Commit messages say why
- [x] Claims were measured, not reasoned: rAF non-firing, pending Suspense template and per-tab hydration counts were all read from the pages

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding — n/a: no thresholds
- [ ] Evidence is the tool's actual output — n/a: gates line above is verbatim
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] Deploy target ref — deferred: release manager
- [ ] strip-baked-env — deferred: release manager
- [ ] New secrets — n/a: none

### Migration ordering

- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position — n/a: docs only, nothing deployed changes

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Production /admin/website direct load not loaded, so unconfirmed there | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Load /admin/website?tab=contact directly and press Save | production |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item is open, pending below

Manual verification by: pending: production direct load of the Contact tab, which needs a signed-in production session

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: pasted when the PR opens
- [ ] Handed to the production release manager — n/a: nothing to deploy

Result: pass with accepted defects
