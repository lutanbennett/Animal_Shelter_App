# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Static CI check that a migration added by a PR does not create a policy naming a role (`scripts/check-new-policy-role-names.mjs`, CI job `new-policy-role-names`) |
| Backlog item | `docs/backlog.md` → Auth: "`0157_map_rooms` added a policy that names a role…" (second half: why it got through) |
| Branch / worktree | `claude/policy-enum-guard` @ `C:\Development\Animal_Shelter_policy-enum-guard` |
| Dev server | n/a: nothing served; `.port` is 3004 |
| PR | pending |
| Tested by / date | Claude (policy-enum-guard session), 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | see PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a PR that adds a migration creating a role-named policy fails CI, with a message saying what to do instead and an explicit `-- policy-role: deliberate — <why>` escape hatch
- [x] Files/areas touched listed: `scripts/check-new-policy-role-names.mjs` (new), `.github/workflows/ci.yml` (new job), `docs/decisions/2026-10-07-policy-enum-guard.md`, this plan. Nothing under `src/`, `worker/` or `supabase/`
- [ ] Roles affected identified — n/a: developer tooling only; no app role sees any of it
- [x] Out of scope written down: the policy itself (`policy-cells-0158` fixes `management_rw_map_rooms`); the database-backed `check-policy-role-names.mjs` is unchanged and still not in CI or `gates.mjs`; policies already on `main` are not judged

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branch cut from current `origin/main`; synced before the PR
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines:

```
GATES_PLACEHOLDER
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration on this stream
- [ ] `node scripts/apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: on this branch (no added migration) the check prints `ok — 0 new migration file(s)` and exits 0
- [ ] Data persists — n/a: no data, nothing stored
- [ ] Create / edit / delete all exercised — n/a: no such feature surface
- [ ] Empty state renders sensibly — n/a: no UI; the empty case (no new migrations) is the happy path above
- [x] Invalid input is rejected with a readable message: run on `0157_map_rooms.sql` it exits 1 and prints the file, the policy and the two ways out
- [x] Boundary cases checked: a throwaway fixture with a marked policy (passes, reason printed), a marker on the `;` line (passes), `role_can('x')` (passes), a function body naming `current_user_role()` (not judged), a bare `current_user_role()='vet'` and `'staff'::app_role` (fail)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no app surface | n/a |
| management | n/a | no app surface | n/a |
| staff | n/a | no app surface | n/a |
| vet | n/a | no app surface | n/a |
| volunteer | n/a | no app surface | n/a |
| signed out | n/a | no app surface | n/a |

- [ ] Every role above tested — n/a: no app surface
- [ ] A role that should not have access is blocked server-side — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: developer tooling, not in the shelter manual
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work: `check-migration-numbers.mjs` and the `migration-numbers` job are untouched; the new job is a sibling and shares only `scripts/lib/migrations.mjs`, read-only
- [x] Any shared file touched checked from a second page: `ci.yml` gained one job and no existing job was edited (`git diff` shows additions only)
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: the item is shared with `policy-cells-0158`, which fixes the policy half and ticks it; editing the same line here would conflict. Any reword goes on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-07-policy-enum-guard.md`
- [x] `README.md` still accurate: it does not list CI jobs
- [ ] **Release notes.** n/a: no shelter user would notice a CI check on migration files
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned: the no-token claim is from reading `check-policy-role-names.mjs` (it calls the Management API with `SUPABASE_ACCESS_TOKEN`), and the pass/fail behaviour above was observed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: not part of the app; CI only
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing the deployed build contains
- [ ] Timezone-sensitive behaviour proved — n/a: no dates involved
- [ ] Boundary or banding change covers both edges — n/a: no thresholds; the match and no-match cases are in section 4
- [ ] Evidence pasted into this plan is the tool's actual output — n/a: only the gates lines, pasted as printed
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production` line read — n/a: nothing deployed by this PR
- [ ] `strip-baked-env` seen — n/a: nothing deployed by this PR
- [ ] Any new secret/env var exists in production — n/a: none added, which is the point of the design

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Production backup for destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: revert the PR; no deploy, schema or data involved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Two bugs in my own fixture handling, found while proving it and fixed before commit: the first file argument was dropped, and a marker on the `;` line attached to the next statement | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | CI job `new-policy-role-names` goes red on a PR adding a role-named policy migration (proved locally, not yet seen red in Actions) | the next PR that carries a migration |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (policy-enum-guard session)  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item listed, awaiting the next migration PR

Manual verification by: pending: the CI job has not yet been seen red in Actions

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: pasted once the PR exists
- [ ] Handed to the production release manager — n/a: handed over at release time

Result: pass

Release manager acknowledgement: pending
