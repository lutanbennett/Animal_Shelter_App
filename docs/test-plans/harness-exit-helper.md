# Feature test plan — harness-exit-helper

## Header

| | |
|---|---|
| Feature | Two checks finish through exitWith; process.exit triage table; who-does-what fixture and fixed-for-now list corrected |
| Backlog item | `docs/backlog.md` → **HARNESS SWEEP … THREE THINGS LEFT** (left open, update note added: deliverable 2 not done) |
| Branch / worktree | `claude/harness-exit-helper` @ `C:\Development\Animal_Shelter_harness-exit-helper` |
| Dev server | `http://localhost:3001` |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-30 |
| Carries a migration? | no |
| Tested at SHA | `84be8f9a` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — (1a) two checks onto exitWith, (1b) a triage table, (3a)-(3c) who-does-what fixture and list; (2) established as an app layout fault and filed, not fixed
- [x] Files/areas touched listed — `scripts/check-map-markers.mjs`, `scripts/check-diets-servings-app.mjs`, `scripts/check-who-does-what.mjs`, `src/lib/permissions/fixed-for-now.ts`, `docs/decisions/2026-10-30-harness-exit-triage.md`, this plan
- [x] Roles affected identified — none; no access rule changed, the list only records what the database already does
- [x] Anything explicitly **out of scope** written down — the 3d doctor entries, the other 74 process.exit scripts (table only), the Security page overflow (filed), scripts/lib/

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 238s

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
- [ ] Constraints and defaults exercised — n/a: no migration (the schema harnesses themselves run in begin and rollback)
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; each harness was re-run and its output read (see the decision file's table)
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input rejected — n/a: no UI surface
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

Cards, not roles: each fixture holds exactly the card named in the decision file.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | unchanged | n/a: no access rule changed |
| management | n/a | unchanged | n/a: no access rule changed |
| staff | n/a | unchanged | n/a: retired role |
| doctor | n/a | unchanged | n/a: no access rule changed |
| volunteer | n/a | unchanged | n/a: no access rule changed |
| signed out | n/a | unchanged | n/a: no access rule changed |

- [ ] Every role above tested — n/a: nothing user-facing changed; nothing user-facing changed
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — check-who-does-what ran against dev: 0 wrong, 0 unlisted, 0 stale; map-markers and diets-servings-app exit 0
- [ ] Any shared file touched checked from a second, unrelated page — n/a: fixed-for-now.ts is read by the Who does what grid; the i18n ids it needs were kept
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after it

## 7. Documentation

- [x] Backlog item updated on the backlog branch — update note added, left open because deliverable 2 is not done
- [x] Non-obvious design choices in `docs/decisions/2026-10-30-harness-exit-triage.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: check scripts and a permissions source file; the database already answered access, so nothing a user can see changed
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — exit codes, page width and the check output were read from runs

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic changed
- [ ] **Boundary or banding change** — n/a: no threshold changed
- [ ] **Evidence pasted is the tool's actual output, unedited** — deferred: release manager for deploy output; the gates output above is unedited
- [ ] Public pages re-checked — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: scripts and a permission source that the database overrides; revert the commit, nothing to undo in data

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Settings → Security is 631 px wide at 375 px; check-security-role-picker times out on its first submit click | deferred to backlog (Mobile) |
| 2 | low | check-who-does-what exits 1 on 17 doctor entries, expected while the Doctor holds no cards | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-30

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: nothing user-facing changed, so there is nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: no release content

Result: pass with accepted defects

Release manager acknowledgement: n/a: not a release
