# Feature test plan

## Header

| | |
|---|---|
| Feature | `0158_map_rooms_permission.sql`: `map_rooms` writes ask `facility.enclosures` Edit instead of naming admin and management |
| Backlog item | `docs/backlog.md` → the `0157_map_rooms` policy item ticked; the volunteer/vet read item stays open with a status line |
| Branch / worktree | `claude/policy-cells-0158` @ `C:\Development\Animal_Shelter_policy-cells-0158` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened from this branch; the number is recorded in the follow-up commit |
| Tested by / date | Claude (automated) / 2026-10-07 |
| Carries a migration? | yes: `0158_map_rooms_permission.sql` |
| Tested at SHA | the branch tip at the commit that adds this plan |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: three policies replace one role-named policy, with the same cell `facility_maps` uses
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0158_map_rooms_permission.sql`, `docs/backlog.md`, one decision file, this plan; no app code
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: admin keeps the write; management loses a hand-made write the page never offered; staff, vet, volunteer and public unchanged (read only)
- [x] Anything explicitly **out of scope** written down: the vet half of the volunteer/vet item (parked, `perm-convert-vet`), wiring the checker into `gates.mjs` (`policy-enum-guard`), C12, C2 and C3 of the audit (reported on the backlog item)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run before the PR opened
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — run before the PR opened
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `main` at `0157`, this is `0158`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `157 applied, 0 pending` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0158_map_rooms_permission.sql … ok`
- [x] Applied to **dev** and recorded in `schema_migrations`: `applying 0158_map_rooms_permission.sql … ok` (applied early because the checker reads the dev database)
- [x] File is re-runnable: `drop policy if exists` before every `create policy`
- [ ] **Constraints and defaults exercised against real rows** — n/a: no table, column or row changed; the resulting policies were read back from `pg_policies` (insert/update/delete ask `has_permission('facility.enclosures')`, read still `true`)
- [x] Down-migration written, or the reason one is not needed is stated: not written; reverse by dropping the three `_perm` policies and recreating `management_rw_map_rooms` as in `0157`
- [x] Production apply plan stated for the release manager: `0158` to production after `0157`; nothing in the app reads it differently

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; the page's actions already checked `facility.enclosures`
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface; one policy per command
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected — n/a: no UI surface, no constraint changed
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | write rooms | no change | policy asks the cell; admin holds it |
| management | read rooms | loses hand-made write | holds `facility.enclosures` Read only |
| staff / vet / volunteer | read rooms | no change | read policy untouched |
| signed out | nothing | no change | no grant to `anon` |

- [ ] Every role above tested under its own JWT — n/a: read from `pg_policies` and the role grants, not exercised with a JWT; `check-policy-role-names` and `check-app-access-gate` ran instead
- [x] A role that should not have access is blocked server-side: `check-app-access-gate` ends `HARNESS-OK` (public_viewer and archived read 0 internal rows)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no string added
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work: not rendered; `/admin/facility-map` checks the same cell, unchanged
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing app-side changed

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch; the volunteer/vet item carries a status line
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-07-map-rooms-permission.md`
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [ ] **Release notes.** n/a: no shelter user would notice; Management never had a screen that writes rooms
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned.** The GREEN result is the checker's output; the volunteer finding is a query of `pg_policies` and `role_permissions` on dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change covers both edges** — n/a: no boundary or banding
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked — n/a: no public view touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` line seen — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** n/a: no code change
- [ ] `--env production --dry-run` run and clean — deferred: Lutan
- [ ] Destructive migration backup — n/a: only policies are replaced
- [x] Apply plan stated: see §3

### Rollback

- [x] Rollback position stated: no Worker change; undo by recreating `management_rw_map_rooms` from `0157`. It does not undo anything done meanwhile

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | Volunteer/vet read item: vet half still open (C10); C12 `resident_list_view` still grants write privileges to `authenticated`, and C2 `residents_admin_delete` still exists | deferred to backlog: status line on the item |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Nothing on screen changes; no check left for a person | n/a |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: nothing is visible to look at

Manual verification by: n/a: no UI surface, a database policy only

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut
