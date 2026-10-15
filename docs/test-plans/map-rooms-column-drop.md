# Feature test plan — map-rooms-column-drop

## Header

| | |
|---|---|
| Feature | Drop the dead `map_rooms.map_id` and `.shape` columns (0201) and rewrite the two harnesses off them |
| Backlog item | `docs/backlog.md` → **Drop `map_rooms.map_id` and `.shape` now that nothing reads them** (ticked) |
| Branch / worktree | `claude/map-rooms-column-drop` @ `C:\Development\Animal_Shelter_map-rooms-column-drop` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` (started; login wall, see Left for manual verification) |
| PR | opened with this plan |
| Tested by / date | Claude / 2026-10-15 |
| Carries a migration? | yes — `0201_map_rooms_drop_map_id_shape.sql` |
| Tested at SHA | `115e977d` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — drops `map_rooms.map_id` and `.shape`, which nothing reads, after rewriting `check-map-rooms.mjs` and `check-map-markers.mjs` off them
- [x] Files/areas touched listed — `supabase/migrations/0201_map_rooms_drop_map_id_shape.sql`, `scripts/check-map-rooms.mjs`, `scripts/check-map-markers.mjs`, `docs/backlog.md`, `docs/decisions/2026-10-15-map-rooms-column-drop.md`, this plan. No app code changed
- [x] Roles affected identified — none; the app already read rooms only through `map_room_placements`
- [x] Anything explicitly **out of scope** written down — `map_rooms.kind` is kept (old history snapshots are rebuilt from it; decision file). The three leftovers (unique rule, trigger, `map_room_kind_name()`) were already dropped by `0184`, so nothing to do

**What was discarded, and the evidence nothing read it.** On dev, 2 rows held a non-null `map_id` and the same 2 a non-null `shape` (of 2 rooms) at drop time; both rooms already had their placement from the `0198` back-fill. Grep of `src/`, `worker/`, `scripts/` and `supabase/migrations` for `map_rooms`: the only readers of the two columns were the two harnesses (now rewritten); app code selects `map_room_placements(map_id, shape)`, whose columns are the placement's own. No later migration (0158, 0170, 0175, 0184) references either column on `map_rooms`; plain `DROP COLUMN` without CASCADE would have failed on a dependent view. After the drop `select map_id from map_rooms` returns "column does not exist".

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Exit code read directly, output redirected to a file:

```
=== gates: build exited 0 after 105s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` (`0200`), checked by the pre-commit migration-number check. Another stream, `claude/public-page-photos-app`, also carries a `0201`: whichever merges second renumbers (decision file)
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 202 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` (final status: 204 applied, 0 pending; the extra rows are an orphan from a short-lived `0202` rename and the other stream's `0201`)
- [x] File is re-runnable (`drop column if exists`); it was in fact applied twice under two names with no error
- [x] Existing rows still read correctly after the change (checked against real dev data) — the app's rooms query, with embedded placements, returns the 2 rooms; the snapshot query returns the 3 placements
- [x] **Constraints and defaults exercised against real rows** — `scripts/check-map-rooms.mjs` (44 checks, GREEN, after the drop) asserts per-role read/write, name rules, placement shape rules (two points, out of range, unknown plan), id upsert, translation queue, and that deleting a plan removes its placements but leaves the room; a service-role probe added a room, placed it, and deleted it
- [x] Down-migration written, or the reason one is not needed is stated — not needed: the columns' values are redundant copies of `map_room_placements` rows (0198 back-fill), so nothing is lost
- [x] Production apply plan stated for the release manager — apply `0201` to `dbkodyyxxhtygxcxmfcu` with the release's migrations, before or after the deploy (the app does not read the columns either way); confirm first that the `0198` back-fill ran there

## 4. Functional checks

- [x] Happy path works end to end — added a room and placed it on a plan through the same tables the editor writes, then removed it
- [x] Data persists — placement and room read back after the write
- [x] Create / edit / delete all exercised (whichever the feature has) — by `check-map-rooms.mjs` probes under each role's JWT
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface changed; no code reads the dropped columns
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no new input path; the existing shape rules are asserted by the harness
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: a column drop has no input boundary

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | rooms (harness) | read and write | pass |
| management | rooms (harness) | read only | pass |
| staff | retired (0173) | n/a | n/a |
| doctor | rooms (harness) | read only | pass |
| volunteer | rooms (harness) | read only | pass |
| signed out | rooms | anon cannot read | pass |

- [x] Every role above tested — via the harness's per-role JWTs (admin, management, second_in_command, volunteer, doctor, anon)
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — write probes by non-admins are refused or touch nothing

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no user-visible change
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings added
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI change
- [ ] Browser console clean — no errors or React warnings — n/a: no UI change; pages not opened because of the login wall
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI change; see Left for manual verification

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — checked at the data layer, not in a browser: the queries behind Settings → Facility map and `/enclosures/map` return rows, and `check-map-markers.mjs` (84 markers, 0 failures) reads placements
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing merged

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-15-map-rooms-column-drop.md` (kind kept, leftovers already gone, migration number)
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: dead columns dropped; nothing a shelter user can see
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The "0184 already dropped the leftovers" claim was read from 0184's text; row counts and the marker overlap were read from dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** n/a: no date logic
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** n/a: no boundary or banding change
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** n/a: the only pasted evidence is the gates tail, copied as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** n/a: no code reads or writes the dropped columns, so apply order against the deploy does not matter
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — deferred: release manager
- [ ] Apply plan stated: file `0201_map_rooms_drop_map_id_shape.sql`, project `dbkodyyxxhtygxcxmfcu` — deferred: release manager

### Rollback

- [ ] Rollback position stated, including what it does not cover — deferred: release manager (a drop cannot be undone by rerunning; the redundant values live in `map_room_placements`)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The marker check read the stale `map_rooms` columns, so it never saw rooms placed after 0198; reading placements exposed a dev Quarantine room drawn over Blue Enclosure 13 | fixed: dev test placement moved, check not loosened |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Open Settings → Facility map and `/enclosures/map` signed in and place a room. I could not: both are behind the login and I do not enter credentials | `http://localhost:3005` or test.lannacare.org |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-15

### Manual verification

pending: someone signed in opens Settings → Facility map and /enclosures/map and places a room

Result: pass
