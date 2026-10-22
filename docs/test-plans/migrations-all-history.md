# Feature test plan — migrations-all-history

## Header

| | |
|---|---|
| Feature | `apply-migrations.mjs --all-history`: build a fresh project from `0001` |
| Backlog item | `docs/backlog.md` → **`apply-migrations.mjs` cannot apply the full migration history** (ticked) |
| Branch / worktree | `claude/migrations-all-history` @ `C:\Development\Animal_Shelter_migrations-all-history` |
| Dev server | not started — no UI surface |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-10-22 |
| Carries a migration? | no |
| Tested at SHA | `470f0809` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a deliberate `--all-history` flag that skips the grants check for files `0077` and below only
- [x] Files/areas touched listed — `scripts/apply-migrations.mjs`, `docs/backlog.md`, `docs/decisions/2026-10-22-all-history-flag.md`, this plan
- [x] Roles affected identified — none; a developer script
- [x] Anything explicitly **out of scope** written down — the importer, `supabase/migrations/`, `check-schema-drift.mjs`; whether early objects end up with the right grants is still unverified

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date with `origin/main`
- [x] `node scripts/gates.mjs` ends clean:

```
=== gates: build exited 0 after 201s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration; dev has nothing pending, so the flag's path is not reachable there
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no schema change
- [ ] Constraints exercised — n/a: no schema change
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not run against a fresh project (none available); only the grants check scoping was exercised, see Defects
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input rejected — n/a: flag refused with `--status`, `--drift`, `--baseline` (code path read, not run)
- [ ] Boundary cases — n/a: cut-off checked by running the checker over 0001..0077 (32 findings) and 0078+ (none)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing | n/a | n/a: no app surface |

- [ ] Every role above tested — n/a: no app surface
- [ ] A role that should not have access is blocked — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual updated — n/a: developer script
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — `apply-migrations.mjs --status` and `--dry-run` still run on dev (247 applied, 0 pending); default path unchanged without the flag
- [ ] Shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken — nothing was merged

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md`, and the cutover item's step 2 now names the flag
- [x] Design choices in `docs/decisions/2026-10-22-all-history-flag.md`
- [x] `README.md` still accurate — it does not describe this flag
- [ ] **Release notes.** — n/a: a developer script, no shelter user would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — 32 findings reproduced by running the checker

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — n/a: not deployed, a script

### On the deployed build

- [ ] Deployed to test — n/a: a script, not part of the app build
- [ ] Smoke-tested — n/a: a script
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates
- [ ] **Boundary or banding change** — n/a: the cut-off is an exact file number, 0077 exempt and 0078 checked, as the existing checker already does
- [ ] **Evidence pasted is unedited** — n/a: gates output above is verbatim
- [ ] Public pages re-checked — n/a: none touched

### Deploy safety

- [ ] `deploy:` line read — n/a: no deploy
- [ ] `strip-baked-env` — n/a: no deploy
- [ ] New secret/env var — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and code together? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated — revert the commit; nothing is applied anywhere by this change

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | Not proved end to end: no throwaway Supabase project was available, so a real from-zero apply with the flag was not run | accepted — to be run once at the cutover rehearsal |
| 2 | info | Grants of the early objects (`0001`..`0077`) are still unverified; the drift script compares columns only | accepted — stated in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | End-to-end run of `--all-history` on an empty free project (skipped 2026-10-22 at Lutan's instruction: the only throwaway project still held all 247 migrations and could not be reset) | Lutan, when a fresh throwaway exists |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-22

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the one item is the end-to-end run, skipped on 2026-10-22 at Lutan's instruction, so it is pending, not checked

Manual verification by: pending: the end-to-end run on a throwaway project

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: nothing to hand over until the PR merges

Result: pass with accepted defects

Release manager acknowledgement: pending: not yet reviewed
