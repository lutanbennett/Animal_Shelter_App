# Feature test plan

Filled from `docs/test-plan-template.md`. A findings-and-scoping stream: no code and no migration changed, so most lines are `n/a` with the reason, and the evidence is the measured counts in the decision file.

---

## Header

| | |
|---|---|
| Feature | `admin-role` (R6): establish what Admin still needs; scope what blocks `perm-drop-enum` |
| Backlog item | `docs/backlog.md` → Roles build, then one role at a time (not ticked) |
| Branch / worktree | `claude/admin-role` @ `C:\Development\Animal_Shelter_admin-role` |
| Dev server | not used: docs only |
| PR | linked from the PR itself |
| Tested by / date | Claude (admin-role session), 2026-10-07 |
| Carries a migration? | no (`0153` reserved, not used) |
| Tested at SHA | see the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the brief: R6 needs nothing; the real blockers for `perm-drop-enum` are recorded with counts
- [x] Files/areas touched listed: `docs/decisions/2026-10-07-admin-role.md`, `docs/roles-and-permissions.md` (one R6 paragraph), this plan. Backlog items went on the `backlog` branch (`2ba81db2`). Nothing under `src/`, `worker/` or `supabase/`
- [ ] Roles affected identified — n/a: no behaviour changes for any role
- [x] Out of scope written down: the vet conversion (blocked on Lutan's decision), `perm-convert-admin` (filed), any `/admin` routing (`management-settings-split`'s)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — ran; `origin/main` merged in and pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` (as printed)
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

Read-only queries against dev's `pg_policies`, `pg_proc`, `pg_views` and `information_schema` (throwaway script, not committed) plus the existing checks.

- [x] Happy path works end to end: `check-policy-role-names --final` GREEN; `check-permission-catalogue` and `check-home-screens` "all ok"; parity 1,926 match / 24 known / 21 mismatch, the 21 all the vet's
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete — n/a: no data written
- [ ] Empty state — n/a: no UI
- [ ] Invalid input is rejected — n/a: no input
- [ ] Boundary cases — n/a: nothing thresholded changed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no role logic changed | n/a |
| management | n/a | no role logic changed | n/a |
| staff | n/a | no role logic changed | n/a |
| vet | n/a | no role logic changed | n/a |
| volunteer | n/a | no role logic changed | n/a |
| signed out | n/a | no role logic changed | n/a |

- [ ] Every role above tested — n/a: no role logic changed
- [ ] A role that should not have access is blocked server-side — n/a: no role logic changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: none added
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page changed
- [ ] Shared file checked from a second page — n/a: no shared app file touched
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: docs only

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately not ticked; the decision §5 says why (watched tests and the vet remain)
- [x] Non-obvious design choices added as `docs/decisions/2026-10-07-admin-role.md`
- [ ] `README.md` still accurate — n/a: README does not describe the role conversion
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: no behaviour changed
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned: the 71 / 42 / 2 / 15 / 9 / 3 counts come from dev's catalogue on 2026-10-07; "Admin passes `has_permission()`" and "a trigger refuses an Admin cell" are from §6 and `0132`, not re-run here

## 8. Pre-production gate

- [ ] Tested SHA recorded and is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — n/a: docs only
- [ ] Smoke-tested on `test.lannacare.org` — n/a: docs only
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: no threshold
- [ ] Evidence pasted is the tool's actual output — n/a: no pasted evidence
- [ ] Public pages re-checked after cache purge — n/a: docs only
- [ ] `deploy: production → Supabase project` line read — n/a: docs only
- [ ] `strip-baked-env` seen — n/a: docs only
- [ ] New secret/env var in production — n/a: none
- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [x] Rollback position: revert the PR; docs only

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | 42 `admin_*` and 2 `volunteer_*` policies still read the enum; no stream owned them | deferred to backlog (`perm-convert-admin`) |
| 2 | medium | 71 vet policies (not 62); converting enforces the draft's narrowing | deferred to backlog (`perm-convert-vet`), blocked on Lutan |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Nothing for a person to look at: no UI changed. Lutan's decision is needed on the vet question in the decision file §3.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (admin-role session)  Date: 2026-10-07

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a: nothing for a person to look at

Manual verification by: n/a: no UI surface and no manual-verification items

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: pending
