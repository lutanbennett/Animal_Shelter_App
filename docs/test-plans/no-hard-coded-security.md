# Feature test plan — no-hard-coded-security

## Header

| | |
|---|---|
| Feature | Hard-coded security is forbidden: the rule in `CLAUDE.md`, a registry of the known mechanisms, and a blocking CI ratchet. Removes nothing |
| Backlog item | `docs/backlog.md` → hard-coded security removal (left open: this PR removes nothing) |
| Branch / worktree | `claude/no-hard-coded-security` @ `C:\Development\Animal_Shelter_no-hard-coded-security` |
| Dev server | not started — no UI surface |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-10-24 |
| Carries a migration? | no |
| Tested at SHA | `54cd1c3e` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the rule goes into `CLAUDE.md` in Lutan's words, and a check fails when the known hard-coded security grows
- [x] Files/areas touched listed — `CLAUDE.md`, `scripts/check-hard-coded-security.mjs`, `docs/hard-coded-security-registry.json`, `.github/workflows/ci.yml` (one new job), `docs/decisions/2026-10-24-hard-coded-security-ratchet.md`, this plan
- [x] Roles affected identified — none: nothing under `src/` or `supabase/` changed
- [x] Anything explicitly **out of scope** written down — removing any mechanism, the Hidden security screen, `docs/card-access-faults.md` (owned by `cards-grants-app`, not on `main` yet)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`:

```
=== gates: build exited 0 after 349s

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
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/check-hard-coded-security.mjs` exits 0 on the tree, printing `ok` for all ten registry entries
- [ ] Data persists — n/a: no UI surface, no stored data
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [x] Invalid input is rejected — the check was proved able to fail: appending a `JOBS_OF_ROLE` mention to `src/lib/bills/access.ts` gave `FAIL jobs-of-role: 3 references, baseline 2` and exit 1; the file was then restored. A first run also caught a placeholder baseline of 0 on `roles-scope-clinical` (real count 9), corrected
- [x] Boundary cases checked — a fall prints `down …` and passes; a missing anchor with zero references prints `gone …` and passes; a moved mechanism with references fails (read from the code, only the rise path was driven)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing changed | unchanged | n/a — no app code touched |
| management | nothing changed | unchanged | n/a — no app code touched |
| staff | nothing changed | unchanged | n/a — no app code touched |
| doctor | nothing changed | unchanged | n/a — no app code touched |
| volunteer | nothing changed | unchanged | n/a — no app code touched |
| signed out | nothing changed | unchanged | n/a — no app code touched |

- [ ] Every role above tested — n/a: no app code, policy or grant changed
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles `src/`, which is untouched; the only runtime-adjacent edit is `ci.yml`, one added job
- [ ] Shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged in

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open; nothing is removed. Searched `docs/backlog.md` for the mechanism names: no other item is closed
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-24-hard-coded-security-ratchet.md`
- [x] `README.md` still accurate — it does not describe CI jobs or this rule
- [ ] **Release notes.** — n/a: a rule, a check and a document; nothing a shelter user sees changes
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — every count came from running the check against the tree at `cd933f43`; the brief's 55 page rules measured as 45 and is recorded as found

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: not an app change, nothing to deploy
- [ ] Smoke-tested on `test.lannacare.org` — n/a: not an app change
- [ ] Timezone-sensitive behaviour proved — n/a: nothing derives a date
- [ ] Boundary or banding change — n/a: a count ratchet, not a user threshold
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: gates output pasted unedited above
- [ ] Public pages re-checked — n/a: public site untouched

### Deploy safety

- [ ] `deploy: production` line read — n/a: no deploy
- [ ] `strip-baked-env` seen — n/a: no deploy
- [ ] Any new secret/env var — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: a revert of the PR undoes it all; no schema, no deploy

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Placeholder baseline 0 for `roles-scope-clinical`; first run failed on it | fixed — real count 9 |
| 2 | info | Brief counted 55 page rules; the file has 45 `path:` entries | accepted — recorded as found in the registry |
| 3 | info | `docs/card-access-faults.md` is named by the CLAUDE.md rule but is not on `main` yet | accepted — owned by `cards-grants-app`; the rule says to note it in the PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The new `hard-coded-security` job goes green on this PR's own run; it is the first run of a check nobody has seen green | the PR's checks |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-24

### Manual verification

Manual verification by: pending: the new `hard-coded-security` CI job has not yet run green on the PR

Result: pass
