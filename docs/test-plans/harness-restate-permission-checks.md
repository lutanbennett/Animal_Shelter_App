# Feature test plan — harness-restate-permission-checks

## Header

| | |
|---|---|
| Feature | Eight role-shaped permission harnesses restated card-shaped (2) or retired (6) |
| Backlog item | `docs/backlog.md` → harness sweep, BATCH 7 (update note added; item stays open for the rest) |
| Branch / worktree | `claude/harness-restate-permission-checks` @ `C:\Development\Animal_Shelter_harness-restate-permission-checks` |
| Dev server | not started — scripts only |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-29 |
| Carries a migration? | no |
| Tested at SHA | `e3f78907` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — each of the eight harnesses restated card-shaped or retired, with a decision file
- [x] Files/areas touched listed — `scripts/check-*.mjs` (2 edited, 6 deleted), `docs/decisions/2026-10-29-harness-restate-permission-checks.md`, `docs/backlog.md`, this plan
- [ ] Roles affected identified — n/a: check scripts only, no access rule changed
- [x] Anything explicitly **out of scope** written down — diet harnesses, doctor-* rows, who-does-what, menu-coverage, 18 server-needing rows

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date with `origin/main`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 241s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev and recorded — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason stated — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `check-role-write-policies.mjs` all hold (14 offered writes; medical_records writes, view_medical reads only, no cards reads nothing); `check-perm-convert-admin.mjs` 172 checks, GREEN; both run on dev
- [ ] Data persists — n/a: both checks end in a rollback
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no UI surface
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| (by card) | n/a | n/a | n/a — no access rule changed; checks only |

- [ ] Every role above tested — n/a: no access rule changed
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed; the restated checks assert refusal for a no-cards login

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — no app code touched; `check-hard-coded-security.mjs` still prints `no coded security outside the Admin bypass`
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken — sync brought nothing

## 7. Documentation

- [x] Backlog item annotated in `docs/backlog.md` — left open on purpose; update note added at its head
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-29-harness-restate-permission-checks.md`
- [x] `README.md` still accurate — it does not list these checks
- [ ] **Release notes.** — n/a: internal check scripts; nothing a shelter user would notice
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — red/green counts are from running each script on dev; the live-count claim comes from reading the file

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — n/a: scripts only, nothing deploys
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] Production dry-run clean — n/a: no migration
- [ ] Rollback position stated — n/a: no migration; revert the PR

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Retiring `perm-convert-photos` leaves no per-card photo-table check | deferred to backlog |
| 2 | info | Stale comment in `src/lib/permissions/jobs.ts` and `docs/roles-and-permissions.md` §11 name retired checks | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-29

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: scripts only, no UI surface

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
