# Test plan: resident-picker-floor

## Header

| | |
|---|---|
| Feature | resident-picker-floor |
| Backlog item | `docs/backlog.md` → The resident picker is empty for Admin and Management |
| Branch / worktree | `claude/resident-picker-floor` @ `C:\Development\Animal_Shelter_resident-picker-floor` |
| Dev server | not run |
| PR | opened after this commit |
| Tested by / date | Claude / 2026-10-13 |
| Carries a migration? | yes |
| Tested at SHA | 05e2e47f |

## 1. Scope and risk

- [x] Change is described in one sentence: resident_who_and_where now also answers roles that read every resident (0192), matching the backlog item
- [x] Files touched: supabase/migrations/0192, three scripts/check-*.mjs, src/lib/releases.ts, docs
- [x] Roles affected: admin and management gain rows; 2IC, volunteer, heads unchanged; doctor, public viewer, signed-out still refused
- [x] Out of scope: other on_volunteer_floor() uses are all "not floor" or email blanking, left alone (see decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends as pasted below

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration 0192 is one above the highest on main (0191)
- [x] `--status` reviewed before applying
- [x] `--dry-run` reviewed
- [x] Applied to dev and recorded in schema_migrations
- [x] File is re-runnable (create or replace view, grant)
- [x] Existing rows still read correctly: check-medical-jobs and check-2ic-role read the view for volunteer and 2IC after the change
- [x] Asserted per login on dev by the check scripts: admin, management, 2IC, volunteer allowed; doctor and no-role refused
- [x] Down-migration: restore the 0180 body, stated in the file header
- [ ] Production apply plan — deferred: release manager (file 0192, project dbkodyyxxhtygxcxmfcu, before the deploy)

## 4. Functional checks

- [ ] Happy path end to end — n/a: no app code changed; the scripts above prove the view per role, a person has not opened the pages
- [ ] Data persists — n/a: read-only view
- [ ] Create / edit / delete — n/a: read-only view
- [ ] Empty state — n/a: no UI change
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: filter is a boolean OR of two existing functions

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | view | rows | allowed (check-medical-jobs, check-2ic-role) |
| management | view | rows | allowed |
| staff | n/a | retired | n/a: retired 0173 |
| doctor | view | none | refused |
| volunteer | view | rows | allowed, unchanged |
| signed out | view | none | refused (no grant to anon; norole refused) |

- [x] Every role above tested
- [x] A role that should not have access is blocked server-side (queried as that login's JWT)

## 5. Cross-cutting

- [ ] Nav entry — n/a: none changed
- [ ] Manual — n/a: no behaviour users read about changed
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI change
- [ ] Browser console — n/a: browser not driven
- [ ] Network — n/a: browser not driven

## 6. Regression

- [x] Nearest pages: volunteer/2IC reads of the view re-run in check-2ic-role and check-volunteer-narrowing, same results as before
- [ ] Shared file touched — n/a: only releases.ts, gained one line
- [x] Nothing merged from main during sync was broken (gates green after sync)

## 7. Documentation

- [x] Backlog item ticked on this branch
- [x] Decision file docs/decisions/2026-10-13-who-and-where-for-all-residents-readers.md
- [x] README.md still accurate
- [x] **Release notes.** `unreleased` gained a line for Admin and Management
- [x] Commit messages say why
- [x] Claims were measured: row access per role came from the check scripts' output, not reasoning

## 8. Pre-production gate

- [ ] Tested SHA is tip of main at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary or banding change — n/a: not a threshold
- [ ] Evidence pasted is actual output — n/a: only the gates line, pasted as printed
- [ ] Public pages re-checked — n/a: view not used on public pages
- [ ] deploy line project ref — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Migration and reading code together — n/a: no code reads anything new; the pages already read this view
- [ ] Production dry-run — deferred: release manager
- [ ] Backup for destructive migration — n/a: replaces a view body only
- [ ] Apply plan stated — deferred: release manager (0192 to production, any time before or with the deploy)
- [ ] Rollback — n/a: restore the 0180 view body; no data changed

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Pre-existing reds untouched: cells role_permissions (medical-jobs), change a delivery (2ic-role), read translations and functions-that-say-volunteer (volunteer-narrowing) | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As Admin and as Management the resident list shows on Add Medical Photos and Record Weight | dev |

## Sign-off

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-13

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: someone opens the two pages as Admin and Management

Manual verification by: pending: picker on the two pages as Admin and Management

Result: pass

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this file
- [ ] Handed to the production release manager — n/a: handed over when the PR is merged
