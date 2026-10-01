# Test plan — facility-map-scope

Investigation PR: a scope document plus a dev-only prototype page. Nothing ships to a user.

## Header

| | |
|---|---|
| Feature | Facility map — scope and tap prototype |
| Backlog item | `docs/backlog.md` → Facility → "A facility map" (left open: scope awaits the drawings and the build) |
| Branch / worktree | `claude/facility-map-scope` @ `C:\Development\Animal_Shelter_facility-map-scope` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | see the PR description |
| Tested by / date | Claude, 2026-10-01 |
| Carries a migration? | no |
| Tested at SHA | tip of the branch when the PR was opened |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a scope with a recommendation plus a prototype, not the build
- [x] Files/areas touched listed: `docs/facility-map-scope.md`, `src/app/enclosures/map-prototype/` (dev-only, `notFound()` in production builds), `public/prototype/placeholder-plan.svg`
- [x] Roles affected identified: the prototype is behind `isShelterRole`; nothing is reachable in production
- [x] Anything explicitly out of scope written down: no migration, no editor, no schema, no real drawings

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; the scope names the schema as the next step
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: at 375×812 in the signed-in dev pane, tapping inside a shape selects it, the card shows name and residents, and Open reaches `/enclosures/<id>`
- [ ] Data persists — n/a: investigation only, the prototype stores nothing
- [ ] Create / edit / delete all exercised — n/a: investigation only
- [ ] Empty state renders sensibly — n/a: investigation only, dev-only page
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: investigation only; the one boundary found (a tap about 2 px outside a 55 px shape selects nothing) is recorded in the scope

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | prototype (dev only) | renders | rendered, signed in as Lutan's admin account |
| management | prototype | same guard | n/a: not driven, same `isShelterRole` guard as `/enclosures` |
| staff | prototype | same guard | n/a: not driven, as above |
| vet | prototype | same guard | n/a: not driven, as above |
| volunteer | prototype | same guard | n/a: not driven, as above |
| signed out | prototype | redirect to login | redirected to `/login?next=…`, seen |

- [ ] Every role above tested — n/a: investigation only, no production surface; admin and signed-out were driven
- [ ] A role that should not have access is blocked server-side — n/a: signed-out redirect observed; the page is `notFound()` in production and uses the existing role guard

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry, reached by URL only
- [ ] Manual updated — n/a: no user-facing feature
- [ ] Translatable strings go through the translation path — n/a: dev-only prototype with English literals
- [x] Mobile viewport (375px) — no overflow, controls reachable
- [x] Browser console clean — no errors or React warnings
- [ ] Network clean — n/a: not inspected beyond the page loading and navigating

## 6. Regression

- [ ] The pages nearest the change still work — n/a: `/enclosures` and `/enclosures/[id]` untouched; `/enclosures/<id>` loaded when reached from the prototype
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates are green after the merge

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open, the item asks for a scope agreed before building and the build has not happened
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: this is a recommendation awaiting a choice; a decisions entry follows when Lutan picks
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: a scope document, nothing ships to a user
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned: the shape sizes were measured in the browser

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — deferred: release manager
- [ ] Boundary or banding assertions cover both edges — deferred: release manager
- [ ] Evidence pasted into this plan is the tool's actual output — deferred: release manager
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — deferred: release manager

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: docs plus a page that returns 404 in production, nothing to roll back

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | Info | At 1× a 55 px shape has no slack: a tap about 2 px outside it selects nothing | deferred to backlog: the build widens the hit area and relies on zoom, recorded in the scope |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Read `docs/facility-map-scope.md` and confirm the recommendation (image + SVG shapes, overview → zone → enclosure, pinch/pan required) | Lutan |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — the one item waits for Lutan to read the scope

Manual verification by: pending: Lutan to read the scope and confirm the recommendation

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR description links to this file
- [ ] Handed to the production release manager — n/a: nothing ships, docs and a dev-only page

Result: pass
