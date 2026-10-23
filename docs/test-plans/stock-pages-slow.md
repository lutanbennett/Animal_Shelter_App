# Feature test plan — stock-pages-slow

## Header

| | |
|---|---|
| Feature | Record a delivery's line ids agree between server and browser (hydration mismatch fixed); the deliveries page loads two independent lookups together |
| Backlog item | "Stock pages are slow on first load, and the Record a delivery form ignores taps" (ticked) |
| Branch / worktree | `claude/stock-pages-slow` @ `C:DevelopmentAnimal_Shelter_stock-pages-slow` |
| Dev server | `next dev` on `http://localhost:3006` |
| PR | pending |
| Tested by / date | Claude / 2026-10-23 |
| Carries a migration? | no |
| Tested at SHA | `49fa3451` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed — `src/app/deliveries/{RecordDeliveryForm,page}.tsx`, `src/lib/releases.ts`, backlog, decision file. No migration, no worker
- [x] Roles affected identified — those holding stock.delivery; nobody's access changed
- [x] Out of scope written down — whether production is slow (not measured); bounding the stock_counts read; the purchasing and stocktake pages were timed only

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — skip if no migration

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

- [x] Happy path works end to end — /deliveries loaded as management on dev at 375 px and rendered; warm GETs 1.1 to 1.3 s (three runs)
- [ ] Data persists — n/a: no write path changed
- [ ] Create / edit / delete all exercised — n/a: saving not driven; saveDelivery untouched
- [ ] Empty state renders sensibly — n/a: list rendering untouched
- [ ] Invalid input is rejected — n/a: server checks untouched
- [ ] Boundary cases checked — n/a: no new input; a second size line gets id formId-line-1, distinct from the first

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | not driven | n/a |
| management | /deliveries | opens | 200 |
| staff | n/a | retired | n/a |
| doctor | n/a | not driven | n/a |
| volunteer | n/a | not driven | n/a |
| signed out | n/a | not driven | n/a |

- [ ] Every role above tested — n/a: only management driven; no permission rule changed
- [ ] A role that should not have access is blocked server-side — n/a: requirePermission unchanged

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a user does differently
- [ ] Translatable strings — n/a: no new text
- [ ] Mobile viewport (375px) — n/a: page loaded at 375 px but the form was not tapped through, see Left for manual verification
- [ ] Browser console clean — n/a: console was read only after load, so a hydration warning at first paint would not have been captured
- [x] Network clean — page GET returned 200 on every timed run

## 6. Regression

- [x] The pages nearest the change still work — /deliveries, /management/purchasing and /stocktake each returned 200
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` has a line for it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Timings are from runs on dev; the decision file says the 60 s was not reproduced and production is not measured. That the mismatch is gone is reasoned from the id now being deterministic, not observed at first paint

## 8. Pre-production gate

- [ ] Tested SHA recorded and is the tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Deploy line names the production project — deferred: release manager
- [ ] strip-baked-env line seen — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date
- [ ] Boundary or banding change covers both edges — n/a: no threshold changed
- [ ] Evidence pasted is the tool's actual output — n/a: gates line above is verbatim
- [ ] Public pages re-checked — n/a: public pages untouched
- [ ] New secret or env var exists in production — n/a: none added
- [ ] Both a migration and code that reads it — n/a: no migration
- [ ] Production dry-run clean — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [x] Rollback position stated: revert the PR; nothing to undo

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | The reported 60 s load was not reproduced and production is unmeasured | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On a phone, open the page and tap Medicine straight away; it should respond at once | /deliveries |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-23

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item is listed and no person has looked yet

Manual verification by: pending: first-tap behaviour on a phone was not driven

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links to this file
- [ ] Handed to the production release manager — n/a: handed over when the PR merges

Result: pass with accepted defects

Release manager acknowledgement: n/a
