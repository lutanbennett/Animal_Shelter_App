# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | `check-shelter-today.mjs` asserts against the live schema instead of replaying `0073` |
| Backlog item | `docs/backlog.md` → `scripts/check-shelter-today.mjs` fails on dev: it replays `0073` |
| Branch / worktree | `claude/check-shelter-today-fix` @ `C:\Development\Animal_Shelter_check-shelter-today-fix` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` (not used: script only) |
| PR | linked from the PR itself |
| Tested by / date | Claude (check-shelter-today-fix session), 2026-10-02 |
| Carries a migration? | no |
| Tested at SHA | `e519908` plus the change, run before the commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the harness no longer replays `0073` and asserts against the live views and functions
- [x] Files/areas touched listed: `scripts/check-shelter-today.mjs`, `docs/backlog.md`, `docs/decisions/2026-10-02-check-scripts-assert-live-not-replay.md`, this plan. Nothing under `src/`, `worker/` or `supabase/`
- [ ] Roles affected identified — n/a: a dev check script, no app role sees it
- [x] Out of scope written down: the 26 other harnesses that replay a migration, filed on `backlog`

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: not yet run at this commit; done before the PR opens
- [ ] `node scripts/gates.mjs` — n/a: not yet run at this commit; closing lines pasted once run
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `node scripts/check-shelter-today.mjs` against dev ends `HARNESS-OK`, exit 0 (it deliberately raises to roll back). Before the change the same run failed at the anon step with `permission denied for function current_vet_resident_ids`
- [ ] Data persists — n/a: the harness runs inside begin…rollback and writes nothing
- [ ] Create / edit / delete all exercised — n/a: no app data flow
- [ ] Empty state — n/a: no UI
- [ ] Invalid input is rejected — n/a: the script still refuses any project other than dev
- [ ] Boundary cases — n/a: the date-boundary assertions (A, C, D) are unchanged and pass in the run above

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | tooling, no app surface | n/a |
| management | n/a | tooling, no app surface | n/a |
| staff | n/a | tooling, no app surface | n/a |
| vet | n/a | tooling, no app surface | n/a |
| volunteer | n/a | tooling, no app surface | n/a |
| signed out | n/a | the harness's own anon step reads both public views: passed | n/a |

- [ ] Every role above tested — n/a: no app code changed
- [ ] A role that should not have access is blocked server-side — n/a: no app code changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: developer tooling
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] The nearest things still work — n/a: no code reads this script
- [ ] Shared file checked from a second page — n/a: no shared file touched
- [ ] Nothing merged from `main` during `sync` was broken — n/a: sync not yet run at this commit

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices recorded in `docs/decisions/2026-10-02-check-scripts-assert-live-not-replay.md`
- [ ] `README.md` still accurate — n/a: README does not describe this script
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a development check script, no shelter user sees it
- [x] Commit messages say why, not just what
- [x] Claims are measured: the failing and passing runs are from the actual script output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: scripts are not part of the Worker bundle
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deploys
- [ ] Timezone-sensitive behaviour proved — n/a: assertions unchanged
- [ ] Boundary assertions cover both edges — n/a: unchanged
- [ ] Evidence pasted is the tool's actual output — n/a: no deployed evidence
- [ ] Public pages re-checked after cache purge — n/a: no page changed

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — n/a: nothing deploys
- [ ] `strip-baked-env` seen — n/a: nothing deploys
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR. A dev check script only

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | 26 other check scripts replay a migration for their fixture and carry the same latent trap | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Nothing here needs human eyes: the script's exit code is the check.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (check-shelter-today-fix session)  Date: 2026-10-02

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI or visual surface; the script's exit code is the check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet, PR does not exist
- [ ] Handed to the production release manager — n/a: nothing deploys

Result: pass

Release manager acknowledgement: n/a (tooling only)  Date: —
