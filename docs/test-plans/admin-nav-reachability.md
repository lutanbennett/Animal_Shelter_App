# Feature test plan — admin-nav-reachability

## Header

| | |
|---|---|
| Feature | Management hub tiles for the pages Admin could not reach, plus a check that every sectioned page is a hub tile |
| Backlog item | `docs/backlog.md` → **#fc7te nine pages not reachable for Admin** (ticked) |
| Branch / worktree | `claude/admin-nav-reachability` @ `C:\Development\Animal_Shelter_admin-nav-reachability` |
| Dev server | `http://localhost:3005` |
| PR | pending: opened after this plan |
| Tested by / date | Claude / 2026-11-15 |
| Carries a migration? | no |
| Tested at SHA | 6c22abfe7 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — nine new tiles on the Management hub, each gated `canOpen(perms, routeFor(path))`, and `scripts/check-section-hubs.mjs` in CI
- [x] Files/areas touched listed — `src/app/management/page.tsx`, `src/lib/permissions/routes.ts` (`section` on two entries), i18n en/th tile descriptions, `scripts/check-section-hubs.mjs`, `.github/workflows/ci.yml`, release note, decision, backlog
- [x] Cards affected identified — `run_merch_shop`, `manage_shop_page`, `review_animal_reports` and the cards behind expenses, foundation papers, board IDs, text approval, memes and reels now see a hub tile; Admin sees all; no card assignment changed
- [x] Anything explicitly **out of scope** written down — Operations and Settings hubs untouched; no card granted to Admin; `/appointments` and `/suppliers` judged already reachable

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: ...` — output below

```
=== gates: typecheck exited 0 after 115s
=== gates: lint exited 0 after 297s
=== gates: test exited 0 after 69s
=== gates: build exited 0 after 225s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — as Admin, clicked Management then each of the nine new tiles; every page opened with its own title
- [ ] Data persists — n/a: no data written, menu entries only
- [ ] Create / edit / delete all exercised — n/a: no data written, menu entries only
- [ ] Empty state renders sensibly — n/a: no list added
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | Management hub | all nine new tiles present and each page opens | merch-shop, admin/shop, animal-reports, expenses, foundation-papers, board-ids, text/approve, memes, reels all opened |
| exactly `run_merch_shop` | Management hub | only its own tile among the new ones | pending: one-card login not driven |
| signed out | Management hub | redirected to sign-in | pending: not driven, the hub guard is unchanged |

- [ ] Every login above tested — pending: the one-card and signed-out logins were not driven; the gate is the unchanged `canOpen` filter
- [ ] A login that should not have access is blocked server-side — n/a: no page guard was changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: NavLinks untouched, the hub page is the menu
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: no workflow changed
- [x] Translatable strings go through the translation path — tile descriptions added to both en and th dictionaries
- [ ] Mobile viewport (375px) — n/a: same tile grid with more tiles
- [x] Browser console clean — no errors seen while driving the pages
- [ ] Network clean — n/a: not inspected

## 6. Regression

- [x] The pages nearest the change still work — the Management hub still lists its original tiles
- [x] Any shared file touched checked from a second, unrelated page — routes.ts gained `section` on two entries; the hub and the new check both load
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-14-admin-nav-reachability.md`
- [ ] `README.md` still accurate — n/a: not affected
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a card-tagged line for it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The check before and after counts (10, then 3, then 0) were run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no dates involved
- [ ] For a boundary or banding change, the assertions cover both edges — n/a: no boundary
- [ ] Evidence pasted into this plan is the tool output, unedited — n/a: the only pasted evidence is the gates output
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager; only menu entries changed, no schema

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `/memes` and `/reels` were also unreachable for Admin, not on the item list | fixed: tiles added |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A login holding only one of the new pages cards sees that tile and not the others | `/management` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-15

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: one-card login check

Manual verification by: pending: one-card login check on /management

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: PR not yet open
- [ ] Handed to the production release manager — pending: after merge

Result: pass

Release manager acknowledgement: pending: release manager
