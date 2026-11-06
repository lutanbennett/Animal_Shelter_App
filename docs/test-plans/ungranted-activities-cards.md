# Feature test plan

## Header

| | |
|---|---|
| Feature | A card, `project_folders` ("Look after project folders"), granting `projects.folders` at edit and nothing else; the other three ungranted activities are recorded, not built |
| Backlog item | `docs/backlog.md` → #wdjt0 |
| Branch / worktree | `claude/ungranted-activities-cards` @ `C:\Development\Animal_Shelter_ungranted-activities-cards` |
| Dev server | `http://localhost:3007` |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude (automated), 2026-11-06 |
| Carries a migration? | yes: 0323 |
| Tested at SHA | 7b93fe38 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: one card for `projects.folders` edit; `maintenance.photos` already on `do_maintenance`, so Lutan ruled no new card
- [x] Files/areas touched listed: `0323`, `cards.ts`, both dictionaries, `check-cards-count.mjs`, `cards.test.mjs`, `gen-card-walkthrough.mjs`, `docs/card-walkthrough.md`, a decision file, the backlog tick
- [x] Cards affected identified: `project_folders` is new; `donations_receipts` (projects.folders at read) unchanged; no role is given the card; Admin unaffected
- [x] Out of scope written down: giving any role the card, `projects.photos`, `projects.publish`, and the mirror check (an activity held by no card)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` four gates, all zero:

```
=== gates: typecheck exited 0 after 151s
=== gates: lint exited 0 after 361s
=== gates: test exited 0 after 64s
=== gates: build exited 0 after 285s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` (0323 after 0322)
- [x] `--status` reviewed (323 applied, 1 pending before apply)
- [x] `--dry-run` reviewed: ok
- [x] Applied to **dev** and recorded in `schema_migrations`
- [x] File is re-runnable (`on conflict do update`)
- [ ] Existing rows still read correctly — n/a: no existing row changes
- [x] Constraints exercised: the file's own assertions ran in the apply, and `check-card-grants.mjs` passed after it (79 roles hold what their cards require)
- [ ] Down-migration written — n/a: additive; delete the two rows to undo
- [x] Production apply plan: 0323 must be applied to production before the card can be given out; Lutan's step

## 4. Functional checks

- [x] Happy path works end to end: one-card login, tile drawn, `/projects` opens, New folder drawn inside a category
- [ ] Data persists — n/a: no write was pressed; the actions are unchanged
- [ ] Create / edit / delete all exercised — n/a: no action code changed
- [ ] Empty state renders sensibly — n/a: no list changed
- [ ] Invalid input is rejected — n/a: no input added
- [ ] Boundary cases checked — n/a: none

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | unchanged | not re-driven, unchanged short-circuit |
| exactly `project_folders` | Home tile, `/projects`, category page | tile drawn, no read-only note, New folder drawn | confirmed on dev |
| signed out | `/projects` | refused | n/a: no routing change |

- [x] Every login that matters tested (the new card driven; others unchanged)
- [ ] A login without access is blocked server-side — n/a: the policies and actions still ask projects.folders, untouched

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: the tile comes from the card's `opens`
- [ ] Manual updated — n/a: no topic describes this card yet
- [x] Translatable strings: name and description in en.ts and th.ts (Thai unreviewed)
- [ ] Mobile viewport (375px) — n/a: no layout changed
- [ ] Browser console clean — n/a: not read
- [ ] Network clean — n/a: not read

## 6. Regression

- [x] Pages nearest the change still work: Home and `/projects` loaded for the card login
- [ ] Shared file touched checked from a second page — n/a: dictionaries only gained keys, and the build and typecheck passed
- [x] Nothing merged from main was broken (nothing to merge)

## 7. Documentation

- [x] Backlog item ticked on this branch
- [x] Decision file: `docs/decisions/2026-11-06-ungranted-activities-cards.md`
- [x] README still accurate
- [ ] **Release notes.** n/a: needs 0323 applied to production; wording is drafted in the decision file
- [x] Commit messages say why
- [x] Claims were measured: the do_maintenance grant was read in jobs.ts and 0257, and the one-card login was driven

## 8. Pre-production gate

- [ ] Tested SHA recorded and tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no threshold
- [ ] Evidence pasted is the tool's actual output — n/a: the only pasted evidence is the gates block, copied from the run
- [ ] Public pages re-checked — n/a: no public page changed
- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] New secret or env var in production — n/a: none
- [ ] Both a migration and code that reads it — deferred: release manager; yes, apply 0323 to production before the deploy
- [ ] `--env production --dry-run` clean — deferred: release manager
- [ ] Backup for a destructive migration — n/a: additive
- [ ] Apply plan stated — deferred: release manager; 0323 to production, before the deploy
- [ ] Rollback position stated — deferred: release manager; additive schema is safe to leave

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | info | Brief said no card grants maintenance.photos; do_maintenance does (jobs.ts:108) | Lutan asked; no card built |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Thai wording of the card name and description | /management/translations |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-06

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: someone who reads Thai

Manual verification by: pending: Thai wording review

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR opens
- [ ] Handed to the production release manager — pending: after merge

Result: pass

Release manager acknowledgement: pending: release manager
