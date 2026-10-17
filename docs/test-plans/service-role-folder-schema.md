# Feature test plan — service-role-folder-schema

## Header

| | |
|---|---|
| Feature | Add Shelter Photos route swaps the service-role client for two narrow database functions (`0219`) and leaves the eslint allow-list |
| Backlog item | `docs/backlog.md` → **Replace the service-role client in the Add Shelter Photos route with narrow database functions** (filed on `backlog`, ticked here) |
| Branch / worktree | `claude/service-role-folder-schema` @ `C:\Development\Animal_Shelter_service-role-folder-schema` |
| Dev server | not started — the route needs a Drive upload and a login holding `photos.shelter_add` |
| PR | pending: number assigned when opened |
| Tested by / date | Claude / 2026-10-17 |
| Carries a migration? | yes — `0219_shelter_photo_folder.sql` (one PR, not two: see the decision file) |
| Tested at SHA | `a50bee7a` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the route reads and once-writes `drive_folder_id` through two functions that check `photos.shelter_add` inside, not through the RLS bypass
- [x] Files/areas touched listed — `supabase/migrations/0219_shelter_photo_folder.sql`, `src/app/api/photos/shelter/[id]/route.ts`, `eslint.config.mjs`, `docs/backlog.md`, `docs/decisions/2026-10-17-shelter-photo-folder-functions.md`, this plan
- [x] Roles affected identified — the volunteer path (`photos.shelter_add`); no role holds the card yet
- [x] Anything explicitly **out of scope** written down — the other 18 allow-listed files, and the staff and medical photo routes

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly before starting (`fe74d852`, includes enclosure-photos-app)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Exit codes read from the script's own output:

```
=== gates: build exited 0 after 154s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs`: ok, 0219 against highest 0218
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev had 219 applied, 1 pending (this file)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `ok`; only the consumer-header warning (the reader is not live yet, the safe direction)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0219_shelter_photo_folder.sql … ok`
- [x] File is re-runnable — `create or replace` and repeated grants only
- [x] Existing rows still read correctly after the change — no table or column changed, two functions added; the harness below left rows as found
- [x] **Constraints and defaults exercised against real rows** in a rolled-back transaction on dev, as a login without the card and as an admin. Asserted: no-card read and write refused; read of a resident with a folder returns it; unknown resident reports not found; malformed folder id refused; first write on a folder-less resident succeeds; second write returns false and keeps the first; overwrite of an existing folder returns false and changes nothing. Ended in the deliberate rollback exception
- [x] Down-migration written, or the reason one is not needed is stated — not needed: two functions old code never calls; dropping them is harmless
- [x] Production apply plan stated for the release manager — `0219` on `dbkodyyxxhtygxcxmfcu` before the release carrying the route change; the new route needs it, so apply first

## 4. Functional checks

- [ ] Happy path works end to end — n/a: needs a real Drive upload by a login holding `photos.shelter_add`, which no role has; function behaviour is proved in §3, the live upload is under Left for manual verification
- [ ] Data persists — n/a: persistence of the folder id asserted in §3's harness
- [ ] Create / edit / delete all exercised — n/a: no UI; the only write is the once-only folder id, asserted in §3
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input; a bad folder id is refused by the function, asserted in §3
- [ ] Boundary cases checked — n/a: the null-guard boundary (second write, overwrite) is asserted in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | both functions | allowed (admin passes `has_permission`) | pass in the §3 harness |
| login without `photos.shelter_add` | both functions | refused | pass in the §3 harness |
| volunteer with the card | both functions | allowed | n/a: no role holds the card yet; same `has_permission` call |
| signed out | both functions | refused | n/a: execute revoked from `public` and `anon`; `check-migration-grants.mjs` passed in lint |

- [ ] Every role above tested — n/a: see the matrix; the card-holding volunteer is untestable until Lutan ticks it in Settings
- [x] A role that should not have access is blocked server-side — the refusal is inside the function (`Not authorized to add photos.`), asserted in §3

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no user-visible change
- [ ] Translatable strings go through the translation path — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the build compiles the route; its other steps (permission check, view read, `record_attachment`) are unchanged
- [ ] Any shared file touched checked from a second, unrelated page — n/a: only `eslint.config.mjs` is shared, and lint passed over the whole repo with the allow-list entry removed
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — ticked; searched for `service-role`, `drive_folder_id` and `photos/shelter`: no other open item is closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-17-shelter-photo-folder-functions.md`
- [x] `README.md` still accurate — it does not describe this route's client
- [ ] **Release notes.** — n/a: nothing a shelter user can see changes; same behaviour with a tighter boundary underneath
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — behaviour from the dev harness, the lint result from the gates

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

- [x] **Does this PR contain both a migration and code that reads it?** — yes, deliberately one PR. So `0219` must be on production before the route's code deploys, or a volunteer's first Shelter photo errors
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only
- [x] Apply plan stated — `0219` on production before the deploy

### Rollback

- [x] Rollback position stated — code rollback to the older route works with `0219` left in place; the old route uses the service role and ignores the functions

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First gates run: typecheck refused the `.returns<>()` form on the rpc call, and lint caught a leftover admin import | fixed — gates re-run green |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A login holding `photos.shelter_add` files a photo for a resident with a Drive folder and one without; the second photo for the folder-less resident goes into the same folder | dev, after the card is ticked for a role |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-17

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: one live upload by a card-holding login

Manual verification by: pending: live volunteer upload on dev

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §3
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, as every schema PR is

Result: pass

Release manager acknowledgement: pending
