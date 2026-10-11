# Feature test plan — drop-leftovers-schema

## Header

| | |
|---|---|
| Feature | `0184`: drop 0175's three map-room leftovers; approved room descriptions in Thai readable by every viewer; drop the four old vet views |
| Backlog item | `docs/backlog.md` → **Drop `0175`'s three map-room leftovers…** and **Drop the four read-only `vets`… views** (both ticked) |
| Branch / worktree | `claude/drop-leftovers-schema` @ `C:\Development\Animal_Shelter_drop-leftovers-schema` |
| Dev server | not started — no UI change; the Thai card needs a volunteer login (left for manual) |
| PR | pending |
| Tested by / date | Claude / 2026-10-11 |
| Carries a migration? | yes — `0184_drop_leftovers.sql` |
| Tested at SHA | see PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog items asked for — three small schema changes in one file; `map_rooms.kind` deliberately kept (the code still reads it)
- [x] Files/areas touched listed — `supabase/migrations/0184_drop_leftovers.sql`, `scripts/check-doctor-resident-scope.mjs`, `scripts/check-map-rooms.mjs`, `src/lib/releases.ts`, `docs/backlog.md`, decision file, this plan
- [x] Roles affected identified — Part B: 2IC, heads, volunteers (admin and management already read translations). Parts A and C: none
- [x] Anything explicitly **out of scope** written down — dropping `map_rooms.kind` (`actions.ts` still selects it)

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: not yet run at this commit
- [ ] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — n/a: not yet run at this commit
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — `0184` above `0183`; the brief names this as the batch's only migration
- [x] `--status` reviewed before applying — dev 183 applied, 1 pending
- [x] `--dry-run` reviewed — `0184_drop_leftovers.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0184_drop_leftovers.sql … ok`
- [x] File is re-runnable (`drop … if exists`, `drop policy if exists` then create)
- [x] Existing rows still read correctly after the change — `check-map-rooms.mjs` 44 checks green; `check-doctor-resident-scope.mjs` HARNESS-OK on dev
- [x] Constraints and defaults exercised against real rows — `check-map-rooms.mjs` (kinded rooms still insert and rename; a volunteer reads a room's approved Thai row and reads 0 approved rows of another table) and `check-doctor-resident-scope.mjs` cases N (no view or name says vet) and J (the four old names no longer resolve)
- [x] Down-migration written, or the reason one is not needed is stated — not needed: the dropped objects are unused; the vet views were read-only copies of the renamed tables
- [x] Production apply plan stated — `0184` on `dbkodyyxxhtygxcxmfcu` with the next release; the drops cannot be undone by redeploying

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI change; policy asserted in section 3
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface; room writes covered by `check-map-rooms.mjs`
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input added
- [ ] Boundary cases checked — n/a: no UI surface; the policy boundary (approved and map_rooms only) is asserted in section 3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | translations | unchanged | harness: reads |
| management | translations | unchanged | not re-run: policy unchanged |
| staff | translations | unchanged | not re-run: policy unchanged |
| doctor | translations | unchanged | not re-run: policy unchanged |
| volunteer | approved map_rooms translations only | room's approved Thai; 0 rows of other tables | harness: 1 and 0 |
| signed out | translations | none (policy is `to authenticated`) | not re-run: no grant |

- [x] Every role above tested — volunteer and admin by harness; the rest answer through unchanged policies
- [x] A role that should not have access is blocked server-side — volunteer reads 0 approved translations of other tables

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no new behaviour to document
- [ ] Translatable strings — n/a: no new strings
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work — `check-map-rooms.mjs` and `check-doctor-resident-scope.mjs` both green on dev
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched beyond the releases line
- [ ] Nothing merged from `main` during `sync` was broken — n/a: sync not yet run at this commit

## 7. Documentation

- [x] Backlog items ticked in `docs/backlog.md` on this branch
- [x] Decision file added — `docs/decisions/2026-10-11-drop-leftovers-schema.md`
- [x] `README.md` still accurate
- [x] **Release notes.** Part B is the reason for the tick: a 2IC, head or volunteer who reads Thai now sees a room's description in Thai. Parts A and C are n/a (dropping dead objects changes nothing anybody sees). `unreleased` gained a line.
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The `kind` finding comes from reading `actions.ts`; the policy from the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: not a threshold change
- [ ] **Evidence pasted into this plan is the tool's actual output** — n/a: no evidence block in this plan
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no code reads anything new; the existing enclosures page works with or without the policy
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive migration: production backup fresh — deferred: release manager
- [ ] Apply plan stated — deferred: release manager

### Rollback

- [x] Rollback position stated: the Pi rebuild reverts the app but **not** 0184. If anything outside the repo reads the four old vet views, it breaks when 0184 is applied, and only a new migration recreating them fixes it.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As a volunteer, open a room with a translated description on the map: the card shows it in Thai | `test.lannacare.org/enclosures` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-11

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: item 1

Manual verification by: pending: a volunteer-login look at one translated room card

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none found
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
