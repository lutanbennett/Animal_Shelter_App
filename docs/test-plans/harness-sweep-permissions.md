# Feature test plan

## Header

| | |
|---|---|
| Feature | Harness sweep batch 1, permissions first: ten of the red database harnesses triaged, nine fixed, one genuine fault filed |
| Backlog item | `docs/backlog.md` → "Sweep the remaining red database harnesses in bounded batches, permissions first" (stays open; note added) |
| Branch / worktree | `claude/harness-sweep-permissions` @ `C:\Development\Animal_Shelter_harness-sweep-permissions` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` (not started: no UI surface) |
| PR | opened after this commit; number on the PR |
| Tested by / date | Claude / 2026-10-24 |
| Carries a migration? | no |
| Tested at SHA | 4ad0b34b |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: ten permission harnesses were triaged against dev, the stale ones fixed, one genuine fault filed, the full red list recorded
- [x] Files/areas touched listed: `scripts/check-{policy-role-names,maintenance-role,clinic-allow-lists,cards-schema,permission-tables,role-can,medical-archive-roles,2ic-role,doctor-resident-scope,permission-parity}.mjs`, `scripts/lib/permission-probes.mjs`, `docs/decisions/2026-10-24-harness-sweep-permissions.md`, `docs/backlog.md`
- [x] Roles affected identified: none at runtime; developer check scripts only
- [x] Anything explicitly out of scope written down: no migration, no `src/`, no CI edit, nothing on production, the genuine fault is filed and not fixed, the other 48 red and 17 server-dependent harnesses are listed and not reached

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Evidence below, as printed (it also runs `test`)
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows in a `begin; … rollback;` harness — n/a: no migration; the harnesses themselves run in rolled-back transactions and each of the ten was re-run after its fix (results in the decision file)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: nothing to apply; nothing in this PR touches production

## 4. Functional checks

- [x] Happy path works end to end: each of the nine fixed harnesses was re-run against dev after its edit and exits 0 (`check-cards-schema` was re-run and fails only on the two items the decision file names: the Doctor fault and a leftover dry-run role)
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, no stored data
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no UI surface
- [ ] Boundary cases checked — n/a: the harnesses' own boundary cases were left as they were

### Role access matrix

No page or route was added or changed, so no role's access changed. The harnesses are what assert role access; they were run, not a browser.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | unchanged | n/a: developer scripts only |
| management | nothing new | unchanged | n/a: developer scripts only |
| staff | retired (0173) | unchanged | n/a: developer scripts only |
| doctor | nothing new | unchanged | n/a: developer scripts only |
| volunteer | nothing new | unchanged | n/a: developer scripts only |
| signed out | nothing new | unchanged | n/a: developer scripts only |

- [ ] Every role above tested — n/a: no UI or policy change; the permission harnesses were re-run for every role they cover
- [ ] A role that should not have access is blocked server-side — n/a: no access was changed; the harnesses assert exactly this and pass (`check-permission-parity`: 1849 match, 0 mismatch)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no `src/` change
- [ ] Manual updated — n/a: developer scripts only, nothing a shelter user reads
- [ ] Translatable strings go through the translation path — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work: the app is not changed; `gates.mjs` build and test pass
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `scripts/lib/permission-probes.mjs` is shared only by `check-permission-parity`, which was re-run green
- [x] Nothing merged from `main` during `sync` was broken by this branch (nothing was merged)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch: deliberately NOT ticked; a BATCH 1 note and an accurate remainder were added so the item stays open, as the brief required. The genuine fault is filed on the `backlog` branch under Security
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-24-harness-sweep-permissions.md`, with the full list
- [x] `README.md` still accurate (it does not describe these checks)
- [ ] **Release notes.** n/a: developer check scripts only, no shelter user sees any of this; the one genuine fault is filed, not fixed, so no behaviour changed
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and the decision file were measured, not reasoned: each verdict rests on a run against dev, the migration text, or a query of the live rows (for example the 0253 attachment baseline was checked by reading the attachments by owner type, and the Doctor's 14 cells against its cards and extras)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing in the deployed build changed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing in the deployed build changed
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic touched
- [ ] Boundary or banding change assertions cover both edges — n/a: no boundary logic changed
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: only the `gates:` line above, pasted as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy for this PR
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy for this PR
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: scripts and docs only; reverting the PR restores the previous checks

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | The Doctor's 14 cells are not backed by its cards and extras (0230), so changing its cards would strip ten powers. Loss of access, not a leak; production not read | deferred to backlog (Security, `backlog` branch) |
| 2 | Low | `dryrun_photo_viewer_d6b305`, a disposable role the acceptance dry run left on dev, keeps `check-cards-schema` red | deferred to backlog (same item says to delete it) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether the Doctor fault exists on production, before anyone saves a Doctor card there | production roles screen / `--status --env production`, by the planner |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-24

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: its one item is the planner's production read, not yet done, so nothing is ticked on anyone's behalf

Manual verification by: pending: whether the Doctor cell fault is live on production (a production read the planner runs; the guards stay)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: nothing here is deployed

Result: pass with accepted defects
