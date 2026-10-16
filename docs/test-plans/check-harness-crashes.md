# Feature test plan — check-harness-crashes

## Header

| | |
|---|---|
| Feature | Repair `check-cards-schema.mjs` (cannot load `cards.ts`) and `check-permission-parity.mjs` (fixture resident code collides on dev) so both reach their assertions |
| Backlog item | `docs/backlog.md` → **Two check harnesses CRASH before asserting anything** (ticked) |
| Branch / worktree | `claude/check-harness-crashes-7231c4` @ `.claude\worktrees\check-harness-crashes-7231c4` |
| Dev server | not started — no UI surface |
| PR | see PR |
| Tested by / date | Claude / 2026-10-16 |
| Carries a migration? | no |
| Tested at SHA | `6d462146` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — two dev check scripts made to run to a real result
- [x] Files/areas touched listed — `scripts/check-cards-schema.mjs`, `scripts/check-permission-parity.mjs`, `docs/backlog.md`, `docs/decisions/2026-10-16-check-harness-crashes.md`, this plan
- [x] Roles affected identified — none; no app code changed
- [x] Anything explicitly **out of scope** written down — the doctor-cell red and the other twelve red harnesses (separate item, needs a ruling from Lutan); CI wiring (recommended against, see decision)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date with `origin/main`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [x] CI green on the PR — all seven checks seen passing on #660

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

- [x] Happy path works end to end — `check-cards-schema.mjs` runs to `All checks passed.`: "cards.ts has the twenty-one agreed cards", seven roles' cards plus extras equal their cells exactly, and the function checks hold. **The card set is still twenty-one.**
- [x] Data persists — both scripts' database parts always roll back; the parity script was run twice and the second run did not collide
- [ ] Create / edit / delete all exercised — n/a: no feature, tooling only
- [ ] Empty state renders sensibly — n/a: no UI
- [ ] Invalid input is rejected with a readable message — n/a: no UI
- [x] Boundary cases checked — deliberate break: a 22nd card added to `CARDS` in `cards.ts` locally; `check-cards-schema.mjs` printed `FAIL the agreed set is twenty-one cards; cards.ts has 22`, `1 FAILED`, exit 1; `cards.ts` reverted with `git checkout` (tree clean). `check-permission-parity.mjs` reaches 262 probe runs and 1834 answers and ends `RESULT: RED` for the recorded content disagreement (21 doctor lines, not this change's), plus four STALE N4 entries and `maintenance.bills` neither probed nor explained, newly visible and passed to the thirteen-harnesses item

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | nothing — no app surface | n/a | n/a |

- [ ] Every role above tested — n/a: no app surface, scripts only
- [ ] A role that should not have access is blocked server-side — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no user-facing change
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — typecheck, lint and build pass; `cards.ts` untouched in the diff
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was a no-op

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch (follow-up filed on the `backlog` branch)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-16-check-harness-crashes.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: tooling only, no shelter user sees a check script.
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The sequence-lag cause is from the DB error (`Key (resident_code)=(R-1001) already exists`); the 22-card break was run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here touches dates
- [ ] For a boundary or banding change, assertions cover both edges — n/a: not a banding change; the one boundary (21 versus 22 cards) was run on both sides
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: gate output pasted verbatim above; script output summarised in section 4
- [ ] Public pages re-checked — n/a: no public change

### Deploy safety

- [ ] Production Supabase ref line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: scripts only; revert the commit, nothing deployed depends on them

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | `check-permission-parity` is RED for the recorded doctor disagreement, four stale N4 entries and unprobed `maintenance.bills` | deferred to backlog (thirteen-harnesses item, needs a ruling from Lutan) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-16

### Manual verification

- [x] The manual list above is empty, so nothing is being signed for — n/a: tooling only, no surface a person needs to look at

Manual verification by: n/a: tooling only, no surface a person needs to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — pending release
