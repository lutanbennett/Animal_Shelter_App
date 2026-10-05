# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Schema: `facility_maps`, `zones.map_shape`, `enclosures.map_shape` (migration 0142) |
| Backlog item | `docs/backlog.md` → Facility → facility map (schema half; item stays open) |
| Branch / worktree | `claude/facility-map-schema` @ `C:\Development\Animal_Shelter_facility-map-schema` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` (not driven: see §4) |
| PR | linked from the PR itself |
| Tested by / date | Claude (facility-map-schema session), 2026-10-04 |
| Carries a migration? | yes, 0142 |
| Tested at SHA | see the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the item: a plan-image table plus a validated polygon column on zones and enclosures, step 1 of 3 in `docs/facility-map-scope.md`
- [x] Files/areas touched listed: `supabase/migrations/0142_facility_maps.sql`, `scripts/check-facility-maps.mjs`, backlog note, decision, this plan
- [x] Roles affected identified: none today — nothing reads or writes the new objects; once built, write is admin and management, read is any signed-in login
- [x] Out of scope written down: the map on `/enclosures`, the place-on-map editor, image upload and storage, non-resident rooms and free-roam occupancy

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 173s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is 0142: 0140 is the highest on `main`, 0141 is held by `claude/maintenance-role` (#359), and Lutan said to take 0142
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: 141 applied (including 0141 from the maintenance branch), 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: ok
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`. Note: this was before 0141 reached `main`; dev already carried 0141 from its branch, and this PR must merge after #359
- [x] File is re-runnable; the harness ran it twice in one transaction
- [x] Existing rows still read correctly: the new columns are nullable with no default, nothing back-filled
- [x] Constraints exercised against real rows in a `begin; … rollback;` harness, `node scripts/check-facility-maps.mjs` → `HARNESS-OK rejections=9`. Rejected: a 2-point shape, a coordinate of 120, a non-array shape, a shape on a Lifecycle enclosure and zone, a second plan for one zone, a zone plan without a zone, a plan for Lifecycle, a second overview. Accepted: a valid 3-point shape, a zone plan, one overview
- [ ] Down-migration written — n/a: unread additive objects are harmless to leave; see the decision
- [x] Production apply plan: `node scripts/apply-migrations.mjs --env production` for 0142 after 0141, any time (nothing reads it); before the map's step 2 deploys

`check-migration-grants.mjs` → `migration grants: ok (64 file(s) checked)`.

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these objects yet
- [ ] Data persists — n/a: no UI surface; shape round-trip asserted in the harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface, no code reads these objects yet
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no UI surface; the constraints and triggers are asserted in the harness
- [ ] Boundary cases checked — n/a: covered by the harness (3-point minimum, 0–100 range)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new in the app | unchanged | n/a: no surface |
| management | nothing new in the app | unchanged | n/a: no surface |
| staff | nothing new in the app | unchanged | n/a: no surface |
| vet | nothing new in the app | unchanged | n/a: no surface |
| volunteer | nothing new in the app | unchanged | n/a: no surface |
| signed out | nothing new | unchanged | n/a: no surface |

- [ ] Every role above tested — n/a: no code reads the table; policies (read: authenticated, write: admin and management) are reviewed by reading, not exercised per role
- [ ] A role that should not have access is blocked server-side — n/a: no new access path in the app

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: none touched
- [ ] Manual updated — n/a: nothing user-facing
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: not driven
- [ ] Network clean — n/a: not driven

## 6. Regression

- [x] Nearest checks still pass: `check-migration-grants.mjs` ok (64 files)
- [ ] Shared file touched checked from a second page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken (gates pass)

## 7. Documentation

- [ ] Backlog item ticked — n/a: this is the schema half only; the item stays open and carries a status line
- [x] Design choices added as `docs/decisions/2026-10-04-facility-maps-schema.md`
- [x] `README.md` still accurate — it names no table
- [ ] **Release notes.** n/a: tables and columns nothing reads; no shelter user would notice
- [x] Commit messages say why
- [x] Claims were measured: the harness result is from the run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no dates
- [ ] Boundary or banding change covered both sides — n/a: bounds (3 points, 0–100) are asserted both sides in the harness
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates lines above, pasted as printed
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] New secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] PR contains both migration and code reading it — n/a: no code reads the objects yet (`-- consumer: none`)
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Production backup for a destructive migration — n/a: additive, nothing dropped
- [ ] Apply plan stated — deferred: release manager, 0142 to project dbkodyyxxhtygxcxmfcu after 0141

### Rollback

- [ ] Rollback position stated — deferred: release manager; purely additive, safe to leave in place after a code rollback

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | first draft lacked Data API grants; `check-migration-grants.mjs` caught it | fixed: section 5 of the migration, applied to dev |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (facility-map-schema session)  Date: 2026-10-04

### Manual verification

- [x] The manual list above is empty, so whoever filled the plan may tick this — n/a: nothing for a person to look at

Manual verification by: n/a: no UI surface, nothing to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: pending
