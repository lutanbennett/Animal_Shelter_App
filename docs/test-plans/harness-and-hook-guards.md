# Feature test plan

## Header

| | |
|---|---|
| Feature | The last red check harnesses, and a pre-commit guard on the `backlog` branch |
| Backlog item | `docs/backlog.md` → "ALL FIVE REMAINING REDS ARE NOW RULED" and "The `backlog` branch can carry ANY file into `main`" |
| Branch / worktree | `claude/harness-and-hook-guards` @ `C:\Development\Animal_Shelter_harness-and-hook-guards` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3014` (not needed: no UI) |
| PR | opened with this plan |
| Tested by / date | Claude / 2026-10-21 |
| Carries a migration? | no |
| Tested at SHA | dd0c0d80 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the thirteen dev harnesses are green or retired with reasons, and `.githooks/pre-commit` refuses non-`docs/backlog.md` commits on `backlog`
- [x] Files/areas touched listed: `scripts/check-{maintenance-role,medication-rounds,permission-tables,permission-parity,impact-baselines}.mjs`, `scripts/lib/permission-probes.mjs`, `.githooks/pre-commit`, `docs/roles-and-permissions.md` §4 (four rows), decision file, backlog ticks
- [x] Roles affected identified: none at run time; only the repo's own checks and the commit hook change
- [x] Anything explicitly **out of scope** written down: `check-bills-roles` and `check-volunteer-narrowing` are red and untouched (decision file); no `src/`, `worker/`, or migration

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Evidence below
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; the harnesses roll back and wrote nothing to dev
- [ ] Constraints and defaults exercised against real rows in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: all thirteen harnesses exit 0 against dev (re-run at the end, `check-permission-parity` and `check-permission-tables` included)
- [ ] Data persists — n/a: no UI or stored data
- [ ] Create / edit / delete all exercised — n/a: no feature data
- [ ] Empty state renders sensibly — n/a: no UI
- [ ] Invalid input is rejected with a readable message — n/a: no input; the hook's refusal message was read in the cases below
- [x] Boundary cases checked: hook run in a scratch repo, four cases. A `docs/backlog.md`-only commit on `backlog` passes. A commit on `backlog` that also stages `x.md` is refused with the message and no commit is made. A commit on `main` and one on `claude/f` are unaffected

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no UI | n/a |
| management | n/a | no UI | n/a |
| staff | n/a | no UI | n/a |
| doctor | n/a | no UI | n/a |
| volunteer | n/a | no UI | n/a |
| signed out | n/a | no UI | n/a |

- [ ] Every role above tested — n/a: no UI surface; the roles' cells are what the harnesses compare, and they pass
- [ ] A role that should not have access is blocked server-side — n/a: no UI surface

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no user-facing change
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work: other readers of the paper's §4 table re-run. `check-2ic-role`, `check-policy-role-names`, `check-new-policy-role-names` and `check-view-write-grants` exit 0
- [x] Any shared file touched checked from a second page: `docs/roles-and-permissions.md` is read by those scripts (above). `check-volunteer-narrowing` is red for causes unrelated to the added rows (translations read, `volunteer` function names), and `check-security-role-picker` needs a running server; neither was taken to green here
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates pass after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch (both items)
- [x] Non-obvious design choices added: `docs/decisions/2026-10-21-harness-reds-and-backlog-guard.md`
- [x] `README.md` still accurate — nothing in it describes these checks
- [ ] **Release notes.** n/a: repo checks, a commit hook and documentation; no shelter user would notice
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned: each harness result was a re-run, the paper counts (57/38/13) were parsed and compared with dev rows, and the `since_year` and `map_rooms` causes were read from `0204` and `0184`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date
- [ ] Boundary or banding change covers both edges — n/a: no boundary or threshold change
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the only pasted evidence is the gates line, copied as printed
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: no deployed artefact changes; revert the commits to undo, and the hook is undone by reverting `.githooks/pre-commit`

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `check-bills-roles` red for the doctor (5 lines) since the doctor gained `medical.visits` | deferred to backlog |
| 2 | low | `check-volunteer-narrowing` red (translations read; two functions still say volunteer) | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-21

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: nothing for a person to look at

Manual verification by: n/a: no UI, nothing to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is committed with the PR
- [ ] Handed to the production release manager — n/a: not a release-affecting change

Result: pass with accepted defects

Release manager acknowledgement: n/a: no deploy
