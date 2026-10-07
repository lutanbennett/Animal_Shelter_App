# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Schema half of "Non-resident rooms on the facility map": table `map_rooms` (0157), one row per room (Medical room, Kitchen, Storage) drawn on a plan |
| Backlog item | `docs/backlog.md` → Non-resident rooms on the facility map (status note added; **not** ticked, the map half is the next PR) |
| Branch / worktree | `claude/map-nonresident-rooms` @ `C:\Development\Animal_Shelter_map-nonresident-rooms` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` (not started: no UI) |
| PR | linked from the PR itself |
| Tested by / date | Claude (map-nonresident-rooms session), 2026-10-07 |
| Carries a migration? | yes |
| Tested at SHA | see the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the item's first question was whether a non-enclosure shape needs schema; it does, so this PR is a new table `map_rooms` (plan, kind, outline) and nothing else
- [x] Files/areas touched listed: `supabase/migrations/0157_map_rooms.sql`, `scripts/check-map-rooms.mjs`, `docs/decisions/2026-10-07-map-rooms-need-a-table.md`, `docs/backlog.md`, this plan. Nothing under `src/` or `worker/`
- [x] Roles affected identified: none can see a change; the table is readable by any signed-in login and writable by admin and management, as `facility_maps` is, but nothing reads or writes it yet
- [x] Out of scope written down: drawing the rooms on the map, placing them in the admin editor, both dictionaries, the manual, the release-notes line, and what a tap on a room does (all the next PR)

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: filled in at the commit that ran it, see the gates block below
- [ ] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — n/a: filled in below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0156), and no other in-flight branch carries one (this was the only stream in its batch allowed one)
- [x] `node scripts/apply-migrations.mjs --status` reviewed: 156 applied, 0 pending, no drift against `origin/main`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `0157_map_rooms.sql … ok`
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: applied to dev at merge time, from this branch, once Lutan says to merge
- [x] File is re-runnable (`create table if not exists`, `create index if not exists`, `drop policy if exists`)
- [x] Existing rows still read correctly — nothing existing is altered: a new table only; `facility_maps` is referenced, not changed
- [x] Constraints and defaults exercised in a rolled-back harness, `node scripts/check-map-rooms.mjs`, 29 checks, RESULT: GREEN. Asserted: a kind outside medical/kitchen/storage is rejected; a null shape, a two-point shape and a point outside 0-100 are rejected; a room on a plan that does not exist is rejected; a second room of the same kind is rejected; a valid room inserts; deleting a plan deletes its rooms; any signed-in role (admin, management, staff, volunteer, vet) can read; only admin and management can insert, update or delete, the other three are refused or touch nothing; anon cannot read
- [x] Down-migration: not needed — additive; `drop table map_rooms;` undoes it, and nothing reads it yet
- [ ] Production apply plan stated — n/a: deferred to the release that ships the map half; apply `0157` to production before deploying code that reads it (additive and harmless on its own)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these columns yet; the data path is covered by the harness in §3
- [ ] Data persists — n/a: no UI surface, no code reads these columns yet
- [ ] Create / edit / delete — n/a: no UI surface; all three were exercised in the §3 harness
- [ ] Empty state — n/a: no UI surface; the table starts empty
- [ ] Invalid input rejected readably — n/a: no UI surface; the constraints reject it, asserted in §3
- [ ] Boundary cases — n/a: no UI surface; the 0-100 range and the three-point minimum were asserted in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | read, insert, update, delete | allowed | as expected (harness) |
| management | read, insert, update, delete | allowed | as expected (harness) |
| staff | read | read only | as expected (harness) |
| vet | read | read only | as expected (harness) |
| volunteer | read | read only | as expected (harness) |
| signed out | nothing | refused | as expected (harness) |

- [x] Every role above tested, in the harness under each role's own JWT
- [x] A role that should not have access is blocked server-side (RLS and grants, not a hidden control)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface, no code reads these columns yet
- [ ] Manual updated — n/a: no UI surface, no code reads these columns yet
- [ ] Translatable strings — n/a: no strings in this PR; the room labels go in both dictionaries in the map half
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: nothing existing was altered; the map and its editor do not know the table exists
- [ ] Shared file checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates below

## 7. Documentation

- [x] Backlog item status updated in `docs/backlog.md` on this branch (left open: the map half is the next PR)
- [x] Design choices recorded in `docs/decisions/2026-10-07-map-rooms-need-a-table.md`: why not an enclosure row, why not coordinates in code, why the label is not stored, why one row per kind
- [ ] `README.md` still accurate — n/a: it does not describe individual tables
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: no screen yet, the rooms appear in the next PR
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned: the access and constraint claims are from the harness; the "enclosure row would leak into lists" claim is from reading the map and enclosure code, not from running it

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager; nothing visible changes until the map half
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: the only boundaries are the 0-100 range and the three-point minimum, asserted in §3
- [ ] Evidence pasted is the tool's actual output — n/a: no deployed evidence
- [ ] Public pages re-checked after cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none added

### Migration ordering

- [ ] Migration and code in one PR? — n/a: schema only, no reader in this PR
- [ ] Production dry-run — deferred: release manager (`--env production --dry-run` before the apply)
- [ ] Production backup — n/a: additive, no rewrite
- [ ] Apply plan stated — deferred: release manager; apply 0157 to production before the deploy that carries the map half

### Rollback

- [x] Rollback position: purely additive schema is safe to leave; nothing reads it, so reverting the PR needs no migration undo. If it must go, `drop table map_rooms;`

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Nothing here has a surface a person could look at: there is no screen, and the behaviour is asserted in the §3 harness.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (map-nonresident-rooms session)  Date: 2026-10-07

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI or visual surface; the behaviour is a table, asserted in the §3 harness

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the release manager reads it from the PR before the deploy that carries this migration

Result: pass

Release manager acknowledgement:
