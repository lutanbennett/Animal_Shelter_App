# Feature test plan

## Header

| | |
|---|---|
| Feature | control-activity-check: the second resolver (control vs its action's activity) |
| Backlog item | `docs/backlog.md` → #79sqf (retitled, left open) |
| Branch / worktree | `claude/control-activity-check` @ `C:\Development\Animal_Shelter_control-activity-check` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-11 |
| Carries a migration? | no |
| Tested at SHA | 93d1a9f0 |

## 1. Scope and risk

- [x] Change is described in one sentence: a static check that fails CI when a control is gated on a different activity from the one its own server action or rpc asks
- [x] Files touched: `scripts/check-control-activity.mjs`, `docs/control-activity-allowlist.json`, `.github/workflows/ci.yml` (one job), `docs/decisions/2026-11-11-control-activity-check.md`, `docs/backlog.md` (retitle #79sqf), this plan. No app code, no `supabase/migrations/`, no `worker/`
- [x] Cards affected: none (the check reads activities in code; it changes no gate). Admin and the public unaffected
- [x] Out of scope: fixing the 3 real findings on /admin/website (parked on the allow-list), F2 (render-time), the ~70 unresolved callback controls

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in before the PR
- [x] `node scripts/gates.mjs` ends with the four-gate line:

```
=== gates: typecheck exited 0 after 169s
=== gates: lint exited 0 after 492s
=== gates: test exited 0 after 120s
=== gates: build exited 0 after 409s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: `node scripts/check-control-activity.mjs` runs in about 12-25 s, prints counts, UNRESOLVED rows by name and findings, exits 0 with every finding on the allow-list
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete — n/a: no UI feature
- [ ] Empty state — n/a: no UI feature
- [x] Invalid input / a new finding fails: with the allow-list file removed the script exits 1 with NOT CLEAN (every finding becomes new); a stale entry also exits 1 by construction
- [ ] Boundary cases — n/a: static analysis, no user input

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any | no page changed | n/a | n/a |

- [ ] Every login above tested — n/a: no page or access changed
- [ ] A login that should not have access is blocked server-side — n/a: no access changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: developer check, not in the manual
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] `node scripts/check-destination-activity.mjs` is untouched (file not edited) and still runs
- [ ] Shared file touched checked from a second page — n/a: no shared app file touched; `ci.yml` gained one independent job
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item #79sqf retitled in `docs/backlog.md` on this branch (left open: its remainder is named in the title)
- [x] Design choices recorded in `docs/decisions/2026-11-11-control-activity-check.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: a developer check; no user-visible change (no control was changed)
- [x] Commit messages say why, not just what
- [x] Claims in the decision file were measured: counts and the 8-finding sample are from the run and from reading the source

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager (nothing deployed changes; CI job only)
- [ ] Timezone-sensitive behaviour — n/a: no dates
- [ ] Boundary or banding change — n/a: no boundary change
- [ ] Evidence is the tool's actual output — n/a: the gate lines above are pasted from the run
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy:` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position — n/a: nothing deployed changes; revert the PR to remove the CI job

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | 3 real faults found on /admin/website: DonationChannels, ClinicVisitEstimate, PublishedProjects show edit controls under a read-level guard | deferred to backlog (#79sqf, on the allow-list) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-11

### Manual verification

- [x] The manual list above is empty, so nothing is being signed for by a person

Manual verification by: n/a: a static check with no surface a person needs to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: release manager reads it at deploy time

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager
