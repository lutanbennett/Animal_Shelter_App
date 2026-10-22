# Test plan: production-rehearsal

## Header

| | |
|---|---|
| Feature | Rehearse building production from zero; `scripts/check-schema-drift.mjs` |
| Backlog item | `docs/backlog.md` → Rehearse building production from zero |
| Branch / worktree | `claude/production-rehearsal` @ `C:\Development\Animal_Shelter_production-rehearsal` |
| Dev server | n/a, no app code changed |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-10-22 |
| Carries a migration? | no |
| Tested at SHA | 3a77a209 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a read-only script diffing the columns of two Supabase projects, plus the record of a from-zero build. The import dry-run part of the item is NOT done (see decision file)
- [x] Files/areas touched listed: `scripts/check-schema-drift.mjs`, `docs/decisions/2026-10-22-from-zero-rehearsal-and-schema-drift.md`, this plan. No `src/`, no `supabase/migrations/`
- [x] Roles affected identified: none, operator script only
- [x] Out of scope written down: fixing the import and the grants-check bypass (decision file, "Findings")

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with all gates 0.

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR (it was run against the throwaway project: 0 applied, 246 pending)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: nothing in dev was changed; every command against dev was a read
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: nothing to apply; production was never touched

## 4. Functional checks

- [x] Happy path works end to end: drift script run dev vs rebuilt project, exit 0, "No differences" (1354 columns each); and it reported the one real difference (`role_groups.name_th`) with exit 1 before `0246` reached the rebuilt project
- [ ] Data persists — n/a: read-only script
- [ ] Create / edit / delete all exercised — n/a: read-only script
- [ ] Empty state renders sensibly — n/a: no UI
- [x] Invalid input is rejected with a readable message: missing `--against` and a malformed ref both exit 2 with a message
- [ ] Boundary cases checked — n/a: no free-text, date or numeric input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all | operator script, needs a Supabase access token | no app surface | n/a |

- [ ] Every role above tested — n/a: no app surface
- [ ] A role that should not have access is blocked server-side — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: operator script, no user-facing topic
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no app code changed
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates above

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately NOT ticked, the import dry-run half is still open; the follow-up goes on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/`
- [ ] `README.md` still accurate — n/a: README does not list this script
- [ ] **Release notes.** n/a: operator script and docs, no shelter user would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Counts (247 applied, 1354 columns) are from the runs; the `0119` cause of the foster error is inferred from the trigger name and is labelled as such

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager (no deploy needed, script only)
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager (not needed, no app change)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (not needed, no app change)
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic
- [ ] **Boundary or banding change** — n/a: no threshold or banding
- [x] **Evidence pasted into this plan is the tool's actual output, unedited**
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager (nothing to deploy)
- [ ] `strip-baked-env` seen — deferred: release manager (nothing to deploy)
- [ ] Any new secret/env var exists in production — n/a: only a local `.env.local` variable, `REHEARSAL_SUPABASE_ACCESS_TOKEN`, used by this script

### Migration ordering

- [ ] Both a migration and code reading it? — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: a new unused script; reverting the commit removes it, no data or schema affected

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | high for cutover | `apply-migrations.mjs` grants check refuses the full history, no bypass | deferred to backlog |
| 2 | high for cutover | `import-appsheet.mjs` needs a bootstrapped admin and fails on the `0119` foster guard | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-22

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person.

Manual verification by: n/a: no UI or user-facing surface to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: pasted when the PR is opened
- [ ] Handed to the production release manager — n/a: nothing to deploy

Result: pass with accepted defects

Release manager acknowledgement: n/a: no deploy
