# Feature test plan — map rooms editor

## Header

| | |
|---|---|
| Feature | Map rooms, build half: Add room / Rename / Delete and a description per room in Settings → Facility map (with the TranslationPanel), shown under the room's name when it is tapped on the Map; plus the three committed plan files deleted |
| Backlog item | `docs/backlog.md` → "Map rooms: add more rooms, and give each a description…" (ticked) and "Delete the three committed plan files…" (ticked) |
| Branch / worktree | `claude/map-rooms-editor` @ `C:\Development\Animal_Shelter_map-rooms-editor` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-10 |
| Carries a migration? | no — `0175` (#506) is the schema half and is applied to dev; this branch was given no number (`0176` is `receipt-issuer-server-side`'s) |
| Tested at SHA | `f9d01612` (code), plan committed on top |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — rooms are no longer a fixed three: Settings → Facility map adds, renames (English and Thai), describes and deletes them, and a tap on the Map shows the description under the name in the reader's language, the generic line when there is none (parts 2 and 3 of the item)
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/admin/facility-map/` (actions, page, MapEditor), `src/app/enclosures/page.tsx`, `src/app/enclosures/map/FacilityMap.tsx`, `src/lib/facility-map/` (rooms, types, plan-store), `src/lib/translations/labels.ts`, `src/app/management/translations/actions.ts`, both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `scripts/check-map-rooms.mjs` (rewritten), `scripts/check-map-markers.mjs`, `scripts/check-facility-map-editor.mjs`, `public/facility-maps/` (three files deleted). No `worker/`, no migration
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — admin (the only role with `facility.enclosures` Edit) edits rooms; every role that opens the Map sees the card; signed-out never reaches either
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — `0175`'s three leftovers (one-per-kind rule, name-from-kind trigger, `map_room_kind_name()`) are NOT dropped here; they are dead code since every write is by primary key, and a new backlog item carries the drop. Also out of scope and in that same item: a read policy so the 2IC, heads and volunteers see an approved Thai description (today they see the English; `docs/decisions/2026-10-10-map-rooms-editor.md`)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — one conflict in `docs/backlog.md` (main's new deferred-drops item beside this branch's tick), resolved by keeping both; merge commit `f9d01612`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [x] Existing rows still read correctly after the change (checked against real dev data) — dev had no rooms; after the browser run it holds two kind-less rooms written by this editor, read back by the editor, the Map and the Translations page. The legacy kinded-row path (rename keeps the typed name) is covered by the harness below
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — `node scripts/check-map-rooms.mjs --verbose` against dev, one rolled-back transaction: `41 checks held, 0 failed. RESULT: GREEN`. Asserted: each of admin, management, second_in_command, volunteer and doctor reads a room; only admin adds, renames, describes and deletes (the others' insert refused, updates and delete touch 0 rows); null shape, two points, out-of-range point, unknown plan and no name all rejected; two kind-less rooms both store; a typed name is kept on a new room, on a legacy `medical` row, and on renaming that row in both languages; the restore path's `upsert on conflict (id)` leaves one row and updates it; a description queues one `translations` row, which `private.translation_queue` labels `Map room · Typed name` and links `/admin/facility-map`; deleting the room drops it; deleting a plan deletes its rooms; anon cannot read. It does not assert the one-per-kind rule or the trigger exist, so it stays green when they are dropped. **Proved to bite:** `--break trigger` (14 failed), `--break policy` (16 failed), `--break queue` (2 failed), `--break unique` (harness stops, RESULT: RED, non-zero exit)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR; it depends on `0175`, which must be on production before this deploys (see §8)

## 4. Functional checks

Driven in the browser pane on `localhost:3001`, signed in as an admin login on dev.

- [x] Happy path works end to end — Add room → "Quarantine room" / "ห้องกักโรค" → Draw it on the plan → rectangle drawn on the overview: "Quarantine room added. Write what it is for below, if you like." → typed a two-line description → Save room: "Quarantine room saved."; the Thai translation box appeared under it reading *Needs translation*; wrote the Thai there → Save & approve: *Approved*. On `/enclosures?view=map`, tapping the room shows the name and both lines
- [x] Data persists — reload the page and the change is still there — reloaded Settings → Facility map: both rooms listed as Placed with their names; dev rows: `Quarantine room / ห้องกักโรค`, `kind` null, description with its `\n`; `Laundry room / ห้องซักผ้า`, description null; one `translations` row, `approved`, `th`, with its line break
- [x] Create / edit / delete all exercised (whichever the feature has) — create (two rooms), rename ("Laundry" → "Laundry room" plus a Thai name: "Laundry room saved."), describe, translate, delete (a third room "Spare store": the confirm read "Delete Spare store? It goes from the map, with its name and what it is for. Nothing else refers to a room." → "Spare store deleted.", gone from the list and from the table)
- [x] Empty state renders sensibly (no rows yet) — before the run dev had no rooms: the Rooms heading showed its help line and the Add room button only. A room with no description shows the generic line on the Map: "A room, not an enclosure: nothing lives here, so there is nothing to open."
- [x] Invalid input is rejected with a readable message, not a crash — the name box is `required` and Draw it on the plan / Save room are disabled while it is blank; the server refuses an empty name (`roomNameRequired`), an over-long name or description, a bad or too-small shape, and a missing plan (`notFound`); the database refuses no name and bad shapes (harness §3)
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the Thai name is optional (Laundry was added without one, then given one); a description with a line break round-trips in both languages; `maxLength` 60 on names and 1000 on the description, matched by the server checks. Not driven: a 1000-character description in the card (left to the plain `whitespace-pre-line` paragraph)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Settings → Facility map; Map | edits rooms; sees the card | browser run above; harness: all four writes succeed |
| management | Map only | reads rooms, writes refused | harness: read 1, insert refused, rename/describe/delete 0 rows |
| staff | — | retired by `0173` | n/a: no such login can be made |
| doctor | Map (app access) | reads rooms, writes refused | harness: read 1, writes refused / 0 rows |
| volunteer | Map | reads rooms, writes refused | harness: read 1, writes refused / 0 rows |
| signed out | nothing | refused | harness: anon read refused; the page redirects to `/login` (seen before signing in) |

- [x] Every role above tested — under each role's own JWT in the rolled-back harness (second_in_command too); admin also in the browser. Staff no longer exists
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — the writes are refused by RLS under the role's JWT, not by hidden buttons; every action also checks `facility.enclosures` before touching the database

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change; the page is the existing Settings → Facility map
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — the Map topic (rooms show what they are for, in your language) and the Facility map topic (Add room, the names, What it is for and its Thai box, Delete room, Remove plan deleting rooms; the "in the app's code" step removed with the committed plans). Read in the file, not loaded at `/manual`
- [x] Translatable strings go through the translation path, checked at `/management/translations` — the description is a prose field: queued on save, translated and approved in place, and listed under **Places** as "Map room · Quarantine room" with *Open list*; both room names are listed under Places as "Map room" labels with *Where it's used* linking Settings → Facility map. All new editor words are in both dictionaries; `roomKinds` removed from both
- [x] Mobile viewport (375px) — no overflow, controls reachable — `/enclosures?view=map` at 375×812: tapped the Quarantine room, the card (327 px wide) shows the name and both lines; `scrollWidth` 375 = `innerWidth`. The editor itself is a "Best on a larger screen" page and was driven at 1400 px
- [x] Browser console clean — no errors or React warnings — no new errors after the edits settled. The console history holds two `isStoredPlan` import errors from a hot reload mid-edit (the file was saved between two edits); the name is in no file now and the page rendered and worked after it
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — every save returned its success message; the plan images load from `/api/facility-maps/…`

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — Settings → Facility map (plans, zone list, drawing, the picture section without the old move-into-storage branch); `/enclosures?view=map` (overview, tapping rooms, Thai); `/management/translations` (Places)
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file** — `src/lib/translations/labels.ts` and `src/app/management/translations/actions.ts` are shared with every translated table: `/management/translations?show=all` loaded with every other group (Website, Residents, Projects…) still listed and filled; `planImageUrl` is shared with the Map, which loaded its plans from the store
- [x] Nothing merged from `main` during `sync` was broken by this branch — main brought `0176` and the receipt issuer; gates green after the merge (`gates: typecheck=0 lint=0 build=0`)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — both items ticked with notes; the deferred drops and the Thai-read policy filed as a new item on `backlog`. Searched the backlog for `map_rooms`, `roomKinds`, `onConflict`, `planImageUrl`, `facility-maps`, `Facility map`, `labels.ts`: the plans item (Cat Zone) stays open, as it is about which zones have plans, which this neither causes nor fixes; no other open item's outcome is closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-10-10-map-rooms-editor.md`
- [x] `README.md` still accurate — it does not describe map rooms or the committed plan files
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the two safety claims the brief asked to prove (kind-less rooms are not limited by the unique rule; the trigger never overwrites a typed name) are harness assertions, red under a planted fault; the "who sees Thai" gap was read from dev's `role_permissions` and the `translations` policy, not assumed; the plan-file deletion followed the read of both databases (dev 3 rows, production 2, all `storage:plans/…`)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no threshold or band changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the `gates:` line and the harness totals are as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page reads rooms or plans

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — deferred: production release manager — no migration here, but this code reads `0175`'s columns (`name`, `name_th`, `description`), so `0175` must be applied to production before this deploys. The release handover already lists `0175` as pending there
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager (for `0175`, with the release)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: production release manager — `0175` on `dbkodyyxxhtygxcxmfcu`, before the deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover**. — a code-only change: `./scripts/pi/deploy-pi.sh --ref <previous sha>` on the Pi reverts it. Rooms added meanwhile stay in the table and would show in the old editor only if they had a kind (they do not, so the old editor would not list them). The three deleted plan files would come back with the old code, unused: no row names them

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | The 2IC, the heads and volunteers see a room's description in English even when an approved Thai exists: they cannot read `translations` | deferred to backlog — the new "Drop 0175's three map-room leftovers…" item carries the read policy; needs schema |
| 2 | low | Undo of a replace that cleared a plan's shapes brings a room back with its names and description, but its approved Thai is re-queued and must be approved again | accepted — rare path, recorded in the decision file |
| 3 | low | Picking another place in the list while a newly named room is waiting to be drawn quietly drops the unsaved room (seen in the run, from a stray click) | accepted — nothing was stored, and the name is three words to type again |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Add a real room's description (e.g. the Medical room) and read it in Thai on a phone, as a Thai reader would | Settings → Facility map, then Enclosures → Map on a phone |
| 2 | The Director's view as Management: the card shows the Thai once approved; the editor is not offered | Enclosures → Map, signed in as Management |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-10-10

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items are left for Lutan above

Manual verification by: pending: Lutan — the two items under Left for manual verification

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: defect 1 is deferred to the backlog rather than fixed or accepted, pending the schema item
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending: production release manager
