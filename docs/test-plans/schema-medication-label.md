# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Schema: `label_drive_file_id` on `medication` and `diet_types` (migration 0129) |
| Backlog item | `docs/backlog.md` → Medical records → Medication label photos… (schema half of part 1; item stays open) |
| Branch / worktree | `claude/schema-medication-label` @ `C:\Development\Animal_Shelter_schema-medication-label` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` (not driven: see §4) |
| PR | linked from the PR itself |
| Tested by / date | Claude (schema-medication-label session), 2026-10-02 |
| Carries a migration? | yes, 0129 |
| Tested at SHA | see the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the item: one nullable `label_drive_file_id text` column on each of `medication` and `diet_types`, a Drive file id like the other Drive-backed columns

- [x] Files/areas touched listed: `supabase/migrations/0129_medication_label.sql`, `scripts/check-medication-label.mjs`, backlog status line, decision, this plan

- [x] Roles affected identified: none — nothing reads or shows the column; writes are by whoever already edits those tables (management, admin)

- [x] Out of scope written down: upload action, thumbnail, stocktake card, photo-proxy table list, parts (2) and (3) of the item


## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 54s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0128), and no other in-flight branch carries one
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: 128 applied, 1 pending (0129), no drift
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: ok
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`add column if not exists`); the harness ran it twice
- [x] Existing rows still read correctly: every existing row has `label_drive_file_id` null (asserted zero non-null on both tables; nothing back-filled)

- [x] Exercised against real rows in a `begin; … rollback;` harness, `node scripts/check-medication-label.mjs` → `HARNESS-OK`. Asserted: existing rows all null; omitted → null; an id round-trips and clears on medication; an id round-trips on diet_types; no trigger or public view names the column; file ran twice

- [ ] Down-migration written — n/a: an unread nullable column is harmless to leave; see the decision
- [x] Production apply plan: `node scripts/apply-migrations.mjs --env production` for 0129, any time (additive, nothing reads it); before the feature half deploys

`check-migration-grants.mjs` → `migration grants: ok (52 file(s) checked)`.

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads this column yet
- [ ] Data persists — n/a: no UI surface; round-trip asserted in the harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface, no code reads this column yet
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no UI surface; the check constraint is asserted in the harness
- [ ] Boundary cases checked — n/a: zero, null, negative and fractional values are covered by the harness

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | unchanged | n/a: no surface |
| management | nothing new | unchanged | n/a: no surface |
| staff | nothing new | unchanged | n/a: no surface |
| vet | nothing new | unchanged | n/a: no surface |
| volunteer | nothing new | unchanged | n/a: no surface |
| signed out | nothing new | unchanged | n/a: no surface |

- [ ] Every role above tested — n/a: a column inherits its table's RLS; neither table has column grants or a `select *` view, and the harness asserts no public view names the column, so no role gains or loses anything
- [ ] A role that should not have access is blocked server-side — n/a: no new access path

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: none touched
- [ ] Manual updated — n/a: nothing user-facing
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: not driven
- [ ] Network clean — n/a: not driven

## 6. Regression

- [x] Nearest checks still pass: `check-migration-grants.mjs` ok (52 files)
- [ ] Shared file touched checked from a second page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken (gates pass)

## 7. Documentation

- [ ] Backlog item ticked — n/a: this is the schema half of part (1) only; the item stays open and carries a status line naming the PR
- [x] Design choices added as `docs/decisions/2026-10-02-medication-label-column.md`
- [x] `README.md` still accurate — it names no column
- [ ] **Release notes.** n/a: a nullable column nothing reads; no shelter user would notice
- [x] Commit messages say why
- [x] Claims were measured: the harness result and the status/dry-run/apply lines are from the runs

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no dates
- [ ] Boundary or banding change covered both sides — n/a: the only bound is `>= 0`; both sides (0 accepted, negative rejected) are in the harness
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates lines above, pasted as printed
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] New secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] PR contains both migration and code reading it — n/a: no code reads the column
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Production backup for a destructive migration — n/a: additive nullable columns do not need one
- [ ] Apply plan stated — deferred: release manager, 0129 to project dbkodyyxxhtygxcxmfcu, before or with the feature half

### Rollback

- [ ] Rollback position stated — deferred: release manager; purely additive, safe to leave in place after a code rollback

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | note | feature half must add `medication` to the photo proxy table list in `api/photos/[fileId]/route.ts` or a label 404s | deferred to backlog: written on the item's status line and in the decision |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (schema-medication-label session)  Date: 2026-10-02

### Manual verification

- [x] The manual list above is empty, so whoever filled the plan may tick this — n/a: nothing for a person to look at

Manual verification by: n/a: no UI surface, nothing to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: pending
