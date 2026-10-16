# Feature test plan — migration-test-guard

## Header

| | |
|---|---|
| Feature | `apply-migrations.mjs --env test` refuses migration files that were merged and have since been renamed or removed on `origin/main` |
| Backlog item | `docs/backlog.md` → **`apply-migrations.mjs` does not guard `--env test`** (part 1 done, status note added; part 2 left open) |
| Branch / worktree | `claude/migration-test-guard-930a8b` @ `C:\Development\Animal_Shelter_App\.claude\worktrees\migration-test-guard-930a8b` |
| Dev server | not started — no UI surface |
| PR | see PR |
| Tested by / date | Claude / 2026-10-16 |
| Carries a migration? | no |
| Tested at SHA | tip of this branch after sync with `origin/main` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — part (1): a narrower check on `--env test` than the full uat/production guard
- [x] Files/areas touched listed — `scripts/apply-migrations.mjs`, `docs/decisions/2026-10-16-migration-guard-for-test.md`, `docs/backlog.md` (status note), this plan
- [x] Roles affected identified — none; a developer script, no app code or database change
- [x] Anything explicitly **out of scope** written down — part (2), the migration deleting the phantom 0201 ledger row, is a separate schema PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with every gate at 0:

```
=== gates: build exited 0 after 85s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration; the script behaviour was exercised instead, see section 6
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface; script behaviour checked in section 6
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI surface
- [ ] Boundary cases — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing changed | unchanged | n/a — no app or policy change |
| management | nothing changed | unchanged | n/a — as above |
| staff | nothing changed | unchanged | n/a — as above |
| vet | nothing changed | unchanged | n/a — as above |
| volunteer | nothing changed | unchanged | n/a — as above |
| signed out | nothing changed | unchanged | n/a — as above |

- [ ] Every role above tested — n/a: a developer script, no role touches it
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — nothing in the app imports the script. Ran in a scratch clone: a file in the merge-base but gone from main is refused with its name listed (0999_old_name.sql); a file new on the branch passes the guard and goes on to the credentials check; the current checkout passes the guard too
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after it

## 7. Documentation

- [x] Backlog item — left open on purpose (part 2 remains); status note added at its line. Other items searched for `apply-migrations` / `--env test`: none else closed
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-16-migration-guard-for-test.md`
- [x] `README.md` still accurate — it does not describe the guard
- [ ] **Release notes.** — n/a: a developer script, no shelter user would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the stale and new-file cases were both run, in a scratch clone

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — n/a: not a deployed change
- [ ] Deployed SHA matches — n/a: not deployed

### On the deployed build

- [ ] Deployed to test — n/a: a developer script, never deployed
- [ ] Smoke-tested on test.lannacare.org — n/a: not deployed
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates output above is unedited
- [ ] Public pages re-checked — n/a: not touched

### Deploy safety

- [ ] Deploy line read — n/a: not deployed
- [ ] strip-baked-env seen — n/a: not deployed
- [ ] New secret/env var — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: revert the commit; no database or deploy effect

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | The guard only sees a stale file if it was in the merge-base; a checkout whose merge-base predates the file entirely cannot be told apart from a new file | accepted — the 0201 case had the file in the base |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-16

### Manual verification

Manual verification by: n/a: a developer script with no surface a person would look at  Date: 2026-10-16

Result: PASS
