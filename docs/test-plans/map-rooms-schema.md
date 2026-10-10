# Feature test plan — map-rooms-schema

## Header

| | |
|---|---|
| Feature | Schema half of map rooms: a stored name (`name` / `name_th`) and a `description` on `map_rooms`, and the fixed list of three rooms goes |
| Backlog item | `docs/backlog.md` → **Map rooms: add more rooms, and give each a description of what it is for, shown when it is tapped on the map** (left open, status note added) |
| Branch / worktree | `claude/map-rooms-schema` @ `C:\Development\Animal_Shelter_map-rooms-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | opened from `claude/map-rooms-schema` |
| Tested by / date | Claude / 2026-10-10 |
| Carries a migration? | yes — `0175_map_rooms_names_and_descriptions.sql` |
| Tested at SHA | `3ee0e73b` (after sync with `origin/main` `8fcb6835`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — part (1) of the item, with the name columns folded in as it asks: rooms get a stored bilingual name and a translatable description, and are no longer limited to three
- [x] Files/areas touched listed — `supabase/migrations/0175_map_rooms_names_and_descriptions.sql`, `docs/backlog.md` (status note), `docs/decisions/2026-10-10-map-rooms-names-and-descriptions.md`, this plan
- [x] Roles affected identified — none see a change: no screen reads the new columns yet, and no policy or grant on `map_rooms` changed (reads `0170`, writes `0158`). The two new functions are revoked from `anon`
- [x] Anything explicitly **out of scope** written down — the Add room / Rename / Delete editor, the description box and TranslationPanel, the room card, the dictionaries, the manual and the releases line are the next batch's `map-rooms-editor` stream. `roomKinds` is untouched (it still has callers)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` `8fcb6835` merged in cleanly (the 0.24.0 release record and `releases.ts`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Exit code read directly, output redirected to a file:

```
=== gates: build exited 0 after 201s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: read from the PR status before merging, not yet run when this plan was written

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs`: ok, `0175` against highest `0174`; the brief names this as the batch's only migration slot
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 174 applied, 1 pending (`0175`)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — first run flagged two new functions without `revoke ... from public, anon` (the grants lint); revokes added, dry-run `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0175_map_rooms_names_and_descriptions.sql … ok`; `--status`: 175 applied, 0 pending; the one row with no file on `origin/main` is `0175` itself, expected until merge
- [x] File is re-runnable — the harness ran the whole file **twice** in one transaction, before applying, and again against the applied database; both `HARNESS-OK`
- [x] Existing rows still read correctly after the change — dev has no rooms drawn, so the back-fill was exercised by a rolled-back transaction that inserted the three legacy rooms nameless and ran the file: result `Kitchen / ครัว`, `Medical room / ห้องพยาบาล`, `Storage / ห้องเก็บของ`, three named rows. After the real apply, `select count(*) from map_rooms where name is null` = 0
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev. Asserted: today's kind-only upsert (insert and conflict path, as `saveRoom` sends it) names the room in both languages; a second `medical` refused (`unique_violation`, the live upsert still has its constraint); a non-legacy kind accepted when named; several kind-less named rooms accepted; a room with no name and no kind refused (`not_null_violation`); a description queued one `translations` row; `private.translation_queue` labels it `Map room · Quarantine` with path `/admin/facility-map`; the name recorded in `label_sources`; deleting the room removed its translation and label source. Result: `HARNESS-OK all assertions held`
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive for every reader. Columns are added, a check is dropped, `kind` loses not-null; `name` gains not-null only after every existing row is named and a trigger names any row today's app writes. Old code reads `kind` and `shape`, both unchanged
- [x] Production apply plan stated for the release manager — `0175` on `dbkodyyxxhtygxcxmfcu` with the next release, any time before `map-rooms-editor` deploys. The consumer header names that stream's paths, so `apply-migrations.mjs` warns (never blocks) that the reader is not live yet: expected

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: no UI surface; writes and reads of the columns asserted in §3's harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; insert, upsert and delete exercised in §3's harness
- [ ] Empty state renders sensibly — n/a: no UI surface; a null description is every room's state today
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input yet; the database refusals are asserted in §3
- [ ] Boundary cases checked — n/a: no UI surface; nameless, duplicate legacy kind and unknown kind are in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `map_rooms` | unchanged | n/a — no policy or grant changed |
| management | `map_rooms` | unchanged | n/a — as above |
| second_in_command / heads | `map_rooms` | unchanged | n/a — as above |
| volunteer | `map_rooms` read | unchanged | n/a — as above |
| signed out | nothing | nothing | n/a — new functions revoked from anon; table policies unchanged |

- [ ] Every role above tested — n/a: no policy and no grant on `map_rooms` changed; the two new functions are revoked from `public` and `anon` (grants lint `ok`)
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet; the Map and Facility map topics are the editor stream's
- [ ] Translatable strings go through the translation path — n/a: no UI strings. The data itself is registered: `description` in `translatable_fields`, `name` in `translatable_labels`
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — Settings → Facility map's room save was the one at risk; its exact write (`upsert` on `kind` with no name) is asserted in §3 to still succeed, and the build gate compiles every reader of `map_rooms`
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched; `private.translation_queue` was re-created from its live definition (`pg_get_viewdef` on dev matched `0166`) with one branch added to each CASE
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync brought the 0.24.0 release record only; gates ran after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open, as the brief says (part 1 of 3); a STATUS note says what `0175` contains and what the editor stream must do. Searched the backlog for `map_rooms`, `roomKinds` and map room: the other hits are already-ticked items, and none open is closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-10-map-rooms-names-and-descriptions.md` (supersedes 0157's fixed list; the label-vs-prose split; why the one-per-kind rule and a name-from-kind trigger stay until the editor lands)
- [x] `README.md` still accurate — it does not list `map_rooms` columns
- [ ] **Release notes.** — n/a: no shelter user can notice a nullable column; nothing reads it until the editor stream
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the constraint names from `pg_constraint` on dev, the queue view from `pg_get_viewdef`, the upsert-on-kind dependency from `actions.ts`, and the behaviour from the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; the migration only. `map-rooms-editor` will read it, so `0175` must be on production before that deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: nothing is dropped but a check constraint; the back-fill only fills nulls
- [x] Apply plan stated — `0175` on production with the next release, any time before the editor half deploys

### Rollback

- [x] Rollback position stated — code rollback via the Pi `--ref` does not revert `0175`, and does not need to: older code reads `kind` and `shape` as before, and the trigger keeps its kind-only writes valid

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First dry run: two new functions without `revoke ... from public, anon` (grants lint) | fixed — revokes added; `map_room_kind_name` granted to `authenticated` because the trigger calls it as the editor |
| 2 | medium | The brief says to drop the one-per-kind rule, but the live `saveRoom` upserts `onConflict: "kind"` and would fail without it | accepted — kept, with the reason in the decision file; deferred to the editor stream in the backlog status note |
| 3 | info | `scripts/check-map-rooms.mjs` fails before this change (it creates a `staff` login, retired in `0173`) | not this PR — deferred to the editor stream in the backlog status note |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-10

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads these columns yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §3
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, as every schema PR is

Result: pass

Release manager acknowledgement: n/a: not yet released
