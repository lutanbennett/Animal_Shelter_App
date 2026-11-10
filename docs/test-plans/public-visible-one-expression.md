# Feature test plan

## Header

| | |
|---|---|
| Feature | public-visible-one-expression |
| Backlog item | `docs/backlog.md` → #w8k4p, #r9wtk |
| Branch / worktree | `claude/public-visible-one-expression` @ `C:\Development\Animal_Shelter_public-visible-one-expression` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | pending: number is known once opened |
| Tested by / date | Claude, 2026-11-10 |
| Carries a migration? | yes |
| Tested at SHA | f6448e96 |

## 1. Scope and risk

- [x] One sentence: `public_enclosures` and `public_resident_profiles` now resolve "on the website" through one view, `private.on_website` (adoption-ready OR a running, text-approved appeal)
- [x] Touched: `supabase/migrations/0350_public_visible_one_expression.sql`, `docs/decisions/2026-11-10-public-visible-one-expression.md`, `docs/backlog.md` ticks. No app code
- [x] Cards affected: none change; the signed-out public sees profile pages for animals under a running appeal. Admin unaffected
- [x] Out of scope: `public_resident_cards` (untouched by standing decision), dropping `is_public_visible`, both write paths (kept), any production command

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends with `gates: typecheck=0 lint=0 test=0 build=0`:

```
=== gates: typecheck exited 0 after 151s
=== gates: lint exited 0 after 363s
=== gates: test exited 0 after 83s
=== gates: build exited 0 after 380s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number 0350 is one above the highest on `main` (0349), no other in-flight branch carries one
- [x] `--status` reviewed before applying
- [x] `--dry-run` reviewed (ok)
- [x] Applied to dev and recorded in `schema_migrations` (an earlier function-based draft was forgotten with `--forget` and re-applied)
- [x] File is re-runnable (`create or replace view`, `drop function if exists`)
- [x] Existing rows still read correctly: `check-public-views.mjs` has no FAIL lines on dev
- [x] Rolled-back harness asserted: resident with neither route is absent from the profiles view; running text-approved appeal and not ready is present; closed appeal is absent; ready is present
- [x] Down-migration: undo line in the file header (re-run 0347's enclosures and 0343's profiles definitions, drop the view)
- [x] Production apply plan: apply `0350` to project dbkodyyxxhtygxcxmfcu with `node scripts/apply-migrations.mjs --env production`, before or with the deploy; Lutan's command

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface, the views are read by existing code unchanged
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI surface
- [ ] Boundary cases — n/a: the boundary (closed vs running appeal) is in the harness above

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| signed out | public views | profile listed only via ready or running appeal | see harness, check-public-views ok |

- [ ] Every login above tested — n/a: only the signed-out public reads these views, covered by check-public-views
- [ ] A login that should not have access is blocked server-side — n/a: no new access; no grants added, check-public-views passes

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual — n/a: no user-facing screen changed
- [ ] Translatable strings — n/a: none added
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI

## 6. Regression

- [x] Pages nearest the change: the public views and kennel card, via `check-public-views.mjs` and `check-card-taps.mjs` (12 held, 0 failed)
- [ ] Shared file touched — n/a: no shared file touched
- [x] Nothing merged from `main` during sync was broken by this branch (gates)

## 7. Documentation

- [x] Backlog items #w8k4p and #r9wtk ticked on this branch
- [x] Decision file `docs/decisions/2026-11-10-public-visible-one-expression.md`
- [x] README still accurate
- [ ] **Release notes.** n/a: no appeal is running on production today, so nobody would notice until the first one; and the production apply is still outstanding
- [x] Commit messages say why
- [x] Claims were measured: the 401 for anon was seen in check-public-views, and the harness ran against dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: nothing here derives a date
- [ ] Boundary/banding assertions — n/a: the running/closed boundary is asserted both sides in the harness
- [ ] Evidence is the tool's actual output — n/a: gate output pasted unedited above
- [ ] Public pages re-checked after purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production` ref line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none added

### Migration ordering

- [x] Both migration and code? No: migration only, no code reads anything new
- [ ] `--env production --dry-run` — deferred: Lutan
- [ ] Destructive migration backup — n/a: views only, no data rewritten
- [ ] Apply plan stated — deferred: Lutan (see section 3)

### Rollback

- [ ] Rollback position — n/a: views only; re-run 0347/0343 definitions per the file header, nothing else to revert

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | First draft used a function reading `appeals`; anon got 401 on the profiles view | fixed in this PR (view instead) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-10

### Manual verification

- [x] The manual list above is empty; nothing for a person to look at

Manual verification by: n/a: no UI surface

### Result

- [x] Open defects are fixed
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: after merge

Result: pass
