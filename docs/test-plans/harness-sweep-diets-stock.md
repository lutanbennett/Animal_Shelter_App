# Feature test plan

## Header

| | |
|---|---|
| Feature | Harness sweep batch 3: the eight diets/stock harnesses fixed and green, plus the read-only `clinic-login-helpers` production check |
| Backlog item | `docs/backlog.md` → "Sweep the remaining red database harnesses in bounded batches" (stays open, 30 remain) and "Settle whether the clinic-login helper functions are still called" (answer written, drop still to do) |
| Branch / worktree | `claude/harness-sweep-diets-stock` @ `C:DevelopmentAnimal_Shelter_harness-sweep-diets-stock` |
| Dev server | not started; no UI surface |
| PR | opened after this commit; number on the PR |
| Tested by / date | Claude / 2026-10-26 |
| Carries a migration? | no |
| Tested at SHA | c1f50c18 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: eight diets/stock harnesses were each given a verdict against dev (all eight FIX, none deleted, no genuine fault) and a named read-only check answers whether the four clinic-login helpers are still called on production
- [x] Files/areas touched listed: `scripts/check-{medication-label,pack-sizes,prescriptions-updated-at,safety-stock,standard-diet,stock-corrections,stock-on-hand,stock-receipts}.mjs`, `scripts/lib/readonly-checks.mjs` (new `clinic-login-helpers` entry), `docs/decisions/2026-10-26-harness-sweep-batch-3.md`, `docs/backlog.md` (two items)
- [x] Roles affected identified: none at runtime; developer check scripts only
- [x] Anything explicitly out of scope written down: no migration, nothing under `src/`, nothing dropped on production, the other 30 red and 17 server-dependent harnesses untouched, the permissions-first ten deliberately left for after `0265`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly 
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

- [x] Happy path works end to end: each of the eight harnesses was re-run against dev after its last edit and prints HARNESS-OK (exit 0); `node --test scripts/check-production.test.mjs` passes (4 tests, the new check included); `node scripts/check-production.mjs clinic-login-helpers` ran against production and dev
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

- [x] Backlog item ticked in `docs/backlog.md` on this branch: deliberately NOT ticked (30 harnesses remain); the opening was rewritten to say batches 2 and 3 are done, 30 remain, and the next batch, the old list marked SUPERSEDED in place; the clinic-login item carries the answer
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-26-harness-sweep-batch-3.md`
- [x] `README.md` still accurate (it does not describe these checks)
- [ ] **Release notes.** n/a: scripts only, no shelter user sees a check harness
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and the decision file were measured, not reasoned: each verdict rests on a run against dev; the replay-overwrites-a-live-function cause was shown by printing the clerk's cells and `has_permission` answers inside the transaction, then confirmed by the harness going green after the live definitions were restored; the production answer is the check's own output

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
| – | – | none found. Nothing genuine: every red was a stale fixture or a removed mechanism. | – |

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

- [x] Open defects are either fixed or explicitly accepted above (there are none)
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: nothing here is deployed

Result: pass
