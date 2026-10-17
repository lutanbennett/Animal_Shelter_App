# Feature test plan — recent-adoptions-resident-id

## Header

| | |
|---|---|
| Feature | Schema half: `resident_id` appended to `public_recent_adoptions` |
| Backlog item | Adoption success stories (consumed by PR #687) — left open |
| Branch / worktree | `claude/recent-adoptions-resident-id` @ `C:\Development\Animal_Shelter_recent-adoptions-resident-id` |
| Dev server | not started — no UI surface in this PR |
| PR | see PR list |
| Tested by / date | Claude / 2026-10-17 |
| Carries a migration? | yes — `0215_recent_adoptions_resident_id.sql` |
| Tested at SHA | branch tip |

## 1. Scope and risk

- [x] Change is described in one sentence — one trailing column on a public view
- [x] Files/areas touched listed — `supabase/migrations/0215_recent_adoptions_resident_id.sql`, decision file, this plan
- [x] Roles affected identified — anon and authenticated read the view, as before; they gain the resident id, already public via `public_resident_cards`
- [x] Out of scope written down — the link and the stories page are PR #687

## 2. Automated gates

- [x] `node scripts/gates.mjs` — run before the PR; result recorded on the PR
- [x] CI green on the PR — read from the PR status before merging

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0214) and no other schema PR is open (#686, #687 are code)
- [x] `--dry-run` reviewed — `ok`
- [x] Applied to dev (`qxkmhwybjggxvsfxsxbd`) — `applying 0215 … ok`
- [x] File is re-runnable — `create or replace view`, grants idempotent
- [x] Existing rows still read correctly — live definition restated column for column; harness on dev: columns are `id,name,species,profile_photo_drive_file_id,adopted_on,resident_id`, 3 rows, `resident_id` equals `placement_history.resident_id` for every row (rolled back)
- [x] `node scripts/check-public-views.mjs` exits 0
- [x] Down-migration not needed: additive trailing column, old code ignores it
- [x] Production apply plan — apply before PR #687 deploys; `-- consumer: src/app/adopt/HappyEndings.tsx`

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface, no code reads this column yet
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: read-only view
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: filters unchanged

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | view | unchanged | n/a — grants restated unchanged |
| management | view | unchanged | n/a — as above |
| staff | view | unchanged | n/a — as above |
| vet | view | unchanged | n/a — as above |
| volunteer | view | unchanged | n/a — as above |
| signed out | view (select) | unchanged | n/a — select to anon kept, write grants revoked |

- [ ] Every role tested — n/a: no grant or policy changed
- [ ] Blocked role blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] Nearest pages still work — the view only gains a trailing column; build gate compiles every reader
- [ ] Shared file from a second page — n/a: no app file touched
- [x] Nothing merged from `main` was broken

## 7. Documentation

- [ ] Backlog item ticked — n/a: left open, PR #687 closes it
- [x] Design choices in `docs/decisions/2026-10-17-recent-adoptions-resident-id.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: no user would notice
- [x] Commit messages say why
- [x] Claims were measured — live definition from `pg_get_viewdef`, behaviour from the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: `adopted_on` expression unchanged
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence is unedited tool output — deferred: release manager
- [ ] Public pages re-checked after cache purge — n/a: no page reads the column yet

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none

### Migration ordering

- [x] Migration and its reader in one PR? No — reader is PR #687; 0215 must reach production first
- [ ] `--env production --dry-run` clean — deferred: release manager
- [ ] Production backup — n/a: additive only
- [x] Apply plan stated — with the next release, before #687's code deploys

### Rollback

- [x] Rollback position stated — older code ignores the extra column; nothing to revert

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-17

### Manual verification

- [x] The manual list above is empty — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads this column yet

### Result

- [x] Open defects are fixed or accepted
- [ ] Checklist pasted into the PR — n/a: PR body links it
- [ ] Handed to the production release manager — n/a: through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
