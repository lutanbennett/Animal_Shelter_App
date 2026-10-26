# Feature test plan

## Header

| | |
|---|---|
| Feature | Harness sweep batch 2: ten database harnesses resolved (one deleted, eight fixed, one fixed with a genuine card-access fault filed), and the `sees_all_residents()` question answered |
| Backlog item | `docs/backlog.md` → "Sweep the remaining red database harnesses in bounded batches, permissions first" (stays open; opening rewritten, 38 remain) |
| Branch / worktree | `claude/harness-sweep-db` @ `C:\Development\Animal_Shelter_harness-sweep-db` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` (started once, for `check-place-order-roles`; no UI surface changed) |
| PR | opened after this commit; number on the PR |
| Tested by / date | Claude / 2026-10-26 |
| Carries a migration? | no |
| Tested at SHA | 2650e5d8 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: ten permission and seeder harnesses were each given a verdict (delete, fix or genuine fault) against dev, and the two policies the residents harness counted were named
- [x] Files/areas touched listed: `scripts/check-perm-convert-{admin,medical,orphans,residents,stock-and-lists}.mjs`, `scripts/check-place-order-roles.mjs`, `scripts/check-{audit-undo,medical-soft-delete,diets-sheet}.mjs`, `scripts/check-perm-convert-vet.mjs` (deleted), `docs/decisions/2026-10-26-harness-sweep-batch-2.md`, `docs/card-access-faults.md` (one row), `docs/backlog.md`
- [x] Roles affected identified: none at runtime; developer check scripts only
- [x] Anything explicitly out of scope written down: no migration, nothing under `src/`, no CI edit, nothing on production, the one genuine fault is filed and not fixed, the other 38 red and 17 server-dependent harnesses are not touched

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
- [ ] Constraints and defaults exercised against real rows in a `begin; … rollback;` harness — n/a: no migration; the harnesses themselves run in rolled-back transactions and each was re-run green after its fix (verdicts in the decision file)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: nothing to apply; nothing here touches production

## 4. Functional checks

- [x] Happy path works end to end: each of the nine remaining harnesses was re-run against dev after its last edit and exits 0 (residents 135 checks, admin 186, medical 143, orphans 519, stock-and-lists 387 with 1 known fault counted, place-order-roles all held against `:3006`, audit-undo, medical-soft-delete and diets-sheet exit 0)
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, no stored data
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no UI surface
- [ ] Boundary cases checked — n/a: the harnesses' own boundary cases were kept except where the mechanism they tested is gone

### Role access matrix

No page, route or policy was added or changed, so no role's access changed. The harnesses are what assert role access; they were run.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | unchanged | n/a: developer scripts only |
| management | nothing new | unchanged | n/a: developer scripts only |
| staff | retired (0173) | unchanged | n/a: developer scripts only |
| doctor | nothing new | unchanged | n/a: developer scripts only |
| volunteer | nothing new | unchanged | n/a: developer scripts only |
| signed out | nothing new | unchanged | n/a: developer scripts only |

- [ ] Every role above tested — n/a: no UI or policy change; the harnesses probe admin, no role and custom roles, and the live roles are covered by `check-permission-parity` and the role-cards checks
- [ ] A role that should not have access is blocked server-side — n/a: no access was changed; the re-run harnesses assert exactly this for no-role and cell-less custom roles, and pass

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no `src/` change
- [ ] Manual updated — n/a: developer scripts only, nothing a shelter user reads
- [ ] Translatable strings go through the translation path — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work: the app is not changed; `gates.mjs` build and test pass
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file touched; every script edited is a stand-alone harness and the one deleted harness is referenced by no script, workflow or package script
- [x] Nothing merged from `main` during `sync` was broken by this branch (nothing was merged)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch: deliberately NOT ticked; its opening was rewritten to say batch 2 is done, 38 remain, what the next batch is, and the old hold is marked SUPERSEDED in place
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-26-harness-sweep-batch-2.md`
- [x] `README.md` still accurate (it does not describe these checks)
- [ ] **Release notes.** n/a: scripts only, no shelter user sees a check harness
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and the decision file were measured, not reasoned: each verdict rests on a run against dev, a query of the live policies and functions (`pg_policies`, `pg_get_functiondef`), or the migration text; the two residents policies were read from `pg_policies` on dev

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
| 1 | Low | A login whose only cell is `reference.add_while_recording` cannot add a medication: `check_unit_in_units()` cannot read `units`, and reports a false "no unit called tablet". Not known to bite a real role; fix needs a migration | deferred to backlog (row in `docs/card-access-faults.md`; counted as a known fault in `check-perm-convert-stock-and-lists`) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is empty; there is no surface a person needs to look at

Manual verification by: n/a: scripts and docs only, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: nothing here is deployed

Result: pass with accepted defects
