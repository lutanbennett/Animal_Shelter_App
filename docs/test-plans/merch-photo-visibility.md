# Feature test plan

## Header

| | |
|---|---|
| Feature | merch-photo-visibility |
| Backlog item | `docs/backlog.md` → #w9xpq |
| Branch / worktree | `claude/merch-photo-visibility` @ `C:\Development\Animal_Shelter_merch-photo-visibility` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | pending |
| Tested by / date | Claude / 2026-11-15 |
| Carries a migration? | yes |
| Tested at SHA | f5897b010 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck exited 0 after 73s
=== gates: lint exited 0 after 278s
=== gates: test exited 0 after 68s
=== gates: build exited 0 after 205s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`)
- [x] Existing rows still read correctly after the change (checked against real dev data)
- [ ] **Constraints and defaults exercised against real rows** — n/a: function-only change, exercised end to end in the browser instead
- [ ] Down-migration written — n/a: re-applying 0362's function body undoes it, and the extra branch is harmless
- [ ] Production apply plan stated — n/a: the release manager applies 0380 to production before deploy

## 4. Functional checks

- [x] Happy path works end to end
- [x] Data persists — reload the page and the change is still there
- [ ] Create / edit / delete all exercised — n/a: only the read path changed
- [ ] Empty state renders sensibly — n/a: the preview hides itself when there is no photo, unchanged
- [ ] Invalid input is rejected with a readable message — n/a: no input added
- [ ] Boundary cases checked — n/a: one id lookup, no boundaries

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| exactly `run_merch_shop` | photo of a hidden product | 200, preview shows | 200, 160x107 |
| exactly `view_residents` | same photo URL | refused | 404 |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side (hitting the URL directly fails)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no new screen or control
- [ ] Translatable strings — n/a: no new strings in the app
- [ ] Mobile viewport — n/a: no layout change
- [x] Browser console clean — no errors or React warnings
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages

## 6. Regression

- [x] The pages nearest the change still work (Merchandise shop catalogue, public /shop/merch)
- [ ] Any shared file touched checked from a second page — n/a: only a SQL function and a release note changed
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices added as a new file in `docs/decisions/`
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [x] **Release notes.** `unreleased` has a line, tagged to the run_merch_shop card; 0380 is applied to dev and production is the release manager's, so the note describes what staff see once released
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary or banding change — n/a: not a boundary change
- [ ] Evidence is the tool's actual output — n/a: no pasted table beyond the gates block
- [ ] Public pages re-checked — deferred: release manager
- [ ] Deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none added
- [ ] Both a migration and code that reads it — n/a: the readers (documents and photos routes) are unchanged and work without it
- [ ] Production dry-run — deferred: release manager
- [ ] Destructive migration backup — n/a: function replace only
- [ ] Apply plan stated — deferred: release manager applies 0380 to production
- [ ] Rollback position stated — n/a: re-apply 0362's function body; nothing else changes

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-15

- [ ] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: nothing left for a person; the browser checks were driven by Claude

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none
- [ ] Checklist pasted into the PR — n/a: not yet
- [ ] Handed to the production release manager — n/a: after merge

Result: pass
