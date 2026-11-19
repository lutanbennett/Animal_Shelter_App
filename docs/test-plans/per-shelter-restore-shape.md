# Feature test plan — per-shelter-restore-shape

## Header

| | |
|---|---|
| Feature | Establish half of #shres: decide the shape of a one-shelter restore. A decision file and a backlog rewrite; no code |
| Backlog item | `docs/backlog.md` → **RESTORE ONE SHELTER** (`#shres`, rewritten on the `backlog` branch, left open) |
| Branch / worktree | `claude/per-shelter-restore-shape` @ `C:\Development\Animal_Shelter_per-shelter-restore-shape` |
| Dev server | not started — no UI surface |
| PR | n/a: the number does not exist at this commit |
| Tested by / date | Claude / 2026-11-20 |
| Carries a migration? | no |
| Tested at SHA | `560f47155` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one decision file answering the item's first question and sizing the build; nothing built
- [x] Files/areas touched listed — `docs/decisions/2026-11-20-per-shelter-restore-shape.md`, this plan; `docs/backlog.md` on the `backlog` branch only
- [x] Roles affected identified — none; no code and no database change
- [x] Anything explicitly **out of scope** written down — the restore tool itself, any edit to `scripts/`, production, the real backups

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged, "Already up to date"
- [x] `node scripts/gates.mjs` ends with the four exit codes below, read from the output file:

```
=== gates: build exited 0 after 294s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration; the counts in the decision file come from read-only catalogue queries on dev
- [ ] Down-migration written, or the reason one is not needed — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code changed
- [ ] Data persists — n/a: no UI surface, no code changed
- [ ] Create / edit / delete all exercised — n/a: no UI surface, no code changed
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role | nothing new | unchanged | n/a — no code, policy or grant changed |

- [ ] Every role above tested — n/a: no access rule changed
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: an operator decision; nothing a shelter user sees
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no code changed; the build gate above compiled the whole app
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged, already up to date

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open and rewritten on the `backlog` branch (title says the build is not to start yet); searched the backlog for `shres`, `sxyw3`, `restore`, `export`: this closes no other item
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-20-per-shelter-restore-shape.md`
- [x] `README.md` still accurate — it does not describe a one-shelter restore
- [ ] **Release notes.** — n/a: an operator decision; no shelter user sees it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — counts come from read-only catalogue queries on dev; what was not measured is listed in the decision file under "Not established"

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager; the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: the public site is untouched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Rollback

- [x] Rollback position stated — docs only; revert the commit

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `product_admins`, `product_admin_lookups`, `product_admin_login_grants` are unscoped on dev but missing from `docs/tenancy-shared-tables-registry.json`; the export would likely refuse (read from code, not run) | deferred to backlog — recorded in the decision file and `#shres` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-20

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code changed

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: docs only

Result: pass

Release manager acknowledgement: n/a: not yet released
