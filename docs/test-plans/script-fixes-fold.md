# Feature test plan — script-fixes-fold

## Header

| | |
|---|---|
| Feature | Run the twenty-one-card count in CI without a database; stop `worktree.mjs` issuing a port twice or aiming a worktree at the main checkout's port |
| Backlog item | `docs/backlog.md` → **Run the twenty-one-card count in CI** and **`worktree.mjs` defaults a portless worktree to 3000** (both ticked) |
| Branch / worktree | `claude/script-fixes-fold` @ `C:\Development\Animal_Shelter_script-fixes-fold` |
| Dev server | not started — no UI surface |
| PR | see PR |
| Tested by / date | Claude / 2026-10-16 |
| Carries a migration? | no |
| Tested at SHA | `8e6c53ba` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a database-free card-count script wired into CI, and `worktree.mjs` port allocation made collision-proof
- [x] Files/areas touched listed — `scripts/check-cards-count.mjs` (new), `.github/workflows/ci.yml` (new `cards-count` job), `scripts/worktree.mjs`, `docs/backlog.md`, `docs/decisions/2026-10-16-cards-count-in-ci-and-worktree-ports.md`, this plan
- [x] Roles affected identified — none; no app code changed
- [x] Anything explicitly **out of scope** written down — making `cards-count` a required check (branch protection, Lutan's call); `worktree.mjs list` showing `.claude/worktrees/` spares (optional in the item, not done)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date with `origin/main`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`:

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
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/check-cards-count.mjs` prints `ok   cards.ts has the twenty-one agreed cards, all naming real activities`, exit 0, with no token. For ports: a throwaway detached worktree with no `.port` was given the free port 3010 by `worktree.mjs launch`, with `.port` and `launch.json` both on 3010; a second run kept 3010; the throwaway was then removed with `git worktree remove` and is gone from `git worktree list`
- [x] Data persists — the assigned `.port` survived a second `launch` run unchanged
- [ ] Create / edit / delete all exercised — n/a: no feature, tooling only
- [ ] Empty state renders sensibly — n/a: no UI
- [ ] Invalid input is rejected with a readable message — n/a: no UI
- [x] Boundary cases checked — card count: `CARD_KEYS` forced to include a fake 22nd key made the script exit 1 (it crashed on the fake key before reaching the count message, so the count message itself was not seen firing here; the identical assertion in `check-cards-schema.mjs` was seen printing the 22-card FAIL in the previous PR); `cards.ts` restored with `git checkout`. Ports: spares under `.claude/worktrees/` are now counted by `nextFreePort`. NOT checked: `writeLaunch` run from the main checkout itself (the edited script cannot run there before merge; the branch only compares against the first `git worktree list` entry). `worktree.mjs list` was run after the change and still renders every row and port

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

- [x] The pages nearest the change still work — typecheck, lint, test and build pass; no app file touched; `worktree.mjs list` and `launch` run from this worktree after the change
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was a no-op

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch (both items)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-16-cards-count-in-ci-and-worktree-ports.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: tooling and CI only — no shelter user would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The port fix was run against a portless worktree; the card script was run clean and broken

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here touches dates
- [ ] For a boundary or banding change, assertions cover both edges — n/a: not a banding change
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: gate line pasted verbatim above; script output quoted in section 4
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

- [ ] Rollback position stated — n/a: scripts and CI only; revert the commits, nothing deployed depends on them

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | `worktree.mjs list` still does not show `.claude/worktrees/` spares, and `done` cannot remove them | deferred to backlog (optional in the item; not cheap) |

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
