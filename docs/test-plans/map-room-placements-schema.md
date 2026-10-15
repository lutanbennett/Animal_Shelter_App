# Feature test plan — map-room-placements-schema

## Header

| | |
|---|---|
| Feature | Schema half of "one room placed on several maps": `map_room_placements`, back-filled from `map_rooms` |
| Backlog item | `docs/backlog.md` → **Map rooms: one room placed on several maps** (left open, status note added) |
| Branch / worktree | `claude/map-rooms-schema` @ `C:\Development\Animal_Shelter_map-rooms-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number assigned when opened |
| Tested by / date | Claude / 2026-10-15 |
| Carries a migration? | yes — `0198_map_room_placements.sql` |
| Tested at SHA | `937c6c8a` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — part (1) only: the placements table, its policies and the back-fill
- [x] Files/areas touched listed — `supabase/migrations/0198_map_room_placements.sql`, `scripts/check-app-access-gate.mjs` (table added), `scripts/check-map-rooms.mjs` (null shape no longer asserted refused), `docs/backlog.md` (status note), `docs/decisions/2026-10-15-map-rooms-are-placed-not-owned.md`, this plan
- [x] Roles affected identified — none see a change; nothing reads the table. Read is behind the app-access gate, writes on `facility.enclosures`, as `map_rooms`
- [x] Anything explicitly **out of scope** written down — the editor, the map and dropping `map_rooms.map_id` / `shape` are the app half and a later file

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date with `origin/main`
- [x] `node scripts/gates.mjs` ends clean:

```
=== gates: build exited 0 after 148s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — `0198` against `0197`; `check-migration-numbers` ok
- [x] `node scripts/apply-migrations.mjs --status` reviewed — dev 198 applied, 1 pending, no drift
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded — `applying 0198_map_room_placements.sql … ok`
- [x] File is re-runnable — `if not exists` / `drop … if exists` / back-fill `on conflict do nothing`
- [x] Existing rows still read correctly — `map_rooms` untouched apart from two columns losing `not null`; `check-map-rooms.mjs` 43 checks green
- [x] **Constraints and defaults exercised against real rows** — back-fill measured on dev: `select count(*) from map_rooms` = **2** before; after, `map_room_placements` = **2**, and 0 rooms lack a placement with the same map and shape. Policies read back from `pg_policies`: read `private.has_app_access()`; insert / update / delete `has_permission('facility.enclosures')`, identical to `map_rooms`
- [x] Down-migration written, or the reason one is not needed — not needed: additive; old code ignores the table and still writes the old columns
- [x] Production apply plan stated — `0198` on `dbkodyyxxhtygxcxmfcu` with the next release; `-- consumer: none`, so any time before the app half deploys; compare production room and placement counts on apply

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: no UI surface, no code reads these columns yet
- [ ] Create / edit / delete all exercised — n/a: no UI surface, no code reads these columns yet
- [ ] Empty state renders sensibly — n/a: no UI surface, no code reads these columns yet
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI surface, no code reads these columns yet
- [ ] Boundary cases checked — n/a: no UI surface, no code reads these columns yet

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | placements | read and write | n/a — policy text compared to `map_rooms`, nothing reads it yet |
| management | placements | read | n/a — as above |
| staff | retired | n/a | n/a — retired in `0173` |
| vet | placements | read | n/a — as above |
| volunteer | placements | read | n/a — as above |
| signed out | nothing | nothing | n/a — table is `to authenticated` only; `check-app-access-gate.mjs` HARNESS-OK |

- [ ] Every role above tested — n/a: no UI surface; policies read back and identical to `map_rooms`, the gate check lists the table
- [ ] A role that should not have access is blocked server-side — n/a: `check-app-access-gate.mjs` HARNESS-OK (archived, roleless, public_viewer, anon read nothing)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface, no code reads these columns yet
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — `check-map-rooms.mjs` 43 green; build compiles every reader of `map_rooms`
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing merged

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: left open on purpose; status note added. Searched `map_rooms` / `facility_maps`: no other open item is closed
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-15-map-rooms-are-placed-not-owned.md`
- [x] `README.md` still accurate — it does not mention these tables
- [ ] **Release notes.** — n/a: no UI surface and no code reads these columns yet
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — counts and policies read from dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; `-- consumer: none`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only
- [x] Apply plan stated — with the next release, before the app half deploys

### Rollback

- [x] Rollback position stated — older code ignores the table and still uses the old columns; nothing to revert

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `check-map-rooms.mjs` went red: it asserted a null shape is refused, which dropping `not null` makes false | fixed — assertion removed, 43 green |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-15

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads these columns yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
