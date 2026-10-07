# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | The blood-test and procedure file routes ask `medical.blood_tests` / `medical.procedures` instead of the resident-photo cell; `assertPhotoWriteAccess()` is deleted |
| Backlog item | `docs/backlog.md` → Roles build, foundation 3 (status updated, not ticked) |
| Branch / worktree | `claude/photo-routes-off-predicate` @ `C:\Development\Animal_Shelter_photo-routes-off-predicate` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` (not started: see Left for manual verification) |
| PR | linked from the PR itself |
| Tested by / date | Claude (photo-routes-off-predicate session), 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | tip of `claude/photo-routes-off-predicate` when the PR was opened |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the two routes asked `photos.resident_add`, which `0152` does not use for a blood-test or procedure attachment; each now asks its own activity, and the helper that carried the wrong name is deleted (it had no other caller)
- [x] Files/areas touched listed: `src/app/api/blood-tests/[id]/attachments/route.ts`, `src/app/api/procedures/[id]/attachments/route.ts`, `src/lib/auth/require-role.ts`, `docs/backlog.md`, `docs/decisions/2026-10-07-photo-routes-off-predicate.md`, this plan. No `worker/`, no migration
- [x] Roles affected identified: admin, management, staff unchanged (hold all three cells); `head_of_medical` and `second_in_command` hold the photo cell and no clinical cell, so are now refused before Drive instead of after; vet, volunteer, head of maintenance and public viewer are refused before and after
- [x] Out of scope written down: the clinic scope (`sees_all_clinical()`) is not repeated in the route (the vet has no cell rows yet; the database stays the authority), no third route was found, the photo split and A5 are untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in: Already up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 46s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration (`scripts/check-perm-convert-photos.mjs` already proves the database half under `c_bt` and `c_pr`, roles holding only the clinical cell)
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

The routes were **not driven in a browser** (no disposable role account was made, and the
refused-before-Drive path needs a session cookie). What was run instead: the real role cells
on dev, read from `roles` / `role_permissions`, put through the old rule (`photos.resident_add`)
and the new one (`medical.blood_tests` / `medical.procedures`):

```
head_of_medical    blood-test old allow new refuse   (and procedure)
second_in_command  blood-test old allow new refuse   (and procedure)
admin, management, staff: allow before and after; vet, volunteer, head_of_maintenance, public_viewer: refuse before and after
```

- [ ] Happy path works end to end — n/a: no browser drive; handed to the manual list below
- [ ] Data persists — n/a: the change writes nothing, it only moves the check ahead of Drive
- [ ] Create / edit / delete all exercised — n/a: attach only; no edit or delete path changed
- [ ] Empty state renders sensibly — n/a: no UI
- [ ] Invalid input is rejected with a readable message — n/a: file-type and size checks are untouched; the refusal reuses `t.photos.errors.notAuthorized`
- [ ] Boundary cases checked — n/a: the boundary is a cell present or absent, covered by the role table above

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | both routes | allowed (Admin passes `can()`) | allowed, unchanged (computed, not driven) |
| management | both routes | allowed | allowed, unchanged (computed) |
| staff | both routes | allowed | allowed, unchanged (computed) |
| vet | neither | refused (no cell rows yet, as before) | refused, unchanged (computed) |
| volunteer | neither | refused | refused, unchanged (computed) |
| signed out | neither | refused (`can(null)` is false) | refused, unchanged (by reading `can()`) |

- [ ] Every role above tested — n/a: the matrix is computed from the dev cells, not driven; see Left for manual verification
- [ ] A role that should not have access is blocked server-side — n/a: this is a server-side check, not driven end to end

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no message changed and no screen changed
- [ ] Translatable strings — n/a: the refusal message is the existing `photos.errors.notAuthorized`
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change: not loaded; the only importers of the deleted helper were these two routes (`grep assertPhotoWriteAccess src` is empty), and typecheck passed
- [ ] Shared file checked from a second page — n/a: `require-role.ts` lost one export that nothing else imported; its other exports are untouched
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates pass on the synced tree

## 7. Documentation

- [x] Backlog item status updated in `docs/backlog.md` on this branch, not ticked: foundation 3 stays open for the `*_ROLES` lists
- [x] Non-obvious design choices added as `docs/decisions/2026-10-07-photo-routes-off-predicate.md`: option 3 for the helper, the mismatch running both ways, the clinic scope left to the database
- [ ] `README.md` still accurate — n/a: it does not describe these routes' checks
- [ ] **Release notes.** n/a: the roles affected, `head_of_medical` and `second_in_command`, have no page that reaches these routes (neither can open a resident's page), and the old behaviour refused them anyway after uploading; nobody who could attach before cannot now
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions` were measured, not reasoned: the role table is from dev's `role_permissions`, and the parity counts are from `check-permission-parity.mjs`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: the only boundary is a cell present or absent, shown for every dev role above
- [ ] Evidence pasted is the tool's actual output — n/a: the role table is a script's output; the gates lines are as printed
- [ ] Public pages re-checked after cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR. No schema change, nothing persisted

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As a role holding `medical.blood_tests` / `medical.procedures` (staff or management), attach a file to a blood test and to a procedure: it uploads and appears | a resident's blood test and procedure, on `:3007` |
| 2 | As a role holding `photos.resident_add` but no clinical cell (the Head of Medical, or a disposable role), POST to either route: 403 with the "can't" message and **no file in Drive** | the same routes |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (photo-routes-off-predicate session)  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet checked by a person; the signature below is `pending` and the two checks are in the table above

Manual verification by: pending: Lutan to drive the two routes (items 1 and 2 above)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links this plan instead of pasting it
- [ ] Handed to the production release manager — n/a: release manager picks it up from section 8 and the pending signature, not at PR time

Result: pass

Release manager acknowledgement: pending
