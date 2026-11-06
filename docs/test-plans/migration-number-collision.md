# Feature test plan — migration-number-collision

## Header

| | |
|---|---|
| Feature | `check-migration-numbers.mjs` refuses a number used twice on main, and a number another open PR already adds |
| Backlog item | `#m2q8c` (ticked) |
| Branch / worktree | `claude/migration-number-collision` @ `C:\Development\Animal_Shelter_migration-number-collision` |
| Dev server | not started — no UI surface |
| PR | pending: opened after this plan |
| Tested by / date | Claude / 2026-11-06 |
| Carries a migration? | no |
| Tested at SHA | `94baec10` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the check now also refuses duplicate numbers in the tree (offline) and collisions with other open PRs (via `gh`)
- [x] Files/areas touched listed — `scripts/check-migration-numbers.mjs`, `scripts/lib/migrations.mjs`, `scripts/check-migration-numbers.test.mjs`, `scripts/fixtures/migration-numbers/`, `.github/workflows/ci.yml` (GH_TOKEN on the one step), decision file, backlog tick
- [x] Roles affected identified — none: a developer check, no app code
- [x] Anything explicitly **out of scope** written down — the two pairs (`0191`, `0324`) are not renamed; the hook (`--staged`) is unchanged and still never uses the network

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — pending: run immediately before opening the PR; any result is in the PR body
- [x] `node scripts/gates.mjs` ends with all four exit codes 0:

```
=== gates: build exited 0 after 331s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/check-migration-numbers.mjs` on this branch: ok, with a note for each of `0191` and `0324`; `node --test scripts/check-migration-numbers.test.mjs`: 5 pass
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete — n/a: no data
- [ ] Empty state renders sensibly — n/a: no UI
- [x] Invalid input is rejected — planted duplicate (`--names-file` fixture) exits 1 naming `0003_c.sql, 0003_d.sql`; a clean list exits 0; offline (`--no-prs`, no network used)
- [x] Boundary cases checked — an open PR holding the same number is a collision; a number unique among open PRs passes (the `0328` case); a PR never collides with itself

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all | nothing in the app | unchanged | n/a — no app code touched |

- [ ] Every role above tested — n/a: no app code
- [ ] A role that should not have access is blocked server-side — n/a: no access rule

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no UI
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — the pre-commit hook path (`--staged`) unchanged; its duplicate and PR reads are skipped there by design
- [ ] Shared file touched checked from a second page — n/a: no app file
- [x] Nothing merged from `main` during `sync` was broken — pending the sync; re-run of the check is in the PR body

## 7. Documentation

- [x] Backlog item ticked — `#m2q8c`; searched the backlog for `check-migration-numbers` and `migration number`: no other open item closed
- [x] Decision file — `2026-11-06-migration-number-collision.md`
- [x] `README.md` still accurate — it does not describe this check
- [ ] **Release notes.** — n/a: a CI check, no shelter user would notice
- [x] Commit messages say why
- [x] Claims were measured — the duplicate list came from `uniq -d` on the folder; the proofs are from running the script

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: nothing deploys; CI-only change
- [ ] Smoke-tested on test — n/a: nothing deploys
- [ ] Timezone-sensitive behaviour — n/a: no dates
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence is unedited tool output — n/a: nothing deployed
- [ ] Public pages re-checked — n/a: untouched

### Deploy safety

- [ ] `deploy:` line read — n/a: no deploy
- [ ] `strip-baked-env` — n/a: no deploy
- [ ] New secret/env var — n/a: `GH_TOKEN` is the built-in `github.token`; without it the open-PR half warns and skips

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated — revert the PR; the hook and the old CI line behave as before

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | info | Step zero found a second duplicate on main, `0191`, older than `0324` | accepted — recorded in `KNOWN_DUPLICATES`, same reason as `0324` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-06

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: CI-only change

Result: pass

Release manager acknowledgement: n/a: not yet released
