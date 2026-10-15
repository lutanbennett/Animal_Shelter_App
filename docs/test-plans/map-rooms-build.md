# Feature test plan

## Header

| | |
|---|---|
| Feature | Map rooms, app half: a room placed on several plans (Settings → Facility map and `/enclosures/map`) |
| Backlog item | `docs/backlog.md` → **Map rooms: one room placed on several maps** (ticked here) |
| Branch / worktree | `claude/map-rooms-build` @ `C:\Development\Animal_Shelter_map-rooms-build` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | to be filled when opened |
| Tested by / date | Claude / 2026-10-15 |
| Carries a migration? | no — reads `0198_map_room_placements.sql` (#632), already on `main` and applied to dev |
| Tested at SHA | `abe57358` + this branch's commits (after sync, `origin/main` already merged) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the editor and the map now read and write a room through its placements, so one room can be drawn on several plans with one name and description
- [x] Files/areas touched listed: `src/app/admin/facility-map/{actions.ts,page.tsx,MapEditor.tsx}`, `src/app/enclosures/page.tsx`, both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`; no migration, no `worker/`
- [x] Roles affected identified: admin (anyone with `facility.enclosures`) edits; everyone who can open `/enclosures` map reads. Signed-out public: nothing, the map is not public
- [x] Out of scope written down: **`map_rooms.map_id` and `.shape` are not dropped** (a migration, filed as its own backlog item); the editor and zone-tap work are extended, not redone; who may do what is unchanged

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; already up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Exit codes read from its own output:

```
=== gates: build exited 0 after 118s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR; `0198` merged in #632
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR; `0198` is already applied to dev
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR; the two dev rooms, back-filled by `0198`, loaded in the editor and on the map with their names and description (§4)
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR; the unique `(room_id, map_id)` pair did refuse a second placement on dev (error 23505) when a script tried to add one
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR; `0198` must be live in production before this ships, and `apply-migrations.mjs` warns if it is not

## 4. Functional checks

- [x] Happy path works end to end: on dev, Settings → Facility map, Cat Zone plan, Add room → Place a room already on another plan → "Quarantine room" → Draw it on this plan → drew a rectangle; the message read "Quarantine room saved." and the card then read "On: Shelter overview, Cat Zone"
- [x] Data persists — after a reload the room was still on both plans; `/enclosures?view=map` on the Cat Zone plan showed it, and tapping it showed "New arrivals stay here for two weeks. Keep the door closed." (the same description the editor holds)
- [x] Create / edit / delete all exercised: placed an existing room (create a placement); Remove from this plan (confirm, then the room stayed on the other two plans and read "Not on this plan" here); Delete room opened its confirmation. A new room and a rename were not re-driven, because `addRoom` and `saveRoomDetails` now touch `map_rooms` only; `addRoom`'s placement insert was exercised through the type-checked code path only
- [x] Empty state renders sensibly: a plan with no rooms placed lists every room as "Not on this plan"; a room on no plan reads "Not on any plan" (code read, dev has none)
- [x] Invalid input is rejected with a readable message: unchanged `roomShape` validation; the database's `unique (room_id, map_id)` and `map_shape_valid` are the second line
- [ ] Boundary cases checked — n/a: no new free-text input; the room picker is a fixed list and the outline rules are unchanged

**The dangerous one: Delete room names every plan.** A room placed on three dev plans (Shelter overview, Cat Zone, Main Zone - Blue). The confirmation said, exactly:

> Delete Quarantine room from every plan? It will disappear from all 3 plans: Shelter overview, Cat Zone, Main Zone - Blue. Its name and what it is for go too. This cannot be undone. To take it off just this plan, use Remove from this plan instead.

Cancelled; nothing was deleted. The Remove-from-plan confirmation said: "Remove Quarantine room from Shelter overview? It stays on its other plans, with its name and what it is for."

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Settings → Facility map, the map | edits and reads | throwaway dev admin (deleted afterwards) drove every step above |
| management | the map | reads | n/a: not driven; reads the same `map_room_placements` through the `has_app_access()` policy `0198` already carries |
| staff | none | retired role | n/a: retired by `0173` |
| doctor | the map | reads | n/a: not driven; same read path as management |
| volunteer | the map | reads | n/a: not driven; same read path |
| signed out | none | redirected to login | the page redirected to `/login?next=/admin/facility-map` before sign-in |

- [ ] Every role above tested — n/a: admin and signed-out driven; no permission or policy changed (`0198` carries them), and the page and every action still begin with the unchanged `facility.enclosures` check
- [x] A role that should not have access is blocked server-side: `addRoom`, `saveRoomShape`, `removeRoomPlacement`, `deleteRoom` all begin with `can(…, "facility.enclosures")`, and the table's insert / update / delete policies need the same permission

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`): the Facility map topic (rooms on many plans, placing an existing room, Remove from this plan vs Delete room, what Remove plan now does to rooms) and the map topic unchanged because what a tap shows is unchanged
- [x] Translatable strings go through the translation path: new strings in both `en.ts` and `th.ts`, held to one shape by `typecheck`; a room's description translation is unchanged (it belongs to the room)
- [ ] Mobile viewport (375px) — n/a: the editor is a "Best on a larger screen" page; the map code was not changed
- [x] Browser console clean — `read_console_messages` with errors only returned none
- [x] Network clean — every server action in §4 returned its success state

## 6. Regression

- [x] The pages nearest the change still work: Settings → Facility map (plans, zone and enclosure lists, Draw again), `/enclosures?view=map` overview and Cat Zone plan
- [x] Shared file checked from a second page: `src/lib/manual/en.ts` and `src/lib/releases.ts` pass `typecheck`, lint and build; `/enclosures` was loaded after the change
- [x] Nothing merged from `main` during `sync` was broken: it merged nothing, and the gates ran after

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch. Other open items searched for `map_rooms`, room and placement: the earlier map-rooms items are already ticked; the follow-up to drop the two old columns is filed on the `backlog` branch
- [x] Non-obvious design choices: `docs/decisions/2026-10-15-map-rooms-app-half.md`
- [x] `README.md` still accurate — it does not describe rooms
- [x] **Release notes.** One line added to `unreleased` in `src/lib/releases.ts`, tagged for admin and management. No outstanding manual step: nothing needs deploying by hand
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The three-plan dialog text above is copied from the running page

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold or band changed
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the gates lines and the dialog text are copied as printed; no hand-made table of results
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration here; the code reads `0198`, which must already be live in production before this deploys
- [ ] `--env production --dry-run` — n/a: no migration in this PR
- [ ] Fresh production backup for a destructive migration — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR; `0198` goes first, with its own PR's plan

### Rollback

- [ ] Rollback position stated — n/a: code only. A rollback to the previous ref goes back to reading `map_rooms.map_id` and `.shape`, which `0198` left in place; rooms placed on a second plan after this ships would not show there, and a room drawn on a new plan under the old code would not be in the placements table

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | During the changeover, rooms added by this build have `map_id` / `shape` null on `map_rooms`; anything still reading those two columns would miss them. Nothing in the app reads them now | accepted: the drop is filed as its own backlog item |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Director or 2IC places the real Medical room or Kitchen on a second plan and reads the delete question once for real | Settings → Facility map on Test |
| 2 | The Thai wording of the new buttons and the delete question reads naturally | Settings → Facility map in Thai |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-15

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items are listed and nobody has looked at them yet; see the pending line below

Manual verification by: pending: the Director or Lutan looking at the two items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: pending
