# Feature test plan

## Header

| | |
|---|---|
| Feature | Retire the Home screen panel: a role's home is drawn from its cards only |
| Backlog item | `docs/backlog.md` → **Who does what has two ways of setting a role's home screen that do not agree** (ticked here) |
| Branch / worktree | `claude/role-home-app` @ `C:\Development\Animal_Shelter_role-home-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-21 |
| Carries a migration? | no — `role_home_tiles` (0225) is left in place, unread; dropping it is a later migration |
| Tested at SHA | `6f88d24b` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the Home screen panel is removed and the home reads the role's cards only, so the board is the single place a home is set
- [x] Files/areas touched listed: `src/lib/home/tiles.ts`, `src/lib/home/roles.ts`, `src/app/home/page.tsx`, `src/app/home/[role]/page.tsx`, `src/app/admin/who-does-what/page.tsx`; deleted `HomeScreenPanel.tsx`, `home-panel-data.ts`, `home-tiles-actions.ts`, `scripts/check-role-home-tiles.mjs`; `src/lib/releases.ts`; decision file; backlog. No `supabase/migrations/`, no `worker/`
- [x] Roles affected identified: every role that has a panel row set (the home now follows its cards); on dev only Management differs (its panel had Enclosures, no card opens it); admin sees the board without the panel; signed-out unchanged
- [x] Out of scope written down: dropping `role_home_tiles`; the groups editor and reading `role_groups`; the manual line that mentions the panel (`src/lib/manual/en.ts` belonged to another stream this batch)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in: "Already up to date"
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; `role_home_tiles` rows are simply no longer read
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `check-home-cards.mjs` (dev, all ok) confirms every role's home is its cards, in order, in English and Thai; `check-home-screens.mjs` and `check-multi-role-build.mjs` all ok
- [ ] Data persists — reload the page and the change is still there — n/a: nothing new is written; the board's own saving is untouched
- [ ] Create / edit / delete all exercised — n/a: the panel's create/edit/delete is what was removed; the board's code is untouched
- [ ] Empty state renders sensibly (no rows yet) — n/a: a role with no cards keeps the derived home, covered by `check-home-screens.mjs`
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input surface was added
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input surface was added

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Who does what | board, no Home screen panel | not driven in a browser; build passes (see Left for manual verification) |
| management | own home | cards in board order | script-checked on dev; Enclosures tile no longer shown (see Defects) |
| staff | none | retired role (0173) | n/a |
| doctor | own home | cards in board order | script-checked on dev |
| volunteer | own home | cards in board order | script-checked on dev |
| signed out | none | unchanged | n/a |

- [ ] Every role above tested — n/a: homes are script-checked per role; the browser pass is under Left for manual verification
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access rule changed; the panel's Admin-only actions were deleted with it

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: that file belonged to another stream this batch; the mention of the panel is still to remove (said in the PR)
- [ ] Translatable strings go through the translation path — n/a: only removed UI; no new strings
- [ ] Mobile viewport (375px) — n/a: no UI added
- [ ] Browser console clean — n/a: not driven in a browser (see Left for manual verification)
- [ ] Network clean — n/a: not driven in a browser (see Left for manual verification)

## 6. Regression

- [x] The pages nearest the change still work: the whole app builds (`gates` build=0); `check-menu-coverage.mjs` reports the same 66 orphans on this branch and on `main`, so unchanged
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `tiles.ts` is shared by `/home` and `/home/[role]`, both covered by the scripts above
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync was a no-op

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch (with a partly-superseded note on *Choose each role's home tiles*)
- [x] Non-obvious design choices added as `docs/decisions/2026-10-21-cards-are-the-only-home.md`, which records that the panel decision is superseded
- [ ] `README.md` still accurate — n/a: README does not mention the panel
- [x] **Release notes.** `unreleased` gained a line telling an Admin where the setting lives now
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The Management/Enclosures difference was read from dev with the old comparison script; the 66 orphans were run on both branches

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no dates involved
- [ ] For a boundary or banding change, the assertions cover both edges — n/a: no threshold or boundary
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: evidence above is the gates' closing line as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: revert the PR; nothing in the database changed, so the panel's old rows are still there and the old code would read them again

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | On dev, Management's panel had an Enclosures row that none of its cards open, so its home loses that tile. Production not read | accepted: Lutan chooses whether to give Management the Enclosures card |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On dev as Admin: add a card to a role and see its home gain the tile; reorder cards and see it reorder; no Home screen panel on the page | `/admin/who-does-what`, then `/home/<role>` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-21

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not ticked, the browser pass is still to do

Manual verification by: pending: the browser pass in the table above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet merged

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager
