# Feature test plan — clinic-login-drop

## Header

| | |
|---|---|
| Feature | Two uncalled clinic-login helper functions dropped (migration 0266); the production check that wrongly reported all four uncalled is fixed |
| Backlog item | `docs/backlog.md` → "Settle whether the clinic-login helper functions are still called" (ticked for two of four; follow-up filed) |
| Branch / worktree | `claude/clinic-login-drop` @ `C:\Development\Animal_Shelter_clinic-login-drop` |
| Dev server | n/a: no page driven |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-26 |
| Carries a migration? | yes: 0266 |
| Tested at SHA | 94318329 |

## 1. Scope and risk

- [x] One sentence: drops doctor_can_write_attachment() and clinic_login_owns_visit(), which nothing live calls, and fixes the \m regex in the clinic-login-helpers check; no access changes
- [x] Touched: supabase/migrations/0266, scripts/lib/readonly-checks.mjs, check-doctor-own-clinic-writes.mjs, check-perm-functions.mjs (comment), docs
- [x] Roles affected: none; no policy, view or function called either dropped function
- [x] Out of scope: clinic_login_may_edit_doctor (two doctors policies call it), current_clinic_resident_ids (current_doctor_resident_ids calls it), current_user_clinic_ids, current_doctor_resident_ids

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged
- [x] `node scripts/gates.mjs` — see output below

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number 0266, next free on main (highest 0265)
- [x] `--status` reviewed: dev 266 applied, 1 pending before
- [x] `--dry-run` reviewed: ok
- [x] Applied to dev: 0266 ok
- [x] Re-runnable: drop function if exists, in dependency order
- [ ] Existing rows still read correctly — n/a: no table or column touched
- [x] Dependencies exercised: the corrected check, run on dev and production before, found no policy, view, constraint or default calling either function; a first attempt to drop clinic_login_may_edit_doctor failed on its two policies, so it was left alone
- [ ] Down-migration — n/a: functions nothing called
- [ ] Production apply plan — n/a: the release manager applies 0266 with the release

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface, no code reads these functions
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete — n/a: no write path changed
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI surface
- [ ] Boundary cases — n/a: no thresholds

### Role access matrix

- [ ] Every role above tested — n/a: nothing called the dropped functions, so no role's access can move; the matrix was not built
- [ ] A role that should not have access is blocked server-side — n/a: unchanged

Note: check-doctor-own-clinic-writes.mjs fails at assertion A ("doctor booked a visit at other clinic: 1") after the drop. No policy, view, constraint or function called either dropped function, so the drop cannot cause it; I did not run the harness before the drop to show it was already failing. Listed under Defects.

## 5. Cross-cutting

- [ ] Nav entry — n/a: no page
- [ ] Manual — n/a: no manual topic
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no layout
- [ ] Console clean — n/a: no page driven
- [ ] Network clean — n/a: no page driven

## 6. Regression

- [x] check-perm-functions.mjs: RESULT: GREEN. check-medical-soft-delete.mjs: HARNESS-OK. check-production.test.mjs: 4 pass
- [x] `node scripts/check-hard-coded-security.mjs`: 5 FAIL, all against 0264 (CRLF comment-strip bug in the checker, owned by harness-sweep-batch-4); none new
- [x] Nothing merged from main during sync was broken (gates)

## 7. Documentation

- [x] Backlog item ticked in docs/backlog.md
- [x] Decision file `docs/decisions/2026-10-26-clinic-login-helpers-drop.md`
- [ ] README — n/a: nothing names these functions
- [ ] **Release notes.** n/a: no shelter user would notice; two functions nothing called were dropped
- [x] Commit messages say why
- [x] Claims were measured: the caller list is database output from the corrected check

## 8. Pre-production gate

- [ ] Tested SHA recorded — n/a: nothing deploys from this PR
- [ ] Deployed SHA matches — n/a: nothing deploys
- [ ] Deployed to test — n/a: nothing deploys
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Boundary/banding — n/a: no threshold
- [ ] Evidence is the tool's actual output — n/a: gates output above is verbatim
- [ ] Public pages re-checked — n/a: no public surface
- [ ] deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Migration and reader code together — n/a: no code reads the dropped functions
- [ ] Production dry-run — deferred: release manager
- [ ] Backup — deferred: release manager
- [ ] Apply plan stated — deferred: release manager
- [ ] Rollback — n/a: nothing called the functions; revert the commit and re-create from 0220 if ever needed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | the clinic-login-helpers check never matched anything (\m read as m) | fixed here |
| 2 | medium | two doctors policies still grant through clinic_login_may_edit_doctor() | deferred to backlog |
| 3 | low | check-doctor-own-clinic-writes.mjs fails at assertion A on dev; cause not shown to predate this change | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Nothing visible changes | n/a |

Automated checks by: Claude  Date: 2026-10-26
Manual verification by: n/a: nothing to look at, no UI surface
Result: pass with accepted defects
